---
title: "可视化和调试"
description: "学习 Spring AI Alibaba Graph 的可视化和调试功能，包括图可视化、监控和最佳实践。"
---

本文档介绍 Spring AI Alibaba Graph 的可视化和调试功能，包括图可视化、监控和最佳实践。

## 流式执行和监控

流式执行是 Spring AI Alibaba Graph 的一个重要特性，它允许您实时观察图的执行过程，而不需要等待整个流程完成。这在以下场景中特别有用：

### 流式执行的优势

- **实时反馈**：用户可以立即看到处理进度，提升用户体验
- **早期发现问题**：可以在问题发生时立即发现，而不是等到最后
- **资源优化**：可以根据中间结果动态调整资源分配
- **调试便利**：便于观察每个节点的执行情况和状态变化

### 适用场景

- **长时间运行的任务**：用户需要了解处理进度的场景
- **交互式应用**：需要实时显示中间结果的应用
- **监控和调试**：开发和运维阶段的监控需求
- **流式 UI**：构建响应式用户界面

Spring AI Alibaba Graph 支持流式执行，可以实时观察图的执行过程：

```java
@Service
public class StreamingGraphService {

    @Autowired
    private CompiledGraph workflow;

    public void executeWithStreaming(String input) {
        // 流式执行，实时获取每个节点的输出
        workflow.stream(Map.of("input", input))
            .subscribe(nodeOutput -> {
                System.out.println("节点 '" + nodeOutput.nodeId() + "' 执行完成");
                System.out.println("当前状态: " + nodeOutput.state().data());

                // 可以根据节点ID进行特定处理
                switch (nodeOutput.nodeId()) {
                    case "classifier":
                        String category = nodeOutput.state()
                            .value("category", String.class).orElse("");
                        System.out.println("分类结果: " + category);
                        break;
                    case "processor":
                        String result = nodeOutput.state()
                            .value("result", String.class).orElse("");
                        System.out.println("处理结果: " + result);
                        break;
                }
            });
    }
}
```

## 检查点和状态恢复

检查点（Checkpoint）是 Graph 框架的一个关键特性，它允许您在图执行过程中保存状态快照，并在需要时从这些快照恢复执行。这个功能在以下场景中非常重要：

### 检查点的价值

- **容错能力**：在系统故障时可以从最近的检查点恢复，而不需要重新开始
- **长时间任务**：对于运行时间很长的任务，可以分段执行，避免资源浪费
- **实验和调试**：可以从特定状态开始重复执行，便于调试和优化
- **成本控制**：避免因为后期失败而重复执行昂贵的前期步骤

### 检查点策略

Spring AI Alibaba Graph 支持多种检查点保存策略：

- **内存保存器**：适用于开发和测试环境
- **文件保存器**：适用于单机部署的生产环境
- **数据库保存器**：适用于分布式环境和需要持久化的场景
- **Redis 保存器**：适用于需要高性能和分布式访问的场景

使用检查点功能可以保存图的执行状态，支持中断和恢复：

```java
import com.alibaba.cloud.ai.graph.checkpoint.savers.MemorySaver;
import com.alibaba.cloud.ai.graph.checkpoint.config.SaverConfig;
import com.alibaba.cloud.ai.graph.checkpoint.constant.SaverConstant;

@Configuration
public class CheckpointGraphExample {

    @Bean
    public CompiledGraph checkpointWorkflow() {
        KeyStrategyFactory keyStrategyFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("input", KeyStrategy.REPLACE);
            strategies.put("step", KeyStrategy.REPLACE);
            strategies.put("result", KeyStrategy.REPLACE);
            return strategies;
        };

        // 配置内存检查点保存器
        MemorySaver memorySaver = new MemorySaver();

        CompileConfig config = CompileConfig.builder()
            .saverConfig(SaverConfig.builder()
                .register(SaverConstant.MEMORY, memorySaver)
                .type(SaverConstant.MEMORY)
                .build())
            .build();

        StateGraph graph = new StateGraph(keyStrategyFactory)
            .addNode("step1", node_async(state -> {
                System.out.println("执行步骤1");
                return Map.of("step", "1", "result", "步骤1完成");
            }))
            .addNode("step2", node_async(state -> {
                System.out.println("执行步骤2");
                return Map.of("step", "2", "result", "步骤2完成");
            }))
            .addNode("step3", node_async(state -> {
                System.out.println("执行步骤3");
                return Map.of("step", "3", "result", "步骤3完成");
            }))

            .addEdge(START, "step1")
            .addEdge("step1", "step2")
            .addEdge("step2", "step3")
            .addEdge("step3", END);

        return graph.compile(config);
    }
}
```

