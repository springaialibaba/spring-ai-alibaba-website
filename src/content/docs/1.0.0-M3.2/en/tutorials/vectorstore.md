---
title: 向量存储(Vector Store)
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

## 核心概念
向量存储（`VectorStore`）是一种用于存储和检索高维向量数据的数据库或存储解决方案，它特别适用于处理那些经过嵌入模型转化后的数据。在 VectorStore 中，查询与传统关系数据库不同。它们执行相似性搜索，而不是精确匹配。当给定一个向量作为查询时，VectorStore 返回与查询向量“相似”的向量。

VectorStore 用于将您的数据与 AI 模型集成。在使用它们时的第一步是将您的数据加载到矢量数据库中。然后，当要将用户查询发送到 AI 模型时，首先检索一组相似文档。然后，这些文档作为用户问题的上下文，并与用户的查询一起发送到 AI 模型。这种技术被称为检索增强生成（`Retrieval Augmented Generation，RAG`）。

VectorStore API提供了简单易用的接口供开发者对 VectorStore 进行操作，接下来的部分描述相关接口以及一些高层次的示例用法。

## API介绍
本节是对 Spring AI 框架中`VectorStore`接口及其相关类的指南。

Spring AI 提供了一个抽象化的 API，通过 VectorStore 接口与向量数据库进行交互。
### VectorStore
以下是`VectorStore`接口的定义：
```java
public interface VectorStore extends DocumentWriter {
    default String getName() {
        return this.getClass().getSimpleName();
    }

    void add(List<Document> documents);

    default void accept(List<Document> documents) {
        this.add(documents);
    }

    Optional<Boolean> delete(List<String> idList);

    List<Document> similaritySearch(SearchRequest request);

    default List<Document> similaritySearch(String query) {
        return this.similaritySearch(SearchRequest.query(query));
    }
}
```
以及相关的`SearchRequest`构建器：
```java
public class SearchRequest {

    public final String query;
    private int topK = 4;
    private double similarityThreshold = SIMILARITY_THRESHOLD_ALL;
    private Filter.Expression filterExpression;

    public static SearchRequest query(String query) { return new SearchRequest(query); }

    private SearchRequest(String query) { this.query = query; }

    public SearchRequest withTopK(int topK) {...}
    public SearchRequest withSimilarityThreshold(double threshold) {...}
    public SearchRequest withSimilarityThresholdAll() {...}
    public SearchRequest withFilterExpression(Filter.Expression expression) {...}
    public SearchRequest withFilterExpression(String textExpression) {...}

    public String getQuery() {...}
    public int getTopK() {...}
    public double getSimilarityThreshold() {...}
    public Filter.Expression getFilterExpression() {...}
}
```

要将数据插入 VectorStore，应先将其封装在`Document`对象中。`Document`类封装了来自数据源（如 PDF 或 Word 文档）的内容，并将文本表示为字符串。它还包含键值对形式的元数据，包括文件名等详细信息。

在将文本内容插入 VectorStore 时，使用 EmbeddingModel 将文本内容转换为数值数组或float[]，这一步称为向量 Embedding。EmbeddingModel 用于将单词、句子或段落转换为这些向量 Embeddings。

VectorStore 的作用是存储并支持对这些 Embeddings 的相似性搜索，它不会生成 Embeddings 本身。因此，VectorStore 需要和 EmbeddingModel 一起使用。

接口中的`similaritySearch`方法允许检索与给定查询字符串相似的文档，你可以微调相似性搜索的这些参数：
- `k`：一个整数，指定要返回的相似文档的最大数量。这通常被称为 “top K” 搜索或 “K最近邻”（KNN）。
- `threshold`：一个值从 0 到 1 的双精度数，接近1的值表示更高的相似性。默认情况下，如果您设置了阈值为0.75，那么只有相似度超过此值的文档才会被返回。
- `Filter.Expression`：一个用于传递流畅 DSL（特定域语言）表达式的类，其功能类似于 SQL 中的 “where”子句，但它仅适用于`Document`的元数据键值对。
- `filterExpression`：基于 ANTLR4 的外部 DSL，接受字符串形式的过滤表达式。例如，对于元数据键如country、year 和`isActive`，您可以使用如下表达式：`country == 'UK' && year >= 2020 && isActive == true`。

## 示例用法
Spring AI Alibaba已经集成了`阿里云百炼平台`，接下来介绍基于阿里云百炼平台调用 VectorStore API。
### 准备工作
在开始之前，参考如下链接获取API-KEY：[获取API-KEY](https://help.aliyun.com/zh/model-studio/developer-reference/get-api-key)。
然后，在项目环境中设置API-KEY，有两种方式：

- 方式一：设置`configuration properties：spring.ai.dashscope.api-key` 为上述API-KEY。
- 方式二：设置环境变量`export SPRING_AI_DASHSCOPE_API_KEY=<YOUR API  KEY>`
### Auto-configuration
Spring AI 为 VectorStore 提供了 Spring Boot 的自动配置。要启用此功能，请将以下依赖项添加到您项目的 Maven`pom.xml`文件中：
```xml
<dependency>
    <groupId>com.alibaba.cloud.ai</groupId>
    <artifactId>spring-ai-alibaba-starter</artifactId>
    <version>1.0.0-M2.1</version>
</dependency>
```
或者添加到您的Gradle`build.gradle`文件中：
```gradle
dependencies {
    implementation 'com.alibaba.cloud.ai:spring-ai-alibaba-starter:1.0.0-M2.1'
}
```

#### VectorStore Properties
前缀`spring.ai.dashscope`是用于配置连接至 DashScope 的属性前缀。

| Property                       | Action          | Default |
|:-------------------------------|:----------------|---------|
| `spring.ai.dashscope.api-key`  | 来自百炼平台的API KEY  | -       |

```tips
所有以 spring.ai.dashscope 开头的属性都可以在构造 DashScopeCloudStore 时传入Runtime Options来覆盖。
```

### Runtime Options
`DashScopeStoreOptions`提供了 DashScopeCloudStore 的配置信息，它通过构造函数来创建选项。

在构造`DashScopeCloudStore`时，通过将一个`DashScopeStoreOptions`实例传入，已完成配置。

例如，使用指定的知识库：
```java
DashScopeCloudStore cloudStore = new DashScopeCloudStore(
        dashscopeApi, new DashScopeStoreOptions("spring-ai知识库"));
```
### 示例代码
该示例将创建一个`DashScopeCloudStore`实例，在指定的知识库上执行检索操作。以下是简单的`@Controller`类的示例，它使用了该 DashScopeCloudStore 实例。
```properties
spring.ai.dashscope.api-key=YOUR_API_KEY
```
```java
@RestController
public class StoreController {

    private final DashScopeCloudStore dashScopeCloudStore;

    @Autowired
    public StoreController(DashScopeCloudStore dashScopeCloudStore) {
        this.dashScopeCloudStore = dashScopeCloudStore;
    }

    @GetMapping("/ai/search")
    public List<Document> store(@RequestParam(value = "message", defaultValue = "What's spring ai") String message) {
        return this.dashScopeCloudStore.similaritySearch(message);
    }
}
```