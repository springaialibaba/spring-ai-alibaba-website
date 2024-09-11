---
title: Chat Client
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

## ChatClient 简介

`ChatClient` 提供了与 AI 模型通信的 Fluent API，它支持同步和反应式（Reactive）编程模型。与 `ChatModel`、`Message`、`ChatMemory` 等原子 API 相比，使用 `ChatClient` 可以将与 LLM 和其他组件交互的复杂性隐藏在背后，因为基于 LLM 的应用程序通常要多个组件协同工作（例如，提示词模板、聊天记忆、LLM Model、输出解析器、RAG 组件：嵌入模型和存储），并且通常涉及多个交互，因此协调它们会让编码变得繁琐。当然使用 `ChatModel` 等原子 API 可以为应用程序带来更多的灵活性，成本就是您需要编写大量样板代码。

ChatClient 类似于应用程序开发中的服务层，它为应用程序直接提供 `AI 服务`，开发者可以使用 ChatClient Fluent API 快速完成一整套 AI 交互流程的组装。

包括一些基础功能，如：
* 定制和组装模型的输入（Prompt）
* 格式化解析模型的输出（Structured Output）
* 调整模型交互参数（ChatOptions）

还支持更多高级功能：
* 聊天记忆（Chat Memory）
* 工具/函数调用（Function Calling）
* RAG


## 创建 ChatClient

使用 `ChatClient.Builder` 对象创建 `ChatClient` 实例，您可以自动注入由Spring Boot 自动配置创建的默认 `ChatClient.Builder` 实例，您也可以通过编程方式自行创建一个 `ChatClient.Builder` 实例并用它来得到 `ChatClient` 实例。

### 使用自动配置的 ChatClient.Builder

在快速开始示例中，就是使用的 Spring Boot 自动装配默认生成的 `ChatClient.Builder` 的 bean，把它注入到您自己的类中。这里是根据用户提问并从模型得到文本回答的简单例子：

```java
    @RestController
    public class ChatController {

    	private final ChatClient chatClient;

    	public ChatController(ChatClient.Builder builder) {
    		this.chatClient = builder.build();
    	}

    	@GetMapping("/chat")
    	public String chat(String input) {
    		return this.chatClient.prompt()
    				.user(input)
    				.call()
    				.content();
    	}
    }
```

在这个示例中，首先设置了用户消息的内容，call 方法向 AI 模型发送请求，content 方法以字符串形式返回 AI 模型的响应。

### 以编程方式创建 ChatClient

您可以通过设置属性 `spring.ai.chat.client.enabled=false` 来禁用 `ChatClient.Builder` bean 的自动配置，如果需要多个聊天模型一起使用，这会很有用，然后以编程方式创建 `ChatClient.Builder`，这样可以为每个聊天模型创建一个实例 `ChatModel`：

```java
    ChatModel myChatModel = ... // usually autowired

    ChatClient.Builder builder = ChatClient.builder(myChatModel);

    // or create a ChatClient with the default builder settings:

    ChatClient chatClient = ChatClient.create(myChatModel);
```

## 处理 ChatClient 响应

ChatClient API 提供了多种方法来格式化来自 AI 模型的响应。

### 返回 ChatResponse

