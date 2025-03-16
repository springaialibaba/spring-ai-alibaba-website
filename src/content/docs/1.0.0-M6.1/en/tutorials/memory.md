---
title: 对话记忆
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

## 对话记忆介绍

"大模型的对话记忆"这一概念，根植于人工智能与自然语言处理领域，特别是针对具有深度学习能力的大型语言模型而言，它指的是模型在与用户进行交互式对话过程中，能够追踪、理解并利用先前对话上下文的能力。
此机制使得大模型不仅能够响应即时的输入请求，还能基于之前的交流内容能够在对话中记住先前的对话内容，并根据这些信息进行后续的响应。这种记忆机制使得模型能够在对话中持续跟踪和理解用户的意图和上下文，从而实现更自然和连贯的对话。

我们在调用大模型的过程中，如果自己维护多轮的对话记忆，通常情况下调用代码如下

```java
import java.util.ArrayList;

List<Message> messages = new ArrayList<>();

//第一轮对话
messages.add(new SystemMessage("你是一个旅游规划师"));
messages.add(new UserMessage("我想去新疆"));
ChatResponse response = chatModel.call(new Prompt(messages));
String content = response.getResult().getOutput().getContent();
        
messages.add(new AssistantMessage(content));

        //第二轮对话
messages.add(new UserMessage("能帮我推荐一些旅游景点吗?"));
response = chatModel.call(new Prompt(messages));
content = response.getResult().getOutput().getContent();

messages.add(new AssistantMessage(content));

        //第三轮对话
messages.add(new UserMessage("那里这两天的天气如何?"));
response = chatModel.call(new Prompt(messages));
content = response.getResult().getOutput().getContent();

System.out.printf("content: %s\n", content);

```

## 基于memory的对话记忆

spring-ai-alibaba支持基于chat memory的对话记忆，也就是不需要调用显示的记录每一轮的对话历史。下边是一个基于内存存储的对话记忆实现:

```java
        //初始化基于内存的对话记忆
        ChatMemory chatMemory = new InMemoryChatMemory();

        DashScopeChatModel chatModel = ...;
        ChatClient chatClient = ChatClient.builder(dashscopeChatModel)
        .defaultAdvisors(new MessageChatMemoryAdvisor(chatMemory))
        .build();

        //对话记忆的唯一标识
        String conversantId = UUID.randomUUID().toString();

        ChatResponse response = chatClient
                .prompt()
                .user("我想去新疆")
                .advisors(spec -> spec.param(CHAT_MEMORY_CONVERSATION_ID_KEY, conversantId)
                        .param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 10))
                .call()
                .chatResponse();
        String content = response.getResult().getOutput().getContent();
        Assertions.assertNotNull(content);

        logger.info("content: {}", content);

        response = chatClient
                .prompt()
                .user("可以帮我推荐一些美食吗")
                .advisors(spec -> spec.param(CHAT_MEMORY_CONVERSATION_ID_KEY, conversantId)
                        .param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 10))
                .call()
                .chatResponse();
        content = response.getResult().getOutput().getContent();
        Assertions.assertNotNull(content);

        logger.info("content: {}", content);

```

当然，开发者也可以自行实现ChatMemory基于类似于文件、Redis等方式进行上下文内容的存储和记录。