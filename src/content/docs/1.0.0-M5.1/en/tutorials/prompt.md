---
title: 提示词 (Prompt)
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

Prompt 是引导 AI 模型生成特定输出的输入格式，Prompt 的设计和措辞会显著影响模型的响应。

Prompt 最开始只是简单的字符串，随着时间的推移，prompt 逐渐开始包含特定的占位符，例如 AI 模型可以识别的 “USER:”、“SYSTEM:” 等。阿里云通义模型可通过将多个消息字符串分类为不同的角色，然后再由 AI 模型处理，为 prompt 引入了更多结构。每条消息都分配有特定的角色，这些角色对消息进行分类，明确 AI 模型提示的每个部分的上下文和目的。这种结构化方法增强了与 AI 沟通的细微差别和有效性，因为 prompt 的每个部分在交互中都扮演着独特且明确的角色。

Prompt 中的主要角色（Role）包括：

* 系统角色（System Role）：指导 AI 的行为和响应方式，设置 AI 如何解释和回复输入的参数或规则。这类似于在发起对话之前向 AI 提供说明。
* 用户角色（User Role）：代表用户的输入 - 他们向 AI 提出的问题、命令或陈述。这个角色至关重要，因为它构成了 AI 响应的基础。
* 助手角色（Assistant Role）：AI 对用户输入的响应。这不仅仅是一个答案或反应，它对于保持对话的流畅性至关重要。通过跟踪 AI 之前的响应（其“助手角色”消息），系统可确保连贯且上下文相关的交互。助手消息也可能包含功能工具调用请求信息。它就像 AI 中的一个特殊功能，在需要执行特定功能（例如计算、获取数据或不仅仅是说话）时使用。
* 工具/功能角色（Tool/Function Role）：工具/功能角色专注于响应工具调用助手消息返回附加信息。


## API 概览
### Prompt
通常使用 ChatModel 的 call() 方法，该方法接受 Prompt 实例并返回 ChatResponse。

Prompt 类充当有组织的一系列 Message 对象和请求 ChatOptions 的容器。每条消息在提示中都体现了独特的角色，其内容和意图各不相同。这些角色可以包含各种元素，从用户查询到 AI 生成的响应再到相关背景信息。这种安排可以实现与 AI 模型的复杂而详细的交互，因为提示是由多条消息构成的，每条消息都被分配了在对话中扮演的特定角色。

下面是 Prompt 类的截断版本，为简洁起见省略了构造函数和实用方法：

```java
public class Prompt implements ModelRequest<List<Message>> {

    private final List<Message> messages;

    private ChatOptions chatOptions;
}
```

#### Message
Message 接口封装了一个提示文本、一组元数据属性以及一个称为 MessageType 的分类。

该接口定义如下：

```java
public interface Content {

	String getContent();

	Map<String, Object> getMetadata();
}

public interface Message extends Content {

	MessageType getMessageType();
}
```

Message 接口的各种实现对应 AI 模型可以处理的不同类别的消息。模型根据对话角色区分消息类别。

![message class diagram](https://img.alicdn.com/imgextra/i4/O1CN01LoRnWM1iHkvWVQTbd_!!6000000004388-0-tps-4379-3653.jpg)


#### Role

角色在 Spring AI 中表示为枚举，如下所示：

```java
public enum MessageType {
	USER("user"),
	ASSISTANT("assistant"),
	SYSTEM("system"),
	TOOL("tool");
}
```

### Prompt Template

Spring AI 中用于提示模板的关键组件是 PromptTemplate 类。该类使用 Terence Parr 开发的 OSS StringTemplate 引擎来构建和管理提示。PromptTemplate 类旨在促进结构化提示的创建，然后将其发送到 AI 模型进行处理

```java
public class PromptTemplate implements PromptTemplateActions, PromptTemplateMessageActions {
    // Other methods to be discussed later
}
```

该类实现的接口支持提示创建的不同方面：

PromptTemplateStringActions 专注于创建和呈现提示字符串，代表提示生成的最基本形式。

PromptTemplateMessageActions 专门用于通过生成和操作 Message 对象来创建提示。

PromptTemplateActions 旨在返回 Prompt 对象，该对象可以传递给 ChatModel 以生成响应。

虽然这些接口可能在许多项目中没有得到广泛使用，但它们展示了创建提示的不同方法。

实现的接口是

```java
public interface PromptTemplateStringActions {

	String render();

	String render(Map<String, Object> model);

}
```

方法 String render()：将提示模板渲染为最终字符串格式，无需外部输入，适用于没有占位符或动态内容的模板。

方法 String render(Map<String, Object> model)：增强渲染功能以包含动态内容。它使用 Map<String, Object>，其中映射键是提示模板中的占位符名称，值是要插入的动态内容。

```java
public interface PromptTemplateMessageActions {

	Message createMessage();

    Message createMessage(List<Media> mediaList);

	Message createMessage(Map<String, Object> model);

}
```

方法 Message createMessage()：创建一个不带附加数据的 Message 对象，用于静态或预定义消息内容。

方法 Message createMessage(List<Media> mediaList)：创建一个带有静态文本和媒体内容的 Message 对象。

方法 Message createMessage(Map<String, Object> model)：扩展消息创建以集成动态内容，接受 Map<String, Object>，其中每个条目代表消息模板中的占位符及其对应的动态值。

```java
public interface PromptTemplateActions extends PromptTemplateStringActions {

	Prompt create();

	Prompt create(ChatOptions modelOptions);

	Prompt create(Map<String, Object> model);

	Prompt create(Map<String, Object> model, ChatOptions modelOptions);

}
```

方法 Prompt create()：生成不带外部数据输入的 Prompt 对象，非常适合静态或预定义提示。

方法 Prompt create(ChatOptions modelOptions)：生成一个 Prompt 对象，无需外部数据输入，但具有聊天请求的特定选项。

方法 Prompt create(Map<String, Object> model)：扩展提示创建功能以包含动态内容，采用 Map<String, Object>，其中每个映射条目都是提示模板中的占位符及其关联的动态值。

方法 Prompt create(Map<String, Object> model, ChatOptions modelOptions)：扩展提示创建功能以包含动态内容，采用 Map<String, Object>，其中每个映射条目都是提示模板中的占位符及其关联的动态值，以及聊天请求的特定选项。

## 使用示例

完整示例源码请参见 [prompt-example](https://github.com/alibaba/spring-ai-alibaba/tree/main/spring-ai-alibaba-examples/prompt-example)。

```java
PromptTemplate promptTemplate = new PromptTemplate("Tell me a {adjective} joke about {topic}");

Prompt prompt = promptTemplate.create(Map.of("adjective", adjective, "topic", topic));

return chatModel.call(prompt).getResult();
```



```java
String userText = """
    Tell me about three famous pirates from the Golden Age of Piracy and why they did.
    Write at least a sentence for each pirate.
    """;

Message userMessage = new UserMessage(userText);

String systemText = """
  You are a helpful AI assistant that helps people find information.
  Your name is {name}
  You should reply to the user's request with your name and also in the style of a {voice}.
  """;

SystemPromptTemplate systemPromptTemplate = new SystemPromptTemplate(systemText);
Message systemMessage = systemPromptTemplate.createMessage(Map.of("name", name, "voice", voice));

Prompt prompt = new Prompt(List.of(userMessage, systemMessage));

List<Generation> response = chatModel.call(prompt).getResults();
```