## 中断和恢复执行

中断和恢复是 Graph 框架支持人机协作的核心机制。它允许图在执行过程中暂停，等待外部输入或人工干预，然后继续执行。这个特性在以下场景中非常有用：

### 中断的应用场景

- **人工审核**：在关键决策点需要人工确认或修改
- **外部依赖**：等待外部系统的响应或用户的输入
- **质量控制**：在重要步骤后进行质量检查
- **合规要求**：某些业务流程需要人工监督和确认

### 中断类型

Spring AI Alibaba Graph 支持两种类型的中断：

1. **interruptBefore**：在指定节点执行前中断
2. **interruptAfter**：在指定节点执行后中断

### 中断和恢复的工作流程

1. **配置中断点**：在编译时指定哪些节点需要中断
2. **执行到中断点**：图执行到中断点时自动暂停
3. **外部处理**：人工或外部系统处理中断状态
4. **修改状态**：根据需要修改状态数据
5. **恢复执行**：从中断点继续执行剩余的流程

可以配置图在特定节点前后中断，实现人工干预或异步处理：

```java
@Configuration
public class InterruptibleGraphExample {

    @Bean
    public CompiledGraph interruptibleWorkflow() {
        KeyStrategyFactory keyStrategyFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("input", KeyStrategy.REPLACE);
            strategies.put("review_needed", KeyStrategy.REPLACE);
            strategies.put("result", KeyStrategy.REPLACE);
            return strategies;
        };

        // 配置中断点
        CompileConfig config = CompileConfig.builder()
            .interruptBefore("human_review")  // 在人工审核前中断
            .build();

        NodeAction analyzeAction = state -> {
            String input = state.value("input", String.class).orElse("");
            boolean needsReview = input.contains("重要");

            return Map.of(
                "analysis", "分析完成",
                "review_needed", needsReview
            );
        };

        NodeAction humanReviewAction = state -> {
            System.out.println("等待人工审核...");
            // 这里会被中断，等待外部恢复
            return Map.of("review_result", "审核通过");
        };

        NodeAction finalizeAction = state -> {
            String analysis = state.value("analysis", String.class).orElse("");
            String review = state.value("review_result", String.class).orElse("");

            return Map.of("result", "最终结果: " + analysis + " + " + review);
        };

        StateGraph graph = new StateGraph(keyStrategyFactory)
            .addNode("analyze", node_async(analyzeAction))
            .addNode("human_review", node_async(humanReviewAction))
            .addNode("finalize", node_async(finalizeAction))

            .addEdge(START, "analyze")
            .addEdge("analyze", "human_review")
            .addEdge("human_review", "finalize")
            .addEdge("finalize", END);

        return graph.compile(config);
    }
}

// 使用中断和恢复
@Service
public class InterruptibleService {

    @Autowired
    private CompiledGraph interruptibleWorkflow;

    public String processWithInterruption(String input) {
        // 第一次执行，会在 human_review 前中断
        Optional<OverAllState> interruptedState = interruptibleWorkflow.invoke(
            Map.of("input", input)
        );

        if (interruptedState.isPresent()) {
            System.out.println("图在人工审核前中断");

            // 模拟人工审核过程
            OverAllState modifiedState = interruptedState.get()
                .update(Map.of("review_result", "人工审核通过"));

            // 从中断点恢复执行
            RunnableConfig resumeConfig = RunnableConfig.builder()
                .resumeFrom(modifiedState)
                .build();

            Optional<OverAllState> finalResult = interruptibleWorkflow.invoke(
                Map.of(), resumeConfig
            );

            return finalResult.map(state ->
                state.value("result", String.class).orElse("无结果")
            ).orElse("执行失败");
        }

        return "未中断，直接完成";
    }
}
```

