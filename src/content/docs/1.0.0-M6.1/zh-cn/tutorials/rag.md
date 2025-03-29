---
title: 检索增强生成RAG（Retrieval-Augmented Generation）
keywords: [Spring AI, RAG, 模型上下文协议, 智能体应用]
description: "Spring AI 智能体如何使用RAG"
---
#  RAG 简介

## 一、 什么是RAG（检索增强生成）
RAG（Retrieval Augmented Generation，检索增强生成）是一种结合信息检索和文本生成的技术范式。

## 🌟 核心设计理念
RAG技术就像给AI装上了「实时百科大脑」，通过**先查资料后回答**的机制，让AI摆脱传统模型的"知识遗忘"困境。

## 🛠️ 四大核心步骤

### 1. 文档切割 → 建立智能档案库
- **核心任务**: 将海量文档转化为易检索的知识碎片
- **实现方式**:
    - 就像把厚重词典拆解成单词卡片
    - 采用智能分块算法保持语义连贯性
    - 给每个知识碎片打标签（如"技术规格"、"操作指南"）

> 📌 关键价值：优质的知识切割如同图书馆分类系统，决定了后续检索效率

### 2. 向量编码 → 构建语义地图
- **核心转换**:
    - 用AI模型将文字转化为数学向量
    - 使语义相近的内容产生相似数学特征
- **数据存储**:
    - 所有向量存入专用数据库
    - 建立快速检索索引（类似图书馆书目检索系统）

🎯 示例效果："续航时间"和"电池容量"会被编码为相似向量

### 3. 相似检索 → 智能资料猎人
**应答触发流程**：
1. 将用户问题转为"问题向量"
2. 通过多维度匹配策略搜索知识库：
    - 语义相似度
    - 关键词匹配度
    - 时效性权重
3. 输出指定个数最相关文档片段

### 4. 生成增强 → 专业报告撰写
**应答构建过程**：
1. 将检索结果作为指定参考资料
2. AI生成时自动关联相关知识片段。
3. 输出形式可以包含：
    - 自然语言回答
    - 附参考资料溯源路径

📝 输出示例：
> "根据《产品手册v2.3》第5章内容：该设备续航时间为..."


## 二、Spring AI 标准接口实现 RAG

### 2.1 核心实现代码

#### 配置类
```java
@Configuration
public class RagConfig {

    @Bean
    ChatClient chatClient(ChatClient.Builder builder) {
        return builder.defaultSystem("你将作为一名机器人产品的专家，对于用户的使用需求作出解答")
                .build();
    }

    @Bean
    VectorStore vectorStore(EmbeddingModel embeddingModel) {
        SimpleVectorStore simpleVectorStore = SimpleVectorStore.builder(embeddingModel)
                .build();

        // 生成一个机器人产品说明书的文档
        List<Document> documents = List.of(
                new Document("产品说明书:产品名称：智能机器人\n" +
                        "产品描述：智能机器人是一个智能设备，能够自动完成各种任务。\n" +
                        "功能：\n" +
                        "1. 自动导航：机器人能够自动导航到指定位置。\n" +
                        "2. 自动抓取：机器人能够自动抓取物品。\n" +
                        "3. 自动放置：机器人能够自动放置物品。\n"));

        simpleVectorStore.add(documents);
        return simpleVectorStore;
    }


}

```
通过这个配置类，完成以下内容：

1 、配置ChatClient作为Bean，其中设置系统默认角色为机器人产品专家， 负责处理用户查询并生成回答
向量存储配置。

2、初始化SimpleVectorStore，加载机器人产品说明书文档，将文档转换为向量形式存储。
>SimpleVectorStore是将向量保存在内存ConcurrentHashmap中，Spring AI提供了多种存储方式，如Redis、MongoDB等，可以根据实际情况选择适合的存储方式。


#### 检索增强服务
```java
@RestController
@RequestMapping("/ai")
public class RagController {

    @Autowired
    private ChatClient chatClient;

    @Autowired
    private VectorStore vectorStore;


    @PostMapping(value = "/chat", produces = "text/plain; charset=UTF-8")
    public String generation(String userInput) {
        // 发起聊天请求并处理响应
        return chatClient.prompt()
                .user(userInput)
                .advisors(new QuestionAnswerAdvisor(vectorStore))
                .call()
                .content();
    }
}
```
通过添加QuestionAnswerAdvisor并提供对应的向量存储，可以将之前放入的文档作为参考资料，并生成增强回答。

