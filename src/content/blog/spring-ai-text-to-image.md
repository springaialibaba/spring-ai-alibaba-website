---
title: 快速体验 Spring Cloud Alibaba AI
keywords: [Spring AI, LLM, 大模型, 通义千问, Langchain]
description: 快速体验 Spring Cloud Alibaba AI
author: 姬世文
date: "2024-05-09"
category: article
---

# 快速体验 Spring Cloud Alibaba AI

[Spring AI](https://docs.spring.io/spring-ai/reference/0.8-SNAPSHOT/index.html) 旨在简化包含人工智能相关功能的应用程序的开发，避免不必要的复杂性。

Spring AI 的核心是提供抽象，作为开发 AI 应用程序的基础。这些抽象有多种实现方式，只需极少的代码改动即可轻松实现各个大模型之间的切换。

Spring AI 提供以下功能：

- 支持所有主要模型提供商，例如 OpenAI、Microsoft、Amazon、Google 和 Huggingface。
- 支持的模型类型包括“聊天”和“文本到图像”，还有更多模型类型正在开发中。
- 跨 AI 提供商的可移植 API，用于聊天和嵌入模型。支持同步和流 API 选项。还支持下拉访问模型特定功能。
- AI 模型输出到 POJO 的映射。
- 支持所有主要矢量数据库提供商，例如 Azure 矢量搜索、Chroma、Milvus、Neo4j、PostgreSQL/PGVector、PineCone、Qdrant、Redis 和 Weaviate
- 跨 Vector Store 提供商的可移植 API，包括同样可移植的新颖的类似 SQL 的元数据过滤器 API。
- 函数调用
- AI 模型和向量存储的 Spring Boot 自动配置和启动器。
- 数据工程的 ETL 框架

## Spring Cloud Alibaba AI

Spring Cloud Alibaba AI （以下简称 SCA AI）基于 Spring AI 0.8.1 版本完成通义系列大模型的接入。

DashScope灵积模型服务建立在 *模型即服务*（Model-as-a-Service，MaaS）的理念基础之上，围绕AI各领域模型，通过标准化的API提供包括模型推理、模型微调训练在内的多种模型服务。。

SCA AI 目前支持的模型主要有：对话、文生图、文生语音，更多功能特性正在适配中。

## 快速体验

#### 创建 SCA AI 应用

在 pom.xml 中引入如下依赖配置：

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-ai</artifactId>
</dependency>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>${spring.cloud.alibaba.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- 因为 Spring AI 还没有正式发布到 maven 仓库，所以需要添加此配置项 目前 maven 仓库为假的。
issue：https://github.com/spring-projects/spring-ai/issues/537
-->
<repositories>
    <repository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
    <repository>
        <id>spring-snapshots</id>
        <name>Spring Snapshots</name>
        <url>https://repo.spring.io/snapshot</url>
        <releases>
            <enabled>false</enabled>
        </releases>
    </repository>
</repositories>
```

#### api-key 配置

在正式开始体验之前，需要申请到模型的 api-key。申请地址：https://help.aliyun.com/zh/dashscope/developer-reference/activate-dashscope-and-create-an-api-key

您可以通过 DashScope 提供的方式配置 api-key，SCA AI 完全兼容 DashScope 环境变量配置 key 的方式：https://help.aliyun.com/zh/dashscope/developer-reference/api-key-settings

当然也可以通过 SCA AI 中提供的如下配置项配置：

```yml
spring:
  cloud:
    ai:
      tongyi:
        # api-key setting:
        api-key: sk-xxxxxxxxxxxxxxxxxxx
```

#### 聊天对话体验

官方 Example：https://github.com/alibaba/spring-cloud-alibaba/tree/2023.x/spring-cloud-alibaba-examples/spring-cloud-ai-example

```java
public class ChatService {

    // 聊天客户端
	private final ChatClient chatClient;
	// stream 流式客户端
	private final StreamingChatClient streamingChatClient;

	@Autowired
	public ChatService(ChatClient chatClient, StreamingChatClient streamingChatClient) {

		this.chatClient = chatClient;
		this.streamingChatClient = streamingChatClient;
	}

	@Override
	public String normalCompletion(String message) {

		Prompt prompt = new Prompt(new UserMessage(message));
		return chatClient.call(prompt).getResult().getOutput().getContent();
	}

	@Override
	public Map<String, String> streamCompletion(String message) {

		StringBuilder fullContent = new StringBuilder();

		streamingChatClient.stream(new Prompt(message))
				.flatMap(chatResponse -> Flux.fromIterable(chatResponse.getResults()))
				.map(content -> content.getOutput().getContent())
				.doOnNext(fullContent::append)
				.last()
				.map(lastContent -> Map.of(message, fullContent.toString()))
				.block();
		return Map.of(message, fullContent.toString());
	}

}
```

之后，创建 controller 接口调用 service 服务：

```java
@Autowired
private ChatService chatService;

@GetMapping("/example")
public String completion(
    @RequestParam(value = "message", defaultValue = "Tell me a joke")
    String message
) {

    return chatService.completion(message);
}

@GetMapping("/stream")
public Map<String, String> streamCompletion(
    @RequestParam(value = "message", defaultValue = "请告诉我西红柿炖牛腩怎么做？")
    String message
) {

    return chatService.streamCompletion(message);
}
```

下面进行接口测试：

```bash
$ curl --get  --data-urlencode 'message=Tell me a joke about a cow.' http://localhost:8080/ai/example

# 获得的响应如下：
Here's a classic cow joke for you:

Why did the farmer separate the chicken and the sheep from the cows?

Because he wanted to have eggs-clusive relationships with his hens!
```

#### 文生图体验

```java
public class ImagesService {

    // 图像生成客户端
	private final ImageClient imageClient;

	@Autowired
	public ImagesService(ImageClient client) {

		this.imageClient = client;
	}

	@Override
	public ImageResponse genImg(String imgPrompt) {

		var prompt = new ImagePrompt(imgPrompt);
		return imageClient.call(prompt);
	}

}
```

文生图对应的 controller 接口如下：

```java
@Autowired
private ImagesService imagesService;

@GetMapping("/img")
public ImageResponse genImg(
    @RequestParam(value = "prompt", defaultValue = "Painting a picture of blue water and blue sky.") String imgPrompt
) {

    return imagesService.genImg(imgPrompt);
}
```

接口调用体验：

```bash
$ curl http://localhost:8080/img?prompt="美女"

# 响应数据为 base64 编码图片和图片网址，注意：图片 url 地址是有有效期的。
```

点击地址我们可以看到如下生成的美女图片：

<img src="/img/blog/spring-ai/2.png" alt="spring ai" style="zoom:50%;" />

#### 文生语音体验

```java
public class AudioService {

	private final SpeechClient speechClient;

	@Autowired
	public AudioService(SpeechClient client) {

		this.speechClient = client;
	}

	@Override
	public String genAudio(String text) {

		var resWAV = speechClient.call(text);
		return save(resWAV, SpeechSynthesisAudioFormat.WAV.getValue());
	}

    // 辅助方法，用于将模型的响应保存到本地.
	private String save(ByteBuffer audio, String type) {

		String currentPath = System.getProperty("user.dir");
		LocalDateTime now = LocalDateTime.now();
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd-HH-mm-ss");
		String fileName = currentPath + File.separator + now.format(formatter) + "." + type;
		File file = new File(fileName);

		try (FileOutputStream fos = new FileOutputStream(file)) {
			fos.write(audio.array());
		}
		catch (Exception e) {
			throw new RuntimeException(e);
		}

		return fileName;
	}

}
```

controller 接口代码如下：

```java
	@Autowired
	private AudioService audioService;

	@GetMapping("/audio")
	public String genAudio(@RequestParam(value = "prompt",
			defaultValue = "你好，Spring Cloud Alibaba AI 框架！") String prompt) {

		return audioService.genAudio(prompt);
	}
```

调用接口体验：

```bash
$ curl http://localhost:8080/ai/audio?prompt="你好，人工智能！"

# 响应值为保存的音频路径。
D:\open_sources\sca-ai\spring-ai\04-29-22-44-22.wav
```

![spring-ai](/img/blog/spring-ai/2.png)

至此，Spring Cloud Alibaba AI 提供的三种基本功能已经体验完成，后续您还可以通过设置一些个性化的参数来使大模型生成各种各样的图片和音频等。

更多配置项可以参考：https://help.aliyun.com/zh/dashscope/developer-reference/api-details。社区相关的文档正在完善，更多功能正在开发中！