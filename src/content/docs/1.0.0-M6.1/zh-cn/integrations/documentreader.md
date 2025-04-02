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
| ArxivDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-arxiv</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | arXiv学术论文阅读器，支持论文元数据提取、PDF下载和内容解析 |
| BilibiliDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-bilibili</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | B站视频内容解析器，支持视频信息提取和字幕抓取 |
| ChatGptDataDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-chatgpt-data</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | ChatGPT对话记录解析器，支持导出数据的结构化处理 |
| EmailDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-email</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 邮件文档解析器，支持EML/MSG格式，可提取正文、附件和元数据 |
| FeiShuDocumentReader | ```xml <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-document-reader-larksuite</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 飞书文档库读取器，可用在 RAG 场景中，将飞书中的文档源读取并写入向量数据库。<br/><br/>示例地址（如有） |
| GitHubDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-github</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | GitHub仓库文档解析器，支持Markdown/README等格式抓取 |
| GitLabDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-gitlab</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | GitLab仓库内容读取器，支持Issue和代码仓库文档解析 |
| MongoDBDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-mongodb</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | MongoDB数据库连接器，支持集合文档的批量读取和查询 |
| MySQLDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-mysql</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | MySQL数据库阅读器，支持SQL查询结果转换为文档 |
| NotionDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-notion</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | Notion知识库集成工具，支持页面内容和块级元素解析 |
| TencentCOSDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-tencent-cos</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 腾讯云对象存储集成工具，支持COS文档内容批量处理 |
| YouTubeDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-youtube</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | YouTube视频内容解析器，支持视频信息和字幕提取 |
| ObsidianDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-obsidian</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | Obsidian笔记解析器，支持Markdown文件和双向链接处理 |
| HuggingFaceFSDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-huggingface-fs</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | HuggingFace数据集文件阅读器，支持JSONL格式解析 |
| MboxDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-mbox</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | Mbox邮箱文件解析器，支持多邮件内容提取 |
| GitbookDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-gitbook</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | Gitbook文档阅读器，支持API方式获取书籍内容 |
| ElasticsearchDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-elasticsearch</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | Elasticsearch文档连接器，支持单节点/集群模式、HTTPS安全连接和基础认证，提供文档检索、ID查询和自定义搜索功能 |
| YuQueDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-yuque</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 语雀知识库集成工具，支持通过API获取文档内容并保留源文件路径信息 |
| OneNoteDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-onenote</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | OneNote文档解析器，支持通过Microsoft Graph API获取笔记本内容和页面结构 |
| GptRepoDocumentReader | ```xml <dependency> <groupId>com.alibaba.cloud.ai</groupId> <artifactId>spring-ai-alibaba-starter-document-reader-gpt-repo</artifactId> <version>${spring.ai.alibaba.version}</version> </dependency> ``` | Git仓库分析工具，支持代码库全量读取、文件过滤和结构化文档生成 |


