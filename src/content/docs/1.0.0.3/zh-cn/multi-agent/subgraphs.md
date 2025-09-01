---
title: 子图 (Subgraphs)
description: Spring AI Alibaba 子图功能
---

# 子图 (Subgraphs)

子图是 Spring AI Alibaba Graph 中的重要概念，它允许将一个完整的 StateGraph 作为另一个图中的节点使用。这是模块化设计和组合模式在图工作流中的体现，使您能够构建具有多个可重用组件的复杂系统。

## 子图的核心价值

子图提供了强大的模块化能力，主要应用场景包括：

- **构建多智能体系统**：每个智能体可以是一个独立的子图，具有自己的内部逻辑和状态管理
- **代码复用**：将通用的处理逻辑封装为子图，在多个父图中重复使用
- **团队协作**：不同团队可以独立开发各自的子图模块，只需要约定好接口规范
- **分层架构**：将复杂的业务流程分解为多个层次，每个层次用子图表示

## 子图的实现机制

Spring AI Alibaba Graph 提供了两种子图实现方式：

1. **SubStateGraphNode**：包装未编译的 StateGraph，支持运行时动态编译
2. **SubCompiledGraphNode**：包装已编译的 CompiledGraph，提供更高的执行效率

子图与父图的通信方式取决于它们的状态模式：

- **共享状态模式**：父图和子图共享相同的状态键，可以直接传递状态
- **不同状态模式**：父图和子图使用不同的状态结构，需要进行状态转换

:::tip
子图的状态管理基于 OverAllState，支持灵活的键策略配置和状态合并机制。
:::

## 共享状态模式

当父图和子图使用相同的状态键时，可以直接将子图作为节点添加到父图中。这是最常见的子图使用方式，特别适用于多智能体系统中智能体间的协作场景。

### 基本使用方式

在共享状态模式下，子图和父图都操作相同的 OverAllState 实例，通过共享的状态键进行数据传递：

```java
import com.alibaba.cloud.ai.graph.StateGraph;
import com.alibaba.cloud.ai.graph.CompiledGraph;
import com.alibaba.cloud.ai.graph.OverAllState;
import com.alibaba.cloud.ai.graph.action.AsyncNodeAction;
import com.alibaba.cloud.ai.graph.state.strategy.AppendStrategy;
import static com.alibaba.cloud.ai.graph.StateGraph.START;
import static com.alibaba.cloud.ai.graph.StateGraph.END;
import static com.alibaba.cloud.ai.graph.action.AsyncNodeAction.node_async;

@Configuration
public class SharedStateSubgraphExample {

    /**
     * 创建子图 - 文档处理子图
     * 子图专注于文档的提取和分析处理
     */
    @Bean
    public CompiledGraph createDocumentProcessingSubgraph() {
        StateGraph subgraph = new StateGraph("document-processing", () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("messages", new AppendStrategy());  // 与父图共享的消息键
            strategies.put("document_content", new ReplaceStrategy());  // 子图内部状态
            return strategies;
        });

        // 文档提取节点
        AsyncNodeAction extractorNode = node_async(state -> {
            String input = (String) state.value("input").orElse("");
            return Map.of(
                "messages", "文档提取完成",
                "document_content", "提取的文档内容: " + input
            );
        });

        // 文档分析节点
        AsyncNodeAction analyzerNode = node_async(state -> {
            String content = (String) state.value("document_content").orElse("");
            return Map.of(
                "messages", "文档分析完成",
                "analysis_result", "分析结果: " + content
            );
        });

        subgraph.addNode("extractor", extractorNode)
                .addNode("analyzer", analyzerNode)
                .addEdge(START, "extractor")
                .addEdge("extractor", "analyzer")
                .addEdge("analyzer", END);

        return subgraph.compile();
    }

    /**
     * 创建父图 - 主工作流
     * 包含预处理、子图调用和后处理步骤
     */
    @Bean
    public CompiledGraph createMainWorkflow() {
        StateGraph mainGraph = new StateGraph("main-workflow", () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("messages", new AppendStrategy());  // 与子图共享
            strategies.put("input", new ReplaceStrategy());
            strategies.put("final_result", new ReplaceStrategy());
            return strategies;
        });

        // 预处理节点
        AsyncNodeAction preprocessNode = node_async(state -> {
            return Map.of("messages", "开始处理文档");
        });

        // 后处理节点
        AsyncNodeAction postprocessNode = node_async(state -> {
            List<String> messages = (List<String>) state.value("messages").orElse(new ArrayList<>());
            return Map.of(
                "messages", "处理完成",
                "final_result", "共处理了 " + messages.size() + " 个步骤"
            );
        });

        // 获取子图实例
        CompiledGraph documentSubgraph = createDocumentProcessingSubgraph();

        mainGraph.addNode("preprocess", preprocessNode)
                 .addNode("document_processing", documentSubgraph)  // 添加子图作为节点
                 .addNode("postprocess", postprocessNode)
                 .addEdge(START, "preprocess")
                 .addEdge("preprocess", "document_processing")
                 .addEdge("document_processing", "postprocess")
                 .addEdge("postprocess", END);

        return mainGraph.compile();
    }
}
```

