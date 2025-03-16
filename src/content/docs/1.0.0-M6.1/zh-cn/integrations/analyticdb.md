---
title: spring-ai-alibaba-analyticdb-store 使用方法
keywords: [Spring Ai Alibaba, VectorStore, Analyticdb]
description: "Spring Ai Alibaba 适配 Analyticdb 向量数据库"
---

### 1. 添加Maven依赖
```xml
<dependency>
    <groupId>com.alibaba.cloud.ai</groupId>
    <artifactId>spring-ai-alibaba-analyticdb-store</artifactId>
    <version>${spring.ai.alibaba.version}</version>
</dependency>
```

### 2. 配置连接参数
在application.properties中配置AnalyticDB连接信息：
```properties
# 基本连接配置
spring.ai.vectorstore.analytic.accessKeyId=your-access-key-id
spring.ai.vectorstore.analytic.accessKeySecret=your-access-key-secret
spring.ai.vectorstore.analytic.regionId=cn-beijing
spring.ai.vectorstore.analytic.dbInstanceId=your-db-instance-id

# 账号权限配置
spring.ai.vectorstore.analytic.managerAccount=admin-account
spring.ai.vectorstore.analytic.managerAccountPassword=admin-password
spring.ai.vectorstore.analytic.namespace=your-namespace
spring.ai.vectorstore.analytic.namespacePassword=namespace-password

# 集合配置
spring.ai.vectorstore.analytic.collectName=doc_collection
spring.ai.vectorstore.analytic.metrics=cosine  # 相似度计算方式

# 搜索参数
spring.ai.vectorstore.analytic.defaultTopK=10
spring.ai.vectorstore.analytic.defaultSimilarityThreshold=0.8
```

### 3. 自动配置使用
Spring Boot会自动配置VectorStore实例：
```java
@Autowired
private VectorStore analyticDbVectorStore;
```

### 4. 核心操作示例
#### 4.1 添加文档
```java
List<Document> documents = List.of(
    new Document("1", "Spring AI核心内容", Map.of("category", "framework")),
    new Document("2", "机器学习算法解析", Map.of("category", "algorithm"))
);

analyticDbVectorStore.add(documents);
```

#### 4.2 相似性搜索
```java
SearchRequest request = SearchRequest.builder()
    .query("人工智能框架")
    .topK(5)
    .similarityThreshold(0.75)
    .build();

List<Document> results = analyticDbVectorStore.similaritySearch(request);
```

#### 4.3 删除文档
```java
// 按ID删除
analyticDbVectorStore.delete(List.of("doc1", "doc2"));

// 按过滤条件删除
Filter.Expression filter = Filter.expression("category == 'obsolete'");
analyticDbVectorStore.delete(filter);
```

### 5. 高级配置
#### 5.1 自定义过滤条件
支持复杂过滤表达式：
```java
Filter.Expression complexFilter = Filter.and(
    Filter.expression("author == 'John'"), 
    Filter.expression("version >= 2.0")
);

SearchRequest request = SearchRequest.builder()
    .query("分布式系统")
    .filter(complexFilter)
    .build();
```

#### 5.2 监控集成
默认集成Micrometer观测：
```java
@Bean
public ObservationRegistry observationRegistry() {
    return TestObservationRegistry.create();
}
```

### 6. 配置选项说明
| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| collectName | 集合名称 | 必填 |
| metrics | 相似度计算方式（cosine/l2） | cosine |
| defaultTopK | 默认返回结果数 | 4 |
| defaultSimilarityThreshold | 默认相似度阈值 | 0.0 |
| readTimeout | 请求超时时间(ms) | 60000 |

### 注意事项
1. 确保网络可访问AnalyticDB实例
2. 集合维度需与Embedding模型输出维度一致
3. 生产环境建议配置HTTPS
4. 批量操作建议使用BatchingStrategy优化性能