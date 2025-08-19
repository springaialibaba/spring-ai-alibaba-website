---
title: "并行处理"
description: "学习 Spring AI Alibaba Graph 的并行处理功能，包括 Map-Reduce 模式、Send API 和异步支持。"
---

本文档介绍 Spring AI Alibaba Graph 的并行处理功能，包括 Map-Reduce 模式、Send API 和异步支持。

## Map-Reduce 和 Send API

Spring AI Alibaba Graph 支持使用 Send API 的 map-reduce 和其他高级分支模式。当您需要动态创建并行任务时，这特别有用。

### Send API 的工作原理

默认情况下，节点和边是预先定义的，并在相同的共享状态上操作。但在某些情况下，确切的边可能事先不知道，或者您可能希望同时存在不同版本的状态。一个常见的例子是 map-reduce 设计模式。

Send API 允许您从条件边返回 `Send` 对象。`Send` 接受两个参数：第一个是节点的名称，第二个是要传递给该节点的状态。

```java
import com.alibaba.cloud.ai.graph.Send;
import static com.alibaba.cloud.ai.graph.action.AsyncEdgeAction.edge_async;

@Configuration
public class MapReduceWorkflow {

    @Bean
    public CompiledGraph mapReduceGraph() {
        KeyStrategyFactory keyStrategyFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("topic", KeyStrategy.REPLACE);
            strategies.put("subjects", KeyStrategy.REPLACE);
            strategies.put("jokes", KeyStrategy.APPEND);  // 使用追加策略收集笑话
            strategies.put("best_joke", KeyStrategy.REPLACE);
            return strategies;
        };

        // 生成主题节点
        NodeAction generateTopicsAction = state -> {
            return Map.of("subjects", List.of("狮子", "大象", "企鹅"));
        };

        // 生成笑话节点（会被动态调用多次）
        NodeAction generateJokeAction = state -> {
            String subject = state.value("subject", String.class).orElse("");

            Map<String, String> jokeMap = Map.of(
                "狮子", "为什么狮子不喜欢快餐？因为它们抓不到！",
                "大象", "为什么大象不用电脑？因为它们害怕鼠标！",
                "企鹅", "为什么企鹅不喜欢在聚会上和陌生人说话？因为它们很难打破僵局。"
            );

            String joke = jokeMap.getOrDefault(subject, "没有找到关于 " + subject + " 的笑话");
            return Map.of("jokes", List.of(joke));
        };

        // 动态路由到笑话生成节点
        EdgeAction continueToJokes = state -> {
            List<String> subjects = state.value("subjects", List.class).orElse(new ArrayList<>());

            // 为每个主题创建一个 Send 对象
            return subjects.stream()
                .map(subject -> new Send("generate_joke", Map.of("subject", subject)))
                .collect(Collectors.toList());
        };

        // 选择最佳笑话节点
        NodeAction bestJokeAction = state -> {
            List<String> jokes = state.value("jokes", List.class).orElse(new ArrayList<>());
            String bestJoke = jokes.isEmpty() ? "没有笑话" : jokes.get(0);
            return Map.of("best_joke", bestJoke);
        };

        return new StateGraph(keyStrategyFactory)
            .addNode("generate_topics", node_async(generateTopicsAction))
            .addNode("generate_joke", node_async(generateJokeAction))
            .addNode("best_joke", node_async(bestJokeAction))

            .addEdge(START, "generate_topics")
            .addConditionalEdges("generate_topics", edge_async(continueToJokes))
            .addEdge("generate_joke", "best_joke")
            .addEdge("best_joke", END)

            .compile();
    }
}
```

### 使用 Map-Reduce 模式

```java
@Service
public class MapReduceService {

    @Autowired
    private CompiledGraph mapReduceGraph;

    public void demonstrateMapReduce() {
        // 调用图：生成笑话列表
        Optional<OverAllState> result = mapReduceGraph.invoke(Map.of("topic", "动物"));

        result.ifPresent(state -> {
            List<String> jokes = state.value("jokes", List.class).orElse(new ArrayList<>());
            String bestJoke = state.value("best_joke", String.class).orElse("");

            System.out.println("生成的笑话:");
            jokes.forEach(joke -> System.out.println("- " + joke));
            System.out.println("最佳笑话: " + bestJoke);
        });
    }
}
```

### Send API 的高级用法

Send API 还可以用于更复杂的动态路由场景：

```java
// 根据数据动态决定处理策略
EdgeAction dynamicProcessingRouter = state -> {
    List<Map<String, Object>> dataItems = state.value("data_items", List.class)
        .orElse(new ArrayList<>());

    List<Send> sends = new ArrayList<>();

    for (Map<String, Object> item : dataItems) {
        String type = (String) item.get("type");

        if ("image".equals(type)) {
            sends.add(new Send("image_processor", Map.of("item", item)));
        } else if ("text".equals(type)) {
            sends.add(new Send("text_processor", Map.of("item", item)));
        } else if ("video".equals(type)) {
            sends.add(new Send("video_processor", Map.of("item", item)));
        }
    }

    return sends;
};
```

