---
title: Spring AI Alibaba 概述
keywords: [Spring Ai Alibaba,Spring AI,Tongyi Qwen]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---
## 什么是 Spring AI Alibaba？
Spring AI Alibaba 定位开源 AI Agent 开发框架，提供从 Agent 构建到 workflow 编排、RAG 检索、模型适配等能力，帮助开发者轻松构建生成式 AI 应用。

![spring ai alibaba architecture](/img/user/ai/overview/spring-ai-alibaba-arch.png)

### Low-level AI Framework

Spring AI Alibaba 基于 Spring AI 开源项目构建，作为 AI 应用程序的基础框架，定义了包括模型适配、聊天交互、提示词管理、工具调用等概念抽象与实现：

* 提供多种大模型服务对接能力，包括 OpenAI、Ollama、阿里云 Qwen 等
* 支持的模型类型包括聊天、文生图、音频转录、文生语音等
* 支持同步和流式 API，在保持应用层 API 不变的情况下支持灵活切换底层模型服务，支持特定模型的定制化能力（参数传递）
* 支持 Structured Output，即将 AI 模型输出映射到 POJOs
* 支持矢量数据库存储与检索
* 支持函数调用 Function Calling
* 支持构建 AI Agent 所需要的工具调用和对话内存记忆能力
* 支持 RAG 开发模式，包括离线文档处理如 DocumentReader、Splitter、Embedding、VectorStore 等，支持 Retrieve 检索

以上原子能力可让您实现 AI 应用的快速开发，例如 "通过文档进行问答" 或 "通过文档进行聊天" 等。

### Agentic Framework

在实际业务实践中，我们要构建的 AI 应用通常具有非常复杂的业务流程，我们既要利用模型推理能力赋予业务智能化，更要确保业务执行结果的可靠性。应对此类问题，业界有两种常用做法：
* 工作流（workflow），通过预先定义好的工作流来编排 LLM 和工具。
* 自动化代理（autonomous agent），LLM 动态分析与规划流程，决策何时使用工具，可在中间插入人类确认或介入环节。

Spring AI Alibaba Graph 是一个结合了 workflow 与 autonomous agent 的框架，它帮助开发者创建 agent 和 multi-agent 工作流。与其他 LLM 框架相比，它提供了以下核心能力：

* 工作流，使用 Spring AI Alibaba Graph 编排包含 LLM、工具等节点的工作流，让您对 agent 应用运行具有更多控制权。
* 多 agent 协作，您可以创建多个 agent，它们可以相互协作，以解决复杂的业务场景。
* 支持人为介入，通过在流程执行过程中设置中断，等待人类确认或修改状态值，来提高业务执行结果的可靠性。
* 支持并行分支、支持嵌套子 graph
* 与 Spring AI、Spring Boot 无缝集成

### Development Tools

Spring AI Alibaba 项目提供了 web ui 工具与项目初始化平台，可帮助开发者快速初始化项目、可视化的调试项目。

#### Spring AI Alibaba Studio

Spring AI Alibaba Studio 是一个包含 Web UI 的本地开发工具，当您在本地启动项目之后，就可以通过端口访问 UI 页面：`http://localhost:8080/studio`。

![studio ui page](/img/user/ai/overview/spring-ai-alibaba-arch.png)

在 studio 中，开发者可以调试模型交互效果、参数、工作流运行、知识库检索等，帮助开发者提升研发迭代效率。

为了开启本地 studio 工具，需要在项目中添加如下依赖与配置：

```xml

```

`application.properties` 配置：

```properties
spring.ai.studio.enabled=true
```

#### Project Initializer

除了直接写代码之外，Spring AI Alibaba 提供了项目初始化平台，可帮助开发者以可视化、低代码的方式快速创建基于 Spring AI Alibaba 框架的 Java 项目。

* 低代码模式可视化的绘制工作流，导出 Java 项目源码
* 可视化配置 Chatbot、Agent，导出 Java 项目源码

![动态 gif 图](/img/user/ai/overview/spring-ai-alibaba-arch.png)

## AI 原生架构生态

Spring AI Alibaba 开源项目是阿里云通义系列模型及服务在 Java AI 应用开发领域的最佳实践，提供高层次的 AI API 抽象与云原生基础设施集成方案，帮助开发者快速构建 AI 应用。

<a target="_blank" href="https://img.alicdn.com/imgextra/i1/O1CN01uhDvMY22HZ4q1OZMM_!!6000000007095-2-tps-5440-2928.png"><image src="https://img.alicdn.com/imgextra/i1/O1CN01uhDvMY22HZ4q1OZMM_!!6000000007095-2-tps-5440-2928.png" /></a>


