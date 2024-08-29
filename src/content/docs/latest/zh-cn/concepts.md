---
title: 核心概念
keywords: [Spring Cloud Alibaba核心概念, ]
description: "Spring Cloud Alibaba核心概念"
---

# 核心概念

本节介绍 Spring Cloud Alibaba AI 框架使用的核心概念。我们建议仔细阅读，以了解框架实现背后的思想。

## 交互模型（ChatModel）

AI 模型是用于处理和生成信息的算法，通常模仿人类的认知功能。通过从大型数据集中学习模式和见解，这些模型可以做出预测、文本、图像或其他输出，从而增强各行各业的各种应用。

人工智能模型有很多种，每种模型都适用于特定的用例。虽然 ChatGPT 及其生成式人工智能功能通过文本输入和输出吸引了用户，但许多模型和公司都提供多样化的输入和输出。在 ChatGPT 之前，许多人对文本到图像的生成模型着迷，例如 Midjourney 和 Stable Diffusion。

下表根据输入（Input）和输出（Output）类型对几种模型进行了分类：

![spring-ai-concepts-model-types](/img/user/ai/overview/spring-ai-concepts-model-types.png)

Sprig Cloud Alibaba AI 目前支持以语言、图像和音频形式处理输入和输出的模型。上表中的最后一行接受文本作为输入并输出数字，通常称为嵌入文本，表示 AI 模型中使用的内部数据结构。Sprig Cloud Alibaba AI 支持嵌入以支持更高级的用例。

GPT 等模型的独特之处在于其预训练特性，正如 GPT 中的“P”所示——Chat Generative Pre-trained Transformer。这种预训练功能将 AI 转变为通用的开发工具，不需要广泛的机器学习或模型训练背景。

## 提示（Prompt）

提示是基于语言的输入的基础，可指导 AI 模型产生特定输出。对于熟悉 ChatGPT 的人来说，提示可能看起来只是输入到对话框中并发送到 API 的文本。然而，它包含的内容远不止这些。在许多 AI 模型中，提示的文本不仅仅是一个简单的字符串。

ChatGPT 的 API 在一个提示中有多个文本输入，每个文本输入都被分配一个角色。例如，系统角色会告诉模型如何表现并设置交互的上下文。还有用户角色，通常是来自用户的输入。

制作有效的提示既是一门艺术，也是一门科学。ChatGPT 是为人类对话而设计的。这与使用 SQL 之类的东西“‘提出问题’”有很大不同。人们必须像与另一个人交谈一样与人工智能模型进行交流。

这种互动方式如此重要，以至于“提示工程”一词已经发展成为一门学科。有越来越多的技术可以提高提示的有效性。花时间制作提示可以大大改善最终的输出。

