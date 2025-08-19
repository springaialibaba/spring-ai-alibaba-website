---
title: "基础用法"
description: "学习 Spring AI Alibaba Graph 的基础用法，包括状态定义、基本图构建和简单示例。"
---

本文档介绍 Spring AI Alibaba Graph 的基础用法，包括状态定义、基本图构建和简单示例。

## 定义和更新状态

在开始构建图之前，我们需要理解如何定义和更新状态。状态是图中所有节点共享的数据结构，它定义了图的模式并控制数据如何在节点间传递。

### 定义状态

Spring AI Alibaba Graph 中的状态可以是任何 Java 类，但通常我们使用 Map 或自定义的 Java 类。状态决定了图的输入和输出模式。

让我们从一个包含消息的简单示例开始：

```java
import com.alibaba.cloud.ai.graph.KeyStrategy;
import com.alibaba.cloud.ai.graph.KeyStrategyFactory;
import org.springframework.ai.chat.messages.Message;

// 定义状态策略
KeyStrategyFactory messageStateFactory = () -> {
    Map<String, KeyStrategy> strategies = new HashMap<>();
    strategies.put("messages", KeyStrategy.APPEND);  // 消息使用追加策略
    strategies.put("extra_field", KeyStrategy.REPLACE);  // 其他字段使用替换策略
    return strategies;
};
```

这个状态跟踪消息对象列表以及一个额外的整数字段。

### 更新状态

让我们构建一个包含单个节点的示例图。节点是一个 Java 函数，它读取图的状态并对其进行更新：

```java
import org.springframework.ai.chat.messages.AssistantMessage;

NodeAction simpleNode = state -> {
    List<Message> messages = state.value("messages", List.class).orElse(new ArrayList<>());
    AssistantMessage newMessage = new AssistantMessage("Hello!");
    
    // 返回状态更新
    List<Message> updatedMessages = new ArrayList<>(messages);
    updatedMessages.add(newMessage);
    
    return Map.of(
        "messages", updatedMessages,
        "extra_field", 10
    );
};
```

> **重要提示**：节点应该返回状态的更新，而不是直接修改状态。

让我们定义一个包含此节点的简单图：

```java
import com.alibaba.cloud.ai.graph.StateGraph;
import static com.alibaba.cloud.ai.graph.StateGraph.*;
import static com.alibaba.cloud.ai.graph.action.AsyncNodeAction.node_async;

StateGraph graph = new StateGraph(messageStateFactory)
    .addNode("simple_node", node_async(simpleNode))
    .addEdge(START, "simple_node")
    .addEdge("simple_node", END);

CompiledGraph compiledGraph = graph.compile();
```

现在我们可以调用这个图：

```java
import org.springframework.ai.chat.messages.UserMessage;

Map<String, Object> input = Map.of(
    "messages", List.of(new UserMessage("Hi"))
);

Optional<OverAllState> result = compiledGraph.invoke(input);
result.ifPresent(state -> {
    List<Message> messages = state.value("messages", List.class).orElse(new ArrayList<>());
    messages.forEach(message -> System.out.println(message.getContent()));
});
```

### 使用 Reducers 处理状态更新

状态中的每个键都可以有自己独立的 reducer 函数，用于控制如何应用节点的更新。如果没有明确指定 reducer 函数，则假定对该键的所有更新都应该覆盖它。

在前面的示例中，我们的节点通过向消息列表追加消息来更新 `"messages"` 键。下面我们为这个键添加一个 reducer，使更新自动追加：

```java
KeyStrategyFactory reducerStateFactory = () -> {
    Map<String, KeyStrategy> strategies = new HashMap<>();
    strategies.put("messages", KeyStrategy.APPEND);  // 自动追加新消息
    strategies.put("extra_field", KeyStrategy.REPLACE);
    return strategies;
};
```

现在我们的节点可以简化：

```java
NodeAction simplifiedNode = state -> {
    AssistantMessage newMessage = new AssistantMessage("Hello!");
    return Map.of(
        "messages", List.of(newMessage),  // 直接返回新消息列表
        "extra_field", 10
    );
};
```

### 定义输入和输出模式

默认情况下，StateGraph 使用单一模式操作，所有节点都使用该模式进行通信。但是，也可以为图定义不同的输入和输出模式。

```java
// 定义输入模式
public class InputState {
    private String question;
    // getters and setters
}

// 定义输出模式  
public class OutputState {
    private String answer;
    // getters and setters
}

// 定义整体模式，结合输入和输出
public class OverallState extends InputState {
    private String answer;
    // getters and setters
}

// 定义处理节点
NodeAction answerNode = state -> {
    String question = (String) state.value("question").orElse("");
    return Map.of(
        "answer", "这是对问题的回答: " + question,
        "question", question
    );
};

// 构建具有指定输入和输出模式的图
KeyStrategyFactory strategyFactory = () -> {
    Map<String, KeyStrategy> strategies = new HashMap<>();
    strategies.put("question", KeyStrategy.REPLACE);
    strategies.put("answer", KeyStrategy.REPLACE);
    return strategies;
};

StateGraph graph = new StateGraph(strategyFactory)
    .addNode("answer_node", node_async(answerNode))
    .addEdge(START, "answer_node")
    .addEdge("answer_node", END);

CompiledGraph compiledGraph = graph.compile();

// 调用图并打印结果
Optional<OverAllState> result = compiledGraph.invoke(Map.of("question", "你好"));
result.ifPresent(state -> {
    System.out.println("答案: " + state.value("answer", String.class).orElse("无答案"));
});
```