### 使用示例和执行结果

```java
@Service
public class SubgraphUsageService {

    @Autowired
    private CompiledGraph mainWorkflow;

    /**
     * 演示共享状态子图的执行
     */
    public void demonstrateSharedStateSubgraph() {
        // 准备初始状态
        Map<String, Object> initialState = Map.of("input", "用户上传的文档.pdf");

        // 执行主工作流
        Optional<OverAllState> result = mainWorkflow.invoke(initialState);

        if (result.isPresent()) {
            OverAllState finalState = result.get();

            // 获取消息历史（展示整个执行过程）
            List<String> messages = (List<String>) finalState.value("messages").orElse(new ArrayList<>());
            System.out.println("执行步骤：");
            messages.forEach(msg -> System.out.println("- " + msg));

            // 获取最终结果
            String finalResult = (String) finalState.value("final_result").orElse("");
            System.out.println("最终结果：" + finalResult);
        }
    }

    /**
     * 流式执行，观察每个节点的输出
     */
    public void demonstrateStreamExecution() {
        Map<String, Object> initialState = Map.of("input", "测试文档内容");

        mainWorkflow.stream(initialState)
                   .stream()
                   .forEach(nodeOutput -> {
                       System.out.println("节点: " + nodeOutput.node());
                       System.out.println("状态: " + nodeOutput.state().data());
                       System.out.println("---");
                   });
    }
}
```

**执行输出示例：**

```
执行步骤：
- 开始处理文档
- 文档提取完成
- 文档分析完成
- 处理完成
最终结果：共处理了 4 个步骤

节点: preprocess
状态: {input=测试文档内容, messages=[开始处理文档]}
---
节点: document_processing-extractor
状态: {input=测试文档内容, messages=[开始处理文档, 文档提取完成], document_content=提取的文档内容: 测试文档内容}
---
节点: document_processing-analyzer
状态: {input=测试文档内容, messages=[开始处理文档, 文档提取完成, 文档分析完成], document_content=提取的文档内容: 测试文档内容, analysis_result=分析结果: 提取的文档内容: 测试文档内容}
---
节点: postprocess
状态: {input=测试文档内容, messages=[开始处理文档, 文档提取完成, 文档分析完成, 处理完成], final_result=共处理了 4 个步骤, ...}
---
```

### 关键特性说明

1. **节点ID格式化**：子图内的节点会自动添加前缀，如 `document_processing-extractor`
2. **状态共享**：`messages` 键在父图和子图间无缝传递
3. **状态隔离**：子图的私有状态（如 `document_content`）不会影响父图的核心逻辑
4. **执行顺序**：子图内的节点按照定义的边顺序执行，完成后返回父图继续执行

## 不同状态模式

当父图和子图需要使用完全不同的状态结构时，需要通过节点函数来调用子图，并在调用前后进行状态转换。这种模式适用于需要状态隔离或不同业务域的场景。

### 基本实现方式

在不同状态模式下，需要创建一个包装节点来处理状态转换和子图调用：