分享提示词已成为一种公共实践，学术界也正在积极研究这一主题。作为创建有效提示（例如，与 SQL 形成对比）是多么违反直觉的一个例子，[最近的一篇研究论文](https://arxiv.org/abs/2205.11916)发现，您可以使用的最有效的提示之一以“深呼吸，一步一步地进行操作”这句话开头。这应该能让您明白为什么语言如此重要。我们尚未完全了解如何最有效地利用该技术的先前版本，例如 ChatGPT 3.5，更不用说正在开发的新版本了。

### 提示词模板（Prompt Template）

创建有效的提示包括建立请求的上下文并用特定于用户输入的值替换请求的各部分。

此过程使用传统的基于文本的模板引擎来快速创建和管理，Spring Cloud Alibaba AI 依赖 OSS 库 [StringTemplate](https://www.stringtemplate.org/) 进行处理。

例如，考虑简单的提示模板：

```text
Tell me a {adjective} joke about {content}.
```

在 Spring Cloud Alibaba AI 中，提示模板可以比作 Spring MVC 架构中的“视图”。`java.util.Map`提供一个模型对象（通常是使用 Map），用于填充模板中的占位符。最后，框架会使用 Map 中的字符串渲染模版并替换占位符，最终作为输入传入模型。

提示词 Prompt 的具体数据格式存在相当大的差异，最初只是简单的字符串，后来演变为包含多条消息，其中每条消息中的每个字符串代表模型的不同角色。

## 嵌入（Embedding）

嵌入是文本、图像或视频的数字表示，用于捕捉输入之间的关系。

嵌入的工作原理是将文本、图像和视频转换为浮点数数组（称为向量 Vector）。这些向量旨在捕捉文本、图像和视频的含义，嵌入数组的长度称为向量的维数。

通过计算两段文本的向量表示之间的数值距离，应用程序可以确定原始数据对象之间的相似性。

![spring-ai-embeddings](/img/user/ai/overview/spring-ai-embeddings.png)

作为探索 AI 的 Java 开发人员，没有必要理解这些矢量表示背后的复杂数学理论或具体实现。对它们在 AI 系统中的作用和功能有基本的了解就足够了，特别是当您将 AI 功能集成到您的应用程序中时。

嵌入在实际应用中尤为重要，例如检索增强生成 (RAG) 模式。它们能够将数据表示为语义空间中的点，这类似于欧几里得几何的二维空间，但在更高的维度上。这意味着，就像欧几里得几何中平面上的点可以根据其坐标而接近或远离一样，在语义空间中，点的接近度反映了含义的相似性。关于相似主题的句子在这个多维空间中的位置更近，就像图上彼此靠近的点一样。这种接近度有助于文本分类、语义搜索甚至产品推荐等任务，因为它允许 AI 根据相关概念在这个扩展的语义景观中的“位置”来辨别和分组相关概念。

你可以把这个语义空间想象成一个向量。

## Token
----------------------------------------------------------------------

token是 AI 模型工作原理的基石。输入时，模型将单词转换为token。输出时，它们将token转换回单词。

在英语中，一个token大约对应一个单词的 75%。作为参考，莎士比亚的全集总共约 90 万个单词，翻译过来大约有 120 万个token。

![spring-ai-concepts-tokens](/img/user/ai/overview/spring-ai-concepts-tokens.png)

也许更重要的是 “token = 金钱”。在托管 AI 模型的背景下，您的费用由使用的token数量决定。输入和输出都会影响总token数量。

此外，模型还受到 token 限制，这会限制单个 API 调用中处理的文本量。此阈值通常称为“上下文窗口”。模型不会处理超出此限制的任何文本。

例如，ChatGPT3 的token限制为 4K，而 GPT4 则提供不同的选项，例如 8K、16K 和 32K。Anthropic 的 Claude AI 模型的token限制为 100K，而 Meta 的最新研究则产生了 1M token限制模型。

要使用 GPT4 总结莎士比亚全集，您需要制定软件工程策略来切分数据并在模型的上下文窗口限制内呈现数据。Spring Cloud Alibaba AI 项目可以帮助您完成此任务。

## 结构化输出（Structured Output）

即使您要求回复为 JSON ，AI 模型的输出通常也会以 `java.lang.String` 的形式出现。它可能是正确的 JSON，但它可能并不是你想要的 JSON 数据结构，它只是一个字符串。此外，在提示词 Prompt 中要求 “返回JSON” 并非 100% 准确。

这种复杂性导致了一个专门领域的出现，涉及创建 Prompt 以产生预期的输出，然后将生成的简单字符串转换为可用于应用程序集成的数据结构。

![结构化输出转换器架构](/img/user/ai/overview/structured-output-architecture.png)

[结构化输出转换](https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html#_structuredoutputconverter)采用精心设计的提示，通常需要与模型进行多次交互才能实现所需的格式。

## 将您的数据和 API 引入 AI 模型

如何让人工智能模型与不在训练集中的数据一同工作？

请注意，GPT 3.5/4.0 数据集仅支持截止到 2021 年 9 月之前的数据。因此，该模型表示它不知道该日期之后的知识，因此它无法很好的应对需要用最新知识才能回答的问题。一个有趣的小知识是，这个数据集大约有 650GB。

有三种技术可以定制 AI 模型以整合您的数据：

* `Fine Tuning` 微调：这种传统的机器学习技术涉及定制模型并更改其内部权重。然而，即使对于机器学习专家来说，这是一个具有挑战性的过程，而且由于 GPT 等模型的大小，它极其耗费资源。此外，有些模型可能不提供此选项。
* `Prompt Stuffing` 提示词填充：一种更实用的替代方案是将您的数据嵌入到提供给模型的提示中。考虑到模型的令牌限制，我们需要具备过滤相关数据的能力，并将过滤出的数据填充到在模型交互的上下文窗口中，这种方法俗称“提示词填充”。Spring Cloud Alibaba AI 库可帮助您基于“提示词填充” 技术，也称为[检索增强生成 (RAG)](https://docs.spring.io/spring-ai/reference/concepts.html#concept-rag)实现解决方案。

![prompt-stuffing](/img/user/ai/overview/spring-ai-prompt-stuffing.png)

* [Function Calling](https://docs.spring.io/spring-ai/reference/concepts.html#concept-fc)：此技术允许注册自定义的用户函数，将大型语言模型连接到外部系统的 API。Spring Cloud Alibaba AI 大大简化了支持[函数调用](https://docs.spring.io/spring-ai/reference/api/functions.html)所需编写的代码。


### 检索增强生成（RAG）

一种称为检索增强生成 (RAG) 的技术已经出现，旨在解决为 AI 模型提供额外的知识输入，以辅助模型更好的回答问题。

该方法涉及批处理式的编程模型，其中涉及到：从文档中读取非结构化数据、对其进行转换、然后将其写入矢量数据库。从高层次上讲，这是一个 ETL（提取、转换和加载）管道。矢量数据库则用于 RAG 技术的检索部分。

在将非结构化数据加载到矢量数据库的过程中，最重要的转换之一是将原始文档拆分成较小的部分。将原始文档拆分成较小部分的过程有两个重要步骤：

1. 将文档拆分成几部分，同时保留内容的语义边界。例如，对于包含段落和表格的文档，应避免在段落或表格中间拆分文档；对于代码，应避免在方法实现的中间拆分代码。
2. 将文档的各部分进一步拆分成大小仅为 AI 模型令牌 token 限制的一小部分的部分。


RAG 的下一个阶段是处理用户输入。当用户的问题需要由 AI 模型回答时，问题和所有“类似”的文档片段都会被放入发送给 AI 模型的提示中。这就是使用矢量数据库的原因，它非常擅长查找类似内容。

![Spring Cloud Alibaba AI RAG](/img/user/ai/overview/spring-ai-rag.png)

* [ETL 管道](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html)提供了有关协调从数据源提取数据并将其存储在结构化向量存储中的流程的更多信息，确保在将数据传递给 AI 模型时数据具有最佳的检索格式。
* ChatClient [\- RAG](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_retrieval_augmented_generation)解释了如何使用`QuestionAnswerAdvisor`顾问在您的应用程序中启用 RAG 功能。


### 函数调用（Function Calling）

大型语言模型 (LLM) 在训练后即被冻结，导致知识陈旧，并且无法访问或修改外部数据。

[Function Calling](https://docs.spring.io/spring-ai/reference/api/functions.html)机制解决了这些缺点，它允许您注册自己的函数，以将大型语言模型连接到外部系统的 API。这些系统可以为 LLM 提供实时数据并代表它们执行数据处理操作。

Spring Cloud Alibaba AI 大大简化了您需要编写的代码以支持函数调用。它为您处理函数调用对话。您可以将函数作为提供，`@Bean`然后在提示选项中提供该函数的 bean 名称以激活该函数。此外，您可以在单个提示中定义和引用多个函数。

![Spring Cloud Alibaba AI Function Calling](/img/user/ai/overview/spring-ai-function-calling.png)

* （1）执行聊天请求并发送函数定义信息。后者提供`name`（`description`例如，解释模型何时应调用该函数）和`input parameters`（例如，函数的输入参数模式）。
* （2）当模型决定调用该函数时，它将使用输入参数调用该函数，并将输出返回给模型。
* （3）Spring Cloud Alibaba AI 为您处理此对话。它将函数调用分派给适当的函数，并将结果返回给模型。
* （4）模型可以执行多个函数调用来检索所需的所有信息。
* （5）一旦获取了所有需要的信息，模型就会生成响应。

请关注[函数调用](https://docs.spring.io/spring-ai/reference/api/functions.html)文档以获取有关如何在不同 AI 模型中使用此功能的更多信息。

## 评估人工智能的回答（Evaluation）

有效评估人工智能系统回答的正确性，对于确保最终应用程序的准确性和实用性非常重要，一些新兴技术使得预训练模型本身能够用于此目的。

Evaluation 评估过程涉及分析响应是否符合用户的意图、与查询的上下文强相关，一些指标如相关性、连贯性和事实正确性等都被用于衡量 AI 生成的响应的质量。

一种方法是把用户的请求、模型的响应一同作为输入给到模型服务，对比模型给的响应或回答是否与提供的响应数据一致。

此外，利用矢量数据库中存储的信息作为补充数据可以增强评估过程，有助于确定响应的相关性。