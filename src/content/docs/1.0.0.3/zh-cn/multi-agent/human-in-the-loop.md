---
title: 人机协作 (Human-in-the-loop)
description: Spring AI Alibaba 人机协作机制
---

# 人机协作 (Human-in-the-loop)

在实际业务场景中，完全自动化的智能体往往无法满足所有需求。有时我们需要在关键决策点引入人工干预，比如审核敏感操作、修正错误输出或提供额外信息。Spring AI Alibaba 提供了完整的人机协作机制，让您可以在工作流的任意节点暂停执行，等待人工处理后再继续。

![人机协作工具调用审查](https://langchain-ai.github.io/langgraph/concepts/img/human_in_the_loop/tool-call-review.png)

:::tip
有关如何使用人机协作的信息，请参阅[启用人类干预](../how-tos/human-in-the-loop/add-human-in-the-loop.md)。
:::

## 核心功能

### 状态持久化

人机协作的基础是状态持久化能力。当工作流需要人工干预时，系统会自动保存当前的执行状态，包括所有变量、上下文信息和执行进度。这样即使暂停很长时间，也能从中断点准确恢复执行。

### 两种中断方式

根据使用场景，Spring AI Alibaba 提供了两种中断方式：

- **动态中断**：在运行时根据业务逻辑决定是否需要人工干预，适用于复杂的业务判断场景
- **静态中断**：在编译时预设中断点，主要用于调试和测试

![断点示例](https://langchain-ai.github.io/langgraph/concepts/img/breakpoints.png)
*工作流在 step_3 之前设置了一个断点*

### 灵活的接入方式

您可以在工作流的任意位置添加人工干预点，无论是数据处理前的参数确认，还是结果输出前的质量检查，都能轻松实现。

## 常见应用场景

根据实际业务需求，人机协作主要应用于以下四种场景：

- **操作审批**：在执行敏感操作（如删除数据、发送邮件）前，先让人工确认是否继续
- **内容审核**：对AI生成的内容进行人工校对，确保质量和准确性
- **工具调用确认**：在调用外部API或执行系统命令前，让人工检查参数是否正确
- **输入验证**：对用户输入进行格式和内容验证，确保数据的有效性

## 动态中断实现

动态中断通过 `HumanNode` 实现，可以根据运行时的状态决定是否需要人工干预。这种方式非常适合复杂的业务逻辑判断。

### 基本用法

使用 `HumanNode` 需要以下几个步骤：

1. **配置检查点保存器** - 用于保存工作流状态
2. **创建 HumanNode** - 定义中断条件和处理逻辑
3. **运行工作流** - 系统会在需要时自动暂停
4. **提供人工反馈** - 通过API接口输入处理结果
5. **恢复执行** - 工作流从中断点继续运行

:::tip
`HumanNode` 支持两种中断策略：`always`（总是中断）和 `conditioned`（按条件中断），可以根据实际需求选择。
:::

### 代码示例

```java
@Component
public class DocumentReviewService {

    @Autowired
    private MemorySaver memorySaver;

    // 创建文档审核节点
    public HumanNode createReviewNode() {
        return HumanNode.builder()
            .interruptStrategy("always") // 总是需要人工审核
            .stateUpdateFunc(this::handleReviewResult) // 处理审核结果
            .build();
    }

    // 处理人工审核的结果
    private Map<String, Object> handleReviewResult(OverAllState state) {
        if (state.humanFeedback() != null) {
            Map<String, Object> feedback = state.humanFeedback().data();
            String reviewedContent = (String) feedback.get("reviewed_content");
            boolean approved = (Boolean) feedback.getOrDefault("approved", false);

            return Map.of(
                "final_content", reviewedContent,
                "review_status", approved ? "通过" : "需要修改"
            );
        }
        return Map.of();
    }
}

// 配置工作流
@Configuration
public class DocumentWorkflowConfig {

    @Bean
    public StateGraph createDocumentWorkflow() {
        // 定义状态结构
        OverAllStateFactory stateFactory = () -> {
            OverAllState state = new OverAllState();
            state.registerKeyAndStrategy("original_content", new ReplaceStrategy());
            state.registerKeyAndStrategy("final_content", new ReplaceStrategy());
            state.registerKeyAndStrategy("review_status", new ReplaceStrategy());
            return state;
        };

        return StateGraph.builder(stateFactory)
            .addNode("review", documentReviewService.createReviewNode())
            .addEdge(StateGraph.START, "review")
            .addEdge("review", StateGraph.END)
            .build();
    }
}

// 实际使用
@Service
public class DocumentService {

    @Autowired
    private CompiledGraph documentWorkflow;

    public String processDocument(String content) {
        // 配置检查点保存器
        SaverConfig saverConfig = SaverConfig.builder()
            .register(SaverConstant.MEMORY, memorySaver)
            .type(SaverConstant.MEMORY)
            .build();

        CompileConfig compileConfig = CompileConfig.builder()
            .saverConfig(saverConfig)
            .build();

        CompiledGraph graph = documentWorkflow.compile(compileConfig);

        RunnableConfig config = RunnableConfig.builder()
            .threadId("doc_" + System.currentTimeMillis())
            .build();

        // 启动文档处理流程
        try {
            graph.invoke(Map.of("original_content", content), config);
        } catch (GraphRunnerException e) {
            if (e.getMessage().contains("interrupt")) {
                // 工作流已暂停，等待人工审核
                return "文档已提交审核，请等待处理结果";
            }
        }
        return "处理失败";
    }

    // 提供审核结果的接口
    public String submitReview(String threadId, String reviewedContent, boolean approved) {
        RunnableConfig config = RunnableConfig.builder().threadId(threadId).build();

        StateSnapshot snapshot = documentWorkflow.getState(config);
        OverAllState state = snapshot.state();
        state.withResume();
        state.withHumanFeedback(new OverAllState.HumanFeedback(
            Map.of(
                "reviewed_content", reviewedContent,
                "approved", approved
            ),
            null
        ));

        Optional<OverAllState> result = documentWorkflow.invoke(state, config);
        return result.get().value("review_status", String.class).orElse("处理完成");
    }
}
```

### 关键要点

1. **中断策略**：`always` 表示总是需要人工干预，`conditioned` 表示按条件判断
2. **状态处理**：通过 `stateUpdateFunc` 定义如何处理人工反馈
3. **持久化存储**：生产环境建议使用数据库等持久化存储方案
4. **异常处理**：中断时会抛出 `GraphRunnerException`，需要妥善处理
5. **状态恢复**：通过 `withHumanFeedback()` 提供处理结果并恢复执行

:::tip "获取执行状态"
使用 `graph.getState(config)` 可以随时查看工作流的当前状态，包括执行进度和中断信息。
:::

:::warning "注意事项"
`HumanNode` 会完全暂停工作流执行，直到收到人工反馈。建议将其作为独立节点使用，避免与其他业务逻辑混合。
:::

## 恢复执行机制

### 执行恢复原理

当工作流在 `HumanNode` 处中断后，系统会保存完整的执行状态。恢复时，工作流会从 `HumanNode` 重新开始执行，但这次会处理人工提供的反馈数据，而不是再次中断。

:::info "执行模式说明"
这种恢复机制与传统的断点调试不同。系统不是从中断的精确位置继续，而是重新执行整个节点，但会使用人工反馈的数据。
:::

### 恢复步骤

```java
// 1. 获取工作流当前状态
StateSnapshot snapshot = graph.getState(config);
OverAllState state = snapshot.state();

// 2. 标记为恢复模式
state.withResume();

// 3. 设置人工反馈数据
state.withHumanFeedback(new OverAllState.HumanFeedback(
    Map.of("user_input", "处理结果"),
    null // 指定下一个节点，null表示按正常流程继续
));

// 4. 重新启动工作流
Optional<OverAllState> result = graph.invoke(state, config);
```

### 一次调用恢复多个中断

当具有中断条件的节点并行运行时，可能有多个 `HumanNode` 同时触发中断。例如，以下图有两个并行运行的节点，需要人类输入：

![并行人机协作](https://langchain-ai.github.io/langgraph/how-tos/assets/human_in_loop_parallel.png)

一旦您的图被中断并停滞，您可以通过设置包含所有必要反馈的人类反馈来恢复执行。

```java
@Component
public class ParallelInterruptExample {

    public HumanNode createHumanNode1() {
        return HumanNode.builder()
            .interruptStrategy("always")
            .stateUpdateFunc(state -> {
                if (state.humanFeedback() != null) {
                    Map<String, Object> data = state.humanFeedback().data();
                    return Map.of("text_1", data.get("edited_text_1"));
                }
                return Map.of();
            })
            .build();
    }

    public HumanNode createHumanNode2() {
        return HumanNode.builder()
            .interruptStrategy("always")
            .stateUpdateFunc(state -> {
                if (state.humanFeedback() != null) {
                    Map<String, Object> data = state.humanFeedback().data();
                    return Map.of("text_2", data.get("edited_text_2"));
                }
                return Map.of();
            })
            .build();
    }

    @Bean
    public StateGraph createParallelGraph() {
        OverAllStateFactory stateFactory = () -> {
            OverAllState state = new OverAllState();
            state.registerKeyAndStrategy("text_1", new ReplaceStrategy());
            state.registerKeyAndStrategy("text_2", new ReplaceStrategy());
            return state;
        };

        return StateGraph.builder(stateFactory)
            .addNode("human_node_1", this.createHumanNode1())
            .addNode("human_node_2", this.createHumanNode2())
            // 从 START 并行添加两个节点
            .addEdge(StateGraph.START, "human_node_1")
            .addEdge(StateGraph.START, "human_node_2")
            .addEdge("human_node_1", StateGraph.END)
            .addEdge("human_node_2", StateGraph.END)
            .build();
    }
}

// 使用示例
String threadId = UUID.randomUUID().toString();
RunnableConfig config = RunnableConfig.builder()
    .threadId(threadId)
    .build();

try {
    Optional<OverAllState> result = graph.invoke(Map.of(
        "text_1", "original text 1",
        "text_2", "original text 2"
    ), config);
} catch (GraphRunnerException e) {
    if (e.getMessage().contains("interrupt")) {
        System.out.println("图已中断，等待人类输入");
    }
}

// 恢复执行，提供所有必要的反馈
StateSnapshot stateSnapshot = graph.getState(config);
OverAllState state = stateSnapshot.state();
state.withResume();
state.withHumanFeedback(new OverAllState.HumanFeedback(
    Map.of(
        "edited_text_1", "human input for text 1",
        "edited_text_2", "human input for text 2"
    ),
    null
));

Optional<OverAllState> finalResult = graph.invoke(state, config);
System.out.println(finalResult.get().data());
// > {text_1=human input for text 1, text_2=human input for text 2}
```

## 实际应用案例

下面通过几个典型的业务场景，展示人机协作的具体实现方法。

### 案例一：操作审批流程

![批准或拒绝](https://langchain-ai.github.io/langgraph/concepts/img/human_in_the_loop/approve-or-reject.png)
*根据审批结果，工作流会执行不同的后续操作*

在执行重要操作前，通常需要人工审批。比如删除重要数据、发送营销邮件等场景。

```java
@Component
public class EmailCampaignService {

    // 创建审批节点
    public HumanNode createApprovalNode() {
        return HumanNode.builder()
            .interruptStrategy("always")
            .stateUpdateFunc(this::handleApprovalResult)
            .build();
    }

    // 处理审批结果
    private Map<String, Object> handleApprovalResult(OverAllState state) {
        if (state.humanFeedback() != null) {
            Map<String, Object> feedback = state.humanFeedback().data();
            boolean approved = (Boolean) feedback.getOrDefault("approved", false);
            String comment = (String) feedback.getOrDefault("comment", "");

            return Map.of(
                "approval_status", approved ? "通过" : "拒绝",
                "approval_comment", comment
            );
        }
        return Map.of();
    }

    // 路由节点：根据审批结果决定下一步
    public NodeAction createRoutingNode() {
        return (state) -> {
            String status = state.value("approval_status", String.class).orElse("拒绝");
            return Map.of("next_action", "通过".equals(status) ? "send_email" : "cancel_campaign");
        };
    }

    // 配置邮件营销审批流程
    @Bean
    public StateGraph createEmailCampaignWorkflow() {
        OverAllStateFactory stateFactory = () -> {
            OverAllState state = new OverAllState();
            state.registerKeyAndStrategy("campaign_content", new ReplaceStrategy());
            state.registerKeyAndStrategy("approval_status", new ReplaceStrategy());
            state.registerKeyAndStrategy("approval_comment", new ReplaceStrategy());
            state.registerKeyAndStrategy("next_action", new ReplaceStrategy());
            state.registerKeyAndStrategy("result", new ReplaceStrategy());
            return state;
        };

        return StateGraph.builder(stateFactory)
            .addNode("approval", this.createApprovalNode())
            .addNode("routing", this.createRoutingNode())
            .addNode("send_email", (state) -> Map.of("result", "邮件发送成功"))
            .addNode("cancel_campaign", (state) -> Map.of("result", "营销活动已取消"))
            .addEdge(StateGraph.START, "approval")
            .addEdge("approval", "routing")
            .addConditionalEdges("routing",
                state -> state.value("next_action", String.class).orElse("cancel_campaign"),
                Map.of(
                    "send_email", "send_email",
                    "cancel_campaign", "cancel_campaign"
                ))
            .addEdge("send_email", StateGraph.END)
            .addEdge("cancel_campaign", StateGraph.END)
            .build();
    }
}

// 使用示例
@RestController
public class CampaignController {

    @PostMapping("/campaign/submit")
    public String submitCampaign(@RequestBody String content) {
        RunnableConfig config = RunnableConfig.builder()
            .threadId("campaign_" + System.currentTimeMillis())
            .build();

        try {
            graph.invoke(Map.of("campaign_content", content), config);
            return "营销活动已提交审批";
        } catch (GraphRunnerException e) {
            return "提交失败：" + e.getMessage();
        }
    }

    @PostMapping("/campaign/approve")
    public String approveCampaign(@RequestParam String threadId,
                                 @RequestParam boolean approved,
                                 @RequestParam String comment) {
        RunnableConfig config = RunnableConfig.builder().threadId(threadId).build();

        StateSnapshot snapshot = graph.getState(config);
        OverAllState state = snapshot.state();
        state.withResume();
        state.withHumanFeedback(new OverAllState.HumanFeedback(
            Map.of("approved", approved, "comment", comment),
            null
        ));

        Optional<OverAllState> result = graph.invoke(state, config);
        return result.get().value("result", String.class).orElse("处理完成");
    }
}
```

### 案例二：内容编辑审核

![编辑图状态](https://langchain-ai.github.io/langgraph/concepts/img/human_in_the_loop/edit-graph-state-simple.png)
*人工可以对AI生成的内容进行审核和修改*

AI生成的内容往往需要人工校对和润色，确保质量和准确性。

```java
@Component
public class ContentEditingService {

    // 创建内容编辑节点
    public HumanNode createEditingNode() {
        return HumanNode.builder()
            .interruptStrategy("always")
            .stateUpdateFunc(this::handleContentEditing)
            .build();
    }

    // 处理内容编辑结果
    private Map<String, Object> handleContentEditing(OverAllState state) {
        if (state.humanFeedback() != null) {
            Map<String, Object> feedback = state.humanFeedback().data();
            String editedContent = (String) feedback.get("edited_content");
            String editorComment = (String) feedback.getOrDefault("comment", "");
            boolean needsRevision = (Boolean) feedback.getOrDefault("needs_revision", false);

            return Map.of(
                "final_content", editedContent,
                "editor_comment", editorComment,
                "revision_needed", needsRevision
            );
        }
        return Map.of();
    }

    // 配置内容编辑工作流
    @Bean
    public StateGraph createContentEditingWorkflow() {
        OverAllStateFactory stateFactory = () -> {
            OverAllState state = new OverAllState();
            state.registerKeyAndStrategy("original_content", new ReplaceStrategy());
            state.registerKeyAndStrategy("final_content", new ReplaceStrategy());
            state.registerKeyAndStrategy("editor_comment", new ReplaceStrategy());
            state.registerKeyAndStrategy("revision_needed", new ReplaceStrategy());
            return state;
        };

        return StateGraph.builder(stateFactory)
            .addNode("editing", this.createEditingNode())
            .addNode("ai_generate", this::generateContent)
            .addNode("publish", this::publishContent)
            .addNode("revise", this::reviseContent)
            .addEdge(StateGraph.START, "ai_generate")
            .addEdge("ai_generate", "editing")
            .addConditionalEdges("editing",
                state -> state.value("revision_needed", Boolean.class).orElse(false) ? "revise" : "publish",
                Map.of(
                    "publish", "publish",
                    "revise", "revise"
                ))
            .addEdge("revise", "editing") // 修改后重新编辑
            .addEdge("publish", StateGraph.END)
            .build();
    }

    private Map<String, Object> generateContent(OverAllState state) {
        // AI生成内容的逻辑
        String topic = state.value("topic", String.class).orElse("默认主题");
        String generated = "AI生成的关于" + topic + "的内容...";
        return Map.of("original_content", generated);
    }

    private Map<String, Object> publishContent(OverAllState state) {
        String content = state.value("final_content", String.class).orElse("");
        // 发布内容的逻辑
        return Map.of("status", "已发布", "published_content", content);
    }

    private Map<String, Object> reviseContent(OverAllState state) {
        String comment = state.value("editor_comment", String.class).orElse("");
        // 根据编辑意见修改内容的逻辑
        return Map.of("revision_note", "已根据意见修改：" + comment);
    }
}
```

### 案例三：工具调用确认

![工具调用审查](https://langchain-ai.github.io/langgraph/concepts/img/human_in_the_loop/tool-call-review.png)
*在执行敏感操作前，需要人工确认工具调用的参数和操作*

某些工具调用可能涉及敏感操作，比如删除文件、发送邮件、调用付费API等，需要人工确认后才能执行。

实现步骤：

1. 使用 `ReactAgentWithHuman` 创建支持人工干预的智能体
2. 配置中断条件来识别需要确认的工具调用

```java
@Component
public class PaymentToolService {

    @Autowired
    private MemorySaver memorySaver;

    @Autowired
    private ChatClient chatClient;

    // 敏感的支付工具
    @Tool("处理支付")
    public String processPayment(@ToolParameter("amount") Double amount,
                                @ToolParameter("account") String account) {
        return String.format("已向账户 %s 转账 %.2f 元", account, amount);
    }

    @Bean
    public ReactAgentWithHuman createPaymentAgent() throws GraphStateException {
        SaverConfig saverConfig = SaverConfig.builder()
            .register(SaverConstant.MEMORY, memorySaver)
            .type(SaverConstant.MEMORY)
            .build();

        CompileConfig compileConfig = CompileConfig.builder()
            .saverConfig(saverConfig)
            .build();

        List<ToolCallback> tools = List.of(
            ToolCallback.builder()
                .name("process_payment")
                .description("处理支付转账")
                .function(this::processPayment)
                .build()
        );

        // 创建支付智能体，所有支付操作都需要人工确认
        return new ReactAgentWithHuman(
            "payment_agent",
            "你是一个支付助手，可以帮助处理转账。所有支付操作都需要人工确认。",
            chatClient,
            tools,
            10, // 最大迭代次数
            null, // 键策略工厂
            compileConfig,
            null, // 继续条件函数
            this::needsPaymentConfirmation // 支付确认条件
        );
    }

    // 判断是否需要支付确认
    private Boolean needsPaymentConfirmation(OverAllState state) {
        List<Message> messages = state.value("messages", List.class).orElse(List.of());
        return messages.stream()
            .anyMatch(msg -> msg instanceof AssistantMessage &&
                ((AssistantMessage) msg).getToolCalls() != null &&
                ((AssistantMessage) msg).getToolCalls().stream()
                    .anyMatch(call -> "process_payment".equals(call.name())));
    }
}

// 使用示例
@RestController
public class PaymentController {

    @Autowired
    private ReactAgentWithHuman paymentAgent;

    @PostMapping("/payment/request")
    public String requestPayment(@RequestParam String instruction) {
        RunnableConfig config = RunnableConfig.builder()
            .threadId("payment_" + System.currentTimeMillis())
            .build();

        CompiledGraph agentGraph = paymentAgent.getAndCompileGraph();

        try {
            agentGraph.invoke(Map.of(
                "messages", List.of(new UserMessage(instruction))
            ), config);
            return "支付请求已提交，等待确认";
        } catch (GraphRunnerException e) {
            if (e.getMessage().contains("interrupt")) {
                return "支付操作需要人工确认，请查看详情";
            }
            return "处理失败：" + e.getMessage();
        }
    }

    @PostMapping("/payment/confirm")
    public String confirmPayment(@RequestParam String threadId,
                                @RequestParam boolean approved,
                                @RequestParam String reason) {
        RunnableConfig config = RunnableConfig.builder().threadId(threadId).build();
        CompiledGraph agentGraph = paymentAgent.getAndCompileGraph();

        StateSnapshot snapshot = agentGraph.getState(config);
        OverAllState state = snapshot.state();
        state.withResume();
        state.withHumanFeedback(new OverAllState.HumanFeedback(
            Map.of(
                "approved", approved,
                "reason", reason
            ),
            null
        ));

        try {
            Optional<OverAllState> result = agentGraph.invoke(state, config);
            return approved ? "支付已执行" : "支付已取消：" + reason;
        } catch (Exception e) {
            return "操作失败：" + e.getMessage();
        }
    }
}
```

这个例子展示了如何在支付场景中实现人工确认：

1. **状态保存**：使用 `MemorySaver` 保存执行状态，支持长时间的审批流程
2. **智能体配置**：`ReactAgentWithHuman` 自动识别支付工具调用并触发中断
3. **Web接口**：提供REST API供前端调用，实现完整的审批流程

### 为任何工具添加中断

您可以创建一个包装器来为_任何_工具添加人类审查功能。下面的示例提供了一个参考实现。

```java
@Component
public class HumanInTheLoopToolWrapper {

    /**
     * 包装工具以支持人机协作审查
     */
    public ToolCallback addHumanInTheLoop(ToolCallback originalTool, String toolName) {
        return ToolCallback.builder()
            .name(toolName)
            .description(originalTool.getDescription() + " (需要人类审查)")
            .function((args) -> {
                // 这里实际上需要在图层面处理中断
                // 工具本身不能直接中断，需要通过图的结构来实现
                return originalTool.getFunction().apply(args);
            })
            .build();
    }

    /**
     * 创建带有人类审查的工具调用节点
     */
    public NodeAction createToolWithHumanReview(ToolCallback tool) {
        return (state) -> {
            // 检查是否需要人类审查
            List<Message> messages = state.value("messages", List.class).orElse(List.of());

            // 提取工具调用信息
            for (Message msg : messages) {
                if (msg instanceof AssistantMessage) {
                    AssistantMessage assistantMsg = (AssistantMessage) msg;
                    if (assistantMsg.getToolCalls() != null && !assistantMsg.getToolCalls().isEmpty()) {
                        // 保存工具调用信息供人类审查
                        return Map.of(
                            "pending_tool_call", assistantMsg.getToolCalls().get(0),
                            "tool_name", tool.getName(),
                            "needs_review", true
                        );
                    }
                }
            }

            return Map.of("needs_review", false);
        };
    }
}

// 使用包装器创建带有人类审查的工作流
@Component
public class ToolReviewWorkflow {

    @Autowired
    private HumanInTheLoopToolWrapper toolWrapper;

    @Tool("预订酒店")
    public String bookHotel(@ToolParameter("hotel_name") String hotelName) {
        return String.format("Successfully booked a stay at %s.", hotelName);
    }

    @Bean
    public StateGraph createToolReviewGraph() {
        OverAllStateFactory stateFactory = () -> {
            OverAllState state = new OverAllState();
            state.registerKeyAndStrategy("messages", new AppendStrategy());
            state.registerKeyAndStrategy("pending_tool_call", new ReplaceStrategy());
            state.registerKeyAndStrategy("tool_name", new ReplaceStrategy());
            state.registerKeyAndStrategy("needs_review", new ReplaceStrategy());
            state.registerKeyAndStrategy("approved", new ReplaceStrategy());
            return state;
        };

        ToolCallback bookHotelTool = ToolCallback.builder()
            .name("book_hotel")
            .description("预订酒店")
            .function(this::bookHotel)
            .build();

        HumanNode humanReviewNode = HumanNode.builder()
            .interruptStrategy("conditioned")
            .interruptCondition(state -> state.value("needs_review", Boolean.class).orElse(false))
            .stateUpdateFunc(state -> {
                if (state.humanFeedback() != null) {
                    Map<String, Object> feedback = state.humanFeedback().data();
                    return Map.of("approved", feedback.getOrDefault("approved", false));
                }
                return Map.of();
            })
            .build();

        return StateGraph.builder(stateFactory)
            .addNode("extract_tool_call", toolWrapper.createToolWithHumanReview(bookHotelTool))
            .addNode("human_review", humanReviewNode)
            .addNode("execute_tool", (state) -> {
                boolean approved = state.value("approved", Boolean.class).orElse(false);
                if (approved) {
                    // 执行工具调用
                    String hotelName = "McKittrick Hotel"; // 从 pending_tool_call 中提取
                    String result = bookHotel(hotelName);
                    return Map.of("tool_result", result);
                } else {
                    return Map.of("tool_result", "工具调用被拒绝");
                }
            })
            .addEdge(StateGraph.START, "extract_tool_call")
            .addEdge("extract_tool_call", "human_review")
            .addEdge("human_review", "execute_tool")
            .addEdge("execute_tool", StateGraph.END)
            .build();
    }
}

// 使用示例
RunnableConfig config = RunnableConfig.builder()
    .threadId("1")
    .build();

try {
    Optional<OverAllState> result = graph.invoke(Map.of(
        "messages", List.of(new UserMessage("book a stay at McKittrick hotel"))
    ), config);
} catch (GraphRunnerException e) {
    if (e.getMessage().contains("interrupt")) {
        System.out.println("等待人类审查工具调用");
    }
}

// 恢复并批准工具调用
StateSnapshot stateSnapshot = graph.getState(config);
OverAllState state = stateSnapshot.state();
state.withResume();
state.withHumanFeedback(new OverAllState.HumanFeedback(
    Map.of("approved", true),
    null
));

Optional<OverAllState> finalResult = graph.invoke(state, config);
```

1. 通过图结构实现工具调用的人类审查，而不是在工具内部直接中断。这提供了更好的控制和状态管理。

### 案例四：输入验证

在某些场景下，需要在工作流内部验证用户输入的有效性，确保数据格式正确后再继续处理。

```java
@Component
public class UserRegistrationService {

    // 创建用户信息验证节点
    public HumanNode createValidationNode() {
        return HumanNode.builder()
            .interruptStrategy("always")
            .stateUpdateFunc(this::validateUserInfo)
            .build();
    }

    // 验证用户输入信息
    private Map<String, Object> validateUserInfo(OverAllState state) {
        if (state.humanFeedback() != null) {
            Map<String, Object> feedback = state.humanFeedback().data();
            String email = (String) feedback.get("email");
            String phone = (String) feedback.get("phone");
            Integer age = (Integer) feedback.get("age");

            // 验证邮箱格式
            if (email == null || !email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
                return Map.of(
                    "validation_passed", false,
                    "error_message", "请输入有效的邮箱地址"
                );
            }

            // 验证手机号格式
            if (phone == null || !phone.matches("^1[3-9]\\d{9}$")) {
                return Map.of(
                    "validation_passed", false,
                    "error_message", "请输入有效的手机号码"
                );
            }

            // 验证年龄
            if (age == null || age < 18 || age > 100) {
                return Map.of(
                    "validation_passed", false,
                    "error_message", "年龄必须在18-100岁之间"
                );
            }

            // 所有验证通过
            return Map.of(
                "validation_passed", true,
                "user_email", email,
                "user_phone", phone,
                "user_age", age,
                "message", "用户信息验证通过"
            );
        }

        return Map.of(
            "validation_passed", false,
            "message", "请填写用户注册信息"
        );
    }

    // 创建用户注册完成节点
    public NodeAction createRegistrationNode() {
        return (state) -> {
            String email = state.value("user_email", String.class).orElse("");
            String phone = state.value("user_phone", String.class).orElse("");
            Integer age = state.value("user_age", Integer.class).orElse(0);

            // 模拟用户注册逻辑
            String userId = "USER_" + System.currentTimeMillis();
            System.out.printf("✅ 用户注册成功：ID=%s, 邮箱=%s, 手机=%s, 年龄=%d%n",
                userId, email, phone, age);

            return Map.of(
                "user_id", userId,
                "registration_status", "成功",
                "registration_time", new Date().toString()
            );
        };
    }

    // 配置用户注册验证工作流
    @Bean
    public StateGraph createRegistrationWorkflow() {
        OverAllStateFactory stateFactory = () -> {
            OverAllState state = new OverAllState();
            state.registerKeyAndStrategy("validation_passed", new ReplaceStrategy());
            state.registerKeyAndStrategy("error_message", new ReplaceStrategy());
            state.registerKeyAndStrategy("message", new ReplaceStrategy());
            state.registerKeyAndStrategy("user_email", new ReplaceStrategy());
            state.registerKeyAndStrategy("user_phone", new ReplaceStrategy());
            state.registerKeyAndStrategy("user_age", new ReplaceStrategy());
            state.registerKeyAndStrategy("user_id", new ReplaceStrategy());
            state.registerKeyAndStrategy("registration_status", new ReplaceStrategy());
            return state;
        };

        return StateGraph.builder(stateFactory)
            .addNode("validate_info", this.createValidationNode())
            .addNode("register_user", this.createRegistrationNode())
            .addEdge(StateGraph.START, "validate_info")
            .addConditionalEdges("validate_info",
                state -> state.value("validation_passed", Boolean.class).orElse(false) ? "valid" : "invalid",
                Map.of(
                    "valid", "register_user",
                    "invalid", "validate_info" // 验证失败，重新输入
                ))
            .addEdge("register_user", StateGraph.END)
            .build();
    }
}

// 使用示例
@RestController
public class RegistrationController {

    @Autowired
    private CompiledGraph registrationWorkflow;

    @PostMapping("/user/register")
    public ResponseEntity<Map<String, Object>> startRegistration() {
        String threadId = "reg_" + System.currentTimeMillis();
        RunnableConfig config = RunnableConfig.builder().threadId(threadId).build();

        try {
            registrationWorkflow.invoke(Map.of(), config);
        } catch (GraphRunnerException e) {
            if (e.getMessage().contains("interrupt")) {
                return ResponseEntity.ok(Map.of(
                    "status", "waiting_input",
                    "thread_id", threadId,
                    "message", "请填写注册信息"
                ));
            }
        }
        return ResponseEntity.badRequest().body(Map.of("error", "启动注册流程失败"));
    }

    @PostMapping("/user/submit-info")
    public ResponseEntity<Map<String, Object>> submitUserInfo(
            @RequestParam String threadId,
            @RequestParam String email,
            @RequestParam String phone,
            @RequestParam Integer age) {

        RunnableConfig config = RunnableConfig.builder().threadId(threadId).build();

        StateSnapshot snapshot = registrationWorkflow.getState(config);
        OverAllState state = snapshot.state();
        state.withResume();
        state.withHumanFeedback(new OverAllState.HumanFeedback(
            Map.of("email", email, "phone", phone, "age", age),
            null
        ));

        try {
            Optional<OverAllState> result = registrationWorkflow.invoke(state, config);
            if (result.isPresent()) {
                OverAllState finalState = result.get();
                String status = finalState.value("registration_status", String.class).orElse("");

                if ("成功".equals(status)) {
                    return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "user_id", finalState.value("user_id", String.class).orElse(""),
                        "message", "注册成功"
                    ));
                }
            }
        } catch (GraphRunnerException e) {
            if (e.getMessage().contains("interrupt")) {
                // 验证失败，需要重新输入
                StateSnapshot newSnapshot = registrationWorkflow.getState(config);
                String errorMsg = newSnapshot.state().value("error_message", String.class)
                    .orElse("信息验证失败，请重新输入");

                return ResponseEntity.badRequest().body(Map.of(
                    "status", "validation_failed",
                    "thread_id", threadId,
                    "error", errorMsg
                ));
            }
        }

        return ResponseEntity.badRequest().body(Map.of("error", "注册失败"));
    }
}
```

## 静态中断调试

静态中断主要用于开发和调试阶段，可以在指定的节点前后自动暂停执行，方便开发者检查工作流的执行状态。

### 使用场景

静态中断适用于以下场景：
- **开发调试**：逐步执行工作流，检查每个节点的输入输出
- **性能分析**：在特定节点暂停，分析执行时间和资源消耗
- **问题排查**：在出现问题的节点前后设置断点，定位问题原因

:::warning "使用建议"
静态中断主要用于开发调试，生产环境的人机协作应该使用动态中断（`HumanNode`）。
:::

### 配置静态中断

```java
@Configuration
public class DebugWorkflowConfig {

    @Autowired
    private MemorySaver memorySaver;

    @Bean
    public CompiledGraph createDebugWorkflow() {
        OverAllStateFactory stateFactory = () -> {
            OverAllState state = new OverAllState();
            state.registerKeyAndStrategy("current_step", new ReplaceStrategy());
            state.registerKeyAndStrategy("data", new ReplaceStrategy());
            state.registerKeyAndStrategy("debug_info", new ReplaceStrategy());
            return state;
        };

        StateGraph stateGraph = StateGraph.builder(stateFactory)
            .addNode("data_preparation", this::prepareData)
            .addNode("data_processing", this::processData)
            .addNode("result_generation", this::generateResult)
            .addEdge(StateGraph.START, "data_preparation")
            .addEdge("data_preparation", "data_processing")
            .addEdge("data_processing", "result_generation")
            .addEdge("result_generation", StateGraph.END)
            .build();

        SaverConfig saverConfig = SaverConfig.builder()
            .register(SaverConstant.MEMORY, memorySaver)
            .type(SaverConstant.MEMORY)
            .build();

        CompileConfig compileConfig = CompileConfig.builder()
            .saverConfig(saverConfig)                        // 启用状态保存
            .interruptBefore("data_processing")              // 在数据处理前暂停
            .interruptAfter("data_preparation", "result_generation")  // 在指定节点后暂停
            .build();

        return stateGraph.compile(compileConfig);
    }

    private Map<String, Object> prepareData(OverAllState state) {
        System.out.println("🔄 正在准备数据...");
        // 模拟数据准备逻辑
        return Map.of(
            "current_step", "数据准备完成",
            "data", "prepared_data_" + System.currentTimeMillis(),
            "debug_info", "数据准备耗时: 100ms"
        );
    }

    private Map<String, Object> processData(OverAllState state) {
        System.out.println("⚙️ 正在处理数据...");
        String data = state.value("data", String.class).orElse("");
        return Map.of(
            "current_step", "数据处理完成",
            "data", "processed_" + data,
            "debug_info", "数据处理耗时: 200ms"
        );
    }

    private Map<String, Object> generateResult(OverAllState state) {
        System.out.println("📊 正在生成结果...");
        String processedData = state.value("data", String.class).orElse("");
        return Map.of(
            "current_step", "结果生成完成",
            "final_result", "result_" + processedData,
            "debug_info", "结果生成耗时: 50ms"
        );
    }
}

// 调试使用示例
@Service
public class DebugService {

    @Autowired
    private CompiledGraph debugWorkflow;

    public void runDebugSession() {
        String threadId = "debug_" + System.currentTimeMillis();
        RunnableConfig config = RunnableConfig.builder().threadId(threadId).build();

        System.out.println("🚀 开始调试会话...");

        try {
            // 启动工作流，会在第一个断点暂停
            debugWorkflow.invoke(Map.of("input", "test_data"), config);
        } catch (GraphRunnerException e) {
            if (e.getMessage().contains("interrupt")) {
                System.out.println("⏸️ 工作流在断点处暂停");

                // 检查当前状态
                StateSnapshot snapshot = debugWorkflow.getState(config);
                OverAllState currentState = snapshot.state();
                System.out.println("当前步骤: " + currentState.value("current_step", String.class).orElse("未知"));
                System.out.println("调试信息: " + currentState.value("debug_info", String.class).orElse("无"));

                // 继续执行到下一个断点
                this.continueExecution(threadId);
            }
        }
    }

    public void continueExecution(String threadId) {
        RunnableConfig config = RunnableConfig.builder().threadId(threadId).build();

        StateSnapshot snapshot = debugWorkflow.getState(config);
        OverAllState state = snapshot.state();
        state.withResume();

        try {
            Optional<OverAllState> result = debugWorkflow.invoke(state, config);
            if (result.isPresent()) {
                System.out.println("✅ 工作流执行完成");
                System.out.println("最终结果: " + result.get().value("final_result", String.class).orElse("无结果"));
            }
        } catch (GraphRunnerException e) {
            if (e.getMessage().contains("interrupt")) {
                System.out.println("⏸️ 工作流在下一个断点暂停");
                // 可以继续调试或检查状态
            }
        }
    }
}
```

### 关键配置说明

1. **检查点保存器**：必须配置才能支持断点功能
2. **interruptBefore**：在指定节点执行前暂停，用于检查输入参数
3. **interruptAfter**：在指定节点执行后暂停，用于检查输出结果
4. **状态恢复**：通过 `withResume()` 继续执行到下一个断点

:::tip "调试技巧"
静态中断只能在编译时配置，适合固定的调试场景。如果需要根据运行时条件动态中断，建议使用 `HumanNode` 的条件中断功能。
:::

## 开发建议

### 避免副作用重复执行

由于 `HumanNode` 在恢复时会重新执行，应该将有副作用的操作（如API调用、数据库写入）放在单独的节点中。

#### 推荐的节点分离方式

```java
// 人工输入节点 - 只处理用户反馈
public HumanNode createInputNode() {
    return HumanNode.builder()
        .interruptStrategy("always")
        .stateUpdateFunc(state -> {
            if (state.humanFeedback() != null) {
                Map<String, Object> feedback = state.humanFeedback().data();
                return Map.of("user_decision", feedback.get("decision"));
            }
            return Map.of();
        })
        .build();
}

// 业务操作节点 - 执行实际的业务逻辑
public NodeAction createBusinessNode() {
    return (state) -> {
        String decision = state.value("user_decision", String.class).orElse("");

        if ("approve".equals(decision)) {
            // 执行实际的业务操作（只会执行一次）
            String result = performBusinessOperation();
            return Map.of("operation_result", result);
        } else {
            return Map.of("operation_result", "操作已取消");
        }
    };
}

// 工作流结构
StateGraph.builder(stateFactory)
    .addNode("user_input", createInputNode())
    .addNode("business_operation", createBusinessNode())
    .addEdge("user_input", "business_operation")
    .build();
```

### 子图中的人机协作

当在子图中使用 `HumanNode` 时，需要注意中断会影响整个调用链。

```java
// 父工作流节点
public NodeAction createParentNode() {
    return (state) -> {
        // 这部分代码在恢复时会重新执行
        System.out.println("准备调用子图...");

        try {
            // 调用包含 HumanNode 的子图
            Optional<OverAllState> subResult = subWorkflow.invoke(
                Map.of("input", state.value("data")),
                config
            );
            return Map.of("sub_result", subResult.get().data());
        } catch (GraphRunnerException e) {
            if (e.getMessage().contains("interrupt")) {
                // 子图中断，向上传播
                throw e;
            }
            throw e;
        }
    };
}
```

### 多个人工干预点

复杂的业务流程可能需要多个人工干预点，每个点负责不同的审核内容。

```java
@Bean
public StateGraph createMultiApprovalWorkflow() {
    // 内容审核节点
    HumanNode contentReview = HumanNode.builder()
        .interruptStrategy("always")
        .stateUpdateFunc(this::handleContentReview)
        .build();

    // 法务审核节点
    HumanNode legalReview = HumanNode.builder()
        .interruptStrategy("conditioned")
        .interruptCondition(state -> needsLegalReview(state))
        .stateUpdateFunc(this::handleLegalReview)
        .build();

    // 最终审批节点
    HumanNode finalApproval = HumanNode.builder()
        .interruptStrategy("always")
        .stateUpdateFunc(this::handleFinalApproval)
        .build();

    return StateGraph.builder(stateFactory)
        .addNode("content_review", contentReview)
        .addNode("legal_review", legalReview)
        .addNode("final_approval", finalApproval)
        .addNode("publish", this::publishContent)
        .addEdge(StateGraph.START, "content_review")
        .addEdge("content_review", "legal_review")
        .addEdge("legal_review", "final_approval")
        .addEdge("final_approval", "publish")
        .addEdge("publish", StateGraph.END)
        .build();
}

private boolean needsLegalReview(OverAllState state) {
    // 根据内容类型判断是否需要法务审核
    String contentType = state.value("content_type", String.class).orElse("");
    return "contract".equals(contentType) || "legal_document".equals(contentType);
}
```

### 设计原则

1. **单一职责**：每个 `HumanNode` 只负责一种类型的人工干预
2. **清晰边界**：明确定义每个节点的输入输出和处理逻辑
3. **状态一致性**：确保状态更新逻辑的一致性和可预测性
4. **错误处理**：妥善处理中断异常和恢复失败的情况

## 配置参考

### 应用配置

```properties
# 数据库配置（用于持久化检查点）
spring.datasource.url=jdbc:mysql://localhost:3306/workflow_db
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# 连接池配置
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000

# Redis 配置（可选，用于缓存）
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.database=0
spring.redis.timeout=5000ms

# 工作流执行配置
workflow.execution.max-iterations=100
workflow.execution.timeout=30m
workflow.human-interaction.default-timeout=24h

# 日志配置
logging.level.com.alibaba.cloud.ai.graph=INFO
logging.level.com.alibaba.cloud.ai.graph.node.HumanNode=DEBUG
```

### Java 配置

```java
@Configuration
@EnableConfigurationProperties
public class WorkflowConfig {

    @Bean
    public MemorySaver memorySaver() {
        return new MemorySaver();
    }

    @Bean
    @ConditionalOnProperty(name = "workflow.saver.type", havingValue = "database")
    public DatabaseSaver databaseSaver(DataSource dataSource) {
        return new DatabaseSaver(dataSource);
    }

    @Bean
    public SaverConfig saverConfig(MemorySaver memorySaver) {
        return SaverConfig.builder()
            .register(SaverConstant.MEMORY, memorySaver)
            .type(SaverConstant.MEMORY)
            .build();
    }

    @Bean
    public CompileConfig compileConfig(SaverConfig saverConfig) {
        return CompileConfig.builder()
            .saverConfig(saverConfig)
            // 生产环境不建议设置静态中断点
            // .interruptBefore("review_node")
            .build();
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

// 工作流属性配置
@ConfigurationProperties(prefix = "workflow")
@Data
public class WorkflowProperties {
    private Execution execution = new Execution();
    private HumanInteraction humanInteraction = new HumanInteraction();

    @Data
    public static class Execution {
        private int maxIterations = 100;
        private Duration timeout = Duration.ofMinutes(30);
    }

    @Data
    public static class HumanInteraction {
        private Duration defaultTimeout = Duration.ofHours(24);
        private boolean enableNotification = true;
        private String notificationUrl;
    }
}
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

- [了解持久执行与时间旅行](./state-context-management/durable-execution.md)
- [学习子图](./subgraphs.md)
- [探索持久化机制](./persistence.md)
