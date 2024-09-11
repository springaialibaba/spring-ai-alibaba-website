---
title: 快速开始
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

我们

## 示例
1. 下载项目

```shell
curl
```

2. 运行项目

```shell
./mvnw exec:xxx
```

访问 xxx，与模型交互。

## 源码分析
是一个普通 Spring Boot 应用，只需添加依赖、注入 ChatClient bean 即可与模型交互。

1. 添加依赖

```xml

```

2. 注入 ChatClient

```java

```

```java

```

## 更多资料
### 基础示例与API使用
* ChatClient 详细说明
* Prompt Template 提示词模板
* Function Calling

### 高级示例
* 使用 RAG 开发 Q&A 答疑助手
* 对非结构化文本自动打标分类
* 具备连续对话能力的聊天机器人