```java
import com.alibaba.cloud.ai.graph.StateGraph;
import com.alibaba.cloud.ai.graph.CompiledGraph;
import com.alibaba.cloud.ai.graph.OverAllState;
import com.alibaba.cloud.ai.graph.action.AsyncNodeActionWithConfig;
import static com.alibaba.cloud.ai.graph.action.AsyncNodeAction.node_async;

@Configuration
public class DifferentStateSubgraphExample {

    /**
     * 创建专门的数据处理子图
     * 使用独立的状态结构，专注于数据转换逻辑
     */
    @Bean
    public CompiledGraph createDataProcessingSubgraph() {
        StateGraph subgraph = new StateGraph("data-processing", () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("raw_data", new ReplaceStrategy());
            strategies.put("processed_data", new ReplaceStrategy());
            strategies.put("processing_steps", new AppendStrategy());
            return strategies;
        });

        // 数据清洗节点
        AsyncNodeAction cleaningNode = node_async(state -> {
            String rawData = (String) state.value("raw_data").orElse("");
            String cleanedData = rawData.trim().toLowerCase();
            return Map.of(
                "processed_data", cleanedData,
                "processing_steps", "数据清洗完成"
            );
        });

        // 数据验证节点
        AsyncNodeAction validationNode = node_async(state -> {
            String processedData = (String) state.value("processed_data").orElse("");
            boolean isValid = !processedData.isEmpty();
            return Map.of(
                "processed_data", isValid ? processedData : "无效数据",
                "processing_steps", "数据验证完成"
            );
        });

        subgraph.addNode("cleaning", cleaningNode)
                .addNode("validation", validationNode)
                .addEdge(START, "cleaning")
                .addEdge("cleaning", "validation")
                .addEdge("validation", END);

        return subgraph.compile();
    }

    /**
     * 创建主业务流程图
     * 使用不同的状态结构，通过包装节点调用子图
     */
    @Bean
    public CompiledGraph createMainBusinessFlow() {
        StateGraph mainGraph = new StateGraph("main-business", () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("user_input", new ReplaceStrategy());
            strategies.put("business_result", new ReplaceStrategy());
            strategies.put("execution_log", new AppendStrategy());
            return strategies;
        });

        // 输入预处理节点
        AsyncNodeAction preprocessNode = node_async(state -> {
            return Map.of("execution_log", "开始处理用户输入");
        });

        // 调用数据处理子图的包装节点
        AsyncNodeActionWithConfig dataProcessingWrapperNode =
            AsyncNodeActionWithConfig.node_async((state, config) -> {
                // 1. 状态转换：从主业务状态转换为数据处理状态
                String userInput = (String) state.value("user_input").orElse("");
                Map<String, Object> subgraphInput = Map.of("raw_data", userInput);

                // 2. 调用子图
                CompiledGraph dataSubgraph = createDataProcessingSubgraph();
                Optional<OverAllState> subgraphResult = dataSubgraph.invoke(subgraphInput);

                // 3. 状态转换：从数据处理状态转换回主业务状态
                if (subgraphResult.isPresent()) {
                    OverAllState result = subgraphResult.get();
                    String processedData = (String) result.value("processed_data").orElse("");
                    List<String> steps = (List<String>) result.value("processing_steps").orElse(new ArrayList<>());

                    return Map.of(
                        "business_result", "处理结果: " + processedData,
                        "execution_log", "数据处理子图执行完成，步骤: " + String.join(", ", steps)
                    );
                } else {
                    return Map.of(
                        "business_result", "处理失败",
                        "execution_log", "数据处理子图执行失败"
                    );
                }
            });

        // 结果后处理节点
        AsyncNodeAction postprocessNode = node_async(state -> {
            String result = (String) state.value("business_result").orElse("");
            return Map.of(
                "business_result", "最终结果: " + result,
                "execution_log", "处理流程完成"
            );
        });

        mainGraph.addNode("preprocess", preprocessNode)
                 .addNode("data_processing_wrapper", dataProcessingWrapperNode)
                 .addNode("postprocess", postprocessNode)
                 .addEdge(START, "preprocess")
                 .addEdge("preprocess", "data_processing_wrapper")
                 .addEdge("data_processing_wrapper", "postprocess")
                 .addEdge("postprocess", END);

        return mainGraph.compile();
    }
}

### 使用示例和状态转换

```java
@Service
public class DifferentStateUsageService {

    @Autowired
    private CompiledGraph mainBusinessFlow;

    /**
     * 演示不同状态模式的子图调用
     */
    public void demonstrateDifferentStateSubgraph() {
        // 准备主业务流程的初始状态
        Map<String, Object> initialState = Map.of("user_input", "  Hello World  ");

        // 执行主业务流程
        Optional<OverAllState> result = mainBusinessFlow.invoke(initialState);

        if (result.isPresent()) {
            OverAllState finalState = result.get();

            // 查看最终业务结果
            String businessResult = (String) finalState.value("business_result").orElse("");
            System.out.println("业务结果: " + businessResult);

            // 查看执行日志
            List<String> executionLog = (List<String>) finalState.value("execution_log").orElse(new ArrayList<>());
            System.out.println("执行日志:");
            executionLog.forEach(log -> System.out.println("- " + log));
        }
    }

