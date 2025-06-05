---
title: 多模态
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

## 多模态

人类能够同时处理多种数据输入模式的知识。我们的学习方式和经验都是多模态的。我们拥有的不仅仅是视觉、听觉和文本。

与这些原则相反，机器学习通常专注于为处理单一模态而定制的专用模型。例如，我们开发了用于文本转语音或语音转文本等任务的音频模型，以及用于对象检测和分类等任务的计算机视觉模型。

然而，新一波多模态大型语言模型开始涌现。例如，OpenAI 的 GPT-4o、谷歌的 Vertex AI Gemini 1.5、Anthropic 的 Claude3，以及开源产品 Llama3.2、LLaVA 和 BakLLaVA，它们能够接受多种输入，包括文本、图像、音频和视频，并通过集成这些输入来生成文本响应。

### Spring AI 多模态

多模态性是指模型同时理解和处理来自各种来源的信息的能力，包括文本、图像、音频和其他数据格式。

Spring AI Message API 提供了支持多模式 LLM 所需的所有抽象。
![message-api](/img/user/ai/tutorials/multimodality/message-api.jpg)

`UserMessage` 的 `content` 字段主要用于文本输入，而可选的 `media` 字段允许添加一个或多个不同模态的附加内容，例如图像、音频和视频。`MimeType` 指定模态类型。根据所使用的 `LLM`，`Media` 数据字段可以是作为资源对象的原始媒体内容，也可以是指向该内容的 `URI`。

>media 字段目前仅适用于用户输入消息（例如 `UserMessage`）。它对系统消息无效。包含 LLM 响应的 `AssistantMessage` 仅提供文本内容。要生成非文本媒体输出，您应该使用专用的单模态模型。

例如，我们可以将下图（`multimodal.test.png`）作为输入，并要求 LLM 解释它所看到的内容。

![multimodal.test](/img/user/ai/tutorials/multimodality/multimodal.test.png)

对于大多数多模式 LLM，Spring AI 代码看起来像这样：

```java
var imageResource = new ClassPathResource("/multimodal.test.png");

var userMessage = new UserMessage(
	"Explain what do you see in this picture?", 
	new Media(MimeTypeUtils.IMAGE_PNG, this.imageResource)); 

ChatResponse response = chatModel.call(new Prompt(this.userMessage));
```

或者使用流畅的ChatClient API：

```java
String response = ChatClient.create(chatModel).prompt()
		.user(u -> u.text("Explain what do you see on this picture?")
				    .media(MimeTypeUtils.IMAGE_PNG, new ClassPathResource("/multimodal.test.png")))
		.call()
		.content();
```
并产生如下响应：

> 这幅图是一个设计简约的水果碗。碗由金属制成，边缘由弯曲的金属丝构成，形成一个开放式结构，使水果从各个角度都能清晰可见。碗内，两根黄色的香蕉放在一个看起来像红色苹果的东西上面。香蕉皮上的棕色斑点表明它们略微熟透了。碗的顶部有一个金属环，可能是用作提手的。碗被放置在一个平面上，背景为中性色，可以清晰地看到里面的水果。