## 创建简单的线性图

线性图是最基础的图结构，节点按照固定的顺序依次执行。这种模式适用于：

- **数据处理管道**：数据需要经过多个步骤的转换和处理
- **工作流程**：业务流程有明确的先后顺序
- **验证链**：需要通过多个验证步骤的场景

让我们从最简单的例子开始 - 一个包含三个顺序执行节点的图：

```java
import com.alibaba.cloud.ai.graph.*;
import com.alibaba.cloud.ai.graph.action.*;
import static com.alibaba.cloud.ai.graph.StateGraph.*;
import static com.alibaba.cloud.ai.graph.action.AsyncNodeAction.node_async;

@Configuration
public class LinearGraphExample {

    @Bean
    public CompiledGraph linearWorkflow() throws GraphStateException {
        // 定义状态策略
        KeyStrategyFactory keyStrategyFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("input", KeyStrategy.REPLACE);
            strategies.put("step1_result", KeyStrategy.REPLACE);
            strategies.put("step2_result", KeyStrategy.REPLACE);
            strategies.put("final_result", KeyStrategy.REPLACE);
            return strategies;
        };

        // 定义节点动作
        NodeAction step1Action = state -> {
            String input = state.value("input", String.class).orElse("");
            String result = "步骤1处理: " + input;
            System.out.println("执行步骤1: " + result);
            return Map.of("step1_result", result);
        };

        NodeAction step2Action = state -> {
            String step1Result = state.value("step1_result", String.class).orElse("");
            String result = "步骤2处理: " + step1Result;
            System.out.println("执行步骤2: " + result);
            return Map.of("step2_result", result);
        };

        NodeAction step3Action = state -> {
            String step2Result = state.value("step2_result", String.class).orElse("");
            String result = "步骤3处理: " + step2Result;
            System.out.println("执行步骤3: " + result);
            return Map.of("final_result", result);
        };

        // 构建线性图
        StateGraph graph = new StateGraph(keyStrategyFactory)
            .addNode("step1", node_async(step1Action))
            .addNode("step2", node_async(step2Action))
            .addNode("step3", node_async(step3Action))

            .addEdge(START, "step1")
            .addEdge("step1", "step2")
            .addEdge("step2", "step3")
            .addEdge("step3", END);

        return graph.compile();
    }
}
```

运行这个图：

```java
@Service
public class GraphService {

    @Autowired
    private CompiledGraph linearWorkflow;

    public String processLinear(String input) throws GraphRunnerException {
        Optional<OverAllState> result = linearWorkflow.invoke(Map.of("input", input));
        return result.map(state ->
            state.value("final_result", String.class).orElse("无结果")
        ).orElse("执行失败");
    }
}
```

## 在图状态中使用消息

### 为什么使用消息？

大多数现代 LLM 提供商都有一个聊天模型接口，接受消息列表作为输入。Spring AI 的 `ChatClient` 特别接受 `Message` 对象列表作为输入。这些消息有多种形式，如 `UserMessage`（用户输入）或 `AssistantMessage`（LLM 响应）。

### 在图中使用消息

在许多情况下，将先前的对话历史作为消息列表存储在图状态中是有帮助的。为此，我们可以向图状态添加一个存储 `Message` 对象列表的键（通道），并使用 reducer 函数对其进行注释。

```java
import com.alibaba.cloud.ai.graph.KeyStrategy;
import com.alibaba.cloud.ai.graph.KeyStrategyFactory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.AssistantMessage;

// 定义包含消息的状态策略
KeyStrategyFactory messageStateFactory = () -> {
    Map<String, KeyStrategy> strategies = new HashMap<>();
    
    // 基础数据使用替换策略
    strategies.put("input", KeyStrategy.REPLACE);
    strategies.put("user_id", KeyStrategy.REPLACE);
    
    // 消息使用追加策略，支持消息历史
    strategies.put("messages", KeyStrategy.APPEND);
    
    // 其他数据
    strategies.put("analysis_results", KeyStrategy.MERGE);
    
    return strategies;
};

// 在节点中处理消息
NodeAction messageProcessingAction = state -> {
    // 读取现有消息
    List<Message> messages = state.value("messages", List.class).orElse(new ArrayList<>());
    String input = state.value("input", String.class).orElse("");
    
    // 添加用户消息
    UserMessage userMessage = new UserMessage(input);
    
    // 调用 LLM
    String response = chatClient.prompt()
        .messages(messages)
        .user(input)
        .call()
        .content();
    
    // 创建助手消息
    AssistantMessage assistantMessage = new AssistantMessage(response);
    
    // 返回状态更新（消息会被追加到现有列表）
    return Map.of(
        "messages", List.of(userMessage, assistantMessage),
        "last_response", response
    );
};
```

## 下一步

- 学习高级配置：[高级配置](./advanced-config)
- 了解控制流：[控制流](./control-flow)
- 返回总览：[使用 Graph API](./use-graph-api)