    /**
     * 演示状态转换的详细过程
     */
    public void demonstrateStateTransformation() {
        System.out.println("=== 状态转换演示 ===");

        // 1. 主业务状态
        Map<String, Object> mainState = Map.of("user_input", "  MIXED Case Data  ");
        System.out.println("主业务状态: " + mainState);

        // 2. 转换为子图状态
        String userInput = (String) mainState.get("user_input");
        Map<String, Object> subgraphState = Map.of("raw_data", userInput);
        System.out.println("子图输入状态: " + subgraphState);

        // 3. 子图处理（模拟）
        String processedData = userInput.trim().toLowerCase();
        Map<String, Object> subgraphResult = Map.of(
            "processed_data", processedData,
            "processing_steps", List.of("数据清洗完成", "数据验证完成")
        );
        System.out.println("子图输出状态: " + subgraphResult);

        // 4. 转换回主业务状态
        Map<String, Object> finalMainState = Map.of(
            "business_result", "处理结果: " + processedData,
            "execution_log", List.of("数据处理子图执行完成")
        );
        System.out.println("最终主业务状态: " + finalMainState);
    }
}
```

**执行输出示例：**

```
业务结果: 最终结果: 处理结果: hello world
执行日志:
- 开始处理用户输入
- 数据处理子图执行完成，步骤: 数据清洗完成, 数据验证完成
- 处理流程完成

=== 状态转换演示 ===
主业务状态: {user_input=  MIXED Case Data  }
子图输入状态: {raw_data=  MIXED Case Data  }
子图输出状态: {processed_data=mixed case data, processing_steps=[数据清洗完成, 数据验证完成]}
最终主业务状态: {business_result=处理结果: mixed case data, execution_log=[数据处理子图执行完成]}
```

### 状态转换的关键要点

1. **输入转换**：将父图的状态字段映射到子图所需的状态结构
2. **子图执行**：子图在独立的状态空间中执行，不影响父图状态
3. **输出转换**：将子图的执行结果转换回父图的状态格式
4. **错误处理**：包装节点需要处理子图执行失败的情况
5. **状态隔离**：父图和子图的状态完全独立，提供更好的模块化

## 子图的持久化和检查点

Spring AI Alibaba Graph 支持为子图配置独立的持久化机制，这对于多智能体系统和长期运行的工作流特别有用。

### 继承父图的检查点配置

默认情况下，子图会继承父图的检查点保存器配置：

```java
import com.alibaba.cloud.ai.graph.StateGraph;
import com.alibaba.cloud.ai.graph.CompiledGraph;
import com.alibaba.cloud.ai.graph.CompileConfig;
import com.alibaba.cloud.ai.graph.saver.SaverConfig;
import com.alibaba.cloud.ai.graph.saver.SaverConstant;
import com.alibaba.cloud.ai.graph.saver.memory.InMemoryCheckpointSaver;

@Configuration
public class PersistentSubgraphExample {

    /**
     * 创建带持久化的子图
     */
    @Bean
    public CompiledGraph createPersistentSubgraph() {
        StateGraph subgraph = new StateGraph("persistent-subgraph", () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("messages", new AppendStrategy());
            strategies.put("step_count", new ReplaceStrategy());
            return strategies;
        });

        AsyncNodeAction stepNode = node_async(state -> {
            int currentCount = (Integer) state.value("step_count").orElse(0);
            return Map.of(
                "messages", "执行步骤 " + (currentCount + 1),
                "step_count", currentCount + 1
            );
        });

        subgraph.addNode("step", stepNode)
                .addEdge(START, "step")
                .addEdge("step", END);

        return subgraph.compile();
    }

    /**
     * 创建带持久化的父图
     * 子图会自动继承父图的检查点配置
     */
    @Bean
    public CompiledGraph createParentGraphWithPersistence() {
        StateGraph parentGraph = new StateGraph("parent-with-persistence", () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("messages", new AppendStrategy());
            strategies.put("session_id", new ReplaceStrategy());
            return strategies;
        });

        AsyncNodeAction initNode = node_async(state -> {
            return Map.of("messages", "开始执行");
        });

        CompiledGraph subgraph = createPersistentSubgraph();

        parentGraph.addNode("init", initNode)
                   .addNode("persistent_subgraph", subgraph)
                   .addEdge(START, "init")
                   .addEdge("init", "persistent_subgraph")
                   .addEdge("persistent_subgraph", END);

        // 配置检查点保存器
        InMemoryCheckpointSaver checkpointSaver = new InMemoryCheckpointSaver();
        CompileConfig compileConfig = CompileConfig.builder()
                .saverConfig(SaverConfig.builder()
                    .type(SaverConstant.MEMORY)
                    .register(SaverConstant.MEMORY, checkpointSaver)
                    .build())
                .build();

        return parentGraph.compile(compileConfig);
    }
}
```

### 独立的子图持久化

对于需要独立状态管理的子图（如多智能体系统中的智能体），可以为子图配置独立的检查点保存器：

```java
@Configuration
public class IndependentSubgraphPersistenceExample {