AI 模型的响应是一种由[ChatResponse](https://docs.spring.io/spring-ai/reference/api/chatmodel.html#ChatResponse)类型定义的丰富结构。它包含响应生成相关的元数据，同时它还可以包含多个子响应（称为[Generation](https://docs.spring.io/spring-ai/reference/api/chatmodel.html#Generation)），每个子响应都有自己的元数据。元数据包括用于创建响应的令牌（token）数量信息（在英文中，每个令牌大约为一个单词的 3/4），了解令牌信息很重要，因为 AI 模型根据每个请求使用的令牌数量收费。

下面的代码段显示了通过调用 `chatResponse()` 返回 `ChatResponse` 的示例，相比于调用 `content()` 方法，这里在调用 `call()` 方法之后调用 `chatResponse()`。

    ChatResponse chatResponse = chatClient.prompt()
        .user("Tell me a joke")
        .call()
        .chatResponse();

### 返回实体类（Entity）

您经常希望返回一个预先定义好的实体类型响应，由框架自动替我们完成从 `String` 到。该`entity`方法提供了此功能。

例如，给定 Java 记录：

    record ActorFilms(String actor, List<String> movies) {
    }

您可以使用该方法轻松地将 AI 模型的输出映射到此记录`entity`，如下所示：

    ActorFilms actorFilms = chatClient.prompt()
        .user("Generate the filmography for a random actor.")
        .call()
        .entity(ActorFilms.class);

还有一种`entity`带有签名的重载方法`entity(ParameterizedTypeReference<T> type)`，可让您指定通用列表等类型：

    List<ActorFilms> actorFilms = chatClient.prompt()
        .user("Generate the filmography of 5 movies for Tom Hanks and Bill Murray.")
        .call()
        .entity(new ParameterizedTypeReference<List<ActorFilms>>() {
        });

### [](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_streaming_responses)流式响应

让`stream`您获得异步响应，如下所示

    Flux<String> output = chatClient.prompt()
        .user("Tell me a joke")
        .stream()
        .content();

您还可以`ChatResponse`使用该方法进行流式传输`Flux<ChatResponse> chatResponse()`。

在 1.0.0 M2 中，我们将提供一种便捷方法，让您使用反应式`stream()`方法返回 Java 实体。同时，您应该使用[结构化输出转换器](https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html#StructuredOutputConverter)明确转换聚合响应，如下所示。这也演示了流畅 API 中参数的使用，本文档后面的部分将对此进行更详细的讨论。

        var converter = new BeanOutputConverter<>(new ParameterizedTypeReference<List<ActorsFilms>>() {
        });

        Flux<String> flux = this.chatClient.prompt()
            .user(u -> u.text("""
                                Generate the filmography for a random actor.
                                {format}
                              """)
                    .param("format", converter.getFormat()))
            .stream()
            .content();

        String content = flux.collectList().block().stream().collect(Collectors.joining());

        List<ActorFilms> actorFilms = converter.convert(content);

[](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_call_return_values)call() 返回值
------------------------------------------------------------------------------------------------

指定`call`方法后，`ChatClient`响应类型有几种不同的选项。

*   `String content()`：返回响应的字符串内容

*   `ChatResponse chatResponse()`：返回`ChatResponse`包含多个代以及有关响应的元数据的对象，例如，使用了多少个令牌来创建响应。

*   `entity`返回 Java 类型

    *   entity(ParameterizedTypeReference<T> type)：用于返回实体类型的集合。

    *   entity(Class<T> type): 用于返回特定的实体类型。

    *   entity(StructuredOutputConverter<T> structuredOutputConverter): 用于指定一个实例，`StructuredOutputConverter`将一个实例转换`String`为实体类型。



您还可以调用该`stream`方法而`call`不是

[](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_stream_return_values)stream() 返回值
----------------------------------------------------------------------------------------------------

在指定`stream`方法后`ChatClient`，响应类型有几个选项：

*   `Flux<String> content()`：返回由AI模型生成的字符串的Flux。

*   `Flux<ChatResponse> chatResponse()`：返回对象的 Flux `ChatResponse`，其中包含有关响应的附加元数据。


[](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_using_defaults)使用默认值
---------------------------------------------------------------------------------------

在类中创建带有默认系统文本的 ChatClient`@Configuration`可简化运行时代码。通过设置默认值，您只需在调用时指定用户文本`ChatClient`，无需在运行时代码路径中为每个请求设置系统文本。

### [](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_default_system_text)默认系统文本

在以下示例中，我们将配置系统文本以始终以海盗的声音回复。为了避免在运行时代码中重复系统文本，我们将`ChatClient`在类中创建一个实例`@Configuration`。

    @Configuration
    class Config {

        @Bean
        ChatClient chatClient(ChatClient.Builder builder) {
            return builder.defaultSystem("You are a friendly chat bot that answers question in the voice of a Pirate")
                    .build();
        }

    }

并`@RestController`调用它

    @RestController
    class AIController {

    	private final ChatClient chatClient;

    	AIController(ChatClient chatClient) {
    		this.chatClient = chatClient;
    	}

    	@GetMapping("/ai/simple")
    	public Map<String, String> completion(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
    		return Map.of("completion", chatClient.prompt().user(message).call().content());
    	}
    }

通过 curl 调用它

    ❯ curl localhost:8080/ai/simple
    {"generation":"Why did the pirate go to the comedy club? To hear some arrr-rated jokes! Arrr, matey!"}

### [](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_default_system_text_with_parameters)带参数的默认系统文本

在下面的例子中，我们将使用系统文本中的占位符来指定在运行时而不是设计时完成的语音。

    @Configuration
    class Config {

        @Bean
        ChatClient chatClient(ChatClient.Builder builder) {
            return builder.defaultSystem("You are a friendly chat bot that answers question in the voice of a {voice}")
                    .build();
        }

    }

    @RestController
    class AIController {
    	private final ChatClient chatClient
    	AIController(ChatClient chatClient) {
    		this.chatClient = chatClient;
    	}
    	@GetMapping("/ai")
    	Map<String, String> completion(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message, String voice) {
    		return Map.of(
    				"completion",
    				chatClient.prompt()
    						.system(sp -> sp.param("voice", voice))
    						.user(message)
    						.call()
    						.content());
    	}
    }

答案是

    http localhost:8080/ai voice=='Robert DeNiro'
    {
        "completion": "You talkin' to me? Okay, here's a joke for ya: Why couldn't the bicycle stand up by itself? Because it was two tired! Classic, right?"
    }

### [](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_other_defaults)其他默认设置

在`ChatClient.Builder`级别上，您可以指定默认提示。

*   `defaultOptions(ChatOptions chatOptions)`：传入`ChatOptions`类中定义的可移植选项或特定于模型的选项（例如 中的选项）`OpenAiChatOptions`。有关特定于模型的`ChatOptions`实现的更多信息，请参阅 JavaDocs。

*   `defaultFunction(String name, String description, java.util.function.Function<I, O> function)`：`name`用于在用户文本中引用该函数。`description`解释该函数的用途并帮助 AI 模型选择正确的函数以获得准确的响应。参数`function`是模型将在必要时执行的 Java 函数实例。

*   `defaultFunctions(String…​ functionNames)`：应用程序上下文中定义的 java.util.Function 的 bean 名称。

*   `defaultUser(String text)`、、`defaultUser(Resource text)`：`defaultUser(Consumer<UserSpec> userSpecConsumer)`这些方法允许您定义用户文本。`Consumer<UserSpec>`允许您使用 lambda 指定用户文本和任何默认参数。

*   `defaultAdvisors(RequestResponseAdvisor…​ advisor)`：顾问允许修改用于创建的数据`Prompt`。该实现通过在提示中附加与用户文本相关的上下文信息来`QuestionAnswerAdvisor`实现模式。`Retrieval Augmented Generation`

*   `defaultAdvisors(Consumer<AdvisorSpec> advisorSpecConsumer)`：此方法允许您定义一个`Consumer`以使用配置多个顾问`AdvisorSpec`。顾问可以修改用于创建最终的数据`Prompt`。`Consumer<AdvisorSpec>`允许您指定 lambda 来添加顾问，例如`QuestionAnswerAdvisor`，它`Retrieval Augmented Generation`通过根据用户文本附加带有相关上下文信息的提示来支持。


您可以在运行时使用不带前缀的相应方法覆盖这些默认值`default`。

*   `options(ChatOptions chatOptions)`

*   `function(String name, String description, java.util.function.Function<I, O> function)`

*   \`函数（字符串…​ 函数名称）

*   `user(String text)`，，`user(Resource text)`​`user(Consumer<UserSpec> userSpecConsumer)`

*   `advisors(RequestResponseAdvisor…​ advisor)`

*   `advisors(Consumer<AdvisorSpec> advisorSpecConsumer)`


[](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_advisors)顾问
------------------------------------------------------------------------------

使用用户文本调用 AI 模型时的一个常见模式是使用上下文数据附加或扩充提示。

这些上下文数据可以是不同类型的。常见类型包括：

*   **您自己的数据**：这是 AI 模型尚未训练过的数据。即使模型已经看到过类似的数据，附加的上下文数据也会优先生成响应。

*   **对话历史记录**：聊天模型的 API 是无状态的。如果您告诉 AI 模型您的姓名，它不会在后续交互中记住它。每次请求都必须发送对话历史记录，以确保在生成响应时考虑到先前的交互。


### [](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_retrieval_augmented_generation)检索增强生成

向量数据库存储的是 AI 模型不知道的数据。当用户问题被发送到 AI 模型时，它会在`QuestionAnswerAdvisor`向量数据库中查询与用户问题相关的文档。

来自向量数据库的响应被附加到用户文本中，为 AI 模型生成响应提供上下文。

假设您已将数据加载到中`VectorStore`，则可以通过向提供实例来执行检索增强生成 (RAG `QuestionAnswerAdvisor`) `ChatClient`。

    ChatResponse response = ChatClient.builder(chatModel)
            .build().prompt()
            .advisors(new QuestionAnswerAdvisor(vectorStore, SearchRequest.defaults()))
            .user(userText)
            .call()
            .chatResponse();

在此示例中，`SearchRequest.defaults()`将对 Vector 数据库中的所有文档执行相似性搜索。为了限制要搜索的文档类型，采用`SearchRequest`了可移植到所有数据库中的类似 SQL 的筛选表达式`VectorStores`。

#### [](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_dynamic_filter_expressions)动态过滤表达式

`SearchRequest`使用`FILTER_EXPRESSION`顾问上下文参数在运行时更新过滤表达式：

    ChatClient chatClient = ChatClient.builder(chatModel)
        .defaultAdvisors(new QuestionAnswerAdvisor(vectorStore, SearchRequest.defaults()))
        .build();

    // Update filter expression at runtime
    String content = chatClient.prompt()
        .user("Please answer my question XYZ")
        .advisors(a -> a.param(QuestionAnswerAdvisor.FILTER_EXPRESSION, "type == 'Spring'"))
        .call()
        .content();

该`FILTER_EXPRESSION`参数允许您根据提供的表达式动态过滤搜索结果。

### [](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_chat_memory)聊天记忆

该接口`ChatMemory`表示聊天对话历史记录的存储。它提供向对话添加消息、从对话中检索消息以及清除对话历史记录的方法。

有两种实现方式`InMemoryChatMemory`，`CassandraChatMemory`分别为聊天对话历史记录提供内存存储和`time-to-live`相应的持久存储。

要创建`CassandraChatMemory`一个`time-to-live`

    CassandraChatMemory.create(CassandraChatMemoryConfig.builder().withTimeToLive(Duration.ofDays(1)).build());

以下顾问实现使用`ChatMemory`接口来建议带有对话历史记录的提示，这些提示在将内存添加到提示的细节上有所不同

*   `MessageChatMemoryAdvisor`：内存被检索并作为消息集合添加到提示中

*   `PromptChatMemoryAdvisor`：检索内存并将其添加到提示的系统文本中。

*   `VectorStoreChatMemoryAdvisor` ：构造函数`VectorStoreChatMemoryAdvisor(VectorStore vectorStore, String defaultConversationId, int chatHistoryWindowSize)`允许您指定要从中检索聊天历史记录的 VectorStore、唯一的对话 ID、要检索的聊天历史记录的大小（以令牌大小为单位）。


`@Service`下面是一个使用多个顾问的示例实现

    import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;
    import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_RETRIEVE_SIZE_KEY;

    @Service
    public class CustomerSupportAssistant {

        private final ChatClient chatClient;

        public CustomerSupportAssistant(ChatClient.Builder builder, VectorStore vectorStore, ChatMemory chatMemory) {

        this.chatClient = builder
                .defaultSystem("""
                        You are a customer chat support agent of an airline named "Funnair".", Respond in a friendly,
                        helpful, and joyful manner.

                        Before providing information about a booking or cancelling a booking, you MUST always
                        get the following information from the user: booking number, customer first name and last name.

                        Before changing a booking you MUST ensure it is permitted by the terms.

                        If there is a charge for the change, you MUST ask the user to consent before proceeding.
                        """)
                .defaultAdvisors(
                        new PromptChatMemoryAdvisor(chatMemory),
                        // new MessageChatMemoryAdvisor(chatMemory), // CHAT MEMORY
                        new QuestionAnswerAdvisor(vectorStore, SearchRequest.defaults()),
                        new LoggingAdvisor()) // RAG
                .defaultFunctions("getBookingDetails", "changeBooking", "cancelBooking") // FUNCTION CALLING
                .build();
    }

    public Flux<String> chat(String chatId, String userMessageContent) {

        return this.chatClient.prompt()
                .user(userMessageContent)
                .advisors(a -> a
                        .param(CHAT_MEMORY_CONVERSATION_ID_KEY, chatId)
                        .param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 100))
                .stream().content();
        }
    }

### [](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_logging)日志记录

这是一个用于记录ChatClient 的和数据的`SimpleLoggerAdvisor`顾问。这对于调试和监控您的 AI 交互非常有用。`request``response`

要启用日志记录，请`SimpleLoggerAdvisor`在创建 ChatClient 时将其添加到顾问链中。建议将其添加到链的末尾：

    ChatResponse response = ChatClient.create(chatModel).prompt()
            .advisors(new SimpleLoggerAdvisor())
            .user("Tell me a joke?")
            .call()
            .chatResponse();

要查看日志，请将顾问包的日志记录级别设置为`DEBUG`：

日志记录.级别.org.springframework.ai.chat.client.advisor=DEBUG

将其添加到您的`application.properties`或`application.yaml`文件中。

您可以使用以下构造函数自定义记录来自 AdvisedRequest 和 ChatResponse 的数据：

    SimpleLoggerAdvisor(
        Function<AdvisedRequest, String> requestToString,
        Function<ChatResponse, String> responseToString
    )

使用示例：

    javaCopySimpleLoggerAdvisor customLogger = new SimpleLoggerAdvisor(
        request -> "Custom request: " + request.userText,
        response -> "Custom response: " + response.getResult()
    );

这使得您可以根据您的特定需要定制记录的信息。