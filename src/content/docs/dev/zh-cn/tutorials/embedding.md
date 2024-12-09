---
title: 嵌入模型 (Embedding Model)
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

## 核心概念
嵌入(`Embedding`)的工作原理是将文本、图像和视频转换为称为向量（Vectors）的浮点数数组。这些向量旨在捕捉文本、图像和视频的含义。嵌入数组的长度称为向量的维度（Dimensionality）。

嵌入模型（`EmbeddingModel`）是嵌入过程中采用的模型。当前EmbeddingModel的接口主要用于将文本转换为数值向量，接口的设计主要围绕这两个目标展开：
- 可移植性：该接口确保在各种嵌入模型之间的轻松适配。它允许开发者在不同的嵌入技术或模型之间切换，所需的代码更改最小化。这一设计与 Spring 模块化和互换性的理念一致。 
- 简单性：嵌入模型简化了文本转换为嵌入的过程。通过提供如`embed(String text)`和`embed(Document document)`这样简单的方法，它去除了处理原始文本数据和嵌入算法的复杂性。这个设计选择使开发者，尤其是那些初次接触 AI 的开发者，更容易在他们的应用程序中使用嵌入，而无需深入了解其底层机制。

## API介绍
### EmbeddingModel
本节介绍`EmbeddingModel`的接口和类。
```java
public interface EmbeddingModel extends Model<EmbeddingRequest, EmbeddingResponse> {

    @Override
    EmbeddingResponse call(EmbeddingRequest request);

    /**
     * Embeds the given document's content into a vector.
     * @param document the document to embed.
     * @return the embedded vector.
     */
    List<Double> embed(Document document);

    /**
     * Embeds the given text into a vector.
     * @param text the text to embed.
     * @return the embedded vector.
     */
    default List<Double> embed(String text) {
        Assert.notNull(text, "Text must not be null");
        return this.embed(List.of(text)).iterator().next();
    }

    /**
     * Embeds a batch of texts into vectors.
     * @param texts list of texts to embed.
     * @return list of list of embedded vectors.
     */
    default List<List<Double>> embed(List<String> texts) {
        Assert.notNull(texts, "Texts must not be null");
        return this.call(new EmbeddingRequest(texts, EmbeddingOptions.EMPTY))
                .getResults()
                .stream()
                .map(Embedding::getOutput)
                .toList();
    }

    /**
     * Embeds a batch of texts into vectors and returns the {@link EmbeddingResponse}.
     * @param texts list of texts to embed.
     * @return the embedding response.
     */
    default EmbeddingResponse embedForResponse(List<String> texts) {
        Assert.notNull(texts, "Texts must not be null");
        return this.call(new EmbeddingRequest(texts, EmbeddingOptions.EMPTY));
    }

    /**
     * @return the number of dimensions of the embedded vectors. It is generative
     * specific.
     */
    default int dimensions() {
        return embed("Test String").size();
    }

}
```
Embedding Model API提供多种选项，将文本转换为Embeddings，支持单个字符串、结构化的Document对象或文本批处理。

有多种快捷方式可以获得文本Embeddings。例如`embed(String text)`方法，它接受单个字符串并返回相应的 Embedding 向量。所有方法都围绕着`call`方法实现，这是调用 Embedding Model的主要方法。

通常，Embedding返回一个float数组，以数值向量格式表示Embeddings。

`embedForResponse`方法提供了更全面的输出，可能包括有关Embeddings的其他信息。

`dimensions`方法是开发人员快速确定 Embedding 向量大小的便利工具，这对于理解 Embedding space 和后续处理步骤非常重要。
#### EmbeddingRequest
`EmbeddingRequest`是一种`ModelRequest`，它接受文本对象列表和可选的Embedding请求选项。以下代码片段简要地显示了 EmbeddingRequest 类，省略了构造函数和其他工具方法：
```java
public class EmbeddingRequest implements ModelRequest<List<String>> {
private final List<String> inputs;
private final EmbeddingOptions options;
// other methods omitted
}
```