    /**
     * 创建具有独立持久化的智能体子图
     */
    @Bean
    public CompiledGraph createAgentSubgraphWithIndependentPersistence() {
        StateGraph agentGraph = new StateGraph("agent-subgraph", () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("agent_messages", new AppendStrategy());
            strategies.put("agent_state", new ReplaceStrategy());
            return strategies;
        });

        AsyncNodeAction agentThinkNode = node_async(state -> {
            List<String> messages = (List<String>) state.value("agent_messages").orElse(new ArrayList<>());
            return Map.of(
                "agent_messages", "智能体思考中...",
                "agent_state", "thinking"
            );
        });

        AsyncNodeAction agentActNode = node_async(state -> {
            return Map.of(
                "agent_messages", "智能体执行动作",
                "agent_state", "acting"
            );
        });

        agentGraph.addNode("think", agentThinkNode)
                  .addNode("act", agentActNode)
                  .addEdge(START, "think")
                  .addEdge("think", "act")
                  .addEdge("act", END);

        // 为子图配置独立的检查点保存器
        InMemoryCheckpointSaver agentCheckpointSaver = new InMemoryCheckpointSaver();
        CompileConfig agentCompileConfig = CompileConfig.builder()
                .saverConfig(SaverConfig.builder()
                    .type(SaverConstant.MEMORY)
                    .register(SaverConstant.MEMORY, agentCheckpointSaver)
                    .build())
                .build();

        return agentGraph.compile(agentCompileConfig);
    }

    /**
     * 使用独立持久化子图的父图
     */
    @Bean
    public CompiledGraph createMultiAgentSystem() {
        StateGraph multiAgentGraph = new StateGraph("multi-agent-system", () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("system_messages", new AppendStrategy());
            strategies.put("coordination_state", new ReplaceStrategy());
            return strategies;
        });

        AsyncNodeAction coordinatorNode = node_async(state -> {
            return Map.of(
                "system_messages", "协调器启动",
                "coordination_state", "coordinating"
            );
        });

        CompiledGraph agentSubgraph = createAgentSubgraphWithIndependentPersistence();

        multiAgentGraph.addNode("coordinator", coordinatorNode)
                      .addNode("agent", agentSubgraph)
                      .addEdge(START, "coordinator")
                      .addEdge("coordinator", "agent")
                      .addEdge("agent", END);

        // 父图使用自己的检查点保存器
        InMemoryCheckpointSaver systemCheckpointSaver = new InMemoryCheckpointSaver();
        CompileConfig systemCompileConfig = CompileConfig.builder()
                .saverConfig(SaverConfig.builder()
                    .type(SaverConstant.MEMORY)
                    .register(SaverConstant.MEMORY, systemCheckpointSaver)
                    .build())
                .build();

        return multiAgentGraph.compile(systemCompileConfig);
    }
}
```

### 持久化的使用示例

```java
@Service
public class PersistentSubgraphUsageService {

    @Autowired
    private CompiledGraph multiAgentSystem;

    /**
     * 演示带持久化的子图执行
     */
    public void demonstratePersistentExecution() {
        // 创建运行时配置，指定线程ID用于持久化
        RunnableConfig config = RunnableConfig.builder()
                .threadId("multi-agent-session-001")
                .build();

        Map<String, Object> initialState = Map.of("input", "启动多智能体系统");

        // 执行系统
        Optional<OverAllState> result = multiAgentSystem.invoke(initialState, config);

        if (result.isPresent()) {
            OverAllState finalState = result.get();
            System.out.println("系统执行完成，最终状态: " + finalState.data());
        }

        // 可以通过相同的线程ID恢复执行状态
        // 这对于长期运行的多智能体系统特别有用
    }
}
```

## 下一步

- [学习多智能体系统](./multi-agent.md) - 了解如何使用子图构建多智能体系统
- [了解持久化机制](./persistence.md) - 深入理解检查点和状态管理
- [探索人机协作](./human-in-the-loop.md) - 学习如何在子图中集成人工干预
