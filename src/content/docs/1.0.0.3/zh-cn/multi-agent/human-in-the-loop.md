---
title: 人机协作 (Human-in-the-loop)
description: Spring AI Alibaba 人机协作机制
---

# 人机协作 (Human-in-the-loop)

要在智能体或工作流中审查、编辑和批准工具调用，请[使用 Spring AI Alibaba 的人机协作功能](../how-tos/memory/add-memory.md#添加人机协作)在工作流的任何点启用人类干预。这在大语言模型（LLM）驱动的应用程序中特别有用，因为模型输出可能需要验证、纠正或额外的上下文。

![人机协作工具调用审查](https://langchain-ai.github.io/langgraph/concepts/img/human_in_the_loop/tool-call-review.png)

:::tip
有关如何使用人机协作的信息，请参阅[启用人类干预](../how-tos/human-in-the-loop/add-human-in-the-loop.md)。
:::

## 核心功能

* **持久执行状态**：中断使用 Spring AI Alibaba 的[持久化](./persistence.md)层，该层保存图状态，以无限期暂停图执行直到您恢复。这是可能的，因为 Spring AI Alibaba 在每个步骤后检查点图状态，这允许系统持久化执行上下文并稍后恢复工作流，从中断的地方继续。这支持异步人类审查或输入，没有时间限制。

    有两种暂停图的方式：

    - [动态中断](#使用-interrupt-暂停)：使用 `interrupt` 从特定节点内部暂停图，基于图的当前状态。
    - [静态中断](#使用静态中断调试)：使用 `interruptBefore` 和 `interruptAfter` 在预定义点暂停图，在节点执行之前或之后。

    ![断点示例](https://langchain-ai.github.io/langgraph/concepts/img/breakpoints.png)
    *一个由 3 个顺序步骤组成的示例图，在 step_3 之前有一个断点。*

* **灵活的集成点**：人机协作逻辑可以在工作流的任何点引入。这允许有针对性的人类参与，例如批准 API 调用、纠正输出或指导对话。

## 设计模式

使用 `interrupt` 和 `Command` 可以实现四种典型的设计模式：

- [批准或拒绝](#批准或拒绝)：在关键步骤（如 API 调用）之前暂停图以审查和批准操作。如果操作被拒绝，您可以阻止图执行该步骤，并可能采取替代操作。此模式通常涉及基于人类输入路由图。
- [编辑图状态](#审查和编辑状态)：暂停图以审查和编辑图状态。这对于纠正错误或使用额外信息更新状态很有用。此模式通常涉及使用人类输入更新状态。
- [审查工具调用](#审查工具调用)：暂停图以在工具执行之前审查和编辑 LLM 请求的工具调用。
- [验证人类输入](#验证人类输入)：暂停图以在继续下一步之前验证人类输入。

## 使用 interrupt 暂停

[动态中断](./human-in-the-loop.md#核心功能)（也称为动态断点）基于图的当前状态触发。您可以通过在适当的位置调用 [`interrupt` 函数](https://spring-ai-alibaba.github.io/reference/types/#interrupt)来设置动态中断。图将暂停，允许人类干预，然后使用他们的输入恢复图。这对于批准、编辑或收集额外上下文等任务很有用。

:::note
从 v1.0 开始，`interrupt` 是暂停图的推荐方式。`NodeInterrupt` 已弃用，将在 v2.0 中删除。
:::

要在图中使用 `interrupt`，您需要：

1. [**指定检查点保存器**](./persistence.md#检查点)以在每个步骤后保存图状态。
2. **调用 `interrupt()`** 在适当的位置。请参阅[常见模式](#常见模式)部分的示例。
3. **运行图** 使用[**线程 ID**](./persistence.md#线程)直到命中 `interrupt`。
4. **恢复执行** 使用 `invoke`/`stream`（请参阅[**`Command` 原语**](#使用-command-原语恢复)）。

```java
import com.alibaba.cloud.ai.graph.types.Interrupt;
import com.alibaba.cloud.ai.graph.types.Command;

@Component
public class HumanInteractionNode {

    public State humanNode(State state) {
        // 暂停执行并等待人类输入
        Object value = interrupt(Map.of(
            "text_to_revise", state.getSomeText() // (1)
        ));

        return state.withSomeText((String) value); // (2)
    }
}

@Configuration
public class GraphConfig {

    @Bean
    public StateGraph<State> createGraph() {
        return StateGraph.<State>builder()
            .addNode("human_node", humanInteractionNode::humanNode)
            .addEdge("__start__", "human_node")
            .build()
            .compile(checkpointer); // (3)
    }
}

// 使用示例
Map<String, Object> config = Map.of(
    "configurable", Map.of("thread_id", "some_id")
);

// 运行图直到命中中断
State result = graph.invoke(Map.of("some_text", "original text"), config); // (4)
System.out.println(result.getInterrupt()); // (5)
// > [Interrupt(value={text_to_revise=original text}, resumable=true, ...)]

// 恢复图执行
State finalResult = graph.invoke(Command.resume("Edited text"), config); // (6)
System.out.println(finalResult.getSomeText()); // > "Edited text"
```

1. 任何 JSON 可序列化的值都可以传递给 `interrupt` 函数。这里是包含要修订文本的映射。
2. 恢复后，`interrupt(...)` 的返回值是人类提供的输入，用于更新状态。
3. 需要检查点保存器来持久化图状态。在生产环境中，这应该是持久的（例如，由数据库支持）。
4. 使用一些初始状态调用图。
5. 当图命中中断时，它返回一个包含有效负载和元数据的 `Interrupt` 对象。
6. 使用 `Command.resume(...)` 恢复图，注入人类输入并继续执行。

:::tip "v0.4.0 中的新功能"
`__interrupt__` 是一个特殊键，当图被中断时运行图会返回该键。在 0.4.0 版本中添加了对 `invoke` 和 `ainvoke` 中 `__interrupt__` 的支持。如果您使用的是较旧版本，只有在使用 `stream` 或 `astream` 时才会在结果中看到 `__interrupt__`。您也可以使用 `graph.getState(threadId)` 来获取中断值。
:::

:::warning
中断在开发者体验方面类似于 Java 的 `Scanner.nextLine()` 函数，但它们不会自动从中断点恢复执行。相反，它们会重新运行使用中断的整个节点。因此，中断通常最好放在节点的开始处或专用节点中。
:::

## 使用 Command 原语恢复

:::warning
从 `interrupt` 恢复与 Java 的 `Scanner.nextLine()` 函数不同，后者从调用 `Scanner.nextLine()` 函数的确切点恢复执行。
:::

当在图中使用 `interrupt` 函数时，执行在该点暂停并等待用户输入。

要恢复执行，请使用 [`Command`](https://spring-ai-alibaba.github.io/reference/types/#command) 原语，可以通过 `invoke` 或 `stream` 方法提供。图从最初调用 `interrupt(...)` 的节点开始恢复执行。这次，`interrupt` 函数将返回 `Command.resume(value)` 中提供的值，而不是再次暂停。从节点开始到 `interrupt` 的所有代码都将重新执行。

```java
// 通过提供用户输入恢复图执行
graph.invoke(Command.resume(Map.of("age", "25")), threadConfig);
```

### 一次调用恢复多个中断

当具有中断条件的节点并行运行时，任务队列中可能有多个中断。例如，以下图有两个并行运行的节点，需要人类输入：

![并行人机协作](https://langchain-ai.github.io/langgraph/how-tos/assets/human_in_loop_parallel.png)

一旦您的图被中断并停滞，您可以使用 `Command.resume` 一次恢复所有中断，传递中断 ID 到恢复值的字典映射。

```java
@Component
public class ParallelInterruptExample {

    public State humanNode1(State state) {
        Object value = interrupt(Map.of("text_to_revise", state.getText1()));
        return state.withText1((String) value);
    }

    public State humanNode2(State state) {
        Object value = interrupt(Map.of("text_to_revise", state.getText2()));
        return state.withText2((String) value);
    }

    @Bean
    public StateGraph<State> createParallelGraph() {
        return StateGraph.<State>builder()
            .addNode("human_node_1", this::humanNode1)
            .addNode("human_node_2", this::humanNode2)
            // 从 START 并行添加两个节点
            .addEdge("__start__", "human_node_1")
            .addEdge("__start__", "human_node_2")
            .build()
            .compile(checkpointer);
    }
}

// 使用示例
String threadId = UUID.randomUUID().toString();
Map<String, Object> config = Map.of(
    "configurable", Map.of("thread_id", threadId)
);

State result = graph.invoke(Map.of(
    "text_1", "original text 1",
    "text_2", "original text 2"
), config);

// 使用中断 ID 到值的映射恢复
Map<String, String> resumeMap = new HashMap<>();
for (Interrupt interrupt : graph.getState(config).getInterrupts()) {
    resumeMap.put(interrupt.getInterruptId(),
        "human input for prompt " + interrupt.getValue());
}

State finalResult = graph.invoke(Command.resume(resumeMap), config);
System.out.println(finalResult);
// > {text_1=edited text for original text 1, text_2=edited text for original text 2}
```

## 常见模式

以下我们展示使用 `interrupt` 和 `Command` 可以实现的不同设计模式。

### 批准或拒绝

![批准或拒绝](https://langchain-ai.github.io/langgraph/concepts/img/human_in_the_loop/approve-or-reject.png)
*根据人类的批准或拒绝，图可以继续执行操作或采取替代路径。*

在关键步骤（如 API 调用）之前暂停图以审查和批准操作。如果操作被拒绝，您可以阻止图执行该步骤，并可能采取替代操作。

```java
@Component
public class ApprovalWorkflow {

    public Command<String> humanApproval(State state) {
        boolean isApproved = (Boolean) interrupt(Map.of(
            "question", "Is this correct?",
            // 显示应由人类审查和批准的输出
            "llm_output", state.getLlmOutput()
        ));

        if (isApproved) {
            return Command.goTo("some_node");
        } else {
            return Command.goTo("another_node");
        }
    }

    @Bean
    public StateGraph<State> createApprovalGraph() {
        return StateGraph.<State>builder()
            .addNode("human_approval", this::humanApproval)
            // 将节点添加到图中的适当位置并连接到相关节点
            .build()
            .compile(checkpointer);
    }
}

// 运行图并命中中断后，图将暂停
// 使用批准或拒绝恢复它
Map<String, Object> threadConfig = Map.of(
    "configurable", Map.of("thread_id", "some_id")
);
graph.invoke(Command.resume(true), threadConfig);
```

### 审查和编辑状态

![编辑图状态](https://langchain-ai.github.io/langgraph/concepts/img/human_in_the_loop/edit-graph-state-simple.png)
*人类可以审查和编辑图的状态。这对于纠正错误或使用额外信息更新状态很有用。*

```java
@Component
public class EditingWorkflow {

    public State humanEditing(State state) {
        Map<String, Object> result = (Map<String, Object>) interrupt(Map.of(
            "task", "Review the output from the LLM and make any necessary edits.",
            "llm_generated_summary", state.getLlmGeneratedSummary()
        ));

        // 使用编辑的文本更新状态
        return state.withLlmGeneratedSummary((String) result.get("edited_text"));
    }

    @Bean
    public StateGraph<State> createEditingGraph() {
        return StateGraph.<State>builder()
            .addNode("human_editing", this::humanEditing)
            // 将节点添加到图中的适当位置并连接到相关节点
            .build()
            .compile(checkpointer);
    }
}

// 运行图并命中中断后，图将暂停
// 使用编辑的文本恢复它
Map<String, Object> threadConfig = Map.of(
    "configurable", Map.of("thread_id", "some_id")
);
graph.invoke(Command.resume(Map.of("edited_text", "The edited text")), threadConfig);
```

### 审查工具调用

![工具调用审查](https://langchain-ai.github.io/langgraph/concepts/img/human_in_the_loop/tool-call-review.png)
*人类可以在继续之前审查和编辑 LLM 的输出。这在工具调用可能敏感或需要人类监督的应用程序中特别关键。*

要向工具添加人类批准步骤：

1. 在工具中使用 `interrupt()` 暂停执行。
2. 使用 `Command` 根据人类输入恢复。

```java
@Component
public class SensitiveToolExample {

    @Autowired
    private CheckpointSaver checkpointer;

    // 需要人类审查/批准的敏感工具示例
    @Tool("预订酒店")
    public String bookHotel(@Parameter("hotel_name") String hotelName) {
        Map<String, Object> response = (Map<String, Object>) interrupt(
            String.format("Trying to call `book_hotel` with args {hotel_name: %s}. " +
                "Please approve or suggest edits.", hotelName)
        );

        if ("accept".equals(response.get("type"))) {
            // 继续执行
        } else if ("edit".equals(response.get("type"))) {
            Map<String, Object> args = (Map<String, Object>) response.get("args");
            hotelName = (String) args.get("hotel_name");
        } else {
            throw new IllegalArgumentException("Unknown response type: " + response.get("type"));
        }

        return String.format("Successfully booked a stay at %s.", hotelName);
    }

    @Bean
    public ReactAgent createAgent() {
        return ReactAgent.builder()
            .model(chatClient)
            .tools(List.of(this::bookHotel))
            .checkpointer(checkpointer) // (1)
            .build();
    }
}

// 使用示例
Map<String, Object> config = Map.of(
    "configurable", Map.of("thread_id", "1")
);

// 运行智能体
for (AgentStep chunk : agent.stream(Map.of(
    "messages", List.of(Map.of("role", "user", "content", "book a stay at McKittrick hotel"))
), config)) {
    System.out.println(chunk);
}

// 您应该看到智能体运行直到到达 interrupt() 调用，此时它暂停并等待人类输入

// 使用 Command 根据人类输入恢复智能体
for (AgentStep chunk : agent.stream(
    Command.resume(Map.of("type", "accept")), // (2)
    // Command.resume(Map.of("type", "edit", "args", Map.of("hotel_name", "McKittrick Hotel"))),
    config
)) {
    System.out.println(chunk);
}
```

1. `InMemorySaver` 用于在工具调用循环的每个步骤存储智能体状态。这启用了[短期记忆](./memory.md#添加短期记忆)和[人机协作](./human-in-the-loop.md)功能。在此示例中，我们使用 `InMemorySaver` 在内存中存储智能体状态。在生产应用程序中，智能体状态将存储在数据库中。
2. [`interrupt` 函数](https://spring-ai-alibaba.github.io/reference/types/#interrupt)与 [`Command`](https://spring-ai-alibaba.github.io/reference/types/#command) 对象结合使用，以使用人类提供的值恢复图。

### 为任何工具添加中断

您可以创建一个包装器来为_任何_工具添加中断。下面的示例提供了一个参考实现。

```java
@Component
public class HumanInTheLoopToolWrapper {

    /**
     * 包装工具以支持人机协作审查
     */
    public Tool addHumanInTheLoop(Tool tool, HumanInterruptConfig interruptConfig) {
        if (interruptConfig == null) {
            interruptConfig = HumanInterruptConfig.builder()
                .allowAccept(true)
                .allowEdit(true)
                .allowRespond(true)
                .build();
        }

        return new Tool() {
            @Override
            public String getName() {
                return tool.getName();
            }

            @Override
            public String getDescription() {
                return tool.getDescription();
            }

            @Override
            public Object call(Map<String, Object> toolInput) {
                HumanInterrupt request = HumanInterrupt.builder()
                    .actionRequest(ActionRequest.builder()
                        .action(tool.getName())
                        .args(toolInput)
                        .build())
                    .config(interruptConfig)
                    .description("Please review the tool call")
                    .build();

                List<Map<String, Object>> response = (List<Map<String, Object>>)
                    interrupt(List.of(request)); // (1)

                Map<String, Object> userResponse = response.get(0);

                // 批准工具调用
                if ("accept".equals(userResponse.get("type"))) {
                    return tool.call(toolInput);
                }
                // 更新工具调用参数
                else if ("edit".equals(userResponse.get("type"))) {
                    Map<String, Object> editedArgs = (Map<String, Object>)
                        ((Map<String, Object>) userResponse.get("args")).get("args");
                    return tool.call(editedArgs);
                }
                // 使用用户反馈响应 LLM
                else if ("response".equals(userResponse.get("type"))) {
                    return userResponse.get("args");
                } else {
                    throw new IllegalArgumentException("Unsupported interrupt response type: " +
                        userResponse.get("type"));
                }
            }
        };
    }
}

// 使用包装器为任何工具添加 interrupt()，而无需在工具内部添加它
@Component
public class ToolUsageExample {

    @Autowired
    private HumanInTheLoopToolWrapper toolWrapper;

    @Tool("预订酒店")
    public String bookHotel(@Parameter("hotel_name") String hotelName) {
        return String.format("Successfully booked a stay at %s.", hotelName);
    }

    @Bean
    public ReactAgent createAgentWithWrappedTool() {
        Tool wrappedTool = toolWrapper.addHumanInTheLoop(
            this::bookHotel,
            null // 使用默认配置
        );

        return ReactAgent.builder()
            .model(chatClient)
            .tools(List.of(wrappedTool)) // (1)
            .checkpointer(checkpointer)
            .build();
    }
}

// 运行智能体
Map<String, Object> config = Map.of("configurable", Map.of("thread_id", "1"));

for (AgentStep chunk : agent.stream(Map.of(
    "messages", List.of(Map.of("role", "user", "content", "book a stay at McKittrick hotel"))
), config)) {
    System.out.println(chunk);
}

// 您应该看到智能体运行直到到达 interrupt() 调用，此时它暂停并等待人类输入

// 使用 Command 根据人类输入恢复智能体
for (AgentStep chunk : agent.stream(
    Command.resume(List.of(Map.of("type", "accept"))),
    // Command.resume(List.of(Map.of("type", "edit", "args", Map.of("args", Map.of("hotel_name", "McKittrick Hotel"))))),
    config
)) {
    System.out.println(chunk);
}
```

1. `addHumanInTheLoop` 包装器用于向工具添加 `interrupt()`。这允许智能体在继续工具调用之前暂停执行并等待人类输入。

### 验证人类输入

如果您需要在图本身内部（而不是在客户端）验证人类提供的输入，您可以通过在单个节点内使用多个中断调用来实现这一点。

```java
@Component
public class InputValidationExample {

    public State humanNode(State state) {
        String question = "What is your age?";

        while (true) {
            Object answer = interrupt(question);

            // 验证答案，如果答案无效则再次请求输入
            if (!(answer instanceof Integer) || (Integer) answer < 0) {
                question = "Please enter a valid age (non-negative integer).";
                continue;
            }

            return state.withAge((Integer) answer);
        }
    }

    @Bean
    public StateGraph<State> createValidationGraph() {
        return StateGraph.<State>builder()
            .addNode("get_valid_age", this::humanNode)
            .addNode("report_age", this::reportAge)
            .addEdge("__start__", "get_valid_age")
            .addEdge("get_valid_age", "report_age")
            .addEdge("report_age", "__end__")
            .build()
            .compile(checkpointer);
    }

    private State reportAge(State state) {
        System.out.printf("✅ Human is %d years old.%n", state.getAge());
        return state;
    }
}

// 使用示例
Map<String, Object> config = Map.of(
    "configurable", Map.of("thread_id", UUID.randomUUID().toString())
);

// 运行图直到第一个中断
State result = graph.invoke(Map.of(), config);
System.out.println(result.getInterrupt()); // 第一个提示："What is your age?"

// 模拟无效输入（例如，字符串而不是整数）
result = graph.invoke(Command.resume("not a number"), config);
System.out.println(result.getInterrupt()); // 带验证消息的后续提示

// 模拟第二个无效输入（例如，负数）
result = graph.invoke(Command.resume("-10"), config);
System.out.println(result.getInterrupt()); // 另一次重试

// 提供有效输入
State finalResult = graph.invoke(Command.resume("25"), config);
System.out.println(finalResult); // 应该包含有效年龄
```

## 使用静态中断调试

要调试和测试图，请使用[静态中断](./human-in-the-loop.md#核心功能)（也称为静态断点）逐个节点地单步执行图或在特定节点暂停图执行。静态中断在定义的点触发，在节点执行之前或之后。您可以通过在编译时或运行时指定 `interruptBefore` 和 `interruptAfter` 来设置静态中断。

:::warning
静态中断**不**推荐用于人机协作工作流。请改用[动态中断](#使用-interrupt-暂停)。
:::

### 编译时设置

```java
@Configuration
public class GraphWithBreakpoints {

    @Bean
    public StateGraph<State> createGraphWithBreakpoints() {
        return StateGraph.<State>builder()
            .addNode("step_1", this::step1)
            .addNode("step_2", this::step2)
            .addNode("step_3", this::step3)
            .addEdge("__start__", "step_1")
            .addEdge("step_1", "step_2")
            .addEdge("step_2", "step_3")
            .addEdge("step_3", "__end__")
            .build()
            .compile(
                checkpointer,                    // (1)
                List.of("node_a"),              // (2) interruptBefore
                List.of("node_b", "node_c")     // (3) interruptAfter
            );
    }

    private State step1(State state) {
        System.out.println("---Step 1---");
        return state;
    }

    private State step2(State state) {
        System.out.println("---Step 2---");
        return state;
    }

    private State step3(State state) {
        System.out.println("---Step 3---");
        return state;
    }
}

// 使用示例
Map<String, Object> config = Map.of(
    "configurable", Map.of("thread_id", "some_thread")
);

// 运行图直到断点
graph.invoke(inputs, config); // (4)

// 恢复图
graph.invoke(null, config); // (5)
```

1. 需要检查点保存器来启用断点。
2. `interruptBefore` 指定执行应在节点执行之前暂停的节点。
3. `interruptAfter` 指定执行应在节点执行之后暂停的节点。
4. 图运行直到命中第一个断点。
5. 通过为输入传递 `null` 来恢复图。这将运行图直到命中下一个断点。

### 运行时设置

```java
// 在运行时设置断点
GraphInvokeOptions options = GraphInvokeOptions.builder()
    .interruptBefore(List.of("node_a"))      // (1)
    .interruptAfter(List.of("node_b", "node_c")) // (2)
    .build();

Map<String, Object> config = Map.of(
    "configurable", Map.of("thread_id", "some_thread")
);

// 运行图直到断点
graph.invoke(inputs, config, options); // (3)

// 恢复图
graph.invoke(null, config); // (4)
```

1. `interruptBefore` 指定执行应在节点执行之前暂停的节点。
2. `interruptAfter` 指定执行应在节点执行之后暂停的节点。
3. 图运行直到命中第一个断点。
4. 通过为输入传递 `null` 来恢复图。这将运行图直到命中下一个断点。

:::note
您不能在运行时为**子图**设置静态断点。如果您有子图，必须在编译时设置断点。
:::

## 注意事项

使用人机协作时，需要记住一些注意事项。

### 使用具有副作用的代码

将具有副作用的代码（如 API 调用）放在 `interrupt` 之后或单独的节点中，以避免重复，因为每次恢复节点时都会重新触发这些代码。

#### 副作用在中断之后

```java
public State humanNode(State state) {
    Object answer = interrupt(question);

    apiCall(answer); // 正确，因为它在中断之后
    return state;
}
```

#### 副作用在单独的节点中

```java
public State humanNode(State state) {
    Object answer = interrupt(question);

    return state.withAnswer(answer);
}

public State apiCallNode(State state) {
    apiCall(state.getAnswer()); // 正确，因为它在单独的节点中
    return state;
}
```

### 使用作为函数调用的子图

当将子图作为函数调用时，父图将从调用子图的**节点开始**恢复执行，其中触发了 `interrupt`。类似地，**子图**将从调用 `interrupt()` 函数的**节点开始**恢复。

```java
public State nodeInParentGraph(State state) {
    someCode(); // <-- 恢复子图时这将重新执行

    // 将子图作为函数调用
    // 子图包含 interrupt 调用
    State subgraphResult = subgraph.invoke(someInput);
    // ...
    return state;
}
```

### 在单个节点中使用多个中断

在单个节点内使用多个中断对于验证人类输入等模式很有帮助。但是，如果处理不当，在同一节点中使用多个中断可能导致意外行为。

当节点包含多个中断调用时，Spring AI Alibaba 保留特定于执行节点任务的恢复值列表。每当执行恢复时，它从节点开始。对于遇到的每个中断，Spring AI Alibaba 检查任务的恢复列表中是否存在匹配值。匹配严格基于索引，因此节点内中断调用的顺序至关重要。

为避免问题，请避免在执行之间动态更改节点的结构。这包括添加、删除或重新排序中断调用，因为此类更改可能导致索引不匹配。这些问题通常来自非常规模式，例如通过 `Command.resume(..., update=SOME_STATE_MUTATION)` 变更状态或依赖全局变量动态修改节点结构。

## 配置选项

```properties
# 人机协作配置
spring.ai.alibaba.human-in-the-loop.enabled=true
spring.ai.alibaba.human-in-the-loop.interrupt.timeout=30m
spring.ai.alibaba.human-in-the-loop.interrupt.max-retries=3

# 检查点配置
spring.ai.alibaba.human-in-the-loop.checkpointer.type=database
spring.ai.alibaba.human-in-the-loop.checkpointer.cleanup-interval=24h

# 静态中断配置
spring.ai.alibaba.human-in-the-loop.static-interrupts.enabled=true
spring.ai.alibaba.human-in-the-loop.static-interrupts.debug-mode=false

# 工具审查配置
spring.ai.alibaba.human-in-the-loop.tool-review.enabled=true
spring.ai.alibaba.human-in-the-loop.tool-review.auto-approve-safe-tools=false
spring.ai.alibaba.human-in-the-loop.tool-review.timeout=15m
```

## 最佳实践

### 1. 中断设计
- **明确中断时机**：在关键决策点或敏感操作前设置中断
- **提供清晰上下文**：确保中断信息包含足够的上下文供人类决策
- **避免过度中断**：平衡自动化效率和人类监督需求

### 2. 状态管理
- **使用检查点**：确保启用持久化以支持中断功能
- **处理副作用**：将有副作用的代码放在中断之后或单独节点中
- **状态一致性**：确保恢复后状态的一致性和完整性

### 3. 用户体验
- **响应式设计**：支持多种设备和界面
- **清晰的操作指引**：提供明确的批准、拒绝、编辑选项
- **及时反馈**：确保用户操作得到及时响应

### 4. 错误处理
- **超时处理**：设置合理的超时时间和升级机制
- **验证输入**：在图内验证人类输入的有效性
- **异常恢复**：提供从错误状态恢复的机制

## 下一步

- [了解时间旅行](./time-travel.md)
- [学习子图](./subgraphs.md)
- [探索持久化机制](./persistence.md)
