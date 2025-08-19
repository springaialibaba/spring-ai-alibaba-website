---
title: 持久执行 (Durable Execution)
description: Spring AI Alibaba 持久执行机制
---

# 持久执行 (Durable Execution)

**持久执行**是一种技术，其中流程或工作流在关键点保存其进度，允许它暂停并稍后从中断的地方恰好恢复。这在需要[人机协作](./human-in-the-loop.md)的场景中特别有用，用户可以在继续之前检查、验证或修改流程，以及在可能遇到中断或错误的长时间运行任务中（例如，LLM 调用超时）。通过保存已完成的工作，持久执行使流程能够在不重新处理先前步骤的情况下恢复——即使在很长时间的延迟后（例如，一周后）。

Spring AI Alibaba Graph 的内置[持久化](./persistence.md)层为工作流提供持久执行，确保每个执行步骤的状态都保存到持久存储中。此功能保证如果工作流被中断——无论是由于系统故障还是[人机协作](./human-in-the-loop.md)交互——它都可以从其最后记录的状态恢复。

:::note[Spring AI Alibaba API 自动启用持久执行]
如果您正在使用带有检查点保存器的 Spring AI Alibaba，您已经启用了持久执行。您可以在任何时候暂停和恢复工作流，即使在中断或故障后也是如此。
为了充分利用持久执行，请确保您的工作流设计为[确定性和一致重放](#确定性和一致重放)，并将任何副作用或非确定性操作包装在[任务](#在节点中使用任务)内。
:::

## 要求

要在 Spring AI Alibaba 中利用持久执行，您需要：

1. 通过指定[检查点保存器](./persistence.md#检查点保存器库)在工作流中启用[持久化](./persistence.md)，该保存器将保存工作流进度。
2. 在执行工作流时指定[线程标识符](./persistence.md#线程)。这将跟踪工作流特定实例的执行历史。
3. 将任何非确定性操作（例如，随机数生成）或具有副作用的操作（例如，文件写入、API 调用）包装在任务内，以确保当工作流恢复时，这些操作不会为特定运行重复，而是从持久化层检索其结果。有关更多信息，请参阅[确定性和一致重放](#确定性和一致重放)。

## 确定性和一致重放

当您恢复工作流运行时，代码**不会**从执行停止的**同一行代码**恢复；相反，它将识别一个适当的[起始点](#恢复工作流的起始点)，从中继续执行。这意味着工作流将从[起始点](#恢复工作流的起始点)重放所有步骤，直到达到停止的点。

因此，当您为持久执行编写工作流时，必须将任何非确定性操作（例如，随机数生成）和任何具有副作用的操作（例如，文件写入、API 调用）包装在任务或节点内。

为了确保您的工作流是确定性的并且可以一致地重放，请遵循以下准则：

- **避免重复工作**：如果一个[节点](./graph/overview.md#节点)包含多个具有副作用的操作（例如，日志记录、文件写入或网络调用），请将每个操作包装在单独的**任务**中。这确保当工作流恢复时，操作不会重复，其结果从持久化层检索。
- **封装非确定性操作**：将任何可能产生非确定性结果的代码（例如，随机数生成）包装在**任务**或**节点**内。这确保在恢复时，工作流遵循具有相同结果的确切记录步骤序列。
- **使用幂等操作**：在可能的情况下，确保副作用（例如，API 调用、文件写入）是幂等的。这意味着如果在工作流失败后重试操作，它将具有与第一次执行时相同的效果。这对于导致数据写入的操作特别重要。如果**任务**开始但未能成功完成，工作流的恢复将重新运行**任务**，依赖记录的结果来维护一致性。使用幂等键或验证现有结果以避免意外重复，确保平滑和可预测的工作流执行。

## 持久性模式

Spring AI Alibaba 支持三种持久性模式，允许您根据应用程序的要求平衡性能和数据一致性。持久性模式从最低到最高持久性如下：

- [`"exit"`](#exit)
- [`"async"`](#async)
- [`"sync"`](#sync)

更高的持久性模式会为工作流执行增加更多开销。

### `"exit"`
仅在图执行完成时（成功或出错）持久化更改。这为长时间运行的图提供了最佳性能，但意味着不保存中间状态，因此您无法从执行中期故障中恢复或中断图执行。

### `"async"`
在下一步执行时异步持久化更改。这提供了良好的性能和持久性，但如果进程在执行期间崩溃，检查点可能不会被写入，存在小风险。

### `"sync"`
在下一步开始之前同步持久化更改。这确保在继续执行之前写入每个检查点，以一些性能开销为代价提供高持久性。

您可以在调用任何图执行方法时指定持久性模式：

```java
graph.stream(
    Map.of("input", "test"),
    config.withDurability("sync")
);
```

## 在节点中使用任务

如果一个[节点](./graph/overview.md#节点)包含多个操作，您可能会发现将每个操作转换为**任务**比将操作重构为单独的节点更容易。

### 原始方式

```java
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.springframework.web.client.RestTemplate;
import com.alibaba.cloud.ai.graph.StateGraph;
import com.alibaba.cloud.ai.graph.checkpoint.InMemoryCheckpointSaver;

// 定义状态类
public class ApiState {
    private String url;
    private String result;

    // getters and setters
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
}

public class ApiCallNode {
    private RestTemplate restTemplate = new RestTemplate();

    public ApiState callApi(ApiState state) {
        // 具有副作用的操作
        String result = restTemplate.getForObject(state.getUrl(), String.class);
        if (result != null && result.length() > 100) {
            result = result.substring(0, 100);
        }
        state.setResult(result);
        return state;
    }
}

// 创建和使用图
StateGraph<ApiState> graph = StateGraph.<ApiState>builder()
    .addNode("call_api", new ApiCallNode()::callApi)
    .addEdge("__start__", "call_api")
    .addEdge("call_api", "__end__")
    .build();

// 指定检查点保存器
InMemoryCheckpointSaver checkpointer = new InMemoryCheckpointSaver();

// 编译图
var compiledGraph = graph.compile(checkpointer);

// 定义配置
String threadId = UUID.randomUUID().toString();
Map<String, Object> config = Map.of("configurable", Map.of("thread_id", threadId));

// 调用图
ApiState initialState = new ApiState();
initialState.setUrl("https://www.example.com");
compiledGraph.invoke(initialState, config);
```

### 使用任务的方式

```java
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.springframework.web.client.RestTemplate;
import com.alibaba.cloud.ai.graph.StateGraph;
import com.alibaba.cloud.ai.graph.checkpoint.InMemoryCheckpointSaver;
import com.alibaba.cloud.ai.graph.task.Task;

// 定义状态类
public class ApiState {
    private String url;
    private String result;

    // getters and setters
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
}

public class ApiCallNode {
    private RestTemplate restTemplate = new RestTemplate();

    // 将 API 调用包装为任务
    @Task
    private CompletableFuture<String> makeRequest(String url) {
        return CompletableFuture.supplyAsync(() -> {
            String result = restTemplate.getForObject(url, String.class);
            return result != null && result.length() > 100 ?
                result.substring(0, 100) : result;
        });
    }

    public ApiState callApi(ApiState state) {
        // 使用任务进行 API 调用
        CompletableFuture<String> requestTask = makeRequest(state.getUrl());
        String result = requestTask.join(); // 获取任务结果
        state.setResult(result);
        return state;
    }
}
```

## 恢复工作流

一旦您在工作流中启用了持久执行，您可以在以下场景中恢复执行：

- **暂停和恢复工作流**：使用 `interrupt` 功能在特定点暂停工作流，并使用 `Command` 原语以更新的状态恢复它。有关更多详细信息，请参阅[**人机协作**](./human-in-the-loop.md)。
- **从故障中恢复**：在异常后（例如，LLM 提供商中断）自动从最后成功的检查点恢复工作流。这涉及通过提供 `null` 作为输入值，使用相同的线程标识符执行工作流。

### 从故障中恢复示例

```java
@Service
public class DurableExecutionService {

    public void resumeFromFailure(String threadId) {
        try {
            // 使用相同的线程 ID 和 null 输入来恢复
            Map<String, Object> config = Map.of(
                "configurable", Map.of("thread_id", threadId)
            );

            // 传入 null 作为输入以从最后检查点恢复
            var result = graph.invoke(null, config);
            log.info("工作流恢复成功: {}", result);

        } catch (Exception e) {
            log.error("工作流恢复失败", e);
            // 可以实现重试逻辑或人工干预
        }
    }

    public void pauseWorkflow(String threadId) {
        // 在节点中使用 interrupt 来暂停工作流
        // 这将在当前节点完成后暂停执行
    }

    public void resumeWorkflow(String threadId, Object updatedState) {
        try {
            Map<String, Object> config = Map.of(
                "configurable", Map.of("thread_id", threadId)
            );

            // 使用更新的状态恢复工作流
            var result = graph.invoke(updatedState, config);
            log.info("工作流恢复成功: {}", result);

        } catch (Exception e) {
            log.error("工作流恢复失败", e);
        }
    }
}
```

## 恢复工作流的起始点

- 如果您使用的是 [StateGraph (Graph API)](./graph/overview.md)，起始点是执行停止的[**节点**](./graph/overview.md#节点)的开始。
- 如果您在节点内进行子图调用，起始点将是调用被暂停子图的**父**节点。在子图内，起始点将是执行停止的特定[**节点**](./graph/overview.md#节点)。
- 如果您使用的是函数式 API，起始点是执行停止的[**入口点**](./graph/overview.md#入口点)的开始。

## 实际应用示例

### 长时间运行的数据处理工作流

```java
@Component
public class DataProcessingWorkflow {

    @Autowired
    private DataService dataService;

    @Autowired
    private ProcessingService processingService;

    public StateGraph<ProcessingState> createDataProcessingGraph() {
        return StateGraph.<ProcessingState>builder()
            .addNode("fetch_data", this::fetchData)
            .addNode("validate_data", this::validateData)
            .addNode("process_data", this::processData)
            .addNode("save_results", this::saveResults)
            .addEdge("__start__", "fetch_data")
            .addEdge("fetch_data", "validate_data")
            .addEdge("validate_data", "process_data")
            .addEdge("process_data", "save_results")
            .addEdge("save_results", "__end__")
            .build();
    }

    @Task
    private CompletableFuture<List<DataRecord>> fetchDataFromSource(String sourceId) {
        return CompletableFuture.supplyAsync(() -> {
            // 长时间运行的数据获取操作
            return dataService.fetchFromSource(sourceId);
        });
    }

    public ProcessingState fetchData(ProcessingState state) {
        List<CompletableFuture<List<DataRecord>>> tasks = new ArrayList<>();

        for (String sourceId : state.getDataSources()) {
            if (!state.isSourceProcessed(sourceId)) {
                tasks.add(fetchDataFromSource(sourceId));
                state.markSourceAsProcessed(sourceId);
            }
        }

        // 等待所有任务完成
        List<DataRecord> allData = tasks.stream()
            .map(CompletableFuture::join)
            .flatMap(List::stream)
            .collect(Collectors.toList());

        state.setRawData(allData);
        return state;
    }

    @Task
    private CompletableFuture<ValidationResult> validateDataBatch(List<DataRecord> batch) {
        return CompletableFuture.supplyAsync(() -> {
            // 验证数据批次
            return processingService.validateBatch(batch);
        });
    }

    public ProcessingState validateData(ProcessingState state) {
        List<DataRecord> rawData = state.getRawData();
        int batchSize = 1000;
        List<CompletableFuture<ValidationResult>> validationTasks = new ArrayList<>();

        for (int i = 0; i < rawData.size(); i += batchSize) {
            List<DataRecord> batch = rawData.subList(i,
                Math.min(i + batchSize, rawData.size()));
            validationTasks.add(validateDataBatch(batch));
        }

        // 收集验证结果
        List<ValidationResult> results = validationTasks.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());

        state.setValidationResults(results);
        return state;
    }
}
```

### 人机协作工作流示例

```java
@Component
public class HumanInTheLoopWorkflow {

    public StateGraph<ReviewState> createReviewWorkflow() {
        return StateGraph.<ReviewState>builder()
            .addNode("analyze_content", this::analyzeContent)
            .addNode("human_review", this::requestHumanReview)
            .addNode("apply_feedback", this::applyFeedback)
            .addNode("finalize", this::finalizeContent)
            .addEdge("__start__", "analyze_content")
            .addEdge("analyze_content", "human_review")
            .addConditionalEdges("human_review", this::checkReviewDecision)
            .addEdge("apply_feedback", "finalize")
            .addEdge("finalize", "__end__")
            .build();
    }

    public ReviewState analyzeContent(ReviewState state) {
        // 自动分析内容
        AnalysisResult analysis = contentAnalyzer.analyze(state.getContent());
        state.setAnalysisResult(analysis);
        return state;
    }

    public ReviewState requestHumanReview(ReviewState state) {
        // 请求人工审核并暂停工作流
        notificationService.sendReviewRequest(state.getContent(), state.getThreadId());

        // 使用 interrupt 暂停工作流等待人工输入
        throw new InterruptException("等待人工审核");
    }

    public Map<String, String> checkReviewDecision(ReviewState state) {
        if (state.getReviewDecision() == ReviewDecision.APPROVED) {
            return Map.of("next", "finalize");
        } else {
            return Map.of("next", "apply_feedback");
        }
    }

    public ReviewState applyFeedback(ReviewState state) {
        // 根据人工反馈修改内容
        String updatedContent = contentEditor.applyFeedback(
            state.getContent(),
            state.getFeedback()
        );
        state.setContent(updatedContent);
        return state;
    }
}
```

## 配置选项

```properties
# 持久执行配置
spring.ai.alibaba.graph.persistence.enabled=true
spring.ai.alibaba.graph.persistence.checkpoint-interval=5m
spring.ai.alibaba.graph.persistence.durability-mode=async

# 检查点保存器配置
spring.ai.alibaba.graph.checkpointer.type=database
spring.ai.alibaba.graph.checkpointer.cleanup-interval=24h
spring.ai.alibaba.graph.checkpointer.max-checkpoints=100

# 任务配置
spring.ai.alibaba.graph.task.timeout=30m
spring.ai.alibaba.graph.task.retry-attempts=3
spring.ai.alibaba.graph.task.retry-delay=5s
```

## 最佳实践

### 1. 设计原则
- **保持节点幂等性**：确保节点可以安全地重复执行而不产生副作用
- **最小化状态大小**：只在状态中保存必要的数据，减少序列化开销
- **合理使用任务**：将有副作用的操作包装在任务中，确保持久执行的正确性

### 2. 错误处理
- **实现优雅的错误恢复**：设计能够从故障点恢复的工作流
- **提供人工干预机制**：在关键决策点允许人工介入
- **记录详细的错误信息**：便于调试和故障排除

### 3. 性能优化
- **选择合适的持久性模式**：根据性能和可靠性需求选择 exit、async 或 sync 模式
- **监控执行性能**：跟踪节点执行时间和资源使用情况
- **及时清理过期数据**：定期清理旧的检查点和执行历史

### 4. 运维管理
- **建立监控告警**：监控长时间运行和卡住的执行
- **定期备份状态**：确保检查点数据的安全性
- **制定恢复预案**：为各种故障场景准备恢复策略

## 常见问题

### Q: 什么时候应该使用持久执行？
A: 在以下场景中应该使用持久执行：
- 长时间运行的工作流（超过几分钟）
- 需要人工干预的流程
- 涉及外部 API 调用的不稳定操作
- 多步骤的复杂业务流程

### Q: 如何选择合适的持久性模式？
A:
- 使用 `"exit"` 模式：当性能最重要且可以接受从头重新执行
- 使用 `"async"` 模式：平衡性能和可靠性的默认选择
- 使用 `"sync"` 模式：当数据一致性最重要时

### Q: 任务和节点有什么区别？
A:
- **节点**：工作流中的主要执行单元，代表业务逻辑的一个步骤
- **任务**：节点内的细粒度操作，用于包装有副作用的操作以确保幂等性

## 下一步

- [学习持久化机制](./persistence.md)
- [了解人机协作](./human-in-the-loop.md)
- [探索时间旅行](./time-travel.md)
