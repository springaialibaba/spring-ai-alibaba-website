---
title: AI 概述
keywords: [Spring Cloud Alibaba,Spring AI,Tongyi Qianwen]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

Spring Cloud Alibaba AI 项目（以下简称 SCA AI）基于 Spring AI 构建，是阿里云通义大模型在 Java AI 应用开发领域的最佳实践，同时提供了更多高层次的 AI API 抽象，帮助开发者快速构建 AI 应用。



Spring AI 项目的目标是简化包含人工智能（AI）功能的应用程序的开发，避免不必要的复杂性。该项目从著名的 Python 项目（例如 LangChain 和 LlamaIndex）中汲取灵感，但 Spring AI 并非这些项目的直接移植。该项目的成立基于这样的信念：下一波生成式 AI 应用将不仅面向 Python 开发人员，还将遍及多种编程语言。

从本质上讲，Spring AI 解决了 AI 集成的基本挑战：Connecting your enterprise Data and APIs with the AI Models。

![spring-ai-intro](/img/user/ai/overview/intro.png)

Spring Cloud Alibaba AI 提供了以下抽象概念，作为开发 AI 应用程序的基础。这些抽象概念具有多种实现，只需进行少量代码更改即可轻松更换组件。
* 提供多种大模型服务对接能力，包括主流开源与阿里云通义大模型服务（百炼）等
* 支持的模型类型包括：聊天、文生图、音频转录、文生语音等
* 支持同步和流式 API，在保持应用层 API 不变的情况下支持灵活切换底层模型服务，支持特定模型的定制化能力（参数传递）
* 支持 Structured Output，即将 AI 模型输出映射到 POJOs
* 支持矢量数据库存储与检索
* 支持函数调用 Function Calling
* 支持构建 AI Agent 所需要的工具调用和对话内存记忆能力
* 支持 RAG 开发模式，包括离线文档处理如 DocumentReader、Splitter、Embedding、VectorStore 等，支持 Retrieve 检索

以上抽象功能集可让您实现常见 AI 应用的快速开发，例如 "通过文档进行问答" 或 "通过文档进行聊天"。


