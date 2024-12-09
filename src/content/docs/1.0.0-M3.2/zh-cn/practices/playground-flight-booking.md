---
title: 智能机票助手
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---
> 本示例项目的源码请参 Github 仓库 [spring-ai-alibaba-examples](https://github.com/alibaba/spring-ai-alibaba/tree/main/spring-ai-alibaba-examples/playground-flight-booking)。

接下来，我们通过一个更贴近实际使用场景的示例，来展示 Spring AI Alibaba 在构建智能体应用方面的强大能力。

示例目标是使用 Spring AI Alibaba 框架开发一个智能机票助手，它可以帮助消费者完成<font style="color:#5e5e5e;">机票预定、问题解答、机票改签、取消等动作，具体要求为：</font>

+ <font style="color:#5e5e5e;">基于 AI 大模型</font>与用户对话，理解用户自然语言表达的需求
+ <font style="color:#5e5e5e;">支持多轮连续对话，能在上下文中理解用户意图</font>
+ <font style="color:#5e5e5e;">理解机票操作相关的术语与规范并严格遵守，如航空法规、退改签规则等</font>
+ 在必要时可<font style="color:#5e5e5e;">调用工具辅助完成任务</font>

#### 完整架构图
<font style="color:#5e5e5e;">基于这样一个</font>智能机票助手目标，我们绘制了一个如下图所示的架构图：

![](https://intranetproxy.alipay.com/skylark/lark/0/2024/png/54037/1726885568393-66764b19-a8cb-4788-bb98-c301fce7c8e4.png)



<font style="color:#5e5e5e;">接下来，我们结合架构图对示例进行详细分析。
</font>

#### <font style="color:#5e5e5e;">为应用接入 AI 模型服务</font>
<font style="color:#5e5e5e;">本质上来说，我们是要用 Spring Boot 开发一个普通的 Java 应用，这个应用能够持续的接收用户的提问，为用户解决机票相关的问题，之所以叫它为智能体应用是因为我们这个应用可以与 AI 交互，由 AI 帮助应用理解用户问题并为用户做决策，所以对我们机票助手一个简化分解的架构图如下所示：</font>

<font style="color:#5e5e5e;"></font>

![](https://intranetproxy.alipay.com/skylark/lark/0/2024/png/54037/1726912043221-e23df6ca-dddc-46b9-b7f2-02d791d150fa.png)

<font style="color:#5e5e5e;"></font>

#### <font style="color:#5e5e5e;">使用 RAG 增加机票退改签规则</font>
<font style="color:#5e5e5e;">基于以上架构图，应用是由 AI 模型理解用户问题，决策下一步动作、驱动业务流程。但任何一个通用的大模型都能帮我们解决机票相关的问题吗？依赖模型的决策是可靠的吗？比如有用户提出了机票改签的诉求，模型一定是能够很好的理解用户的意图的，这点没有疑问。但它怎么知道当前用户符不符合退票规则那？要知道每个航空公司的改签规则可能都是不一样的；它怎么知道改签手续费的规定那？在这样一个可能带来经济纠纷、法律风险的应用场景下，AI模型必须要知道改签规则的所有细节，并逐条确认用户信息复合规则后，才能最终作出是否改签的决策。</font>

<font style="color:#5e5e5e;">很显然，单纯依赖 AI 模型本身并不能替我们完成上面的要求，这个时候就要用到 RAG（检索增强）模式了。通过 RAG 我们可以把机票退改签相关的领域知识输入给应用和 AI 模型，让 AI 结合这些规则与要求辅助决策，增加 RAG 后的架构如下图所示：</font>



![](https://intranetproxy.alipay.com/skylark/lark/0/2024/png/54037/1727063147426-6df413c8-bcd2-4966-b0c0-178279ab2752.png)

<font style="color:#5e5e5e;"></font>

<font style="color:#5e5e5e;">有了 RAG 之后，我们的应用真正的成为了一个智能化的机票问题专家，就像一个经过公司业务培训的客服代表，既能人性化的与用户对话，又能根据规则引导用户行为。</font>

<font style="color:#5e5e5e;"></font>

#### <font style="color:#5e5e5e;">使用 Function Calling 执行业务动作</font>
<font style="color:#5e5e5e;">AI 智能体可以帮助应用理解用户需求并作出决策，但是它没法代替应用完成决策的执行，决策的执行还是要由应用自己完成，这一点和传统应用并没有区别，不论是智能化的还是预先编排好的应用，都是要由应用本身去调用函数修改数据库记录实现数据持久化。</font>

<font style="color:#5e5e5e;">通过 Spring AI 框架，我们可以将模型的决策转换为对某个具体函数的调用，从而完成机票的最终改签或者退票动作，将用户数据写入数据库，这就是我们前面提到的 Function Calling 模式。</font>

<font style="color:#5e5e5e;"></font>

![](https://intranetproxy.alipay.com/skylark/lark/0/2024/png/54037/1726913577931-fdcd7e06-90ec-4dad-9547-bc63016e0bf2.png)



#### <font style="color:#5e5e5e;">使用 Chat Memory 增加多轮对话能力</font>
<font style="color:#5e5e5e;">最后一点是关于多轮连续对话的支持，我们要记住一点，大模型是无状态的，它看到的只有当前这一轮对话的内容。因此如果要支持多轮对话效果，需要应用每次都要把之前的对话上下文保留下来，并与最新的问题一并作为 prompt 发送给模型。这时，我们可以利用 Spring AI Alibaba 提供的内置 Conversation Memory 支持，方便的维护对话上下文。</font>

<font style="color:#5e5e5e;">总结起来，我们在这个智能机票助手应用中用到了 Spring AI Alibaba 的核心如下能力：</font>

1. <font style="color:#5e5e5e;">基本模型对话能力，通过 Chat Model API 与阿里云通义模型交互</font>
2. <font style="color:#5e5e5e;">Prompt 管理能力</font>
3. <font style="color:#5e5e5e;">Chat Memory 聊天记忆，支持多轮对话</font>
4. <font style="color:#5e5e5e;">RAG、Vector Store，机票预定、改签、退票等相关规则</font>


![](https://intranetproxy.alipay.com/skylark/lark/0/2024/png/54037/1726914000870-648040e8-d109-4f08-ab27-ebfcef0079f9.png)


#### 使用 ChatClient 完成编码
Spring AI Alibaba 不止提供了以上原子能力抽象，还提供了高阶 “智能体” API 抽象 `ChatClient`，让我们可以非常方便的使用流式 Fluent API 把多个组件组装起来，成为一个智能体 Agent。`ChatClient` 的使用方式如下：

```java
this.chatClient = modelBuilder
				.defaultSystem("""
						您是“Funnair”航空公司的客户聊天支持代理。请以友好、乐于助人且愉快的方式来回复。
					   您正在通过在线聊天系统与客户互动。
					   在提供有关预订或取消预订的信息之前，您必须始终
					   从用户处获取以下信息：预订号、客户姓名。
					   在询问用户之前，请检查消息历史记录以获取此信息。
					   在更改预订之前，您必须确保条款允许这样做。
					   如果更改需要收费，您必须在继续之前征得用户同意。
					   使用提供的功能获取预订详细信息、更改预订和取消预订。
					   如果需要，可以调用相应函数调用完成辅助动作。
					   请讲中文。
					   今天的日期是 {current_date}.
					""")
				.defaultAdvisors(
						new PromptChatMemoryAdvisor(chatMemory), // Chat Memory
						new VectorStoreChatMemoryAdvisor(vectorStore)),
						new QuestionAnswerAdvisor(vectorStore, SearchRequest.defaults()), // RAG
						new LoggingAdvisor())
				.defaultFunctions("getBookingDetails", "changeBooking", "cancelBooking") // FUNCTION CALLING

				.build();
```

<font style="color:#5e5e5e;">这样，</font>`<font style="color:#5e5e5e;">ChatClient</font>`<font style="color:#5e5e5e;">就为我们屏蔽了所有与大模型交互的细节，只需要把 </font>`<font style="color:#5e5e5e;">ChatClient</font>`<font style="color:#5e5e5e;">注入常规的 Spring Bean 就可以为我们的机票应用加入智能化能力了。</font>

最终，我们开发的示例运行效果如下所示：

![](https://intranetproxy.alipay.com/skylark/lark/0/2024/png/54037/1726916955378-bd0b89ff-6d2e-4cda-a0b7-7cf22c680fb9.png)

