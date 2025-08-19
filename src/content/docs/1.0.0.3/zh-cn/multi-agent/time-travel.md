---
title: 时间旅行 (Time Travel)
description: Spring AI Alibaba 时间旅行功能
---

# 时间旅行 ⏱️

当使用基于模型决策的非确定性系统（例如，由 LLM 驱动的智能体）时，详细检查其决策过程可能很有用：

1. 🤔 **理解推理**：分析导致成功结果的步骤。
2. 🐞 **调试错误**：识别错误发生的位置和原因。
3. 🔍 **探索替代方案**：测试不同路径以发现更好的解决方案。

Spring AI Alibaba 提供[时间旅行功能](../how-tos/human-in-the-loop/time-travel.md)来支持这些用例。具体来说，您可以从先前的检查点恢复执行——要么重放相同的状态，要么修改它以探索替代方案。在所有情况下，恢复过去的执行都会在历史中产生新的分支。

:::tip
有关如何使用时间旅行的信息，请参阅[使用时间旅行](../how-tos/human-in-the-loop/time-travel.md)。
:::

## 使用时间旅行

要在 Spring AI Alibaba 中使用[时间旅行](./time-travel.md)：

1. [运行图](#1-运行图)：使用 [`invoke`](https://spring-ai-alibaba.github.io/reference/graphs/#invoke) 或 [`stream`](https://spring-ai-alibaba.github.io/reference/graphs/#stream) 方法运行图的初始输入。
2. [识别现有线程中的检查点](#2-识别检查点)：使用 [`getStateHistory()`](https://spring-ai-alibaba.github.io/reference/graphs/#getStateHistory) 方法检索特定 `threadId` 的执行历史并定位所需的 `checkpointId`。
   或者，在您希望执行暂停的节点之前设置[中断](../how-tos/human-in-the-loop/add-human-in-the-loop.md)。然后您可以找到记录到该中断的最新检查点。
3. [更新图状态（可选）](#3-更新状态可选)：使用 [`updateState`](https://spring-ai-alibaba.github.io/reference/graphs/#updateState) 方法修改检查点处的图状态，并从替代状态恢复执行。
4. [从检查点恢复执行](#4-从检查点恢复执行)：使用 `invoke` 或 `stream` 方法，输入为 `null`，配置包含适当的 `threadId` 和 `checkpointId`。

## 在工作流中使用

此示例构建了一个简单的 Spring AI Alibaba 工作流，该工作流生成笑话主题并使用 LLM 编写笑话。它演示了如何运行图、检索过去的执行检查点、可选地修改状态，以及从选定的检查点恢复执行以探索替代结果。

### 设置

首先，我们需要设置基本的依赖和配置：

```java
@Configuration
@EnableStateGraph
public class TimeTravelConfig {

    @Bean
    public CheckpointSaver checkpointSaver() {
        return new InMemoryCheckpointSaver(); // 在生产环境中使用数据库实现
    }

    @Bean
    public ChatClient chatClient() {
        return ChatClient.builder()
            .model("qwen-plus") // 或其他支持的模型
            .temperature(0.0)
            .build();
    }
}

// 定义状态类
public class JokeState {
    private String topic;
    private String joke;

    // constructors, getters and setters
    public JokeState() {}

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getJoke() { return joke; }
    public void setJoke(String joke) { this.joke = joke; }
}
```

### 构建工作流

```java
@Component
public class JokeWorkflow {

    @Autowired
    private ChatClient chatClient;

    @Autowired
    private CheckpointSaver checkpointSaver;

    // LLM 调用生成笑话主题
    public JokeState generateTopic(JokeState state) {
        ChatResponse response = chatClient.prompt()
            .user("给我一个有趣的笑话主题")
            .call();

        state.setTopic(response.getResult().getOutput().getContent());
        return state;
    }

    // LLM 调用基于主题编写笑话
    public JokeState writeJoke(JokeState state) {
        String prompt = String.format("写一个关于 %s 的简短笑话", state.getTopic());

        ChatResponse response = chatClient.prompt()
            .user(prompt)
            .call();

        state.setJoke(response.getResult().getOutput().getContent());
        return state;
    }

    @Bean
    public StateGraph<JokeState> createJokeGraph() {
        return StateGraph.<JokeState>builder()
            // 添加节点
            .addNode("generate_topic", this::generateTopic)
            .addNode("write_joke", this::writeJoke)

            // 添加边连接节点
            .addEdge("__start__", "generate_topic")
            .addEdge("generate_topic", "write_joke")
            .addEdge("write_joke", "__end__")

            // 编译图
            .build()
            .compile(checkpointSaver);
    }
}
```

### 1. 运行图

```java
@Service
public class TimeTravelExample {

    @Autowired
    private StateGraph<JokeState> jokeGraph;

    public void demonstrateTimeTravel() {
        // 创建配置
        Map<String, Object> config = Map.of(
            "configurable", Map.of(
                "thread_id", UUID.randomUUID().toString()
            )
        );

        // 运行图
        JokeState result = jokeGraph.invoke(new JokeState(), config);

        System.out.println("主题: " + result.getTopic());
        System.out.println();
        System.out.println("笑话: " + result.getJoke());

        // 示例输出：
        // 主题: 程序员的咖啡依赖症
        //
        // 笑话: 为什么程序员总是喝咖啡？
        // 因为没有咖啡，他们就会进入睡眠模式！
    }
}
```

### 2. 识别检查点

```java
@Service
public class CheckpointIdentificationService {

    @Autowired
    private StateGraph<JokeState> jokeGraph;

    public void identifyCheckpoints(Map<String, Object> config) {
        // 状态按时间倒序返回
        List<StateSnapshot> states = jokeGraph.getStateHistory(config);

        System.out.println("检查点历史:");
        for (StateSnapshot state : states) {
            System.out.println("下一步: " + state.getNext());
            System.out.println("检查点ID: " + state.getConfig().get("configurable"));
            System.out.println();
        }

        // 示例输出：
        // 下一步: []
        // 检查点ID: {thread_id=..., checkpoint_id=1f02ac4a-ec9f-6524-8002-8f7b0bbeed0e}
        //
        // 下一步: [write_joke]
        // 检查点ID: {thread_id=..., checkpoint_id=1f02ac4a-ce2a-6494-8001-cb2e2d651227}
        //
        // 下一步: [generate_topic]
        // 检查点ID: {thread_id=..., checkpoint_id=1f02ac4a-a4e0-630d-8000-b73c254ba748}
        //
        // 下一步: [__start__]
        // 检查点ID: {thread_id=..., checkpoint_id=1f02ac4a-a4dd-665e-bfff-e6c8c44315d9}
    }

    public StateSnapshot selectCheckpoint(Map<String, Object> config) {
        List<StateSnapshot> states = jokeGraph.getStateHistory(config);

        // 选择倒数第二个状态（在 write_joke 之前）
        StateSnapshot selectedState = states.get(1);

        System.out.println("选中的检查点:");
        System.out.println("下一步: " + selectedState.getNext());
        System.out.println("状态值: " + selectedState.getValues());

        // 示例输出：
        // 下一步: [write_joke]
        // 状态值: {topic=程序员的咖啡依赖症}

        return selectedState;
    }
}
```

### 3. 更新状态（可选）

`updateState` 将创建一个新的检查点。新检查点将与同一线程关联，但具有新的检查点 ID。

```java
@Service
public class StateUpdateService {

    @Autowired
    private StateGraph<JokeState> jokeGraph;

    public Map<String, Object> updateStateExample(StateSnapshot selectedState) {
        // 创建新状态值
        JokeState newValues = new JokeState();
        newValues.setTopic("小鸡");

        // 更新状态
        Map<String, Object> newConfig = jokeGraph.updateState(
            selectedState.getConfig(),
            newValues
        );

        System.out.println("新配置: " + newConfig);

        // 示例输出：
        // 新配置: {configurable={thread_id=c62e2e03-c27b-4cb6-8cea-ea9bfedae006,
        //                        checkpoint_ns=,
        //                        checkpoint_id=1f02ac4a-ecee-600b-8002-a1d21df32e4c}}

        return newConfig;
    }
}
```

### 4. 从检查点恢复执行

```java
@Service
public class ExecutionResumptionService {

    @Autowired
    private StateGraph<JokeState> jokeGraph;

    public JokeState resumeFromCheckpoint(Map<String, Object> newConfig) {
        // 从检查点恢复执行
        JokeState result = jokeGraph.invoke(null, newConfig);

        System.out.println("恢复执行结果:");
        System.out.println("主题: " + result.getTopic());
        System.out.println("笑话: " + result.getJoke());

        // 示例输出：
        // 主题: 小鸡
        // 笑话: 小鸡为什么要加入乐队？
        //       因为它有出色的鼓槌！

        return result;
    }
}

// 完整的时间旅行示例
@Service
public class CompleteTimeTravelExample {

    @Autowired
    private StateGraph<JokeState> jokeGraph;

    public void demonstrateCompleteTimeTravel() {
        // 1. 运行图
        Map<String, Object> config = Map.of(
            "configurable", Map.of(
                "thread_id", UUID.randomUUID().toString()
            )
        );

        JokeState initialResult = jokeGraph.invoke(new JokeState(), config);
        System.out.println("初始结果:");
        System.out.println("主题: " + initialResult.getTopic());
        System.out.println("笑话: " + initialResult.getJoke());
        System.out.println();

        // 2. 识别检查点
        List<StateSnapshot> states = jokeGraph.getStateHistory(config);
        StateSnapshot selectedState = states.get(1); // 选择 write_joke 之前的状态

        // 3. 更新状态
        JokeState newValues = new JokeState();
        newValues.setTopic("程序员");
        Map<String, Object> newConfig = jokeGraph.updateState(selectedState.getConfig(), newValues);

        // 4. 从检查点恢复执行
        JokeState newResult = jokeGraph.invoke(null, newConfig);
        System.out.println("时间旅行后的结果:");
        System.out.println("主题: " + newResult.getTopic());
        System.out.println("笑话: " + newResult.getJoke());
    }
}
```

## 配置选项

```properties
# 时间旅行配置
spring.ai.alibaba.time-travel.enabled=true
spring.ai.alibaba.time-travel.checkpointer.type=database
spring.ai.alibaba.time-travel.checkpointer.cleanup-interval=24h

# 检查点存储配置
spring.ai.alibaba.time-travel.checkpoint.max-history=100
spring.ai.alibaba.time-travel.checkpoint.compression.enabled=true
spring.ai.alibaba.time-travel.checkpoint.async-save=true

# 状态历史配置
spring.ai.alibaba.time-travel.history.max-entries=50
spring.ai.alibaba.time-travel.history.retention-days=30
spring.ai.alibaba.time-travel.history.auto-cleanup=true
```

## 最佳实践

### 1. 检查点管理
- **合理设置检查点频率**：在关键节点自动创建检查点
- **控制历史大小**：设置合理的历史记录保留策略
- **使用有意义的线程ID**：便于识别和管理不同的执行线程

### 2. 状态更新策略
- **谨慎修改状态**：确保状态修改的一致性和有效性
- **测试替代路径**：使用时间旅行探索不同的执行路径
- **记录变更原因**：为状态修改添加适当的注释和日志

### 3. 性能优化
- **异步处理**：使用异步方式保存检查点以减少延迟
- **压缩存储**：启用检查点压缩以节省存储空间
- **定期清理**：自动清理过期的检查点和历史记录

### 4. 调试和监控
- **可视化执行历史**：使用工具可视化执行路径和状态变化
- **监控资源使用**：跟踪检查点存储的资源消耗
- **错误处理**：妥善处理时间旅行过程中的异常情况

## 常见问题

### Q: 什么时候应该使用时间旅行？
A: 时间旅行特别适用于：
- 调试复杂的智能体行为
- 探索不同的决策路径
- 从错误状态恢复执行
- 测试替代的输入或参数

### Q: 时间旅行会影响性能吗？
A: 时间旅行需要额外的存储空间来保存检查点，但通过以下方式可以最小化影响：
- 启用检查点压缩
- 设置合理的历史保留策略
- 使用异步保存机制

### Q: 如何选择合适的检查点？
A: 选择检查点时考虑：
- 选择关键决策点之前的检查点
- 查看检查点的状态内容
- 考虑后续执行的复杂性

### Q: 可以从任意检查点恢复吗？
A: 是的，您可以从任何有效的检查点恢复执行，但需要注意：
- 确保检查点状态的完整性
- 考虑状态修改的影响
- 测试恢复后的执行路径

## 下一步

- [学习子图](./subgraphs.md)
- [探索持久化机制](./persistence.md)
- [了解人机协作](./human-in-the-loop.md)
