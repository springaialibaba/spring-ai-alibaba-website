---
title: 工具(Function Calling)
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

“工具（Tool）”或“功能调用（Function Calling）”允许大型语言模型（LLM）在必要时调用一个或多个可用的工具，这些工具通常由开发者定义。工具可以是任何东西：网页搜索、对外部 API 的调用，或特定代码的执行等。LLM 本身不能实际调用工具；相反，它们会在响应中表达调用特定工具的意图（而不是以纯文本回应）。然后，我们应用程序应该执行这个工具，并报告工具执行的结果给模型。

例如，我们知道 LLM 自身在数学方面不是特别擅长。如果你的用例偶尔涉及数学计算，你可能会想提供给 LLM 一个“数学工具”。通过在请求中声明一个或多个工具，LLM 可以在认为合适时调用其中之一。给定一个数学问题和一组数学工具，LLM 可能会决定为正确回答问题，它应该首先调用其中一个提供的数学工具。

接下来，让我们用一个示例看一下 Function Calling 的具体工作过程。

以下是没有 Function Calling 的一个消息交互过程示例，模型给给出的结果非常接近但是并不正确：

```text
Request:
- messages:
    - UserMessage:
        - text: What is the square root of 475695037565?

Response:
- AiMessage:
    - text: The square root of 475695037565 is approximately 689710.
```

以下是包含了 Function Calling 的消息交互过程：

```text
Request 1:
- messages:
    - UserMessage:
        - text: What is the square root of 475695037565?
- tools:
    - sum(double a, double b): Sums 2 given numbers
    - squareRoot(double x): Returns a square root of a given number

Response 1:
- AiMessage:
    - toolExecutionRequests:
        - squareRoot(475695037565)


... here we are executing the squareRoot method with the "475695037565" argument and getting "689706.486532" as a result ...


Request 2:
- messages:
    - UserMessage:
        - text: What is the square root of 475695037565?
    - AiMessage:
        - toolExecutionRequests:
            - squareRoot(475695037565)
    - ToolExecutionResultMessage:
        - text: 689706.486532

Response 2:
- AiMessage:
    - text: The square root of 475695037565 is 689706.486532.
```

其中，函数定义如下：
```java
@Bean
@Description("Get the weather in location") // function description
public Function<MockWeatherService.Request, MockWeatherService.Response> weatherFunction1() {
	return new MockWeatherService();
}
```

正如你所看到的，当 LLM 可以访问工具时，它可以在合适的情况下决定调用其中一个工具，这是一个非常强大的功能。在这个简单的示例中，我们给 LLM 提供了基本的数学工具，但想象一下，如果我们给它提供了，比如说，googleSearch 和 sendEmail 工具，并且有一个查询像是“我的朋友想了解 AI 领域的最新新闻。将简短的总结发送到 friend@email.com”，那么它可以使用 googleSearch 工具查找最新新闻，然后总结这些信息并通过 sendEmail 工具将总结发送到指定的邮箱。

## API 概览

通常，自定义函数需要提供一个 `name`、`description` 和 `function call signature`，以便模型知道函数能做什么、期望的输入参数。

Spring AI 使这一过程变得简单，只需定义一个返回 `java.util.Function` 的 @Bean 定义，并在调用 ChatModel 时将 bean 名称作为选项进行注册。在底层，Spring 会用适当的适配器代码包装你的 POJO（即函数），以便与 AI 模型进行交互，免去了编写繁琐的样板代码。`FunctionCallback.java`  接口和配套的 `FunctionCallbackWrapper.java` 工具类包含了底层实现代码，它们是简化 Java 回调函数的实现和注册的关键。

