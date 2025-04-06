---
title: Vector Store 向量数据库集成
keywords: [Spring Ai Alibaba, 向量数据库, vector database, vector store]
description: "Spring Ai Alibaba插件与工具生态，本文档主要涵盖向量数据库的集成适配于使用方法。"
---

## 基本使用方法

以下是 Spring AI Alibaba 集成的阿里云向量数据库产品实现。关于更多向量数据库（Vector Store）的扩展实现使用方法，请参考 spring ai 官方或者我们的示例仓库。

## 社区实现列表

| 名称（代码引用名） | application.yml 配置 | Maven 依赖 | 说明 |
| --- | --- | --- | --- |
| Aliyun OpenSearch | ```yaml spring:  ai:   vectorstore:     aliyun-opensearch:      index-name: spring-ai-document-index ```  | ```xml <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-opensearch-store</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 阿里云OpenSearch向量检索版适配。<br/><br/>示例地址（如有） |
| Aliyun AnalyticDB | | ```xml <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-analyticdb-store</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency>``` | |
| Aliyun Tair | | ```xml <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tair-store</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency>``` | |
