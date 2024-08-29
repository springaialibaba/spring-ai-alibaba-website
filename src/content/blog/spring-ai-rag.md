---
title: 使用 Spring Cloud Alibaba AI 构建 RAG 应用
keywords: [Spring AI, LLM, 大模型, 通义千问, Langchain, RAG]
description: 使用 Spring Cloud Alibaba AI 构建 RAG 应用
author: 姬世文
date: "2024-05-24"
category: article
---

## 背景介绍

### RAG（Retrieval Augmented Generation）

检索增强生成（RAG）是一种用于将数据与人工智能模型集成的技术。在 RAG 工作流程中，第一步将文档数据加载到矢量数据库（例如 Redis）中。当收到用户查询时，矢量数据库会检索一组与该查询相似的文档。然后，这些文档数据充当用户问题的上下文，并与用户的查询结合使用生成响应（通常通过 LLM 模型）。

在此示例中，我们将使用包含啤酒信息的数据集，包括名称、酒精体积 (ABV)、国际苦度单位 (IBU) 等属性以及每种啤酒的描述。该数据集将加载到 Redis 中，之后通过 Spring Cloud Alibaba AI Starter 构建 Spring 项目，以演示 RAG 应用的工作流程。

### Redis 矢量数据库

矢量数据库经常充当人工智能应用程序的内存。对于那些由大型语言模型（LLM）支持的人来说尤其如此。矢量数据库允许语义搜索，这为 LLM 提供了相关上下文。 Spring AI 项目旨在简化人工智能驱动的应用程序的开发，包括矢量数据库的应用。

## 代码和依赖关系

您可以在 SCA 的官方 example 示例中找到 [RAG example 示例](https://github.com/alibaba/spring-cloud-alibaba/tree/2023.x/spring-cloud-alibaba-examples/ai-example/spring-cloud-ai-rag-example)

此示例 example 使用 Spring Cloud Alibaba AI 和 Spring AI Redis，用 Sping Web 构建 Web 应用程序。

### 数据加载

RAG 应用使用的数据由 JSON 文档组成，文档内容如下：

```json
{
  "id": "00gkb9",
  "name": "Smoked Porter Ale",
  "description": "The Porter Pounder Smoked Porter is a dark rich flavored ale that is made with 5 malts that include smoked and chocolate roasted malts. It has coffee and mocha notes that create a long finish that ends clean with the use of just a bit of dry hopping",
  "abv": 8,
  "ibu": 36
}
```

在此示例中，我们通过 RagDataLoader 类将数据插入到 Redis 中。

## RAG 应用

RAGService 类在收到用户提示时，将会调用检索方法，执行以下步骤：

1. 计算用户提示的向量
2. 查询 Redis 数据库以检索最相关的文档
3. 使用检索到的文档和用户提示构建提示
4. 调用 ChatClient 并提示生成响应

## 调用示例

我们可以通过浏览器或者 curl 命令的方式调用 web api 接口，来获得 RAG 应用的输出。默认的 prompt 参数：`What ber pairs well with smoked meats?`

```shell
curl $ curl  http://127.0.0.1:8081/rag/chat

# 如果一切正常，您将看到如下响应：
Bieré De Ménage would pair well with smoked meats due to its high ABV (8%) and potentially the influence of oak barrels from the winemaking process, which can complement the rich fla
vors of smoked dishes. However, if you prefer a sturdier stout, Son of Berserker Stout with its 6.9% ABV and 20 IBUs could also serve as a good match for smoked foods, especially since it's a substantial stout without additional complexities like bourbon or oak.
```

如果您使用浏览器调用：将看到以下内容

<img src="/img/blog/spring-ai-rag/rag.png" alt="spring ai" style="zoom:50%;" />

在此示例中，将 Spring Cloud Alibaba AI 与 Redis 向量存储，仅通过几个类实现了 RAG 应用。欢迎您试用 Spring Cloud Alibaba AI Starter，如果有任何问题，您可以通过 Issue 的方式与我们联系。