### 2.2 运行程序
启动Spring Boot应用程序，并访问`/ai/chat`接口，传入用户问题，即可获取增强回答。如下：
```bash
POST http://localhost:8080/spring-ai/ai/chat?userInput=机器人有哪些功能？

HTTP/1.1 200 
Content-Type: text/plain;charset=UTF-8

根据您提供的智能机器人产品说明书，该机器人的主要功能包括：

1. 自动导航：机器人可以自动导航到指定的位置。
2. 自动抓取：机器人能够自动抓取物品。
3. 自动放置：机器人能够自动放置物品。

如果您需要更详细的信息或者关于其他功能的问题，请提供具体的需求，我会尽力帮助您。

```
这样测试结果，可以清晰地看到AI生成的回答，并参考了机器人产品说明书中的相关信息。


## 三、Spring AI 高级RAG功能实现

### 3.1 Multi Query Expansion (多查询扩展)

多查询扩展是提高RAG系统检索效果的关键技术。在实际应用中，用户的查询往往是简短且不完整的，这可能导致检索结果不够准确或完整。Spring AI提供了强大的多查询扩展机制，能够自动生成多个相关的查询变体，从而提高检索的准确性和召回率。

```java
// 创建聊天客户端实例
// 设置系统提示信息，定义AI助手作为专业的室内设计顾问角色
ChatClient chatClient = builder
        .defaultSystem("你是一位专业的室内设计顾问，精通各种装修风格、材料选择和空间布局。请基于提供的参考资料，为用户提供专业、详细且实用的建议。在回答时，请注意：\n" +
                "1. 准确理解用户的具体需求\n" +
                "2. 结合参考资料中的实际案例\n" +
                "3. 提供专业的设计理念和原理解释\n" +
                "4. 考虑实用性、美观性和成本效益\n" +
                "5. 如有需要，可以提供替代方案")
        .build();

// 构建查询扩展器
// 用于生成多个相关的查询变体，以获得更全面的搜索结果
MultiQueryExpander queryExpander = MultiQueryExpander.builder()
        .chatClientBuilder(builder)
        .includeOriginal(false) // 不包含原始查询
        .numberOfQueries(3) // 生成3个查询变体
        .build();

// 执行查询扩展
// 将原始问题"请提供几种推荐的装修风格?"扩展成多个相关查询
List<Query> queries = queryExpander.expand(
        new Query("请提供几种推荐的装修风格?"));
```

在这个过程中，系统会自动生成多个相关的查询变体，例如当用户查询"请提供几种推荐的装修风格?"时，系统会生成多个不同角度的查询。这种方式不仅提高了检索的全面性，还能捕获用户潜在的查询意图。

效果如下：
```
扩展后的查询内容:
1. 哪些装修风格最受欢迎？请推荐一些。
2. 能否推荐一些流行的家居装修风格？
3. 想了解不同的装修风格，有哪些是值得推荐的？
```

多查询扩展的主要优势：
1. **提高召回率**：通过多个查询变体，增加相关文档的检索机会
2. **覆盖不同角度**：从不同维度理解和扩展用户的原始查询
3. **增强语义理解**：捕获查询的多种可能含义和相关概念
4. **提升检索质量**：综合多个查询结果，获得更全面的信息

### 3.2 Query Rewrite (查询重写)

查询重写是RAG系统中的一个重要优化技术，它能够将用户的原始查询转换成更加结构化和明确的形式。这种转换可以提高检索的准确性，并帮助系统更好地理解用户的真实意图。

Spring AI提供了`RewriteQueryTransformer`来实现查询重写功能。以下是一个具体的示例：

```java
// 创建一个模拟用户学习AI的查询场景
Query query = new Query("我正在学习人工智能，什么是大语言模型？");

// 创建查询重写转换器
QueryTransformer queryTransformer = RewriteQueryTransformer.builder()
        .chatClientBuilder(builder)
        .build();

// 执行查询重写
Query transformedQuery = queryTransformer.transform(query);

// 输出重写后的查询
System.out.println(transformedQuery.text());
```

重写后的查询可能会变成：
```
什么是大语言模型？
```

查询重写的主要优势：**查询明确化**：将模糊的问题转换为具体的查询点

这种转换不仅有助于系统检索到更相关的文档，还能帮助生成更全面和专业的回答。

### 3.3 Query Translation (查询翻译)

