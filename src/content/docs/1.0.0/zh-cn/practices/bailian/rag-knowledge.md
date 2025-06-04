---
title: 本地RAG应用集成百炼知识库
keywords: [Spring AI,通义Qwen,百炼知识库]
description: "使用 Spring AI Alibaba 集成百炼 RAG 知识库，将您的 Spring Boot 应用接入大模型。"
---

阿里云百炼是一款可视化 AI 智能体应用开发平台，同时它提供 RAG 知识库管理能力。简单来讲，您可以将私有数据上传到百炼平台，借助百炼平台数据解析、切片、向量化等能力实现数据向量化预处理，处理后的数据可用于后续的智能体应用开发检索，即我们常说的 RAG 模式。

在本示例中，我们首先在百炼平台平台上新建一个知识库，将自己的文档上传到知识库并完成切片、向量化存储等。随后，我们使用 Spring AI Alibaba 开发一个智能体应用，使用 RAG 模式检索百炼中的知识库。

![knowledge-architecture.png](/img/user/ai/practices/bailian-knowledge/architecture.png)

## 新建百炼知识库

取决于使用场景，我们有两种方式创建百炼知识库：
1. 访问百炼控制台，通过可视化 web 界面上传知识库并上传文档。
2. 在 Spring Boot 或 Spring AI 项目中编写代码调用 API 创建知识库并上传文档。

### 通过百炼控制台创建知识库

打开百炼控制台，访问页面左侧 “数据管理” 菜单，通过 “导入数据” 按钮上传私域数据：

![agent-architecture.png](/img/user/ai/practices/bailian-knowledge/import-data.png)

访问页面左侧 “知识索引” 菜单，通过 “创建知识库” 完成之前数据的向量化：

![agent-architecture.png](/img/user/ai/practices/bailian-knowledge/embedding-data.png)

> 注意，请记住这里填写的 `知识库名称`，它会作为唯一索引被用于后续的 RAG 知识检索。

### 通过 API 创建知识库

如果您不想手动操作百炼控制台，则可以使用 Spring AI Alibaba 中的 `DocumentReader` 接口实现 `DashScopeDocumentCloudReader`，`VectorStore` 实现 `DashScopeCloudStore` 将本地数据上传到百炼，完成数据向量化。

以下是相关代码

```java
public void importDocuments() {
	String path = "absolute-path-to-your-file";

	// 1. import and split documents
	DocumentReader reader = new DashScopeDocumentCloudReader(path, dashscopeApi, null);
	List<Document> documentList = reader.get();
	logger.info("{} documents loaded and split", documentList.size());

	// 1. add documents to DashScope cloud storage
	VectorStore vectorStore = new DashScopeCloudStore(dashscopeApi, new DashScopeStoreOptions(indexName));
	vectorStore.add(documentList);
	logger.info("{} documents added to dashscope cloud vector store", documentList.size());
}
```

> 注意，以上代码中使用的 `indexName` 值，会作为唯一索引被用于后续的 RAG 知识检索。

## 创建 RAG 智能体应用

完成知识库之后，我们就可以开发自己的 RAG 应用了。同样的，我们有两种模式来开发自己的应用：
1. 继续在百炼控制台开发应用，百炼提供了可视化的智能体应用开发与部署平台，可以方便的创建托管应用。
2. 使用 Spring AI Alibaba 框架开发应用，这通常适用于您需要将 RAG 集成于遗留的 Java 应用，或者需要对应用检索等行为有更灵活控制的场景。

以下我们重点讲解如何使用 Spring AI Alibaba 框架开发 RAG 应用，模拟一个遗留 Java 应用接入大模型的开发过程。

为了让 Spring Boot 应用可以接入大模型并使用百炼中的知识库，我们首先要为应用加入 Spring AI Alibaba 依赖：

```xml
<dependency>
	<groupId>com.alibaba.cloud.ai</groupId>
	<artifactId>spring-ai-alibaba-starter</artifactId>
	<version>${spring-ai-alibaba.version}</version>
</dependency>
```

其次，需要在百炼平台获取模型 apikey 等必要信息：

```yaml
spring:
  ai:
    dashscope:
      api-key: ${AI_DASHSCOPE_API_KEY}
```

* api-key，必填，访问模型服务的 key。
* workspace-id，选填，默认使用默认业务空间，如果是在独立业务空间创建的应用则需要指定。

接下来，就是使用 Spring AI Alibaba 框架开发 RAG 应用的标准流程了。其中，为了在检索环节和百炼建立连接，我们需要指定百炼知识库检索组件 `DashScopeDocumentRetriever` 。

```java
private static final String indexName = "微服务";

DocumentRetriever retriever = new DashScopeDocumentRetriever(dashscopeApi,
				DashScopeDocumentRetrieverOptions.builder().withIndexName(indexName).build());
```

其中，`indexName` 需要指定为您在百炼中创建的知识库名称，具体获取方法可参见上一小节。

如以下代码片段，使用 `ChatClient` 调用模型服务，其中 `DocumentRetrievalAdvisor` 切面会负责拦截用户请求，并将 `retriever` 检索到的知识库上下文附加到用户 prompt 后一同发送给大模型。

```java
ChatClient chatClient = builder
		.defaultAdvisors(new DocumentRetrievalAdvisor(retriever))
		.build();

String content = chatClient.prompt().user(message).stream().chatResponse();
```

> 示例项目的完整源码请查看 Github 仓库 [spring-ai-alibaba-examples](https://github.com/springaialibaba/spring-ai-alibaba-examples/tree/main/spring-ai-alibaba-rag-example)。
