## spring-ai-alibaba-analyticdb-store 使用方法

### 1. 添加依赖
首先，你需要在项目的`pom.xml`文件中添加`spring-ai-alibaba-analyticdb-store`的依赖（假设它有独立的依赖项）。示例如下：
```xml
<dependency>
    <groupId>com.alibaba.cloud.ai</groupId>
    <artifactId>spring-ai-alibaba-analyticdb-store</artifactId>
    <version>版本号</version>
</dependency>
```

### 2. 配置`AnalyticdbConfig`
创建并配置`AnalyticdbConfig`对象，该对象包含与AnalyticDB连接所需的各种参数，如访问密钥、区域ID、数据库实例ID等。示例代码如下：
```java
import com.alibaba.cloud.ai.vectorstore.analyticdb.AnalyticdbConfig;

// 创建并配置 AnalyticdbConfig 对象
AnalyticdbConfig config = new AnalyticdbConfig()
        .setAccessKeyId("yourAccessKeyId")
        .setAccessKeySecret("yourAccessKeySecret")
        .setRegionId("yourRegionId")
        .setDBInstanceId("yourDBInstanceId")
        .setManagerAccount("yourManagerAccount")
        .setManagerAccountPassword("yourManagerAccountPassword")
        .setNamespace("yourNamespace")
        .setNamespacePassword("yourNamespacePassword")
        .setMetrics("cosine")
        .setReadTimeout(60000)
        .setEmbeddingDimension(1536L)
        .setUserAgent("index");
```

### 3. 创建`AnalyticdbVector`对象
使用配置好的`AnalyticdbConfig`对象，结合集合名称和嵌入模型，创建`AnalyticdbVector`对象。示例代码如下：
```java
import com.alibaba.cloud.ai.vectorstore.analyticdb.AnalyticdbVector;
import com.alibaba.cloud.ai.vectorstore.EmbeddingModel;

// 假设已经有一个 EmbeddingModel 实例
EmbeddingModel embeddingModel = new YourEmbeddingModel();
String collectionName = "yourCollectionName";

try {
    // 创建 AnalyticdbVector 对象
    AnalyticdbVector analyticdbVector = new AnalyticdbVector(collectionName, config, embeddingModel);
} catch (Exception e) {
    e.printStackTrace();
}
```

### 4. 使用`AnalyticdbVector`的功能
`AnalyticdbVector`类实现了`VectorStore`接口，提供了一些常用的向量存储操作方法，例如：

#### 4.1 添加文档
使用`add`方法向向量存储中添加文档列表。示例代码如下：
```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// 创建文档列表
List<Document> documents = new ArrayList<>();
Map<String, Object> metadata = new HashMap<>();
metadata.put("docId", "yourDocId");
Document doc = new Document("yourDocumentText", metadata);
documents.add(doc);

// 调用 add 方法添加文档
analyticdbVector.add(documents);
```

#### 4.2 删除文档
使用`delete`方法根据文档ID列表删除向量存储中的文档。示例代码如下：
```java
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

// 创建要删除的文档ID列表
List<String> ids = Arrays.asList("docId1", "docId2");

// 调用 delete 方法删除文档
Optional<Boolean> deleteResult = analyticdbVector.delete(ids);
if (deleteResult.isPresent() && deleteResult.get()) {
    System.out.println("Documents deleted successfully.");
} else {
    System.out.println("Failed to delete documents.");
}
```

#### 4.3 相似性搜索
使用`similaritySearch`方法进行相似性搜索。示例代码如下：
```java
import java.util.List;

// 定义搜索请求
SearchRequest searchRequest = SearchRequest.builder()
        .query("yourQuery")
        .topK(10)
        .similarityThreshold(0.8)
        .build();

// 调用 similaritySearch 方法进行搜索
List<Document> searchResults = analyticdbVector.similaritySearch(searchRequest);
for (Document result : searchResults) {
    System.out.println("Search result: " + result.getText());
}
```

## 注意事项
- 上述代码中的`YourEmbeddingModel`、`Document`和`SearchRequest`需要根据实际情况替换为具体的实现类。
- 在使用过程中，要确保配置的参数正确，特别是访问密钥、数据库实例ID等敏感信息。
- 异常处理部分可以根据实际需求进行调整，例如记录日志、返回错误信息等。

通过以上步骤，你就可以基本使用`spring-ai-alibaba-analyticdb-store`进行向量存储相关的操作了。