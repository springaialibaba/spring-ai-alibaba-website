---
title: Tool Calling
keywords: [Spring AI,Tool Calling]
description: "Spring AI Tool Calling"
---

## Overview

`Tool Calling` allows large language models (LLMs) to invoke one or more available tools when necessary, which are typically defined by developers. Tools can be anything: web searches, calls to external APIs, or execution of specific code, etc. The LLM itself cannot actually call tools; instead, it expresses the intent to call a specific tool in its response (rather than providing a plain-text reply). The application should then execute the tool and report the tool's execution result back to the model. When an LLM has access to tools, it can decide to call one of them when appropriate—this is an extremely powerful capability.

## Tools Definition

Spring AI supports two approaches for defining tool calls: `Method as Tools` and `Function as Tools`. The following demonstrates both approaches using a "Get Current Time Tool" example.

For more comprehensive examples, refer to [Spring AI Alibaba Tool Calling Examples](https://github.com/springaialibaba/spring-ai-alibaba-examples/tree/main/spring-ai-alibaba-tool-calling-example).

### Method as Tools

Spring AI allows defining a class method as a tool by annotating the method with `@Tool` and its parameters with `@ToolParam`. For example:

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

When calling ChatClient, pass tool objects either via the `.tools()` method during invocation or through the `.defaultTools()` method during ChatClient instantiation:

```java
String response = chatClient.prompt("Obtain Beijing time")
    .tools(new TimeTools())
    .call()
    .content();
```

To use existing class methods without modifying source code, you can define method tools using `MethodToolCallBack`.

For example, consider the following class:

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

Define method tools using `MethodToolCallBack.Builder`:

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

The `JsonSchemaGenerator.generateForMethodInput(method)` method can be used to obtain the Input Schema. However, if the original method parameters lack `@ToolParam` or `@JsonPropertyDescription` annotations, the generated schema will miss parameter description fields. It is therefore recommended to use this method to generate a template and then manually populate the parameter descriptions.

When invoking ChatClient, pass `MethodToolCallBack` objects either via `.toolCallbacks()` during API calls or through `.defaultToolCallBacks()` during ChatClient instantiation:

```java
String response = chatClient.prompt("Obtain Beijing time")
    .toolCallbacks(toolCallback)
    .call()
    .content();
```

The following types are not currently supported as parameters or return types for methods used as tools:
- `Optional`
- Asynchronous types (`CompletableFuture`, `Future`)
- Reactive types (`Flow`, `Mono`, `Flux`)
- Functional types (`Function`, `Supplier`, `Consumer`)

### Function as Tools

Developers can define any Function-implementing object as a Bean and pass it to the ChatClient via `.toolNames()` or `.defaultToolNames()`.

<span id="time-function"></span>

For example, consider this class implementing the `Function` interface:

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

Define an instance of this class as a Spring Bean:

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

When invoking ChatClient, pass the names of function tool beans either via `.toolNames()` during API calls or through `.defaultToolNames()` during ChatClient instantiation:

```java
String response = chatClient.prompt("Obtain Beijing time")
    .toolNames("getTimeByZoneId")
    .call()
    .content();
```

Developers can also bypass Bean definition by directly creating `FunctionToolCallBack` objects, passing them to ChatClient either via `.toolCallBacks()` during invocation or through `.defaultToolCallBacks()` during instantiation:

```java
String response = chatClient.prompt("Obtain Beijing time")
    .toolCallbacks(FunctionToolCallback
        .builder("getTimeByZoneId", new TimeFunction())
        .description("Get time by zone id")
        .inputType(TimeFunction.Request.class)
        .build())
    .call()
    .content();
```

The following types are not currently supported as input or output types for functions used as tools:
- Primitive types
- `Optional`
- Collection types (`List`, `Map`, `Array`, `Set`)
- Asynchronous types (`CompletableFuture`, `Future`)
- Reactive types (`Flow`, `Mono`, `Flux`)

## Result Conversion

In the Spring AI framework, tool call results are processed through a `ToolCallResultConverter` before being returned to the AI model. The `ToolCallResultConverter` interface provides methods for converting tool execution results into string representations. Spring AI defaults to using `DefaultToolCallResultConverter`, which leverages the `Jackson` library to serialize result objects into JSON strings. The interface is defined as follows:

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

When defining method tools, you can specify a `ToolCallResultConverter` implementation via the `resultConverter` parameter of the `@Tool` annotation. For both method tools and function tools, implementations may also be configured through the `resultConverter()` method of `MethodToolCallBack.Builder` and `FunctionToolCallBack.Builder` respectively.

## Tool Context

Spring AI supports passing additional contextual information to tools via the `ToolContext` API. This feature enables supplying supplemental data such as user identity, which will be combined with the tool parameters provided by the AI model.

For example:

```java
public class UserInfoTools {
    @Tool(description = "get current user name")
    public String getUserName(ToolContext context) {
        String userId = context.getContext().get("userId").toString();
        if (!StringUtils.hasText(userId)) {
            return "null";
        }
        // Simulated data
        return userId + "user";
    }
}
```

When invoking ChatClient, pass the tool context via the `.toolContext()` method:

```java
String response = chatClient.prompt("Get my username")
    .tools(new UserInfoTools())
    .toolContext(Map.of("userId", "12345"))
    .call()
    .content();
```

## Tool Calling Return Direct

By default, tool call return values are sent back to the AI model for further processing. However, certain scenarios like data search operations may require direct results to be returned to the caller instead of the model.

To enable direct result return when defining method tools, set the `returnDirect` parameter to true in the `@Tool` annotation. For both method tools and function tools, this configuration can alternatively be passed via a `ToolMetadata` object to their respective builders: `MethodToolCallBack.Builder` and `FunctionToolCallBack.Builder`.

Taking the [TimeFunction](#time-function) from the tool definition as an example, here's a demonstration of the code:

```java
String response = chatClient.prompt("Obtain Beijing time")
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

Invoking this code will directly return the JSON object from TimeFunction, bypassing further processing by the large language model.
