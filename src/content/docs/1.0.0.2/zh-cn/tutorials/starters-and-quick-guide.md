---
title: Spring AI Alibaba 可用组件列表与使用指南
keywords: [Spring Ai Alibaba, Spring Boot Starter]
description: "本文深入"
---

## Spring AI Alibaba 发布的核心组件

**1. 基本使用方式**

通过以下坐标引入依赖：

```xml
<dependency>
	<groupId>com.alibaba.cloud.ai</groupId>
	<artifactId>spring-ai-alibaba-starter-dashscope</artifactId>
	<version>${spring-ai-alibaba.version}</version>
</dependency>
```

> 本文档编写时的最新发布版本是 1.0.0.2，请通过 [Github Releases](https://github.com/alibaba/spring-ai-alibaba/releases) 关注最新版本发布情况。

**2. 组件列表**

以下是 Spring AI Alibaba 1.0 版本中发布所有核心组件，您可以按需将这些组件加入到项目中使用。
比如：如果您只是想使用 `ChatClient` 开发一个简单的单智能体或者聊天助手，则只需要加入 `spring-ai-alibaba-starter-dashscope` 依赖，如果您需要使用工作流或多智能体，则需要加入 `spring-ai-alibaba-graph-core` 依赖。

* **spring-ai-alibaba-bom** - 用于为所有组件做统一版本管理
* **spring-ai-alibaba-starter-dashscope** - 百炼模型服务适配
* **spring-ai-alibaba-graph-core** - 智能体 Graph 框架核心组件
* **spring-ai-alibaba-starter-nl2sql** - 自然语言到 SQL 转换组件
* **spring-ai-alibaba-starter-memory** - 会话记忆组件
* **spring-ai-alibaba-starter-nacos-mcp-client**，Nacos MCP 客户端，推荐 Nacos 3.0.1 版本。Nacos2 Server 用户请用老版本（spring-ai-alibaba-starter-nacos2-mcp-client）
* **spring-ai-alibaba-starter-nacos-mcp-server**，Nacos MCP 服务端，推荐 Nacos 3.0.1 版本。Nacos2 Server 用户请用老版本（spring-ai-alibaba-starter-nacos2-mcp-server）
* **spring-ai-alibaba-starter-nacos-prompt** - Nacos Prompt 管理
* **spring-ai-alibaba-starter-arms-observation** - ARMS 可观测
* community 组件
  * **spring-ai-alibaba-starter-tool-calling-*** - 工具调用组件
  * **spring-ai-alibaba-starter-document-reader-*** - 文档读取组件

## 依赖管理最佳实践

### 使用 `bom` 管理依赖版本
我们推荐明确指定 Spring AI Alibaba、Spring AI、Spring Boot 的 bom 依赖版本，并在此基础上，按需启用所需要的依赖。

> Spring AI Alibaba 与 Spring AI、Spring Boot 的版本依赖关系，请参考 [FAQ](../../faq)。

```xml
<properties>
	<spring-ai.version>1.0.0</spring-ai.version>
	<spring-ai-alibaba.version>1.0.0.2</spring-ai-alibaba.version>
	<spring-boot.version>3.4.5</spring-boot.version>
</properties>

<dependencyManagement>
	<dependencies>
		<dependency>
			<groupId>com.alibaba.cloud.ai</groupId>
			<artifactId>spring-ai-alibaba-bom</artifactId>
			<version>${spring-ai-alibaba.version}</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-dependencies</artifactId>
			<version>${spring-boot.version}</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.ai</groupId>
			<artifactId>spring-ai-bom</artifactId>
			<version>${spring-ai.version}</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>

	</dependencies>
</dependencyManagement>

<dependencies>
  <dependency>
    <groupId>com.alibaba.cloud.ai</groupId>
    <artifactId>spring-ai-alibaba-starter-dashscope</artifactId>
  </dependency>
</dependencies>
```



