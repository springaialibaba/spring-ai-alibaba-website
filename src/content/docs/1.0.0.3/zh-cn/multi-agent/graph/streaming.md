---
title: 流式输出
keywords: ["Spring AI Alibaba", "Graph", "Streaming", "流式处理", "实时输出"]
description: "学习如何使用 Spring AI Alibaba Graph 的流式处理功能，实现实时的工作流输出和进度监控。"
---

您可以从 Spring AI Alibaba Graph 智能体或工作流中[流式输出](../concepts/streaming.md)。

## 支持的流式模式

将以下一种或多种流式模式作为列表传递给 [`stream()`](../../api-reference/graph/#stream) 或 [`streamAsync()`](../../api-reference/graph/#streamAsync) 方法：

| 模式       | 描述                                                                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `values`   | 在图的每个步骤后流式传输状态的完整值。                                                                                                                                       |
| `updates`  | 在图的每个步骤后流式传输状态的更新。如果在同一步骤中进行多次更新（例如，运行多个节点），这些更新将分别流式传输。                                                           |
| `custom`   | 从图节点内部流式传输自定义数据。                                                                                                                                             |
| `messages` | 从调用 LLM 的任何图节点流式传输 2 元组（LLM 令牌，元数据）。                                                                                                                |
| `debug`    | 在图的执行过程中流式传输尽可能多的信息。                                                                                                                                     |

## 从智能体流式处理

### 智能体进度

要流式传输智能体进度，请使用 [`stream()`](../../api-reference/graph/#stream) 或 [`streamAsync()`](../../api-reference/graph/#streamAsync) 方法，并设置 `streamMode="updates"`。这会在每个智能体步骤后发出事件。

例如，如果您有一个调用工具一次的智能体，您应该看到以下更新：

- **LLM 节点**：带有工具调用请求的 AI 消息
- **工具节点**：带有执行结果的工具消息
- **LLM 节点**：最终 AI 响应

=== "同步"

    ```java hl_lines="5 7"
    @Service
    public class AgentStreamingService {

        @Autowired
        private CompiledGraph reactAgent;

        public void processWithStreaming(String userInput) {
            Map<String, Object> input = Map.of(
                "messages", List.of(Map.of(
                    "role", "user",
                    "content", userInput
                ))
            );

            // 流式执行智能体
            for (StreamEvent chunk : reactAgent.stream(input, StreamConfig.builder()
                    .streamMode("updates")
                    .build())) {
                System.out.println(chunk);
                System.out.println();
            }
        }
    }
    ```

=== "异步"

    ```java hl_lines="5 7"
    @Service
    public class AgentStreamingService {

        @Autowired
        private CompiledGraph reactAgent;

        public void processWithStreaming(String userInput) {
            Map<String, Object> input = Map.of(
                "messages", List.of(Map.of(
                    "role", "user",
                    "content", userInput
                ))
            );

            // 异步流式执行智能体
            reactAgent.streamAsync(input, StreamConfig.builder()
                    .streamMode("updates")
                    .build())
                .subscribe(chunk -> {
                    System.out.println(chunk);
                    System.out.println();
                });
        }
    }
    ```

### LLM 令牌

要流式传输 LLM 生成的令牌，请使用 `streamMode="messages"`：

=== "同步"

    ```java hl_lines="5 7"
    @Service
    public class LLMTokenStreamingService {

        @Autowired
        private CompiledGraph reactAgent;

        public void streamLLMTokens(String userInput) {
            Map<String, Object> input = Map.of(
                "messages", List.of(Map.of(
                    "role", "user",
                    "content", userInput
                ))
            );

            // 流式传输 LLM 令牌
            for (StreamEvent event : reactAgent.stream(input, StreamConfig.builder()
                    .streamMode("messages")
                    .build())) {
                if (event instanceof MessageStreamEvent) {
                    MessageStreamEvent msgEvent = (MessageStreamEvent) event;
                    System.out.println("令牌: " + msgEvent.getToken());
                    System.out.println("元数据: " + msgEvent.getMetadata());
                    System.out.println();
                }
            }
        }
    }
    ```

=== "异步"

    ```java hl_lines="5 7"
    @Service
    public class LLMTokenStreamingService {

        @Autowired
        private CompiledGraph reactAgent;

        public void streamLLMTokens(String userInput) {
            Map<String, Object> input = Map.of(
                "messages", List.of(Map.of(
                    "role", "user",
                    "content", userInput
                ))
            );

            // 异步流式传输 LLM 令牌
            reactAgent.streamAsync(input, StreamConfig.builder()
                    .streamMode("messages")
                    .build())
                .subscribe(event -> {
                    if (event instanceof MessageStreamEvent) {
                        MessageStreamEvent msgEvent = (MessageStreamEvent) event;
                        System.out.println("令牌: " + msgEvent.getToken());
                        System.out.println("元数据: " + msgEvent.getMetadata());
                        System.out.println();
                    }
                });
        }
    }
    ```

### 工具更新

要在工具执行时流式传输更新，您可以使用 [getStreamWriter](../../api-reference/config/#getStreamWriter)：

```java
import com.alibaba.cloud.ai.graph.config.StreamWriter;
import com.alibaba.cloud.ai.graph.config.GraphConfig;

@Component
public class WeatherTool {

    public String getWeather(String city) {
        StreamWriter writer = GraphConfig.getStreamWriter();

        // 流式传输任意数据
        writer.write(Map.of(
            "type", "progress",
            "message", "正在查找城市数据: " + city
        ));

        // 模拟 API 调用
        String result = callWeatherAPI(city);

        writer.write(Map.of(
            "type", "result",
            "message", "天气数据获取完成"
        ));

        return result;
    }

    private String callWeatherAPI(String city) {
        return city + " 总是阳光明媚！";
    }
}

// 在图中使用工具
@Service
public class WeatherAgentService {

    @Autowired
    private CompiledGraph weatherAgent;

    public void processWeatherQuery(String query) {
        Map<String, Object> input = Map.of(
            "messages", List.of(Map.of(
                "role", "user",
                "content", query
            ))
        );

        weatherAgent.stream(input, StreamConfig.builder()
                .streamMode("custom")
                .build())
            .subscribe(chunk -> {
                System.out.println(chunk);
                System.out.println();
            });
    }
}
```

!!! Note "注意"

    如果您在工具内部添加 `getStreamWriter`，您将无法在 Spring AI Alibaba Graph 执行上下文之外调用该工具。

### 流式传输多种模式

您可以通过将流式模式作为列表传递来指定多种流式模式：`streamMode=["updates", "messages", "custom"]`：

```java
@Service
public class MultiModeStreamingService {

    @Autowired
    private CompiledGraph reactAgent;

    public void streamMultipleModes(String userInput) {
        Map<String, Object> input = Map.of(
            "messages", List.of(Map.of(
                "role", "user",
                "content", userInput
            ))
        );

        // 流式传输多种模式
        reactAgent.stream(input, StreamConfig.builder()
                .streamModes(List.of("updates", "messages", "custom"))
                .build())
            .subscribe(streamEvent -> {
                String mode = streamEvent.getMode();
                Object chunk = streamEvent.getChunk();

                System.out.println("模式: " + mode);
                System.out.println("数据: " + chunk);
                System.out.println();
            });
    }
}
```

### 禁用流式处理

在某些应用程序中，您可能需要为给定模型禁用单个令牌的流式处理。这在[多智能体](../multi-agent)系统中很有用，可以控制哪些智能体流式传输其输出。

请参阅[模型](../models#disable-streaming)指南了解如何禁用流式处理。

## 从工作流流式处理

### 基本用法示例

Spring AI Alibaba Graph 图公开了 [`.stream()`](../../api-reference/graph/#stream)（同步）和 [`.streamAsync()`](../../api-reference/graph/#streamAsync)（异步）方法，以产生流式输出作为迭代器。

```java
// 同步
for (StreamEvent chunk : graph.stream(inputs, StreamConfig.builder()
        .streamMode("updates")
        .build())) {
    System.out.println(chunk);
}

// 异步
graph.streamAsync(inputs, StreamConfig.builder()
        .streamMode("updates")
        .build())
    .subscribe(chunk -> System.out.println(chunk));
```

??? example "扩展示例：流式传输更新"

    ```java
    import com.alibaba.cloud.ai.graph.StateGraph;
    import com.alibaba.cloud.ai.graph.action.NodeAction;
    import static com.alibaba.cloud.ai.graph.StateGraph.*;

    public class StreamingUpdatesExample {

        public static class State {
            private String topic;
            private String joke;

            // 构造函数、getter 和 setter
        }

        public static NodeAction refineTopic = state -> {
            String topic = (String) state.value("topic").orElse("");
            return Map.of("topic", topic + " and cats");
        };

        public static NodeAction generateJoke = state -> {
            String topic = (String) state.value("topic").orElse("");
            return Map.of("joke", "This is a joke about " + topic);
        };

        public static void main(String[] args) {
            CompiledGraph graph = new StateGraph(keyStrategyFactory)
                .addNode("refineTopic", node_async(refineTopic))
                .addNode("generateJoke", node_async(generateJoke))
                .addEdge(START, "refineTopic")
                .addEdge("refineTopic", "generateJoke")
                .addEdge("generateJoke", END)
                .compile();

            // 流式执行
            for (StreamEvent chunk : graph.stream(
                    Map.of("topic", "ice cream"),
                    StreamConfig.builder()
                        .streamMode("updates")
                        .build())) {
                System.out.println(chunk);
            }
        }
    }
    ```

    输出：
    ```
    {'refineTopic': {'topic': 'ice cream and cats'}}
    {'generateJoke': {'joke': 'This is a joke about ice cream and cats'}}
    ```

### 流式传输多种模式

您可以将列表作为 `streamMode` 参数传递，以一次流式传输多种模式。

流式输出将是 `(mode, chunk)` 的元组，其中 `mode` 是流式模式的名称，`chunk` 是该模式流式传输的数据。

```java
// 同步
for (StreamEvent event : graph.stream(inputs, StreamConfig.builder()
        .streamModes(List.of("updates", "custom"))
        .build())) {
    String mode = event.getMode();
    Object chunk = event.getChunk();
    System.out.println("模式: " + mode + ", 数据: " + chunk);
}

// 异步
graph.streamAsync(inputs, StreamConfig.builder()
        .streamModes(List.of("updates", "custom"))
        .build())
    .subscribe(event -> {
        String mode = event.getMode();
        Object chunk = event.getChunk();
        System.out.println("模式: " + mode + ", 数据: " + chunk);
    });
```

### 流式传输图状态

使用流式模式 `updates` 和 `values` 来流式传输图在执行时的状态。

- `updates` 流式传输图每个步骤后状态的**更新**。
- `values` 流式传输图每个步骤后状态的**完整值**。

API 参考：[StateGraph](../../api-reference/graph/#StateGraph) | [START](../../api-reference/graph/#START) | [END](../../api-reference/graph/#END)

```java
import com.alibaba.cloud.ai.graph.StateGraph;
import com.alibaba.cloud.ai.graph.action.NodeAction;
import static com.alibaba.cloud.ai.graph.StateGraph.*;

public class State {
    private String topic;
    private String joke;

    // 构造函数、getter 和 setter
}

NodeAction refineTopic = state -> {
    String topic = (String) state.value("topic").orElse("");
    return Map.of("topic", topic + " and cats");
};

NodeAction generateJoke = state -> {
    String topic = (String) state.value("topic").orElse("");
    return Map.of("joke", "This is a joke about " + topic);
};

CompiledGraph graph = new StateGraph(keyStrategyFactory)
    .addNode("refineTopic", node_async(refineTopic))
    .addNode("generateJoke", node_async(generateJoke))
    .addEdge(START, "refineTopic")
    .addEdge("refineTopic", "generateJoke")
    .addEdge("generateJoke", END)
    .compile();
```

=== "updates"

    使用此模式仅流式传输每个步骤后节点返回的**状态更新**。流式输出包括节点的名称以及更新。

    ```java
    for (StreamEvent chunk : graph.stream(
            Map.of("topic", "ice cream"),
            StreamConfig.builder()
                .streamMode("updates")
                .build())) {
        System.out.println(chunk);
    }
    ```

=== "values"

    使用此模式流式传输每个步骤后图的**完整状态**。

    ```java
    for (StreamEvent chunk : graph.stream(
            Map.of("topic", "ice cream"),
            StreamConfig.builder()
                .streamMode("values")
                .build())) {
        System.out.println(chunk);
    }
    ```

### 流式传输子图输出

要在流式输出中包含来自[子图](../subgraphs)的输出，您可以在父图的 `.stream()` 方法中设置 `subgraphs=true`。这将流式传输来自父图和任何子图的输出。

输出将作为元组 `(namespace, data)` 流式传输，其中 `namespace` 是一个元组，包含调用子图的节点的路径，例如 `("parent_node:<task_id>", "child_node:<task_id>")`。

```java
for (StreamEvent chunk : graph.stream(
        Map.of("foo", "foo"),
        StreamConfig.builder()
            .streamMode("updates")
            .subgraphs(true)  // 设置 subgraphs=true 以流式传输子图输出
            .build())) {
    System.out.println(chunk);
}
```

??? example "扩展示例：从子图流式传输"

    ```java
    import com.alibaba.cloud.ai.graph.StateGraph;
    import static com.alibaba.cloud.ai.graph.StateGraph.*;

    // 定义子图
    public static class SubgraphState {
        private String foo;  // 注意这个键与父图状态共享
        private String bar;

        // 构造函数、getter 和 setter
    }

    NodeAction subgraphNode1 = state -> Map.of("bar", "bar");

    NodeAction subgraphNode2 = state -> {
        String foo = (String) state.value("foo").orElse("");
        String bar = (String) state.value("bar").orElse("");
        return Map.of("foo", foo + bar);
    };

    CompiledGraph subgraph = new StateGraph(subgraphKeyStrategyFactory)
        .addNode("subgraphNode1", node_async(subgraphNode1))
        .addNode("subgraphNode2", node_async(subgraphNode2))
        .addEdge(START, "subgraphNode1")
        .addEdge("subgraphNode1", "subgraphNode2")
        .compile();

    // 定义父图
    public static class ParentState {
        private String foo;

        // 构造函数、getter 和 setter
    }

    NodeAction node1 = state -> {
        String foo = (String) state.value("foo").orElse("");
        return Map.of("foo", "hi! " + foo);
    };

    CompiledGraph graph = new StateGraph(parentKeyStrategyFactory)
        .addNode("node1", node_async(node1))
        .addNode("node2", subgraph)
        .addEdge(START, "node1")
        .addEdge("node1", "node2")
        .compile();

    for (StreamEvent chunk : graph.stream(
            Map.of("foo", "foo"),
            StreamConfig.builder()
                .streamMode("updates")
                .subgraphs(true)  // 设置 subgraphs=true 以流式传输子图输出
                .build())) {
        System.out.println(chunk);
    }
    ```

    输出：
    ```
    ((), {'node1': {'foo': 'hi! foo'}})
    (('node2:dfddc4ba-c3c5-6887-5012-a243b5b377c2',), {'subgraphNode1': {'bar': 'bar'}})
    (('node2:dfddc4ba-c3c5-6887-5012-a243b5b377c2',), {'subgraphNode2': {'foo': 'hi! foobar'}})
    ((), {'node2': {'foo': 'hi! foobar'}})
    ```

    **注意**，我们不仅接收节点更新，还接收命名空间，这些命名空间告诉我们正在从哪个图（或子图）流式传输。

### 调试 {#debug}

使用 `debug` 流式模式在图的执行过程中流式传输尽可能多的信息。流式输出包括节点的名称以及完整状态。

```java
for (StreamEvent chunk : graph.stream(
        Map.of("topic", "ice cream"),
        StreamConfig.builder()
            .streamMode("debug")
            .build())) {
    System.out.println(chunk);
}
```

### LLM 令牌 {#messages}

使用 `messages` 流式模式从图的任何部分**逐令牌**流式传输大语言模型（LLM）输出，包括节点、工具、子图或任务。

来自 [`messages` 模式](#supported-stream-modes)的流式输出是一个元组 `(message_chunk, metadata)`，其中：

- `message_chunk`：来自 LLM 的令牌或消息段。
- `metadata`：包含图节点和 LLM 调用详细信息的字典。

> 如果您的 LLM 不作为 Spring AI 集成提供，您可以使用 `custom` 模式流式传输其输出。请参阅[与任何 LLM 一起使用](#use-with-any-llm)了解详细信息。

!!! warning "异步需要手动配置"

    在 Java 中使用异步代码时，您必须显式传递 `RunnableConfig` 到 `invokeAsync()` 以启用正确的流式传输。

API 参考：[ChatClient](../../api-reference/chat/#ChatClient) | [StateGraph](../../api-reference/graph/#StateGraph) | [START](../../api-reference/graph/#START)

```java
import com.alibaba.cloud.ai.chat.ChatClient;
import com.alibaba.cloud.ai.graph.StateGraph;
import static com.alibaba.cloud.ai.graph.StateGraph.*;

public class MyState {
    private String topic;
    private String joke = "";

    // 构造函数、getter 和 setter
}

@Autowired
private ChatClient chatClient;

NodeAction callModel = state -> {
    String topic = (String) state.value("topic").orElse("");

    // 调用 LLM 生成关于主题的笑话
    String response = chatClient.prompt()  // (1)!
        .user("Generate a joke about " + topic)
        .call()
        .content();

    return Map.of("joke", response);
};

CompiledGraph graph = new StateGraph(keyStrategyFactory)
    .addNode("callModel", node_async(callModel))
    .addEdge(START, "callModel")
    .compile();

// 流式传输 LLM 令牌
for (StreamEvent event : graph.stream(  // (2)!
        Map.of("topic", "ice cream"),
        StreamConfig.builder()
            .streamMode("messages")
            .build())) {

    if (event instanceof MessageStreamEvent) {
        MessageStreamEvent msgEvent = (MessageStreamEvent) event;
        if (msgEvent.getContent() != null) {
            System.out.print(msgEvent.getContent() + "|");
        }
    }
}
```

1. 注意，即使使用 `.call()` 而不是 `.stream()` 运行 LLM，也会发出消息事件。
2. "messages" 流式模式返回一个迭代器，其中包含元组 `(message_chunk, metadata)`，其中 `message_chunk` 是 LLM 流式传输的令牌，`metadata` 是包含调用 LLM 的图节点信息和其他信息的字典。

### 流式传输自定义数据

要从 Spring AI Alibaba Graph 节点或工具内部发送自定义用户定义的数据，请按照以下步骤操作：

1. 使用 `getStreamWriter()` 访问流写入器并发出自定义数据。
2. 在调用 `.stream()` 或 `.streamAsync()` 时设置 `streamMode="custom"` 以在流中获取自定义数据。您可以组合多种模式（例如，`["updates", "custom"]`），但至少一种必须是 `"custom"`。

=== "节点"

    ```java
    import com.alibaba.cloud.ai.graph.config.StreamWriter;
    import com.alibaba.cloud.ai.graph.config.GraphConfig;

    public class State {
        private String query;
        private String answer;

        // 构造函数、getter 和 setter
    }

    NodeAction customNode = state -> {
        StreamWriter writer = GraphConfig.getStreamWriter();  // (1)!
        writer.write(Map.of("custom_key", "在节点内生成自定义数据")); // (2)!
        return Map.of("answer", "some data");
    };

    CompiledGraph graph = new StateGraph(keyStrategyFactory)
        .addNode("node", node_async(customNode))
        .addEdge(START, "node")
        .compile();

    Map<String, Object> inputs = Map.of("query", "example");

    // 使用
    for (StreamEvent chunk : graph.stream(inputs, StreamConfig.builder()
            .streamMode("custom")  // (3)!
            .build())) {
        System.out.println(chunk);
    }
    ```

    1. 获取流写入器以发送自定义数据。
    2. 发出自定义键值对（例如，进度更新）。
    3. 设置 `streamMode="custom"` 以在流中接收自定义数据。

=== "工具"

    ```java
    import com.alibaba.cloud.ai.graph.config.StreamWriter;
    import com.alibaba.cloud.ai.graph.config.GraphConfig;

    @Component
    public class DatabaseTool {

        public String queryDatabase(String query) {
            StreamWriter writer = GraphConfig.getStreamWriter(); // (1)!
            writer.write(Map.of("data", "已检索 0/100 条记录", "type", "progress")); // (2)!

            // 执行查询
            String result = performQuery(query);

            writer.write(Map.of("data", "已检索 100/100 条记录", "type", "progress")); // (3)!
            return result;
        }
    }

    // 在图中使用此工具
    for (StreamEvent chunk : graph.stream(inputs, StreamConfig.builder()
            .streamMode("custom")  // (4)!
            .build())) {
        System.out.println(chunk);
    }
    ```

    1. 访问流写入器以发送自定义数据。
    2. 发出自定义键值对（例如，进度更新）。
    3. 发出另一个自定义键值对。
    4. 设置 `streamMode="custom"` 以在流中接收自定义数据。

### 与任何 LLM 一起使用 {#use-with-any-llm}

如果您的 LLM 不作为 Spring AI 集成提供，您可以使用 `custom` 模式流式传输其输出。

```java
import com.alibaba.cloud.ai.graph.config.StreamWriter;
import com.alibaba.cloud.ai.graph.config.GraphConfig;

public class State {
    private String query;
    private String answer;

    // 构造函数、getter 和 setter
}

NodeAction customLLMNode = state -> {
    String query = (String) state.value("query").orElse("");
    StreamWriter writer = GraphConfig.getStreamWriter();

    // 使用您的自定义 LLM 客户端
    CustomLLMClient llmClient = new CustomLLMClient();
    StringBuilder fullResponse = new StringBuilder();

    // 流式调用您的 LLM
    llmClient.streamGenerate(query, token -> {
        fullResponse.append(token);
        // 发出每个令牌
        writer.write(Map.of(
            "type", "token",
            "content", token,
            "accumulated", fullResponse.toString()
        ));
    });

    return Map.of("answer", fullResponse.toString());
};

CompiledGraph graph = new StateGraph(keyStrategyFactory)
    .addNode("llm", node_async(customLLMNode))
    .addEdge(START, "llm")
    .compile();

// 流式传输自定义 LLM 输出
for (StreamEvent chunk : graph.stream(
        Map.of("query", "What is the weather like?"),
        StreamConfig.builder()
            .streamMode("custom")
            .build())) {
    System.out.println(chunk);
}
```

### 流式传输事件

Spring AI Alibaba Graph 中的流式传输事件具有以下结构：

```java
public class StreamEvent {
    private String mode;        // 流式模式（"updates", "values", "messages", "custom", "debug"）
    private String namespace;   // 命名空间（用于子图）
    private Object chunk;       // 实际数据
    private Map<String, Object> metadata; // 元数据

    // 构造函数、getter 和 setter
}
```

根据流式模式，`chunk` 的内容会有所不同：

- **updates**: `Map<String, Object>` - 节点名称到状态更新的映射
- **values**: `Map<String, Object>` - 完整的图状态
- **messages**: `MessageChunk` - LLM 令牌和元数据
- **custom**: `Object` - 用户定义的任何数据
- **debug**: `DebugInfo` - 详细的执行信息

### 错误处理

在流式处理过程中，错误会作为特殊的流式事件发出：

```java
graph.stream(inputs, StreamConfig.builder()
        .streamMode("updates")
        .build())
    .subscribe(
        chunk -> {
            if (chunk instanceof ErrorStreamEvent) {
                ErrorStreamEvent error = (ErrorStreamEvent) chunk;
                System.err.println("流式错误: " + error.getError());
            } else {
                System.out.println("正常数据: " + chunk);
            }
        },
        error -> {
            System.err.println("流式异常: " + error.getMessage());
        }
    );
```

## 最佳实践

### 流式处理设计原则

- **选择合适的模式**：根据您的用例选择正确的流式模式
- **适度粒度**：不要过于频繁地发送更新，避免性能问题
- **有意义的事件**：只发送对用户有价值的进度信息
- **错误处理**：确保流式处理中的错误能够优雅地传播
- **资源管理**：及时清理流式连接，避免资源泄漏

### 性能考虑

- **缓冲策略**：对于高频更新，考虑使用缓冲来减少网络开销
- **背压处理**：在消费者处理速度慢于生产者时实施背压机制
- **内存管理**：避免在流式处理中累积大量数据
- **网络优化**：对于 Web 应用，使用 WebSocket 或 Server-Sent Events

### 用户体验优化

- **进度指示**：为长时间运行的任务提供清晰的进度指示
- **实时反馈**：让用户知道系统正在工作
- **错误恢复**：在流式连接中断时提供重连机制
- **性能平衡**：在实时性和性能之间找到平衡

## 下一步

- [持久化](./persistence) - 学习如何持久化图状态和检查点
- [人机协作](./human-in-the-loop) - 了解如何在工作流中集成人工干预
- [子图](./subgraphs) - 构建可复用的子图组件
- [时间旅行](./time-travel) - 探索状态回滚和分支功能