#### EmbeddingResponse
`EmbeddingResponse`类的结构如下：
```java
public class EmbeddingResponse implements ModelResponse<Embedding> {
    private List<Embedding> embeddings;
    private EmbeddingResponseMetadata metadata = new EmbeddingResponseMetadata();
    // other methods omitted
}
```
`EmbeddingResponse`类保存了AI模型的输出，其中每个 Embedding 实例包含来自单个文本输入的结果向量数据。同时，它还携带了有关 AI 模型响应的`EmbeddingResponseMetadata`元数据。
#### Embedding
`Embedding`表示一个 Embedding 向量。
```java
public class Embedding implements ModelResult<List<Double>> {
    private List<Double> embedding;
    private Integer index;
    private EmbeddingResultMetadata metadata;
// other methods omitted
}
```
## 示例用法
Spring AI Alibaba已经集成了`阿里云百炼平台`，接下来介绍基于阿里云百炼平台调用Embedding Model API。
### 准备工作
在开始之前，参考如下链接获取API-KEY：[获取API-KEY](https://help.aliyun.com/zh/model-studio/developer-reference/get-api-key)。
然后，在项目环境中设置API-KEY，有两种方式：

- 方式一：设置`configuration properties：spring.ai.dashscope.api-key` 为上述API-KEY。
- 方式二：设置环境变量`export SPRING_AI_DASHSCOPE_API_KEY=<YOUR API  KEY>`

### Auto-configuration
Spring AI 为 DashScope Embedding Model提供了 Spring Boot 的自动配置。要启用此功能，请将以下依赖项添加到您项目的 Maven`pom.xml`文件中：
```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-dashscope-spring-boot-starter</artifactId>
</dependency>
```
或者添加到您的Gradle`build.gradle`文件中：
```gradle
dependencies {
    implementation 'org.springframework.ai:spring-ai-dashscope-spring-boot-starter'
}
```
#### Embedding Properties
前缀`spring.ai.dashscope`是用于配置连接至 DashScope 的属性前缀。

| Property                       | Action          | Default |
|:-------------------------------|:----------------|---------|
| `spring.ai.dashscope.api-key`  | 来自百炼平台的API KEY  | -       |


```tips
所有以 spring.ai.dashscope 开头的属性都可以在运行过程中通过在 EmbeddingRequest 调用中添加特定请求的Runtime Options来覆盖。
```

### Runtime Options
`DashScopeEmbeddingOptions`提供了Embedding Request的配置信息，它提供了一个构建器，用于创建选项。

在启动时，可以使用`DashScopeEmbeddingModel`构造函数设置所有嵌入请求使用的默认选项。在运行时，可以通过将一个`DashScopeEmbeddingOptions`实例传递给`EmbeddingRequest`请求来覆盖默认选项。

例如，使用指定的请求覆盖默认的模型名称：
```java
EmbeddingResponse embeddingResponse = embeddingModel.call(
        new EmbeddingRequest(List.of("Hello World", "World is big and salvation is near"),
                DashScopeEmbeddingOptions.builder()
                        .withModel("Different-Embedding-Model-Deployment-Name")
                        .build()));
```

### 示例代码
该示例将创建一个`EmbeddingModel`实例，您可以将其注入到您的类中。以下是一个简单的`@Controller`类的示例，它使用了该 EmbeddingModel 实例。
```properties
spring.ai.dashscope.api-key=YOUR_API_KEY
```

```java
@RestController
public class EmbeddingController {

    private final EmbeddingModel embeddingModel;

    @Autowired
    public EmbeddingController(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    @GetMapping("/ai/embedding")
    public Map embed(@RequestParam(value = "message", defaultValue = "Tell me a joke") String message) {
        EmbeddingResponse embeddingResponse = this.embeddingModel.embedForResponse(List.of(message));
        return Map.of("embedding", embeddingResponse);
    }
}
```

### Manual Configuration
如果您不希望使用 Spring Boot 的 Auto-configuration，可以在应用程序中手动配置`DashScopeEmbeddingModel`。为此，请将`spring.ai.dashscope`依赖项添加到您项目的 Maven`pom.xml`文件中：
```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-dashscope</artifactId>
</dependency>
```

或者添加到您的Gradle`build.gradle`文件中：
```gradle
dependencies {
    implementation 'org.springframework.ai:spring-ai-dashscope'
}
```

```note
spring-ai-dashcope 依赖项还提供了对 DashScopeChatModel 的访问。有关 DashScopeChatModel 的更多信息，请参考 DashScope Chat Client部分。
```

接下来，创建一个`DashScopeEmbeddingModel`实例，并使用它计算两个输入文本之间的相似性：
```java
var dashScopeApi = new DashScopeApi(System.getenv("DASHSCOPE_API_KEY"));
var embeddingModel = new DashScopeEmbeddingModel(dashScopeApi, MetadataMode.EMBED,
        DashScopeEmbeddingOptions.builder()
                .withModel("text-embedding-v2")
                .build());

EmbeddingResponse embeddingResponse = embeddingModel
        .embedForResponse(List.of("Hello World", "World is big and salvation is near"));
```