## 图可视化

Spring AI Alibaba Graph 支持生成图的可视化表示：

```java
@Service
public class GraphVisualizationService {

    @Autowired
    private CompiledGraph workflow;

    public String generateMermaidDiagram() {
        GraphRepresentation mermaid = workflow.getGraph(GraphRepresentation.Type.MERMAID);
        return mermaid.content();
    }

    public String generatePlantUMLDiagram() {
        GraphRepresentation plantuml = workflow.getGraph(GraphRepresentation.Type.PLANTUML);
        return plantuml.content();
    }

    @PostConstruct
    public void printDiagrams() {
        System.out.println("=== Mermaid 图表 ===");
        System.out.println(generateMermaidDiagram());

        System.out.println("\n=== PlantUML 图表 ===");
        System.out.println(generatePlantUMLDiagram());
    }
}
```

## 生命周期监听

可以添加生命周期监听器来监控图的执行过程：

```java
import com.alibaba.cloud.ai.graph.GraphLifecycleListener;

@Configuration
public class MonitoredGraphExample {

    @Bean
    public CompiledGraph monitoredWorkflow() {
        KeyStrategyFactory keyStrategyFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("input", KeyStrategy.REPLACE);
            strategies.put("result", KeyStrategy.REPLACE);
            return strategies;
        };

        // 创建生命周期监听器
        GraphLifecycleListener listener = new GraphLifecycleListener() {
            @Override
            public void onStart(String nodeId, Map<String, Object> state, RunnableConfig config) {
                System.out.println("节点开始执行: " + nodeId);
                System.out.println("输入状态: " + state);
            }

            @Override
            public void onComplete(String nodeId, Map<String, Object> state, RunnableConfig config) {
                System.out.println("节点执行完成: " + nodeId);
                System.out.println("输出状态: " + state);
            }

            @Override
            public void onError(String nodeId, Map<String, Object> state, Throwable ex, RunnableConfig config) {
                System.err.println("节点执行错误: " + nodeId);
                System.err.println("错误信息: " + ex.getMessage());
            }
        };

        CompileConfig config = CompileConfig.builder()
            .withLifecycleListener(listener)
            .build();

        StateGraph graph = new StateGraph(keyStrategyFactory)
            .addNode("process", node_async(state -> {
                String input = state.value("input", String.class).orElse("");
                return Map.of("result", "处理结果: " + input);
            }))

            .addEdge(START, "process")
            .addEdge("process", END);

        return graph.compile(config);
    }
}
```

## 调试最佳实践

### 1. 节点设计原则

#### 单一职责原则

每个节点应该专注于一个明确的任务，这样做的好处包括：

- **易于测试**：单一职责的节点更容易编写单元测试
- **易于维护**：职责明确的代码更容易理解和修改
- **可重用性**：专注的节点可以在不同的工作流中重用
- **错误隔离**：问题更容易定位和修复

```java
// 好的节点设计示例 - 专注于数据验证
NodeAction validationAction = state -> {
    try {
        String input = state.value("input", String.class).orElse("");

        // 输入验证
        ValidationResult validation = validateInput(input);

        if (validation.isValid()) {
            return Map.of(
                "validated_input", input,
                "validation_status", "success",
                "validation_details", validation.getDetails()
            );
        } else {
            return Map.of(
                "validation_status", "failed",
                "validation_errors", validation.getErrors()
            );
        }

    } catch (Exception e) {
        return Map.of(
            "validation_status", "error",
            "error_message", e.getMessage()
        );
    }
};
```

#### 幂等性设计

节点应该是幂等的，即多次执行产生相同的结果：

```java
NodeAction idempotentAction = state -> {
    String input = state.value("input", String.class).orElse("");
    String processedKey = "processed_" + input.hashCode();

    // 检查是否已经处理过
    if (state.value(processedKey, String.class).isPresent()) {
        return Map.of(); // 已处理，返回空更新
    }

    // 执行处理逻辑
    String result = processInput(input);

    return Map.of(
        "result", result,
        processedKey, "true"  // 标记已处理
    );
};
```

