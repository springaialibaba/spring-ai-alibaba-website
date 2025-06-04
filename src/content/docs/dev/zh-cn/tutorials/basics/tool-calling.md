---
title: 工具调用（Tool Calling）
keywords: [Spring AI,Tool Calling]
description: "Spring AI 接入工具。"
---

## 概述

“工具调用（Tool Calling）”或“函数调用”允许大型语言模型（LLM）在必要时调用一个或多个可用的工具，这些工具通常由开发者定义。工具可以是任何东西：网页搜索、对外部 API 的调用，或特定代码的执行等。LLM 本身不能实际调用工具；相反，它们会在响应中表达调用特定工具的意图（而不是以纯文本回应）。然后，我们应用程序应该执行这个工具，并报告工具执行的结果给模型。

例如，我们知道 LLM 自身在数学方面不是特别擅长。如果你的用例偶尔涉及数学计算，你可能会想提供给 LLM 一个“数学工具”。通过在请求中声明一个或多个工具，LLM 可以在认为合适时调用其中之一。给定一个数学问题和一组数学工具，LLM 可能会决定为正确回答问题，它应该首先调用其中一个提供的数学工具。

接下来，让我们用一个示例看一下 Tool Calling 的具体工作过程。

以下是没有 Tool Calling 的一个消息交互过程示例，模型给给出的结果非常接近但是并不正确：

```text
Request:
- messages:
    - UserMessage:
        - text: What is the square root of 475695037565?

Response:
- AiMessage:
    - text: The square root of 475695037565 is approximately 689710.
```

以下是包含了 Tool Calling 的消息交互过程：

```text
Request 1:
- messages:
    - UserMessage:
        - text: What is the square root of 475695037565?
- tools:
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
@Description("Returns a square root of a given number")   // Tool Description
public Function<Double, Double> squareRoot() {
    return Math::sqrt;
}
```

当 LLM 可以访问工具时，它可以在合适的情况下决定调用其中一个工具，这是一个非常强大的功能。在这个简单的示例中，我们给 LLM 提供了基本的数学工具，但想象一下，如果我们给它提供了，比如说，搜索工具和发送邮件工具，并且有一个查询像是“我的朋友想了解 AI 领域的最新新闻。将简短的总结发送到 friend@email.com”，那么它可以使用搜索工具查找最新新闻，然后总结这些信息并通过发送邮件工具将总结发送到指定的邮箱。

## 工具调用定义

Spring AI 支持两种工具调用的定义：`方法工具` 和 `函数工具`。接下来将以“获取当前时间工具”为例，简单介绍这两种工具定义方法。

