---
title: 工具调用（Tool Calling）
keywords: [Spring AI,Tool Calling]
description: "Spring AI 接入工具。"
---

## 概述

“工具调用（Tool Calling）”或“函数调用”允许大型语言模型（LLM）在必要时调用一个或多个可用的工具，这些工具通常由开发者定义。工具可以是任何东西：网页搜索、对外部 API 的调用，或特定代码的执行等。LLM 本身不能实际调用工具；相反，它们会在响应中表达调用特定工具的意图（而不是以纯文本回应）。然后，应用程序应该执行这个工具，并报告工具执行的结果给模型。当 LLM 可以访问工具时，它可以在合适的情况下决定调用其中一个工具，这是一个非常强大的功能。

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

<span id="time-function"></span>

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

## 返回值转换

Spring AI 框架中，工具调用的结果会通过 `ToolCallResultConverter` 进行处理，然后回传给 AI 模型。`ToolCallResultConverter` 接口提供了将工具调用结果转换为字符串对象的方法。Spring AI 默认使用 `DefaultToolCallResultConverter`，将返回结果对象使用 Jackson 库转化为 JSON 字符串。`ToolCallResultConverter` 接口的定义为：

```java
@FunctionalInterface
public interface ToolCallResultConverter {
	/**
	 * Given an Object returned by a tool, convert it to a String compatible with the
	 * given class type.
	 */
	String convert(@Nullable Object result, @Nullable Type returnType);
}
```

定义方法工具时，可以通过 `@Tool` 注解的 `resultConverter` 参数提供 `ToolCallResultConverter` 的实现类；定义方法工具和函数工具时可以通过 `MethodToolCallBack.Builder` 和 `FunctionToolCallBack.Builder` 的 `resultConverter()` 方法设置`ToolCallResultConverter` 的实现类。

## 工具上下文

Spring AI 支持通过 `ToolContext API` 向工具传递额外的上下文信息。该特性允许提供补充数据，比如用户身份信息。这些数据将与 AI 模型传递的工具参数结合使用。

例如：

```java
public class UserInfoTools {
    @Tool(description = "get current user name")
    public String getUserName(ToolContext context) {
        String userId = context.getContext().get("userId").toString();
        if (!StringUtils.hasText(userId)) {
            return "null";
        }
        // 模拟数据
        return userId + "user";
    }
}
```

在调用 ChatClient 时，通过 `.toolContext()` 方法传递工具上下文：

```java
String response = chatClient.prompt("获取我的用户名")
    .tools(new UserInfoTools())
    .toolContext(Map.of("userId", "12345"))
    .call()
    .content();
```

## 工具调用直接返回

默认情况下，工具调用的返回值会再次回传到 AI 模型进一步处理。但在一些场景中需要将结果直接返回给调用方而非模型，比如数据搜索。

定义方法工具时，可以通过 `@Tool` 注解的 `returnDirect` 参数置 `true` 来启动直接返回；定义方法工具和函数工具时需要通过 `ToolMetadata` 对象传递到 `MethodToolCallBack.Builder` 和 `FunctionToolCallBack.Builder`中。

以工具调用定义中的 [TimeFunction](#time-function) 为例，演示代码：

```java
String response = chatClient.prompt("获取北京时间")
    .toolCallbacks(FunctionToolCallback
        .builder("getTimeByZoneId", new TimeFunction())
        .toolMetadata(ToolMetadata.builder()
            .returnDirect(true)
            .build())
        .description("Get time by zone id")
        .inputType(TimeFunction.Request.class)
        .build())
    .call()
    .content();
```

调用这段代码将直接返回 TimeFunction 返回的JSON对象，而不再经过大模型加工处理。
