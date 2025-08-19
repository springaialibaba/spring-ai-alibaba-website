---
title: 子图 (Subgraphs)
description: Spring AI Alibaba 子图功能
---

# 子图 (Subgraphs)

子图是作为另一个图中的[节点](./low-level.md#节点)使用的[图](./low-level.md#图)——这是封装概念在 Spring AI Alibaba 中的应用。子图允许您构建具有多个组件的复杂系统，这些组件本身就是图。

![子图](https://langchain-ai.github.io/langgraph/concepts/img/subgraph.png)

使用子图的一些原因包括：

- 构建[多智能体系统](./multi-agent.md)
- 当您想在多个图中重用一组节点时
- 当您希望不同团队独立工作在图的不同部分时，您可以将每个部分定义为子图，只要子图接口（输入和输出模式）得到遵守，父图就可以在不了解子图任何细节的情况下构建

添加子图时的主要问题是父图和子图如何通信，即它们在图执行期间如何在彼此之间传递[状态](./low-level.md#状态)。有两种场景：

- 父图和子图在其状态[模式](./low-level.md#状态)中有**共享状态键**。在这种情况下，您可以[将子图作为节点包含在父图中](#共享状态模式)
- 父图和子图有**不同的模式**（在其状态[模式](./low-level.md#状态)中没有共享状态键）。在这种情况下，您必须[从父图中的节点内部调用子图](#不同状态模式)：当父图和子图有不同的状态模式，您需要在调用子图之前或之后转换状态时，这很有用

:::tip
有关如何使用子图的信息，请参阅[使用子图](../how-tos/subgraph.md)。
:::

## 共享状态模式

父图和子图通过状态[模式](./low-level.md#状态)中的共享状态键（通道）进行通信的常见情况。例如，在[多智能体](./multi-agent.md)系统中，智能体通常通过共享的 [messages](./low-level.md#为什么使用消息) 键进行通信。

如果您的子图与父图共享状态键，您可以按照以下步骤将其添加到图中：

1. 定义子图工作流（下面示例中的 `subgraphBuilder`）并编译它
2. 在定义父图工作流时，将编译的子图传递给 `.addNode` 方法

```java
import com.alibaba.cloud.ai.graph.StateGraph;
import com.alibaba.cloud.ai.graph.START;

// 定义状态类
public class State {
    private String foo;

    public State() {}

    public String getFoo() { return foo; }
    public void setFoo(String foo) { this.foo = foo; }
}

@Component
public class SubgraphExample {

    // 子图
    public State subgraphNode1(State state) {
        return new State() {{
            setFoo("hi! " + state.getFoo());
        }};
    }

    @Bean
    public StateGraph<State> createSubgraph() {
        StateGraph<State> subgraphBuilder = StateGraph.<State>builder()
            .addNode("subgraph_node_1", this::subgraphNode1)
            .addEdge(START, "subgraph_node_1")
            .build();

        return subgraphBuilder.compile();
    }

    // 父图
    @Bean
    public StateGraph<State> createParentGraph() {
        StateGraph<State> subgraph = createSubgraph();

        return StateGraph.<State>builder()
            .addNode("node_1", subgraph)
            .addEdge(START, "node_1")
            .build()
            .compile();
    }
}
```

### 完整示例：共享状态模式

```java
// 定义子图状态
public class SubgraphState {
    private String foo; // (1) 与父图状态共享的键
    private String bar; // (2) 子图私有的键，父图不可见

    public SubgraphState() {}

    public String getFoo() { return foo; }
    public void setFoo(String foo) { this.foo = foo; }

    public String getBar() { return bar; }
    public void setBar(String bar) { this.bar = bar; }
}

@Component
public class SharedStateSubgraphExample {

    // 子图节点
    public SubgraphState subgraphNode1(SubgraphState state) {
        SubgraphState newState = new SubgraphState();
        newState.setFoo(state.getFoo());
        newState.setBar("bar");
        return newState;
    }

    public SubgraphState subgraphNode2(SubgraphState state) {
        // 注意这个节点使用了只在子图中可用的状态键（'bar'）
        // 并在共享状态键（'foo'）上发送更新
        SubgraphState newState = new SubgraphState();
        newState.setFoo(state.getFoo() + state.getBar());
        newState.setBar(state.getBar());
        return newState;
    }

    @Bean
    public StateGraph<SubgraphState> createSubgraph() {
        return StateGraph.<SubgraphState>builder()
            .addNode("subgraph_node_1", this::subgraphNode1)
            .addNode("subgraph_node_2", this::subgraphNode2)
            .addEdge(START, "subgraph_node_1")
            .addEdge("subgraph_node_1", "subgraph_node_2")
            .build()
            .compile();
    }

    // 定义父图状态
    public static class ParentState {
        private String foo;

        public ParentState() {}

        public String getFoo() { return foo; }
        public void setFoo(String foo) { this.foo = foo; }
    }

    // 父图节点
    public ParentState node1(ParentState state) {
        ParentState newState = new ParentState();
        newState.setFoo("hi! " + state.getFoo());
        return newState;
    }

    @Bean
    public StateGraph<ParentState> createParentGraph() {
        StateGraph<SubgraphState> subgraph = createSubgraph();

        return StateGraph.<ParentState>builder()
            .addNode("node_1", this::node1)
            .addNode("node_2", subgraph)
            .addEdge(START, "node_1")
            .addEdge("node_1", "node_2")
            .build()
            .compile();
    }
}

// 使用示例
@Service
public class SubgraphUsageExample {

    @Autowired
    private StateGraph<ParentState> parentGraph;

    public void demonstrateSharedStateSubgraph() {
        ParentState initialState = new ParentState();
        initialState.setFoo("foo");

        for (Map<String, Object> chunk : parentGraph.stream(initialState)) {
            System.out.println(chunk);
        }

        // 输出：
        // {'node_1': {'foo': 'hi! foo'}}
        // {'node_2': {'foo': 'hi! foobar'}}
    }
}
```

1. 这个键与父图状态共享
2. 这个键是 `SubgraphState` 私有的，父图不可见

## 不同状态模式

对于更复杂的系统，您可能希望定义与父图具有**完全不同模式**的子图（没有共享键）。例如，您可能希望为[多智能体](./multi-agent.md)系统中的每个智能体保留私有消息历史。

如果您的应用程序是这种情况，您需要定义一个**调用子图的节点函数**。此函数需要在调用子图之前将输入（父）状态转换为子图状态，并在从节点返回状态更新之前将结果转换回父状态。

```java
// 定义子图状态
public class SubgraphState {
    private String bar;

    public SubgraphState() {}

    public String getBar() { return bar; }
    public void setBar(String bar) { this.bar = bar; }
}

@Component
public class DifferentStateSubgraphExample {

    // 子图
    public SubgraphState subgraphNode1(SubgraphState state) {
        SubgraphState newState = new SubgraphState();
        newState.setBar("hi! " + state.getBar());
        return newState;
    }

    @Bean
    public StateGraph<SubgraphState> createSubgraph() {
        return StateGraph.<SubgraphState>builder()
            .addNode("subgraph_node_1", this::subgraphNode1)
            .addEdge(START, "subgraph_node_1")
            .build()
            .compile();
    }

    // 父图状态
    public static class State {
        private String foo;

        public State() {}

        public String getFoo() { return foo; }
        public void setFoo(String foo) { this.foo = foo; }
    }

    // 调用子图的节点
    public State callSubgraph(State state) {
        // (1) 将状态转换为子图状态
        SubgraphState subgraphInput = new SubgraphState();
        subgraphInput.setBar(state.getFoo());

        SubgraphState subgraphOutput = createSubgraph().invoke(subgraphInput);

        // (2) 将响应转换回父状态
        State newState = new State();
        newState.setFoo(subgraphOutput.getBar());
        return newState;
    }

    @Bean
    public StateGraph<State> createParentGraph() {
        return StateGraph.<State>builder()
            .addNode("node_1", this::callSubgraph)
            .addEdge(START, "node_1")
            .build()
            .compile();
    }
}
```

1. 将状态转换为子图状态
2. 将响应转换回父状态

### 完整示例：不同状态模式

```java
// 定义子图状态
public class SubgraphState {
    // 注意这些键都不与父图状态共享
    private String bar;
    private String baz;

    public SubgraphState() {}

    public String getBar() { return bar; }
    public void setBar(String bar) { this.bar = bar; }

    public String getBaz() { return baz; }
    public void setBaz(String baz) { this.baz = baz; }
}

@Component
public class ComplexSubgraphExample {

    // 子图节点
    public SubgraphState subgraphNode1(SubgraphState state) {
        SubgraphState newState = new SubgraphState();
        newState.setBar(state.getBar());
        newState.setBaz("baz");
        return newState;
    }

    public SubgraphState subgraphNode2(SubgraphState state) {
        SubgraphState newState = new SubgraphState();
        newState.setBar(state.getBar() + state.getBaz());
        newState.setBaz(state.getBaz());
        return newState;
    }

    @Bean
    public StateGraph<SubgraphState> createSubgraph() {
        return StateGraph.<SubgraphState>builder()
            .addNode("subgraph_node_1", this::subgraphNode1)
            .addNode("subgraph_node_2", this::subgraphNode2)
            .addEdge(START, "subgraph_node_1")
            .addEdge("subgraph_node_1", "subgraph_node_2")
            .build()
            .compile();
    }

    // 定义父图状态
    public static class ParentState {
        private String foo;

        public ParentState() {}

        public String getFoo() { return foo; }
        public void setFoo(String foo) { this.foo = foo; }
    }

    // 父图节点
    public ParentState node1(ParentState state) {
        ParentState newState = new ParentState();
        newState.setFoo("hi! " + state.getFoo());
        return newState;
    }

    public ParentState node2(ParentState state) {
        // (1) 将状态转换为子图状态
        SubgraphState subgraphInput = new SubgraphState();
        subgraphInput.setBar(state.getFoo());

        SubgraphState response = createSubgraph().invoke(subgraphInput);

        // (2) 将响应转换回父状态
        ParentState newState = new ParentState();
        newState.setFoo(response.getBar());
        return newState;
    }

    @Bean
    public StateGraph<ParentState> createParentGraph() {
        return StateGraph.<ParentState>builder()
            .addNode("node_1", this::node1)
            .addNode("node_2", this::node2)
            .addEdge(START, "node_1")
            .addEdge("node_1", "node_2")
            .build()
            .compile();
    }
}

// 使用示例
@Service
public class DifferentStateUsageExample {

    @Autowired
    private StateGraph<ParentState> parentGraph;

    public void demonstrateDifferentStateSubgraph() {
        ParentState initialState = new ParentState();
        initialState.setFoo("foo");

        for (Map<String, Object> chunk : parentGraph.stream(initialState, true)) {
            System.out.println(chunk);
        }

        // 输出：
        // ((), {'node_1': {'foo': 'hi! foo'}})
        // (('node_2:9c36dd0f-151a-cb42-cbad-fa2f851f9ab7',), {'subgraph_node_1': {'baz': 'baz'}})
        // (('node_2:9c36dd0f-151a-cb42-cbad-fa2f851f9ab7',), {'subgraph_node_2': {'bar': 'hi! foobaz'}})
        // ((), {'node_2': {'foo': 'hi! foobaz'}})
    }
}
```

1. 将状态转换为子图状态
2. 将响应转换回父状态

## 添加持久化

您只需要**在编译父图时提供检查点保存器**。Spring AI Alibaba 将自动将检查点保存器传播到子图。

```java
import com.alibaba.cloud.ai.graph.START;
import com.alibaba.cloud.ai.graph.StateGraph;
import com.alibaba.cloud.ai.checkpoint.memory.InMemoryCheckpointSaver;

public class State {
    private String foo;

    public State() {}

    public String getFoo() { return foo; }
    public void setFoo(String foo) { this.foo = foo; }
}

@Component
public class PersistentSubgraphExample {

    // 子图
    public State subgraphNode1(State state) {
        State newState = new State();
        newState.setFoo(state.getFoo() + "bar");
        return newState;
    }

    @Bean
    public StateGraph<State> createSubgraph() {
        return StateGraph.<State>builder()
            .addNode("subgraph_node_1", this::subgraphNode1)
            .addEdge(START, "subgraph_node_1")
            .build()
            .compile();
    }

    // 父图
    @Bean
    public StateGraph<State> createParentGraphWithPersistence() {
        StateGraph<State> subgraph = createSubgraph();

        InMemoryCheckpointSaver checkpointer = new InMemoryCheckpointSaver();

        return StateGraph.<State>builder()
            .addNode("node_1", subgraph)
            .addEdge(START, "node_1")
            .build()
            .compile(checkpointer);
    }
}
```

如果您希望子图**拥有自己的内存**，您可以使用适当的检查点保存器选项编译它。这在[多智能体](./multi-agent.md)系统中很有用，如果您希望智能体跟踪其内部消息历史：

```java
@Bean
public StateGraph<SubgraphState> createSubgraphWithOwnMemory() {
    return StateGraph.<SubgraphState>builder()
        // ... 添加节点和边
        .build()
        .compile(true); // 使用独立的检查点保存器
}
```

## 查看子图状态

当您启用[持久化](./persistence.md)时，您可以通过适当的方法[检查图状态](./persistence.md#检查点)（检查点）。要查看子图状态，您可以使用 subgraphs 选项。

您可以通过 `graph.getState(config)` 检查图状态。要查看子图状态，您可以使用 `graph.getState(config, true)`。

:::important 仅在中断时可用
子图状态只能在**子图被中断时**查看。一旦您恢复图，您将无法访问子图状态。
:::

### 查看中断的子图状态示例

```java
import com.alibaba.cloud.ai.graph.START;
import com.alibaba.cloud.ai.graph.StateGraph;
import com.alibaba.cloud.ai.checkpoint.memory.InMemoryCheckpointSaver;
import com.alibaba.cloud.ai.types.interrupt;
import com.alibaba.cloud.ai.types.Command;

public class State {
    private String foo;

    public State() {}

    public String getFoo() { return foo; }
    public void setFoo(String foo) { this.foo = foo; }
}

@Component
public class InterruptedSubgraphExample {

    // 子图
    public State subgraphNode1(State state) {
        String value = interrupt("Provide value:");
        State newState = new State();
        newState.setFoo(state.getFoo() + value);
        return newState;
    }

    @Bean
    public StateGraph<State> createInterruptedSubgraph() {
        return StateGraph.<State>builder()
            .addNode("subgraph_node_1", this::subgraphNode1)
            .addEdge(START, "subgraph_node_1")
            .build()
            .compile();
    }

    // 父图
    @Bean
    public StateGraph<State> createParentGraphWithInterruption() {
        StateGraph<State> subgraph = createInterruptedSubgraph();

        InMemoryCheckpointSaver checkpointer = new InMemoryCheckpointSaver();

        return StateGraph.<State>builder()
            .addNode("node_1", subgraph)
            .addEdge(START, "node_1")
            .build()
            .compile(checkpointer);
    }

    public void demonstrateSubgraphStateViewing() {
        StateGraph<State> graph = createParentGraphWithInterruption();
        Map<String, Object> config = Map.of("configurable", Map.of("thread_id", "1"));

        State initialState = new State();
        initialState.setFoo("");

        graph.invoke(initialState, config);

        GraphState parentState = graph.getState(config);
        GraphState subgraphState = graph.getState(config, true).getTasks().get(0).getState(); // (1)

        // 恢复子图
        graph.invoke(Command.resume("bar"), config);
    }
}
```

1. 这只有在子图被中断时才可用。一旦您恢复图，您将无法访问子图状态。

## 流式输出子图

要在流式输出中包含子图的输出，您可以在父图的 stream 方法中设置 subgraphs 选项。这将流式输出父图和任何子图的输出。

```java
@Service
public class SubgraphStreamingExample {

    @Autowired
    private StateGraph<ParentState> parentGraph;

    public void demonstrateSubgraphStreaming() {
        ParentState initialState = new ParentState();
        initialState.setFoo("foo");

        for (Map<String, Object> chunk : parentGraph.stream(
            initialState,
            true, // (1) 设置 subgraphs=true 以流式输出子图
            "updates"
        )) {
            System.out.println(chunk);
        }

        // 输出：
        // ((), {'node_1': {'foo': 'hi! foo'}})
        // (('node_2:e58e5673-a661-ebb0-70d4-e298a7fc28b7',), {'subgraph_node_1': {'bar': 'bar'}})
        // (('node_2:e58e5673-a661-ebb0-70d4-e298a7fc28b7',), {'subgraph_node_2': {'foo': 'hi! foobar'}})
        // ((), {'node_2': {'foo': 'hi! foobar'}})
    }
}
```

1. 设置 `subgraphs=true` 以流式输出子图。

## 配置选项

```properties
# 子图基本配置
spring.ai.alibaba.subgraphs.enabled=true
spring.ai.alibaba.subgraphs.max-depth=5
spring.ai.alibaba.subgraphs.timeout=30m

# 状态管理配置
spring.ai.alibaba.subgraphs.state.isolation=true
spring.ai.alibaba.subgraphs.state.auto-cleanup=true
spring.ai.alibaba.subgraphs.state.memory-limit=100MB

# 执行配置
spring.ai.alibaba.subgraphs.execution.parallel=true
spring.ai.alibaba.subgraphs.execution.max-concurrent=10
spring.ai.alibaba.subgraphs.execution.retry-attempts=3

# 监控配置
spring.ai.alibaba.subgraphs.monitoring.enabled=true
spring.ai.alibaba.subgraphs.monitoring.metrics=true
spring.ai.alibaba.subgraphs.monitoring.tracing=true
```

## 最佳实践

### 1. 设计原则
- **单一职责**：每个子图应该有明确的单一功能
- **清晰接口**：定义明确的输入输出状态模式
- **错误处理**：实现适当的错误处理和恢复机制
- **状态隔离**：合理使用状态隔离避免意外的状态污染

### 2. 性能优化
- **并行执行**：在可能的情况下使用并行子图执行
- **状态传递**：优化状态转换以减少序列化开销
- **资源管理**：监控子图的资源使用情况
- **缓存策略**：对重复的子图调用实施缓存

### 3. 可维护性
- **模块化设计**：将复杂逻辑分解为可重用的子图
- **版本管理**：为子图实施版本控制策略
- **文档完整**：提供详细的子图文档和使用示例
- **测试覆盖**：为每个子图编写全面的单元测试

### 4. 多智能体系统
- **智能体隔离**：为每个智能体使用独立的子图
- **通信机制**：通过共享状态键实现智能体间通信
- **协调策略**：实施适当的智能体协调和同步机制
- **故障恢复**：设计智能体故障时的恢复策略

## 常见问题

### Q: 什么时候应该使用子图？
A: 子图适用于以下场景：
- 构建多智能体系统
- 需要重用一组节点的逻辑
- 不同团队独立开发图的不同部分
- 需要模块化复杂的工作流

### Q: 共享状态模式和不同状态模式如何选择？
A:
- **共享状态模式**：当父图和子图需要共享某些状态信息时使用
- **不同状态模式**：当需要完全隔离状态或进行复杂状态转换时使用

### Q: 子图的性能开销如何？
A: 子图会带来一些开销：
- 状态序列化/反序列化
- 额外的内存使用
- 可能的网络通信（分布式场景）
- 通过合理设计和优化可以最小化这些开销

### Q: 如何调试子图？
A: 调试子图的方法：
- 使用流式输出查看子图执行过程
- 启用详细的日志记录
- 使用中断功能检查子图状态
- 编写针对子图的单元测试

## 下一步

- [学习多智能体系统](./multi-agent.md)
- [了解持久化机制](./persistence.md)
- [探索人机协作](./human-in-the-loop.md)