查询翻译是RAG系统中的一个实用功能，它能够将用户的查询从一种语言翻译成另一种语言。这对于多语言支持和跨语言检索特别有用。Spring AI提供了`TranslationQueryTransformer`来实现这一功能。

```java
// 创建一个英文查询
Query query = new Query("What is LLM?");

// 创建查询翻译转换器，设置目标语言为中文
QueryTransformer queryTransformer = TranslationQueryTransformer.builder()
        .chatClientBuilder(builder)
        .targetLanguage("chinese")  // 设置目标语言为中文
        .build();

// 执行查询翻译
Query transformedQuery = queryTransformer.transform(query);

// 输出翻译后的查询
System.out.println(transformedQuery.text());
```

翻译后的查询结果：
```
什么是大语言模型？
```

查询翻译的主要优势：
1. **多语言支持**：支持不同语言之间的查询转换
2. **本地化处理**：将查询转换为目标语言的自然表达方式
3. **跨语言检索**：支持在不同语言的文档中进行检索
4. **用户友好**：允许用户使用自己熟悉的语言进行查询

### 3.4 Context-aware Queries (上下文感知查询)

在实际对话中，用户的问题往往依赖于之前的对话上下文。下面通过一个房地产咨询的场景来说明上下文感知查询的实现：

```java
// 构建带有历史上下文的查询
// 这个例子模拟了一个房地产咨询场景，用户先问小区位置，再问房价
Query query = Query.builder()
        .text("那这个小区的二手房均价是多少?")  // 当前用户的提问
        .history(new UserMessage("深圳市南山区的碧海湾小区在哪里?"),  // 历史对话中用户的问题
                new AssistantMessage("碧海湾小区位于深圳市南山区后海中心区，临近后海地铁站。"))  // AI的回答
        .build();
```

在这个例子中：
1. 用户首先询问了碧海湾小区的位置（历史对话）
2. 系统回答了小区的具体位置信息（历史回答）
3. 用户接着问"那这个小区的二手房均价是多少?"（当前查询）

如果不考虑上下文，系统将无法理解"这个小区"具体指的是哪个小区。为了解决这个问题，我们使用`CompressionQueryTransformer`来处理上下文信息：

```java
// 创建查询转换器
// QueryTransformer用于将带有上下文的查询转换为完整的独立查询
QueryTransformer queryTransformer = CompressionQueryTransformer.builder()
        .chatClientBuilder(builder)
        .build();

// 执行查询转换
// 将模糊的代词引用（"这个小区"）转换为明确的实体名称（"碧海湾小区"）
Query transformedQuery = queryTransformer.transform(query);
```

转换后的查询会变成更明确的形式，比如："深圳市南山区碧海湾小区的二手房均价是多少?"。这种转换有以下优势：
1. 消除歧义：明确指定了查询目标（碧海湾小区）
2. 保留上下文：包含了地理位置信息（深圳市南山区）
3. 提高准确性：使系统能够更精确地检索相关信息

```
输出结果：
深圳市南山区碧海湾小区的二手房均价是多少？
```

### 3.5 文档合并器（DocumentJoiner）

在实际应用中，我们经常需要从多个查询或多个数据源获取文档。为了有效地管理和整合这些文档，Spring AI提供了`ConcatenationDocumentJoiner`文档合并器。这个工具可以将多个来源的文档智能地合并成一个统一的文档集合。

文档合并器的主要特点：
1. **智能去重**：当存在重复文档时，只保留第一次出现的文档
2. **分数保持**：合并过程中保持每个文档的原始相关性分数
3. **多源支持**：支持同时处理来自不同查询和不同数据源的文档
4. **顺序维护**：保持文档的原始检索顺序

以下是一个使用示例：

```java
// 从多个查询或数据源获取的文档集合
Map<Query, List<List<Document>>> documentsForQuery = ...

// 创建文档合并器实例
DocumentJoiner documentJoiner = new ConcatenationDocumentJoiner();

// 执行文档合并
List<Document> documents = documentJoiner.join(documentsForQuery);
```

这种合并机制在以下场景特别有用：
1. **多轮查询**：需要合并多个查询返回的文档结果
2. **跨源检索**：从不同的数据源（如数据库、文件系统）获取文档
3. **查询扩展**：使用查询扩展生成多个相关查询时，需要合并所有结果
4. **增量更新**：在现有文档集合中添加新的检索结果

### 3.6 检索增强顾问（RetrievalAugmentationAdvisor）

