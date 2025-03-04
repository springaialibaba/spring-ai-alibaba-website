---
title: Tool Calling 工具插件集成
keywords: [Spring Ai Alibaba, tool calling, function calling]
description: "Spring Ai Alibaba插件与工具生态，本文档主要涵盖 tool calling 工具的集成适配于使用方法。"
---

## 基本使用方法
Spring AI Alibaba 官方社区提供了很多 Tool Calling（Function Calling）扩展实现，方便开发者通过声明的方式直接开启插件，避免重复开发的麻烦。


以下是使用官方社区 Tool Calling 插件的步骤：

1. **增加 maven 依赖**

```xml
<dependency>
  <groupId>com.alibaba.cloud.ai</groupId>
  <artifactId>spring-ai-alibaba-starter-tool-calling-baidutranslate</artifactId>
  <version>${spring.ai.alibaba.version}</version>
</dependency>
```

2. **在配置文件中配置开关开启插件**

```properties
spring.ai.alibaba.toolcalling.baidutranslate.enable=true
spring.ai.alibaba.toolcalling.baidutranslate.appId=xxx
spring.ai.alibaba.toolcalling.baidutranslate.secretKey=xxx
```

3. **在代码中注册插件**

```java
chatClient.prompt(DEFAULT_PROMPT).functions("baiduTranslateFunction").call().content();
// 或者注册全局函数
ChatClient.builder(chatModel).defaultFunctions("baiduTranslateFunction").build();
```

> 其中 `baiduTranslateFunction` 即为下表中的 tool 名称。

## 社区实现列表

以下是当前社区提供的官方插件实现列表，可根据业务需要使用。

| 名称（代码引用名） | application.properties 配置 | Maven 依赖 | 说明 |
| --- | --- | --- | --- |
| <font style="color:#080808;background-color:#ffffff;">baiduTranslateFunction</font> | spring.ai.alibaba.toolcalling.baidutranslate.enable=true<br/>spring.ai.alibaba.toolcalling.baidutranslate.appId=xxx（可选）<br/>spring.ai.alibaba.toolcalling.baidutranslate.<font style="color:#080808;background-color:#ffffff;">secretKey</font>=xxx（可选） | ```xml <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-baidutranslate</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ```  | 百度翻译工具，可用于如中文到英文翻译等场景。示例地址（如有） |
| | | | |





## DocumentReader
Spring AI Alibaba 官方社区提供了很多 DocumentReader 插件扩展实现，在 RAG 场景中，当需要集成不同来源、不同格式的私域数据时，这些插件会非常有用，它可以帮助开发者快速的读取数据，免去重复开发带来的麻烦。



以下是使用官方社区 DocumentReader 实现集成数据的步骤：

```java
FeiShuResource feiShuResource = FeiShuResource.builder()
			.appId("xxxxx")
			.appSecret("xxxxxxx")
			.build();
FeiShuDocumentReader reader = new FeiShuDocumentReader(feishuResourcde);

List<Document> documentList = reader.get();

TokenTextSplitter splitter = new TokenTextSplitter();
List<Document> chunks = splitter.apply(documentList);

vectorStore.store();
```



| 名称（代码引用名） | Maven 依赖 | 说明 |
| --- | --- | --- |
| <font style="color:#080808;background-color:#ffffff;">FeiShuDocumentReader</font> | ```xml <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>feishu-document-reader</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ```  | 飞书文档库读取器，可用在 RAG 场景中，将飞书中的文档源读取并写入向量数据库。<br/><br/>示例地址（如有） |
| | | |
| | | |
| | | |


## Vector Store
| 名称（代码引用名） | application.yml 配置 | Maven 依赖 | 说明 |
| --- | --- | --- | --- |
| <font style="color:#080808;background-color:#ffffff;">Aliyun OpenSearch</font> | ```yaml spring:  ai:   vectorstore:     aliyun-opensearch:      index-name: spring-ai-document-index ```  | ```xml <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-analyticdb-store</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ```  | 阿里云OpenSearch向量检索版适配。<br/><br/>示例地址（如有） |
| Aliyun AnalyticDB | | | |
| Aliyun Tair | | | |
| | | | |