这种模式特别适用于：

- **批量处理**：需要对大量数据项进行并行处理
- **多媒体处理**：根据文件类型选择不同的处理器
- **分布式计算**：将大任务分解为小任务并行执行
- **动态工作流**：根据运行时数据决定执行路径

## 异步支持

Spring AI Alibaba Graph 原生支持异步操作，这对于 I/O 密集型任务特别有用。

### 异步节点定义

```java
import java.util.concurrent.CompletableFuture;

@Configuration
public class AsyncGraphExample {

    @Autowired
    private ChatClient chatClient;

    @Bean
    public CompiledGraph asyncGraph() {
        KeyStrategyFactory keyStrategyFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("messages", KeyStrategy.APPEND);
            strategies.put("processing_time", KeyStrategy.REPLACE);
            return strategies;
        };

        // 异步 LLM 调用节点
        AsyncNodeAction asyncLLMAction = async(state -> {
            long startTime = System.currentTimeMillis();

            List<Message> messages = state.value("messages", List.class)
                .orElse(new ArrayList<>());

            // 异步调用 LLM
            return CompletableFuture.supplyAsync(() -> {
                try {
                    String response = chatClient.prompt()
                        .messages(messages)
                        .call()
                        .content();

                    long processingTime = System.currentTimeMillis() - startTime;

                    return Map.of(
                        "messages", List.of(new AssistantMessage(response)),
                        "processing_time", processingTime
                    );
                } catch (Exception e) {
                    throw new RuntimeException("LLM 调用失败", e);
                }
            });
        });

        // 异步数据处理节点
        AsyncNodeAction asyncDataProcessingAction = async(state -> {
            String input = state.value("input", String.class).orElse("");

            return CompletableFuture.supplyAsync(() -> {
                // 模拟异步数据处理
                try {
                    Thread.sleep(1000); // 模拟 I/O 操作
                    String processed = processDataAsync(input);
                    return Map.of("processed_data", processed);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("处理被中断", e);
                }
            });
        });

        return new StateGraph(keyStrategyFactory)
            .addNode("llm_call", asyncLLMAction)
            .addNode("data_processing", asyncDataProcessingAction)
            .addEdge(START, "llm_call")
            .addEdge("llm_call", "data_processing")
            .addEdge("data_processing", END)
            .compile();
    }

    private String processDataAsync(String input) {
        // 模拟异步数据处理逻辑
        return "异步处理结果: " + input.toUpperCase();
    }
}
```

### 异步图调用

```java
@Service
public class AsyncGraphService {

    @Autowired
    private CompiledGraph asyncGraph;

    public CompletableFuture<String> processAsync(String input) {
        // 异步调用图
        return CompletableFuture.supplyAsync(() -> {
            Optional<OverAllState> result = asyncGraph.invoke(Map.of(
                "input", input,
                "messages", List.of(new UserMessage("处理这个输入: " + input))
            ));

            return result.map(state ->
                state.value("processed_data", String.class).orElse("无结果")
            ).orElse("执行失败");
        });
    }

    public void demonstrateAsyncStreaming() {
        // 异步流式执行
        asyncGraph.stream(Map.of("input", "测试数据"))
            .subscribe(
                nodeOutput -> {
                    System.out.println("节点 '" + nodeOutput.nodeId() + "' 完成");
                    Long processingTime = nodeOutput.state()
                        .value("processing_time", Long.class).orElse(0L);
                    if (processingTime > 0) {
                        System.out.println("处理时间: " + processingTime + "ms");
                    }
                },
                error -> System.err.println("执行错误: " + error.getMessage()),
                () -> System.out.println("异步流式执行完成")
            );
    }
}
```

### 异步最佳实践

```java
// 1. 合理配置线程池
@Configuration
public class AsyncConfig {

    @Bean
    public TaskExecutor graphTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("graph-async-");
        executor.initialize();
        return executor;
    }
}

// 2. 异常处理
AsyncNodeAction robustAsyncAction = async(state -> {
    return CompletableFuture.supplyAsync(() -> {
        try {
            // 异步操作
            return performAsyncOperation(state);
        } catch (Exception e) {
            // 优雅处理异常
            return Map.of(
                "error", e.getMessage(),
                "status", "failed"
            );
        }
    }).exceptionally(throwable -> {
        // 异常恢复
        return Map.of(
            "error", "异步操作失败: " + throwable.getMessage(),
            "status", "error"
        );
    });
});
```

## 管道模式（Pipeline Pattern）