RetrievalAugmentationAdvisor是Spring AI提供的一个强大工具，它能够自动化地处理文档检索和查询增强过程。这个顾问组件将文档检索与查询处理无缝集成，使得AI助手能够基于检索到的相关文档提供更准确的回答。

#### 3.6.1 基础用法

以下是RetrievalAugmentationAdvisor的基本使用示例：

```java
// 1. 初始化向量存储
SimpleVectorStore vectorStore = SimpleVectorStore.builder(embeddingModel)
        .build();

// 2. 添加文档到向量存储
List<Document> documents = List.of(
        new Document("产品说明书:产品名称：智能机器人\n" +
                "产品描述：智能机器人是一个智能设备，能够自动完成各种任务。\n" +
                "功能：\n" +
                "1. 自动导航：机器人能够自动导航到指定位置。\n" +
                "2. 自动抓取：机器人能够自动抓取物品。\n" +
                "3. 自动放置：机器人能够自动放置物品。\n"));
vectorStore.add(documents);

// 3. 创建检索增强顾问
Advisor advisor = RetrievalAugmentationAdvisor.builder()
        .documentRetriever(VectorStoreDocumentRetriever.builder()
                .vectorStore(vectorStore)
                .build())
        .build();

// 4. 在聊天客户端中使用顾问
String response = chatClient.prompt()
        .user("机器人有哪些功能？")
        .advisors(advisor)  // 添加检索增强顾问
        .call()
        .content();
```

这个基础实现提供了以下功能：
1. 自动文档检索：根据用户问题自动检索相关文档
2. 上下文整合：将检索到的文档内容整合到回答中
3. 智能回答生成：基于检索到的信息生成准确的回答

#### 3.6.2 高级配置选项

RetrievalAugmentationAdvisor支持多种高级配置：

```java
Advisor advisor = RetrievalAugmentationAdvisor.builder()
        // 配置查询增强器
        .queryAugmenter(ContextualQueryAugmenter.builder()
                .allowEmptyContext(true)        // 允许空上下文查询
                .build())
        // 配置文档检索器
        .documentRetriever(VectorStoreDocumentRetriever.builder()
                .vectorStore(vectorStore)
                .similarityThreshold(0.5)       // 相似度阈值
                .topK(3)                        // 返回文档数量
                .filterExpression(new FilterExpressionBuilder()
                                  .eq("genre", "fairytale")
                                  .build())     // 文档过滤表达式
                .build())
        .build();
```

主要配置选项包括：
1. **查询增强器配置**：
    - 上下文处理策略：定义如何处理对话历史和上下文信息，包括上下文窗口大小、历史消息权重等
    - 空值处理方式：指定当查询缺少某些参数时的处理策略，如使用默认值或抛出异常
    - 查询转换规则：设置如何将原始查询转换为更有效的检索形式，包括同义词扩展、关键词提取等

2. **文档检索器配置**：
    - 相似度阈值设置：确定文档匹配的最低相似度要求，低于此阈值的文档将被过滤掉
    - 返回结果数量限制：控制每次检索返回的最大文档数量，避免返回过多不相关的结果
    - 文档过滤规则：定义基于元数据的过滤条件，如时间范围、文档类型、标签等

### 3.7 Document Selection (文档选择)

在理解了检索增强顾问的基础上，我们来看看更复杂的文档选择机制。文档选择是RAG系统的核心组件之一，它决定了系统能够为用户提供多么准确和相关的信息。

#### 3.7.1 文档结构设计

首先，让我们看一个结构良好的文档示例：

```java
// 生成室内设计案例文档
List<Document> documents = new ArrayList<>();

// 现代简约风格客厅案例
documents.add(new Document(
        "案例编号：LR-2023-001\n" +
                "项目概述：180平米大平层现代简约风格客厅改造\n" +
                "设计要点：\n" +
                "1. 采用5.2米挑高的落地窗，最大化自然采光\n" +
                "2. 主色调：云雾白(哑光，NCS S0500-N)配合莫兰迪灰\n" +
                "3. 家具选择：意大利B&B品牌真皮沙发，北欧白橡木茶几\n" +
                "4. 照明设计：嵌入式筒灯搭配意大利Flos吊灯\n" +
                "5. 软装配饰：进口黑胡桃木电视墙，几何图案地毯\n" +
                "空间效果：通透大气，适合商务接待和家庭日常起居",
        Map.of(
                "type", "interior",    // 文档类型
                "year", "2023",        // 年份
                "month", "06",         // 月份
                "location", "indoor",   // 位置类型
                "style", "modern",      // 装修风格
                "room", "living_room"   // 房间类型
)));
```

