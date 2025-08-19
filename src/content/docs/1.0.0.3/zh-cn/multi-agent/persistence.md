---
title: 持久化
description: Spring AI Alibaba Graph 持久化系统
---

# 持久化

Spring AI Alibaba Graph 内置了持久化层，通过检查点保存器（checkpointers）实现。当您使用检查点保存器编译图时，检查点保存器会在每个超级步骤保存图状态的 `检查点`。这些检查点保存到一个 `线程` 中，可以在图执行后访问。由于 `线程` 允许在执行后访问图的状态，因此可以实现人机交互、记忆、时间旅行和容错等强大功能。

:::note[Spring AI Alibaba API 自动处理检查点]
当使用 Spring AI Alibaba API 时，您无需手动实现或配置检查点保存器。API 会在后台为您处理所有持久化基础设施。
:::

## 线程

线程是分配给检查点保存器保存的每个检查点的唯一 ID 或线程标识符。它包含一系列运行的累积状态。当执行运行时，助手底层图的状态将持久化到线程中。

当使用检查点保存器调用图时，您**必须**在配置的 `configurable` 部分指定 `thread_id`：

```java
Map<String, Object> config = Map.of(
    "configurable", Map.of("thread_id", "1")
);
```

线程的当前和历史状态可以被检索。要持久化状态，必须在执行运行之前创建线程。

## 检查点

线程在特定时间点的状态称为检查点。检查点是在每个超级步骤保存的图状态快照，由 `StateSnapshot` 对象表示，具有以下关键属性：

- `config`: 与此检查点关联的配置。
- `metadata`: 与此检查点关联的元数据。
- `values`: 此时间点状态通道的值。
- `next`: 图中下一个要执行的节点名称元组。
- `tasks`: 包含下一个要执行任务信息的 `PregelTask` 对象元组。如果之前尝试过该步骤，它将包含错误信息。如果图从节点内部动态中断，任务将包含与中断相关的附加数据。

检查点被持久化，可用于稍后恢复线程的状态。

让我们看看当简单图按如下方式调用时保存了哪些检查点：

```java
import com.alibaba.cloud.ai.graph.StateGraph;
import com.alibaba.cloud.ai.graph.checkpoint.InMemoryCheckpointSaver;
import static com.alibaba.cloud.ai.graph.StateGraph.*;

public class State {
    private String foo;
    private List<String> bar; // 使用 reducer 累加

    // 构造函数、getter 和 setter
}

NodeAction nodeA = state -> {
    return Map.of("foo", "a", "bar", List.of("a"));
};

NodeAction nodeB = state -> {
    return Map.of("foo", "b", "bar", List.of("b"));
};

StateGraph workflow = new StateGraph(State.class);
workflow.addNode("node_a", nodeA);
workflow.addNode("node_b", nodeB);
workflow.addEdge(START, "node_a");
workflow.addEdge("node_a", "node_b");
workflow.addEdge("node_b", END);

CheckpointSaver checkpointer = new InMemoryCheckpointSaver();
CompiledGraph graph = workflow.compile(checkpointer);

Map<String, Object> config = Map.of("configurable", Map.of("thread_id", "1"));
graph.invoke(Map.of("foo", ""), config);
```

运行图后，我们期望看到恰好 4 个检查点：

- 空检查点，`START` 作为下一个要执行的节点
- 包含用户输入 `{'foo': '', 'bar': []}` 和 `node_a` 作为下一个要执行节点的检查点
- 包含 `node_a` 输出 `{'foo': 'a', 'bar': ['a']}` 和 `node_b` 作为下一个要执行节点的检查点
- 包含 `node_b` 输出 `{'foo': 'b', 'bar': ['a', 'b']}` 且没有下一个要执行节点的检查点

注意 `bar` 通道值包含两个节点的输出，因为我们为 `bar` 通道设置了 reducer。

### 获取状态

与保存的图状态交互时，您**必须**指定线程标识符。您可以通过调用 `graph.getState(config)` 查看图的_最新_状态。这将返回一个 `StateSnapshot` 对象，对应于配置中提供的线程 ID 关联的最新检查点，或者如果提供了检查点 ID，则对应于线程的特定检查点。

```java
// 获取最新状态快照
Map<String, Object> config = Map.of("configurable", Map.of("thread_id", "1"));
StateSnapshot snapshot = graph.getState(config);

// 获取特定 checkpoint_id 的状态快照
Map<String, Object> config = Map.of(
    "configurable", Map.of(
        "thread_id", "1",
        "checkpoint_id", "1ef663ba-28fe-6528-8002-5a559208592c"
    )
);
StateSnapshot snapshot = graph.getState(config);
```

在我们的示例中，`getState` 的输出将如下所示：

```java
StateSnapshot.builder()
    .values(Map.of("foo", "b", "bar", List.of("a", "b")))
    .next(List.of())
    .config(Map.of("configurable", Map.of(
        "thread_id", "1",
        "checkpoint_ns", "",
        "checkpoint_id", "1ef663ba-28fe-6528-8002-5a559208592c"
    )))
    .metadata(Map.of(
        "source", "loop",
        "writes", Map.of("node_b", Map.of("foo", "b", "bar", List.of("b"))),
        "step", 2
    ))
    .createdAt(Instant.parse("2024-08-29T19:19:38.821749Z"))
    .parentConfig(Map.of("configurable", Map.of(
        "thread_id", "1",
        "checkpoint_ns", "",
        "checkpoint_id", "1ef663ba-28f9-6ec4-8001-31981c2c39f8"
    )))
    .tasks(List.of())
    .build();
```

### 获取状态历史