其他更丰富的例子可以查看 [Spring AI Alibaba Tool Calling Examples](https://github.com/springaialibaba/spring-ai-alibaba-examples/tree/main/spring-ai-alibaba-tool-calling-example)。

### 方法工具

Spring AI 可以定义类的某个方法为工具，在方法上标记 `@Tool` 注解，在参数上标记 `@ToolParam` 注解。例如：

```java
public class TimeTools {

    @Tool(description = "Get time by zone id")
    public String getTimeByZoneId(@ToolParam(description = "Time zone id, such as Asia/Shanghai")
                                      String zoneId) {
        ZoneId zid = ZoneId.of(zoneId);
        ZonedDateTime zonedDateTime = ZonedDateTime.now(zid);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");
        return zonedDateTime.format(formatter);
    }
}
```

在调用 ChatClient 时，通过 `.tools()` 方法传递工具对象，或者在实例化 ChatClient 对象的时候通过 `.defalutTools()` 方法传递工具对象：

```java
String response = chatClient.prompt("获取北京时间")
    .tools(new TimeTools())
    .call()
    .content();
```

如果要使用之前编写好的类的方法，不想修改源代码，可以使用 `MethodToolCallBack` 定义方法工具。

比如，现在有这样的一个类：

```java
public class TimeTools {

    public String getTimeByZoneId(String zoneId) {
        ZoneId zid = ZoneId.of(zoneId);
        ZonedDateTime zonedDateTime = ZonedDateTime.now(zid);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");
        return zonedDateTime.format(formatter);
    }
}
```

通过 `MethodToolCallBack.builder()` 定义方法工具：

```java
String inputSchema = """
    {
      "$schema" : "https://json-schema.org/draft/2020-12/schema",
      "type" : "object",
      "properties" : {
        "zoneId" : {
          "type" : "string",
          "description" : "Time zone id, such as Asia/Shanghai"
        }
      },
      "required" : [ "zoneId" ],
      "additionalProperties" : false
    }
    """;
Method method = ReflectionUtils.findMethod(TimeTools.class, "getTimeByZoneId", String.class);
if (method == null) {
    throw new RuntimeException("Method not found");
}
MethodToolCallback toolCallback = MethodToolCallback.builder()
    .toolDefinition(ToolDefinition.builder()
        .description("Get time by zone id")
        .name("getTimeByZoneId")
        .inputSchema(inputSchema)
        .build())
    .toolMethod(method)
    .toolObject(new TimeTools())
    .build();
```

可以使用 `JsonSchemaGenerator.generateForMethodInput(method)` 方法获取 Input Schema。但如果原方法的参数没有 `@ToolParam` 或者 `@JsonPropertyDescription` 注解，则会缺失参数的 `description` 字段，因此建议可以用该方法生成一个模板，然后填充参数的 `description` 字段。

在调用 ChatClient 时，通过`.toolCallbacks()` 传递 `MethodToolCallBack` 对象，或者在实例化 ChatClient 对象的时候通过 `.defalutToolCallBacks()` 方法传递工具对象：

```java
String response = chatClient.prompt("获取北京时间")
    .toolCallbacks(toolCallback)
    .call()
    .content();
```

当前方法工具不支持以下类型的参数和返回类型：
- `Optional`
- 异步类型（`CompletableFuture`、`Future`）
- 响应式类型（`Flow`、`Mono`、`Flux`）
- 函数类型（`Function`、`Supplier`、`Consumer`）

### 函数工具

开发者可以把任意实现 `Function` 接口的对象，定义为 `Bean` ，并通过 `.toolNames()` 或 `.defaultToolNames()` 传递给 ChatClient 对象。

例如有这么一个实现了`Function` 接口的类：

```java
public class TimeFunction implements
        Function<TimeFunction.Request, TimeFunction.Response> {

    @JsonClassDescription("Request to get time by zone id")
    public record Request(@JsonProperty(required = true, value = "zoneId")
                              @JsonPropertyDescription("Time zone id, such as Asia/Shanghai") String zoneId) {
    }

    @JsonClassDescription("Response to get time by zone id")
    public record Response(@JsonPropertyDescription("time") String time) {
    }

    @Override
    public Response apply(Request request) {
        ZoneId zid = ZoneId.of(request.zoneId());
        ZonedDateTime zonedDateTime = ZonedDateTime.now(zid);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");
        return new Response(zonedDateTime.format(formatter));
    }
}
```

将该类的对象定义为 Bean：

```java
@Configuration
public class TestAutoConfiguration {

    @Bean
    @Description("Get time by zone id")
    public TimeFunction getTimeByZoneId() {
        return new TimeFunction();
    }
}
```

在调用 ChatClient 时，通过`.toolNames()` 传递函数工具的 Bean 名称，或者在实例化 ChatClient 对象的时候通过 `.defalutToolNames()` 方法传递函数工具：

```java
String response = chatClient.prompt("获取北京时间")
    .toolNames("getTimeByZoneId")
    .call()
    .content();
```

开发者也可以不用定义 Bean，直接定义 `FunctionToolCallBack` 对象，在调用 ChatClient 时通过 `.toolCallBacks()` 或者在实例化 ChatClient 对象的时候通过 `.defalutToolCallBacks()` 传递 `FunctionToolCallBack` 对象：

```java
String response = chatClient.prompt("获取北京时间")
    .toolCallbacks(FunctionToolCallback
        .builder("getTimeByZoneId", new TimeFunction())
        .description("Get time by zone id")
        .inputType(TimeFunction.Request.class)
        .build())
    .call()
    .content();
```

当前函数工具不支持以下类型的参数和返回类型：
- 基本类型
- `Optional`
- 集合类型（`List`、`Map`、`Array`、`Set`）
- 异步类型（`CompletableFuture`、`Future`）
- 响应式类型（`Flow`、`Mono`、`Flux`）