每个文档包含两个主要部分：
1. 文档内容：结构化的文本描述，包含项目编号、概述、详细信息等
2. 元数据：用于快速筛选和分类的键值对，如类型、年份、位置等

#### 3.7.2 高级检索实现

以下是一个完整的高级检索示例：

```java
// 1. 初始化向量存储
SimpleVectorStore vectorStore = SimpleVectorStore.builder(embeddingModel)
        .build();

// 2. 配置AI助手角色
ChatClient chatClient = builder
        .defaultSystem("你是一位专业的室内设计顾问，精通各种装修风格、材料选择和空间布局。请基于提供的参考资料，为用户提供专业、详细且实用的建议。在回答时，请注意：\n" +
                "1. 准确理解用户的具体需求\n" +
                "2. 结合参考资料中的实际案例\n" +
                "3. 提供专业的设计理念和原理解释\n" +
                "4. 考虑实用性、美观性和成本效益\n" +
                "5. 如有需要，可以提供替代方案")
        .build();

// 3. 构建复杂的文档过滤条件
var b = new FilterExpressionBuilder();
var filterExpression = b.and(
        b.and(
                b.eq("year", "2023"),         // 筛选2023年的案例
                b.eq("location", "indoor")),   // 仅选择室内案例
        b.and(
                b.eq("type", "interior"),      // 类型为室内设计
                b.in("room", "living_room", "study", "kitchen")  // 指定房间类型
));

// 4. 配置文档检索器
DocumentRetriever retriever = VectorStoreDocumentRetriever.builder()
        .vectorStore(vectorStore)
        .similarityThreshold(0.5)    // 设置相似度阈值
        .topK(3)                     // 返回前3个最相关的文档
        .filterExpression(filterExpression.build())
        .build();

// 5. 创建上下文感知的查询增强器
Advisor advisor = RetrievalAugmentationAdvisor.builder()
        .queryAugmenter(ContextualQueryAugmenter.builder()
                .allowEmptyContext(true)
                .build())
        .documentRetriever(retriever)
        .build();

// 6. 执行查询并获取响应
String userQuestion = "根据已经提供的资料，请描述所有相关的场景风格，输出案例编号，尽可能详细地描述其内容。";
String response = chatClient.prompt()
        .user(userQuestion)
        .advisors(advisor)
        .call()
        .content();
```

这个实现包含以下关键特性：

1. **元数据过滤**：
    - 使用`FilterExpressionBuilder`构建复杂的过滤条件
    - 支持精确匹配（eq）、范围查询（in）等多种过滤方式
    - 可以组合多个条件（and/or）实现精确筛选

2. **相似度控制**：
    - 通过`similarityThreshold`设置相似度阈值（0.3）
    - 使用`topK`限制返回结果数量（3）
    - 确保只返回最相关的文档

3. **上下文感知**：
    - 集成`ContextualQueryAugmenter`实现上下文感知
    - 允许空上下文查询（allowEmptyContext）
    - 自动关联相关文档和查询上下文

4. **智能顾问集成**：
    - 使用`RetrievalAugmentationAdvisor`增强查询效果
    - 自动整合文档检索和查询处理
    - 提供更智能的响应生成

通过这种多层次的文档选择机制，系统能够：
1. 快速定位相关文档
2. 准确评估文档相关性
3. 智能组合多个信息源
4. 生成高质量的回答

### 3.8 Error Handling and Edge Cases (错误处理和边界情况)

在生产环境中，RAG系统需要优雅地处理各种边界情况，特别是文档检索失败或相关文档未找到的情况。通过使用`ContextualQueryAugmenter`，我们可以实现更友好的错误处理机制：

```java

    // 1. 构建检索增强顾问
    Advisor advisor = RetrievalAugmentationAdvisor.builder()
            .queryAugmenter(ContextualQueryAugmenter.builder()
                    .allowEmptyContext(true)  // 允许空上下文，避免NPE
                    .build())
            .documentRetriever(retriever)
            .build();

    // 2. 执行查询并处理可能的异常
    return chatClient.prompt()
            .user(query)
            .advisors(advisor)
            .call()
            .getContent();

```

运行效果对比：

修改前的结果展示：
```
AI回答：I'm sorry, but it appears that the specific details or references you mentioned for your interior design query are not included in my current knowledge base. To provide you with the best possible advice, I would need more information about your project, such as the style you're aiming for, the size of the space, your budget, and any specific elements you want to include or avoid. If you can provide more details, I would be more than happy to offer tailored advice on interior design, space planning, material selection, and more.
```