管道模式将复杂的处理过程分解为一系列简单的步骤，每个步骤专注于特定的转换：

```java
@Configuration
public class DataProcessingPipeline {

    @Bean
    public CompiledGraph dataProcessingWorkflow() {
        KeyStrategyFactory keyStrategyFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("raw_data", KeyStrategy.REPLACE);
            strategies.put("cleaned_data", KeyStrategy.REPLACE);
            strategies.put("transformed_data", KeyStrategy.REPLACE);
            strategies.put("validated_data", KeyStrategy.REPLACE);
            strategies.put("processing_log", KeyStrategy.APPEND);
            return strategies;
        };

        // 数据清洗节点
        NodeAction cleaningAction = state -> {
            Object rawData = state.value("raw_data", Object.class).orElse(null);
            Object cleanedData = performDataCleaning(rawData);

            return Map.of(
                "cleaned_data", cleanedData,
                "processing_log", "数据清洗完成: " + System.currentTimeMillis()
            );
        };

        // 数据转换节点
        NodeAction transformationAction = state -> {
            Object cleanedData = state.value("cleaned_data", Object.class).orElse(null);
            Object transformedData = performDataTransformation(cleanedData);

            return Map.of(
                "transformed_data", transformedData,
                "processing_log", "数据转换完成: " + System.currentTimeMillis()
            );
        };

        // 数据验证节点
        NodeAction validationAction = state -> {
            Object transformedData = state.value("transformed_data", Object.class).orElse(null);

            if (isValidData(transformedData)) {
                return Map.of(
                    "validated_data", transformedData,
                    "processing_log", "数据验证通过: " + System.currentTimeMillis()
                );
            } else {
                return Map.of(
                    "error", "数据验证失败",
                    "processing_log", "数据验证失败: " + System.currentTimeMillis()
                );
            }
        };

        return new StateGraph(keyStrategyFactory)
            .addNode("cleaning", node_async(cleaningAction))
            .addNode("transformation", node_async(transformationAction))
            .addNode("validation", node_async(validationAction))

            .addEdge(START, "cleaning")
            .addEdge("cleaning", "transformation")
            .addEdge("transformation", "validation")
            .addEdge("validation", END)

            .compile();
    }

    private Object performDataCleaning(Object rawData) {
        // 实现数据清洗逻辑
        return rawData;
    }

    private Object performDataTransformation(Object cleanedData) {
        // 实现数据转换逻辑
        return cleanedData;
    }

    private boolean isValidData(Object data) {
        // 实现数据验证逻辑
        return data != null;
    }
}
```

## 并行处理实际应用

### 多文档处理工作流

```java
@Configuration
public class DocumentProcessingWorkflow {

    @Bean
    public CompiledGraph documentProcessingGraph() {
        KeyStrategyFactory keyStrategyFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("documents", KeyStrategy.REPLACE);
            strategies.put("processed_documents", KeyStrategy.APPEND);
            strategies.put("summary", KeyStrategy.REPLACE);
            return strategies;
        };

        // 文档分发节点
        NodeAction distributeDocumentsAction = state -> {
            List<String> documents = state.value("documents", List.class).orElse(new ArrayList<>());
            return Map.of("document_count", documents.size());
        };

        // 文档处理节点（并行执行）
        NodeAction processDocumentAction = state -> {
            String document = state.value("document", String.class).orElse("");
            
            // 模拟文档处理
            String processed = "已处理: " + document + " (长度: " + document.length() + ")";
            
            return Map.of("processed_documents", List.of(processed));
        };

        // 汇总节点
        NodeAction summarizeAction = state -> {
            List<String> processedDocs = state.value("processed_documents", List.class)
                .orElse(new ArrayList<>());
            
            String summary = String.format("共处理 %d 个文档", processedDocs.size());
            return Map.of("summary", summary);
        };

        // 动态分发逻辑
        EdgeAction distributeLogic = state -> {
            List<String> documents = state.value("documents", List.class).orElse(new ArrayList<>());
            
            return documents.stream()
                .map(doc -> new Send("process_document", Map.of("document", doc)))
                .collect(Collectors.toList());
        };

        return new StateGraph(keyStrategyFactory)
            .addNode("distribute", node_async(distributeDocumentsAction))
            .addNode("process_document", node_async(processDocumentAction))
            .addNode("summarize", node_async(summarizeAction))

            .addEdge(START, "distribute")
            .addConditionalEdges("distribute", edge_async(distributeLogic))
            .addEdge("process_document", "summarize")
            .addEdge("summarize", END)

            .compile();
    }
}
```

## 下一步

- 学习可视化和调试：[可视化和调试](./visualization-debugging)
- 返回控制流：[控制流](./control-flow)
- 返回总览：[使用 Graph API](./use-graph-api)
