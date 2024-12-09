---
title: 格式化输出(Structured Output)
keywords: [Chat Model, 聊天, 对话]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

如果您想从 LLM 接收结构化输出，Structured Output 可以协助将 `ChatModel/ChatClient` 方法的返回类型从 String 更改为其他类型。

LLM 生成结构化输出的能力对于依赖可靠解析输出值的下游应用程序非常重要。开发人员希望快速将 AI 模型的结果转换为可以传递给其他应用程序函数和方法的数据类型，例如 JSON、XML 或 Java 类。Spring AI 结构化输出转换器有助于将 LLM 输出转换为结构化格式。

![structured output flow](https://img.alicdn.com/imgextra/i2/O1CN01JozLPb1zIX4DMaXTO_!!6000000006691-0-tps-2809-1423.jpg)

在 LLM 调用之前，转换器会将期望的输出格式（output format instruction）附加到 prompt 中，为模型提供生成所需输出结构的明确指导，这些指令充当蓝图，塑造模型的响应以符合指定的格式。以下是此类格式说明的示例：

```text
Your response should be in JSON format.
The data structure for the JSON should match this Java class: java.util.HashMap
Do not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.
```

在 LLM 调用之后，转换器获取模型的输出文本并将其转换为结构化类型的实例，此转换过程涉及解析原始文本输出并将其映射到相应的结构化数据表示，例如 JSON、XML 或特定于域的数据结构。

## API 概述

当前 Spring AI 提供的 Converter 实现有 `AbstractConversionServiceOutputConverter`, `AbstractMessageOutputConverter`, `BeanOutputConverter`, `MapOutputConverter` and `ListOutputConverter`。

![structured output class hierarchy](https://img.alicdn.com/imgextra/i2/O1CN01JTh3dN1iXmmroxnYo_!!6000000004423-0-tps-2864-1396.jpg)

* BeanOutputConverter<T> - 使用指定的 Java 类（例如 Bean）或 ParameterizedTypeReference 配置，此转换器指示 AI 模型生成符合 DRAFT_2020_12 的 JSON 响应，JSON 模式派生自指定的 Java 类，随后，它利用 ObjectMapper 将 JSON 输出反序列化为目标类的 Java 对象实例。
* MapOutputConverter - 该实现指导 AI 模型生成符合 RFC8259 的 JSON 响应，此外，它还包含一个转换器实现，该实现利用提供的 MessageConverter 将 JSON 负载转换为 java.util.Map<String, Object> 实例。
* ListOutputConverter - 该实现指导 AI 模型生成逗号分隔的格式化输出，最终转换器将模型文本输出转换为 java.util.List。

## 使用示例

格式化输出工具的使用非常简单，以下是 `ChatClient` 和 `ChatModel` 两种使用示例。完整是示例源码请参见 [structured-output-example](https://github.com/alibaba/spring-ai-alibaba/tree/main/spring-ai-alibaba-examples/structured-output-example)

假设我们期望将模型输出转换为以下结构体：
```java
record ActorsFilms(String actor, List<String> movies) {
}
```

### ChatClient
将模型响应转换为 ActorsFilms 对象实例：

```java
ActorsFilms actorsFilms = ChatClient.create(chatModel).prompt()
        .user(u -> u.text("Generate the filmography of 5 movies for {actor}.")
                    .param("actor", "Tom Hanks"))
        .call()
        .entity(ActorsFilms.class);
```

或者，将模型响应转换为 List<ActorsFilms> 对象实例：

```java
List<ActorsFilms> actorsFilms = ChatClient.create(chatModel).prompt()
        .user("Generate the filmography of 5 movies for Tom Hanks and Bill Murray.")
        .call()
        .entity(new ParameterizedTypeReference<List<ActorsFilms>>() {});
```

将模型响应转换为 Map<String, Object>：

```java
Map<String, Object> result = ChatClient.create(chatModel).prompt()
        .user(u -> u.text("Provide me a List of {subject}")
                    .param("subject", "an array of numbers from 1 to 9 under their key name 'numbers'"))
        .call()
        .entity(new ParameterizedTypeReference<Map<String, Object>>() {});
```

使用 `ListOutputConverter` 将模型响应转换为 List<String>：

```java
List<String> flavors = ChatClient.create(chatModel).prompt()
                .user(u -> u.text("List five {subject}")
                            .param("subject", "ice cream flavors"))
                .call()
                .entity(new ListOutputConverter(new DefaultConversionService()));
```

### ChatModel

如果您使用的更底层的原子 API，则使用如下方式进行格式化输出转换：

```java
BeanOutputConverter<ActorsFilms> beanOutputConverter =
    new BeanOutputConverter<>(ActorsFilms.class);

String format = beanOutputConverter.getFormat();

String actor = "Tom Hanks";

String template = """
        Generate the filmography of 5 movies for {actor}.
        {format}
        """;

Generation generation = chatModel.call(
    new PromptTemplate(template, Map.of("actor", actor, "format", format)).create()).getResult();

ActorsFilms actorsFilms = beanOutputConverter.convert(generation.getOutput().getContent());
```