修改后的结果展示：
```
AI回答：很抱歉，您没有提供具体的参考资料或案例编号。为了能够提供详细的场景风格描述，我需要您提供具体的案例编号或者相关资料。一旦您提供了这些信息，我将能够准确地描述相关的场景风格，包括以下内容：

1. 设计风格和主题
2. 空间布局和功能规划
3. 材料选择和色彩搭配
4. 灯光设计和氛围营造
5. 家具配置和软装搭配
```

通过使用`ContextualQueryAugmenter`，我们实现了以下改进：

1. **友好的错误提示**：
    - 使用中文回复，更符合用户习惯
    - 提供清晰的后续操作指导
    - 说明所需的具体信息

2. **结构化的响应格式**：
    - 明确列出可提供的信息类别
    - 使用编号列表提高可读性
    - 保持专业性和完整性

3. **上下文感知处理**：
    - 自动处理空上下文情况
    - 保持对话的连贯性
    - 引导用户提供必要信息

这种错误处理方式不仅提供了更好的用户体验，还有助于收集更完整的用户需求信息，从而提供更准确的响应。

### 4. 最佳实践

在实际部署和运营RAG系统时，我们需要从多个维度来考虑系统的最佳实践。以下是完整的实践指南：

### 4.1 文档处理最佳实践

#### 4.1.1 文档结构设计
- **结构化内容**：文档应包含清晰的结构，如案例编号、项目概述、设计要点等
- **元数据标注**：为每个文档添加丰富的元数据，如：
  ```java
  Map.of(
      "type", "interior",    // 文档类型
      "year", "2023",        // 年份
      "style", "modern"      // 风格类型
  )
  ```

#### 4.1.2 文档切割策略
- 采用智能分块算法保持语义连贯性
- 给每个知识碎片打标签
- 保持合适的文档大小，避免过长或过短

### 4.2 检索增强策略

#### 4.2.1 多查询扩展（Multi Query Expansion）
- 启用多查询扩展机制，提高检索准确性
- 设置合适的查询数量（建议3-5个）
- 保留原始查询的核心语义

#### 4.2.2 查询重写和翻译
- 使用`RewriteQueryTransformer`优化查询结构
- 配置`TranslationQueryTransformer`支持多语言
- 保持查询的语义完整性

### 4.3 系统配置最佳实践

#### 4.3.1 向量存储配置
```java
SimpleVectorStore vectorStore = SimpleVectorStore.builder(embeddingModel)
    .build();
```
- 选择合适的向量存储方案
- 根据数据规模选择存储方式（内存/Redis/MongoDB）

#### 4.3.2 检索器配置
```java
DocumentRetriever retriever = VectorStoreDocumentRetriever.builder()
    .vectorStore(vectorStore)
    .similarityThreshold(0.5)    // 相似度阈值
    .topK(3)                     // 返回文档数量
    .build();
```
- 设置合理的相似度阈值
- 控制返回文档数量
- 配置文档过滤规则

### 4.4 错误处理机制

#### 4.4.1 异常处理
- 允许空上下文查询
- 提供友好的错误提示
- 引导用户提供必要信息

#### 4.4.2 边界情况处理
```java
ContextualQueryAugmenter.builder()
    .allowEmptyContext(true)
    .build()
```
- 处理文档未找到情况
- 处理相似度过低情况
- 处理查询超时情况

### 4.5 系统角色设定

#### 4.5.1 AI助手配置
```java
ChatClient chatClient = builder
    .defaultSystem("你是一位专业的顾问，请注意：\n" +
        "1. 准确理解用户需求\n" +
        "2. 结合参考资料\n" +
        "3. 提供专业解释\n" +
        "4. 考虑实用性\n" +
        "5. 提供替代方案")
    .build();
```
- 设定清晰的角色定位
- 定义回答规范
- 确保专业性和实用性

### 4.6 性能优化建议

#### 4.6.1 查询优化
- 使用文档过滤表达式
- 设置合理的检索阈值
- 优化查询扩展数量

#### 4.6.2 资源管理
- 控制文档加载数量
- 优化内存使用
- 合理设置缓存策略

通过遵循以上最佳实践，可以构建一个高效、可靠的RAG系统，为用户提供准确和专业的回答。这些实践涵盖了从文档处理到系统配置的各个方面，能够帮助开发者构建更好的RAG应用。

