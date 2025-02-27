---
title: 本地集成百炼智能体应用
keywords: [Spring AI Alibaba,百炼,智能体应用]
description: "使用 Spring AI Alibaba 框架将本地 Spring Boot 应用接入百炼智能体，访问百炼智能体应用 API。"
---

阿里云百炼是一款可视化 AI 智能体应用开发平台，它提供了三种大模型应用开发模式：智能体、工作流与智能体编排，支持知识库检索、互联网搜索、工作流设计及智能体协作等功能。

本示例演示了如何使用百炼开发并发布一款简单的智能体应用，随后演示如何将一个普通的 Spring Boot 微服务应用接入智能体，让普通应用具备智能化能力。

![agent-architecture.png](/img/user/ai/practices/bailian-agent/agent-architecture.png)

## 定义并发布百炼智能体应用

打开百炼控制台，如下图所示创建自己的智能体应用，详细应用创建步骤可参考 [百炼官方文档](https://help.aliyun.com/zh/model-studio/user-guide/application-introduction)。

![bailian-app-new.png](/img/user/ai/practices/bailian-agent/bailian-app-new.png)

应用编辑完成之后，可在线可视化测试应用，如果最终测试符合预期，点击页面右上角的 “发布” 按钮，将智能体正式发布出去。

![bailian-app-publish.png](/img/user/ai/practices/bailian-agent/bailian-app-publish.png)

发布完成后，我们就可以通过通过 API 与这个智能体应用进行对话了。接下来我们演示如何在 Spring Boot 应用中快速访问这个智能体应用。

## 在 Spring Boot 应用中调用智能体应用

为了让 Spring Boot 应用访问百炼中发布的智能体应用，首先我们为应用加入 Spring AI Alibaba 依赖：

```xml
<dependency>
	<groupId>com.alibaba.cloud.ai</groupId>
	<artifactId>spring-ai-alibaba-starter</artifactId>
	<version>${spring-ai-alibaba.version}</version>
</dependency>
```

其次，需要在百炼平台获取应用标识、模型apikey等信息：

```yaml
spring:
  ai:
    dashscope:
      agent:
        app-id: put-your-app-id-here
      api-key: ${AI_DASHSCOPE_API_KEY}
```

* api-key，必填，访问模型服务的 key。
* app-id，必填，每个百炼应用都有一个 id，用户唯一标识这个应用。
* workspace-id，选填，默认使用默认业务空间，如果是在独立业务空间创建的应用则需要指定。

应用id

![bailian-app-id.png](/img/user/ai/practices/bailian-agent/bailian-app-id.png)

业务空间

![bailian-app-workspace.png](/img/user/ai/practices/bailian-agent/bailian-app-workspace.png)


Spring AI Alibaba 使用 `DashScopeAgent` 访问，以下是使用方法：

```java
public class BailianAgentRagController {
	private DashScopeAgent agent;

	@Value("${spring.ai.dashscope.agent.app-id}")
	private String appId;

	public BailianAgentRagController(DashScopeAgentApi dashscopeAgentApi) {
		this.agent = new DashScopeAgent(dashscopeAgentApi);
	}

	@GetMapping("/bailian/agent/call")
	public String call(@RequestParam(value = "message") String message) {
		ChatResponse response = agent.call(new Prompt(message, DashScopeAgentOptions.builder().withAppId(appId).build()));
		AssistantMessage app_output = response.getResult().getOutput();
		return app_output.getContent();
	}
}
```

Streaming 调用模式：

```java
public Flux<String> stream(@RequestParam(value = "message") String message) {
	return agent.stream(new Prompt(message, DashScopeAgentOptions.builder().withAppId(appId).build())).map(response -> {
		AssistantMessage app_output = response.getResult().getOutput();
		return app_output.getContent();
	});
}
```

> 示例项目的源码请查看 Github 仓库 [spring-ai-alibaba-examples](https://github.com/springaialibaba/spring-ai-alibaba-examples/tree/main/spring-ai-alibaba-rag-example)。

