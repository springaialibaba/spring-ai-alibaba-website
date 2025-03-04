---
title: DocumentReader RAG 数据源集成
keywords: [Spring Ai Alibaba, DocumentReader, 文档读取, RAG]
description: "Spring Ai Alibaba插件与工具生态，本文档主要 DocumentReader 的不同实现与使用方法，用于RAG集成不同私域数据。"
---

## 基本使用方法
Spring AI Alibaba 官方社区提供了很多 DocumentReader 插件扩展实现，在 RAG 场景中，当需要集成不同来源、不同格式的私域数据时，这些插件会非常有用，它可以帮助开发者快速的读取数据，免去重复开发带来的麻烦。


以飞书文档库为例，以下是使用官方社区 DocumentReader 实现集成数据的基本用法：

1. **增加 Maven 依赖**

```xml
<dependency>
  <groupId>com.alibaba.cloud.ai</groupId>
  <artifactId>feishu-document-reader</artifactId>
  <version>${spring.ai.alibaba.version}</version>
</dependency>
```

2. **编写代码读取文档并写入向量数据库**

```java
FeiShuResource feiShuResource = FeiShuResource.builder()
			.appId("xxxxx")
			.appSecret("xxxxxxx")
			.build();
FeiShuDocumentReader reader = new FeiShuDocumentReader(feishuResourcde);

List<Document> documentList = reader.get();

TokenTextSplitter splitter = new TokenTextSplitter();
List<Document> chunks = splitter.apply(documentList);

vectorStore.add(chunks);
```


## 社区实现列表

| 名称（代码引用名） | Maven 依赖 | 说明 |
| --- | --- | --- |
| FeiShuDocumentReader | ```xml <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>feishu-document-reader</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ```  | 飞书文档库读取器，可用在 RAG 场景中，将飞书中的文档源读取并写入向量数据库。<br/><br/>示例地址（如有） |
| | | |