#### 错误处理策略

在节点内部优雅地处理错误，而不是让异常传播：

```java
NodeAction robustAction = state -> {
    try {
        String input = state.value("input", String.class).orElse("");

        // 前置检查
        if (input.trim().isEmpty()) {
            return Map.of(
                "status", "skipped",
                "reason", "输入为空，跳过处理"
            );
        }

        // 执行核心逻辑
        String result = performProcessing(input);

        return Map.of(
            "result", result,
            "status", "success",
            "processing_time", System.currentTimeMillis()
        );

    } catch (ValidationException e) {
        // 可预期的验证错误
        return Map.of(
            "status", "validation_error",
            "error_message", e.getMessage(),
            "error_code", e.getErrorCode()
        );

    } catch (ExternalServiceException e) {
        // 外部服务错误，可能需要重试
        return Map.of(
            "status", "external_error",
            "error_message", e.getMessage(),
            "retry_suggested", true
        );

    } catch (Exception e) {
        // 未预期的错误
        return Map.of(
            "status", "internal_error",
            "error_message", "内部处理错误",
            "error_details", e.getMessage()
        );
    }
};
```

### 2. 状态管理最佳实践

#### 状态键命名规范

```java
// 使用清晰的命名约定
KeyStrategyFactory bestPracticeStateFactory = () -> {
    Map<String, KeyStrategy> strategies = new HashMap<>();
    
    // 输入数据
    strategies.put("user_input", KeyStrategy.REPLACE);
    strategies.put("request_id", KeyStrategy.REPLACE);
    
    // 处理状态
    strategies.put("processing_stage", KeyStrategy.REPLACE);
    strategies.put("current_step", KeyStrategy.REPLACE);
    
    // 结果数据
    strategies.put("final_result", KeyStrategy.REPLACE);
    strategies.put("intermediate_results", KeyStrategy.APPEND);
    
    // 元数据
    strategies.put("execution_log", KeyStrategy.APPEND);
    strategies.put("performance_metrics", KeyStrategy.MERGE);
    strategies.put("error_history", KeyStrategy.APPEND);
    
    return strategies;
};
```

#### 状态验证

```java
NodeAction stateValidationAction = state -> {
    // 验证必需的状态键
    List<String> requiredKeys = List.of("user_input", "request_id");
    List<String> missingKeys = new ArrayList<>();
    
    for (String key : requiredKeys) {
        if (!state.value(key, Object.class).isPresent()) {
            missingKeys.add(key);
        }
    }
    
    if (!missingKeys.isEmpty()) {
        return Map.of(
            "status", "validation_failed",
            "missing_keys", missingKeys
        );
    }
    
    // 继续处理...
    return Map.of("status", "validated");
};
```

### 3. 调试工具和技巧

#### 调试模式配置

```java
@Configuration
@Profile("debug")
public class DebugGraphConfig {
    
    @Bean
    public CompileConfig debugCompileConfig() {
        return CompileConfig.builder()
            .debug(true)
            .withLifecycleListener(new DetailedLoggingListener())
            .build();
    }
    
    public static class DetailedLoggingListener implements GraphLifecycleListener {
        @Override
        public void onStart(String nodeId, Map<String, Object> state, RunnableConfig config) {
            System.out.println("=== 节点开始 ===");
            System.out.println("节点ID: " + nodeId);
            System.out.println("输入状态: " + formatState(state));
            System.out.println("时间戳: " + Instant.now());
        }
        
        @Override
        public void onComplete(String nodeId, Map<String, Object> state, RunnableConfig config) {
            System.out.println("=== 节点完成 ===");
            System.out.println("节点ID: " + nodeId);
            System.out.println("输出状态: " + formatState(state));
            System.out.println("时间戳: " + Instant.now());
        }
        
        private String formatState(Map<String, Object> state) {
            return state.entrySet().stream()
                .map(entry -> entry.getKey() + ": " + entry.getValue())
                .collect(Collectors.joining(", "));
        }
    }
}
```

## 下一步

- 返回并行处理：[并行处理](./parallel-processing)
- 返回控制流：[控制流](./control-flow)
- 返回总览：[使用 Graph API](./use-graph-api)