您可以通过调用 `graph.getStateHistory(config)` 获取给定线程的图执行完整历史。这将返回与配置中提供的线程 ID 关联的 `StateSnapshot` 对象列表。重要的是，检查点将按时间顺序排列，最新的检查点/`StateSnapshot` 在列表的第一位。

```java
Map<String, Object> config = Map.of("configurable", Map.of("thread_id", "1"));
List<StateSnapshot> history = graph.getStateHistory(config);
```

### 重放

也可以回放先前的图执行。如果我们使用 `thread_id` 和 `checkpoint_id` 调用图，那么我们将_重放_对应于 `checkpoint_id` 的检查点_之前_先前执行的步骤，并且只执行检查点_之后_的步骤。

- `thread_id` 是线程的 ID。
- `checkpoint_id` 是指线程内特定检查点的标识符。

调用图时，您必须将这些作为配置的 `configurable` 部分传递：

```java
Map<String, Object> config = Map.of(
    "configurable", Map.of(
        "thread_id", "1",
        "checkpoint_id", "0c62ca34-ac19-445d-bbb0-5b4984975b2a"
    )
);
graph.invoke(null, config);
```

重要的是，Spring AI Alibaba Graph 知道特定步骤是否之前已执行。如果已执行，Spring AI Alibaba Graph 只是_重放_图中的特定步骤而不重新执行该步骤，但仅适用于提供的 `checkpoint_id` _之前_的步骤。`checkpoint_id` _之后_的所有步骤都将被执行（即新分支），即使它们之前已执行过。

### 更新状态

除了从特定`检查点`重放图之外，我们还可以_编辑_图状态。我们使用 `graph.updateState()` 来做到这一点。此方法接受三个不同的参数：

#### `config`

配置应包含指定要更新哪个线程的 `thread_id`。当只传递 `thread_id` 时，我们更新（或分叉）当前状态。可选地，如果我们包含 `checkpoint_id` 字段，那么我们分叉该选定的检查点。

#### `values`

这些是将用于更新状态的值。请注意，此更新的处理方式与来自节点的任何更新完全相同。这意味着这些值将传递给 reducer 函数（如果为图状态中的某些通道定义了它们）。这意味着 `updateState` 不会自动覆盖每个通道的通道值，而只覆盖没有 reducer 的通道。

#### `asNode`

调用 `updateState` 时可以选择性地指定的最后一件事是 `asNode`。如果您提供了它，更新将被应用，就像它来自节点 `asNode` 一样。如果未提供 `asNode`，它将设置为最后更新状态的节点（如果不模糊）。这很重要，因为下一步执行取决于最后给出更新的节点，因此这可以用来控制下一个执行哪个节点。

## 记忆存储

状态模式指定了在图执行时填充的一组键。如上所述，状态可以通过检查点保存器在每个图步骤写入线程，从而实现状态持久化。

但是，如果我们想要在_线程之间_保留一些信息怎么办？考虑聊天机器人的情况，我们希望在与该用户的_所有_聊天对话（例如线程）中保留关于用户的特定信息！

仅使用检查点保存器，我们无法在线程之间共享信息。这促使需要 `Store` 接口。作为说明，我们可以定义一个 `InMemoryStore` 来存储跨线程的用户信息。我们只需像以前一样使用检查点保存器编译我们的图，并使用我们新的 `inMemoryStore` 变量。

:::note[Spring AI Alibaba API 自动处理存储]
当使用 Spring AI Alibaba API 时，您无需手动实现或配置存储。API 会在后台为您处理所有存储基础设施。
:::

## 检查点保存器库

在底层，检查点由符合 `BaseCheckpointSaver` 接口的检查点保存器对象提供支持。Spring AI Alibaba 提供了几个检查点保存器实现：

- `spring-ai-alibaba-graph-checkpoint`: 检查点保存器的基础接口（`BaseCheckpointSaver`）和序列化/反序列化接口（`SerializerProtocol`）。包括用于实验的内存检查点保存器实现（`InMemoryCheckpointSaver`）。Spring AI Alibaba Graph 包含 `spring-ai-alibaba-graph-checkpoint`。
- `spring-ai-alibaba-graph-checkpoint-database`: 使用关系数据库的 Spring AI Alibaba Graph 检查点保存器实现（`DatabaseCheckpointSaver` / `AsyncDatabaseCheckpointSaver`）。适合生产使用。需要单独安装。
- `spring-ai-alibaba-graph-checkpoint-redis`: 使用 Redis 数据库的高级检查点保存器（`RedisCheckpointSaver` / `AsyncRedisCheckpointSaver`），在 Spring AI Alibaba Platform 中使用。适合高性能场景。需要单独安装。

## 功能

### 人机交互

首先，检查点保存器通过允许人类检查、中断和批准图步骤来促进人机交互工作流。这些工作流需要检查点保存器，因为人类必须能够在任何时间点查看图的状态，并且图必须能够在人类对状态进行任何更新后恢复执行。

### 记忆

其次，检查点保存器允许交互之间的"记忆"。在重复的人类交互（如对话）的情况下，任何后续消息都可以发送到该线程，该线程将保留对先前消息的记忆。

### 时间旅行

第三，检查点保存器允许"时间旅行"，允许用户重放先前的图执行以审查和/或调试特定的图步骤。此外，检查点保存器使得可以在任意检查点分叉图状态以探索替代轨迹。

### 容错

最后，检查点还提供容错和错误恢复：如果一个或多个节点在给定的超级步骤失败，您可以从最后一个成功的步骤重新启动图。此外，当图节点在给定超级步骤的中间执行失败时，Spring AI Alibaba Graph 存储来自在该超级步骤成功完成的任何其他节点的待处理检查点写入，以便每当我们从该超级步骤恢复图执行时，我们不会重新运行成功的节点。