![function calling flow](https://img.alicdn.com/imgextra/i1/O1CN01CfzrO11PzHs9GTPKG_!!6000000001911-0-tps-2372-1685.jpg)

## 使用示例
在以下示例中，我们将创建一个聊天机器人，通过调用我们自己的函数来回答问题。为了支持聊天机器人的响应，我们将注册一个自己的函数，该函数接受一个位置并返回该位置的当前天气。当模型需要回答诸如 “What’s the weather like in Boston?” 这样的问题时，AI 模型将调用客户端，将位置值作为参数传递给函数。这种类似 RPC 的数据将以 JSON 格式传递。

我们的函数调用某个基于 SaaS 的天气服务 API，并将天气响应返回给模型以完成对话。在这个示例中，我们将使用一个名为 MockWeatherService 的简单实现，它为不同位置硬编码了温度。

> 示例源码请参见 [function-calling-example](https://github.com/alibaba/spring-ai-alibaba/tree/main/spring-ai-alibaba-examples/function-calling-example)

以下是代表天气服务 API 的 MockWeatherService.java：

```java
public class MockWeatherService implements Function<Request, Response> {
	public enum Unit { C, F }
	public record Request(String location, Unit unit) {}
	public record Response(double temp, Unit unit) {}

	public Response apply(Request request) {
		return new Response(30.0, Unit.C);
	}
}
```

### 定义&注册函数

通过这种方法，您可以在应用程序上下文中定义 @Beans，就像定义任何其他 Spring 管理对象一样。

在内部，Spring AI ChatModel 将创建一个 FunctionCallbackWrapper 包装器的实例，该包装器添加通过 AI 模型调用它的逻辑。@Bean 的名称作为 ChatOption 传递。

```java
@Configuration
static class Config {
	@Bean
	@Description("Get the weather in location") // function description
	public Function<MockWeatherService.Request, MockWeatherService.Response> weatherFunction1() {
		return new MockWeatherService();
	}
	...
}
```

@Description 注释是可选的，它提供了函数描述 (2)，可帮助模型了解何时调用该函数。这是一个重要的属性，可帮助 AI 模型确定要调用哪个客户端函数。

提供函数描述的另一种选择是使用 MockWeatherService.Request 上的 @JsonClassDescription 注释来提供函数描述：

```java
@Configuration
static class Config {
	@Bean
	public Function<Request, Response> currentWeather3() { // (1) bean name as function name.
		return new MockWeatherService();
	}
	...
}

@JsonClassDescription("Get the weather in location") // (2) function description
public record Request(String location, Unit unit) {}
```

最佳做法是使用信息注释请求对象，以便该函数生成的 JSON 模式尽可能具有描述性，以帮助 AI 模型选择要调用的正确函数。

如果已经有定义的@Service，那么可以通过以下方式来通过function call来调用已有的service的方法。
```java
// 1. 已存在的MockOrderService
@Service
public class MockOrderService {
    public Response getOrder(Request request) {
        String productName = "尤尼克斯羽毛球拍";
        return new Response(String.format("%s的订单编号为%s, 购买的商品为: %s", request.userId, request.orderId, productName));
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Request(
            //这里的JsonProperty将转换为function的parameters信息, 包括参数名称和参数描述等
            /*
             {
                "orderId": {
                    "type": "string",
                    "description": "订单编号, 比如1001***"
                    },
                "userId": {
                    "type": "string",
                    "description": "用户编号, 比如2001***"
                }
            }
            */
            @JsonProperty(required = true, value = "orderId") @JsonPropertyDescription("订单编号, 比如1001***") String orderId,
            @JsonProperty(required = true, value = "userId") @JsonPropertyDescription("用户编号, 比如2001***") String userId) {
    }

    public record Response(String description) {
    }
}

//2. 将MockOrderService的getOrder注册为function call的bean
@Configuration
public class FunctionCallConfiguration {
    @Bean
    @Description("根据用户编号和订单编号查询订单信息")  //function的描述
    public Function<MockOrderService.Request, MockOrderService.Response> getOrderFunction(MockOrderService mockOrderService) {
        return mockOrderService::getOrder;
    }
}

//3. 调用function call
DashScopeChatModel dashscopeChatModel = ...;
ChatClient chatClient = ChatClient.builder(dashscopeChatModel)
        .defaultFunctions("getOrderFunction")
        .build();

ChatResponse response = chatClient
        .prompt()
        .user("帮我一下订单, 用户编号为1001, 订单编号为2001")
        .call()
        .chatResponse();

String content = response.getResult().getOutput().getContent();
logger.info("content: {}", content);

```

> 还有一种函数注册方式是使用 `FunctionCallbackWrapper`，具体请查看示例仓库中的源码。

### 为 Prompt 指定函数
为了让模型知道并调用您的 CurrentWeather 函数，您需要在 Prompt 请求中启用它。

#### ChatClient

```java
	ChatResponse response = chatClient.prompt()
		.functions("CurrentWeather")
		.user("What's the weather like in San Francisco, Tokyo, and Paris?")
		.call()
		.chatResponse();
```

#### ChatModel

```java
OpenAiChatModel chatModel = ...

UserMessage userMessage = new UserMessage("What's the weather like in San Francisco, Tokyo, and Paris?");

ChatResponse response = chatModel.call(new Prompt(List.of(userMessage),
		OpenAiChatOptions.builder().withFunction("CurrentWeather").build())); // (1) Enable the function

logger.info("Response: {}", response);
```

上述用户问题将触发 3 次对 CurrentWeather 函数的调用（每个城市一次），最终的响应将是这样的：

```text
Here is the current weather for the requested cities:
- San Francisco, CA: 30.0°C
- Tokyo, Japan: 10.0°C
- Paris, France: 15.0°C
```

### 动态注册函数

除了自动配置之外，您还可以使用 Prompt 请求动态注册回调函数：

```java
OpenAiChatModel chatModel = ...

UserMessage userMessage = new UserMessage("What's the weather like in San Francisco, Tokyo, and Paris?");

var promptOptions = OpenAiChatOptions.builder()
	.withFunctionCallbacks(List.of(new FunctionCallbackWrapper<>(
		"CurrentWeather", // name
		"Get the weather in location", // function description
		new MockWeatherService()))) // function code
	.build();

ChatResponse response = chatModel.call(new Prompt(List.of(userMessage), promptOptions));
```

这种方法允许根据用户输入动态选择要调用的不同函数，无需预先声明函数为 bean 实例。
