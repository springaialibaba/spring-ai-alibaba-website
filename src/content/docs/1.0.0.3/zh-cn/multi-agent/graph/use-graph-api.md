---
title: 使用 Graph API
keywords: ["Spring AI Alibaba", "Graph API", "多智能体", "工作流", "实践"]
description: "学习如何使用 Spring AI Alibaba Graph API 构建实际的多智能体应用，包括实际应用示例、高级特性和最佳实践。"
---

## 实际应用示例

### 1. 客户评价处理系统

```java
@Configuration
public class CustomerFeedbackWorkflow {
    
    @Bean
    public CompiledGraph customerFeedbackGraph(ChatClient chatClient) throws GraphStateException {
        // 状态工厂
        KeyStrategyFactory stateFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("input", new ReplaceStrategy());
            strategies.put("classifier_output", new ReplaceStrategy());
            strategies.put("solution", new ReplaceStrategy());
            return strategies;
        };
        
        // 创建节点
        var feedbackClassifier = new QuestionClassifierNode(
            chatClient,
            "请将客户反馈分类为：positive（正面）或 negative（负面）",
            Map.of("positive", "positive", "negative", "negative")
        );
        
        var specificClassifier = new QuestionClassifierNode(
            chatClient,
            "请将负面反馈细分为：service（服务）、product（产品）、delivery（配送）",
            Map.of("service", "service", "product", "product", "delivery", "delivery")
        );
        
        var recorder = new RecorderNode();
        
        // 构建工作流
        StateGraph workflow = new StateGraph(stateFactory)
            .addNode("feedback_classifier", node_async(feedbackClassifier))
            .addNode("specific_classifier", node_async(specificClassifier))
            .addNode("recorder", node_async(recorder))
            
            .addEdge(START, "feedback_classifier")
            .addConditionalEdges("feedback_classifier", 
                edge_async(new FeedbackDispatcher()), 
                Map.of(
                    "positive", "recorder",
                    "negative", "specific_classifier"
                ))
            .addConditionalEdges("specific_classifier",
                edge_async(new CategoryDispatcher()),
                Map.of(
                    "service", "recorder",
                    "product", "recorder", 
                    "delivery", "recorder"
                ))
            .addEdge("recorder", END);
        
        return workflow.compile();
    }
}
```

### 2. 智能研究助手

```java
@Configuration
public class ResearchAssistantWorkflow {
    
    @Bean
    public CompiledGraph researchGraph(ChatClient chatClient) throws GraphStateException {
        KeyStrategyFactory stateFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("query", new ReplaceStrategy());
            strategies.put("research_plan", new ReplaceStrategy());
            strategies.put("collected_info", new AppendStrategy());
            strategies.put("final_report", new ReplaceStrategy());
            return strategies;
        };
        
        // 研究规划节点
        NodeAction plannerAction = state -> {
            String query = (String) state.value("query").orElse("");
            String plan = chatClient.prompt()
                .system("你是一个研究规划专家，请为以下查询制定详细的研究计划")
                .user(query)
                .call()
                .content();
            
            return Map.of("research_plan", plan);
        };
        
        // 信息收集节点
        NodeAction collectorAction = state -> {
            String plan = (String) state.value("research_plan").orElse("");
            // 这里可以集成搜索引擎、数据库等
            String info = performResearch(plan);
            
            return Map.of("collected_info", info);
        };
        
        // 报告生成节点
        NodeAction writerAction = state -> {
            String query = (String) state.value("query").orElse("");
            List<String> info = (List<String>) state.value("collected_info").orElse(List.of());
            
            String context = String.join("\n", info);
            String report = chatClient.prompt()
                .system("基于收集的信息，生成详细的研究报告")
                .user("查询：" + query + "\n\n信息：" + context)
                .call()
                .content();
            
            return Map.of("final_report", report);
        };
        
        StateGraph workflow = new StateGraph(stateFactory)
            .addNode("planner", node_async(plannerAction))
            .addNode("collector", node_async(collectorAction))
            .addNode("writer", node_async(writerAction))
            
            .addEdge(START, "planner")
            .addEdge("planner", "collector")
            .addEdge("collector", "writer")
            .addEdge("writer", END);
        
        return workflow.compile();
    }
}
```

### 3. 并行处理工作流

```java
@Configuration
public class ParallelProcessingWorkflow {
    
    @Bean
    public CompiledGraph parallelGraph(ChatClient chatClient) throws GraphStateException {
        KeyStrategyFactory stateFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("input", new ReplaceStrategy());
            strategies.put("results", new MergeStrategy());
            return strategies;
        };
        
        // 数据分发节点
        NodeAction dispatcherAction = state -> {
            String input = (String) state.value("input").orElse("");
            // 将输入分发给多个处理器
            return Map.of("task_data", input);
        };
        
        // 并行处理节点
        NodeAction processor1Action = state -> {
            String data = (String) state.value("task_data").orElse("");
            String result = processWithModel1(data);
            return Map.of("result1", result);
        };
        
        NodeAction processor2Action = state -> {
            String data = (String) state.value("task_data").orElse("");
            String result = processWithModel2(data);
            return Map.of("result2", result);
        };
        
        NodeAction processor3Action = state -> {
            String data = (String) state.value("task_data").orElse("");
            String result = processWithModel3(data);
            return Map.of("result3", result);
        };
        
        // 结果聚合节点
        NodeAction aggregatorAction = state -> {
            String result1 = (String) state.value("result1").orElse("");
            String result2 = (String) state.value("result2").orElse("");
            String result3 = (String) state.value("result3").orElse("");
            
            String finalResult = aggregateResults(result1, result2, result3);
            return Map.of("final_result", finalResult);
        };
        
        StateGraph workflow = new StateGraph(stateFactory)
            .addNode("dispatcher", node_async(dispatcherAction))
            .addNode("processor1", node_async(processor1Action))
            .addNode("processor2", node_async(processor2Action))
            .addNode("processor3", node_async(processor3Action))
            .addNode("aggregator", node_async(aggregatorAction))
            
            .addEdge(START, "dispatcher")
            // 并行分支
            .addEdge("dispatcher", "processor1")
            .addEdge("dispatcher", "processor2")
            .addEdge("dispatcher", "processor3")
            // 汇聚到聚合器
            .addEdge("processor1", "aggregator")
            .addEdge("processor2", "aggregator")
            .addEdge("processor3", "aggregator")
            .addEdge("aggregator", END);
        
        return workflow.compile();
    }
}
```

## 高级特性

### 1. 人机协作（Human-in-the-loop）

```java
@Configuration
public class HumanInTheLoopWorkflow {

    @Bean
    public CompiledGraph humanInteractionGraph() throws GraphStateException {
        // 配置中断点
        CompileConfig config = CompileConfig.builder()
            .interruptBefore("human_review")  // 在人工审核前中断
            .interruptAfter("critical_decision")  // 在关键决策后中断
            .build();

        StateGraph workflow = new StateGraph(keyStrategyFactory)
            .addNode("analyzer", node_async(analyzerAction))
            .addNode("human_review", node_async(humanReviewAction))
            .addNode("finalizer", node_async(finalizerAction))

            .addEdge(START, "analyzer")
            .addEdge("analyzer", "human_review")
            .addEdge("human_review", "finalizer")
            .addEdge("finalizer", END);

        return workflow.compile(config);
    }
}

// 使用示例
@Service
public class HumanInteractionService {

    public String processWithHumanReview(String input) {
        // 启动工作流
        CompiledGraph graph = humanInteractionGraph();

        // 执行到中断点
        Optional<OverAllState> state = graph.invoke(Map.of("input", input));

        // 等待人工干预...
        // 可以通过 Web 界面让用户修改状态

        // 恢复执行
        RunnableConfig config = RunnableConfig.builder()
            .resumeFrom(state.get())
            .build();

        return graph.invoke(Map.of(), config)
            .map(s -> (String) s.value("result").orElse(""))
            .orElse("");
    }
}
```

### 2. 检查点和状态恢复

```java
@Configuration
public class CheckpointWorkflow {

    @Bean
    public CompiledGraph checkpointGraph() throws GraphStateException {
        // 配置检查点保存器
        CheckpointSaver checkpointSaver = new MemoryCheckpointSaver();

        CompileConfig config = CompileConfig.builder()
            .checkpointer(checkpointSaver)
            .build();

        StateGraph workflow = new StateGraph(keyStrategyFactory)
            .addNode("step1", node_async(step1Action))
            .addNode("step2", node_async(step2Action))
            .addNode("step3", node_async(step3Action))

            .addEdge(START, "step1")
            .addEdge("step1", "step2")
            .addEdge("step2", "step3")
            .addEdge("step3", END);

        return workflow.compile(config);
    }
}
```

### 3. 流式输出

```java
@RestController
public class StreamingController {

    private final CompiledGraph workflow;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamProcess(@RequestParam String input) {
        return workflow.stream(Map.of("input", input))
            .map(state -> {
                // 提取当前状态的输出
                return extractStreamContent(state);
            })
            .filter(content -> !content.isEmpty());
    }

    private String extractStreamContent(OverAllState state) {
        // 根据业务需求提取流式内容
        return state.value("current_output", String.class).orElse("");
    }
}
```

## 可视化和调试

### 1. 图结构可视化

```java
@Service
public class GraphVisualizationService {

    public String generateMermaidDiagram(CompiledGraph graph) {
        GraphRepresentation mermaid = graph.getGraph(GraphRepresentation.Type.MERMAID);
        return mermaid.content();
    }

    public String generatePlantUMLDiagram(CompiledGraph graph) {
        GraphRepresentation plantuml = graph.getGraph(GraphRepresentation.Type.PLANTUML);
        return plantuml.content();
    }
}
```

### 2. 执行监控

```java
@Component
public class GraphExecutionMonitor {

    private final MeterRegistry meterRegistry;

    public void monitorExecution(CompiledGraph graph, String workflowName) {
        Timer executionTimer = Timer.builder("graph.execution.duration")
            .tag("workflow", workflowName)
            .register(meterRegistry);

        Counter nodeCounter = Counter.builder("graph.node.executions")
            .tag("workflow", workflowName)
            .register(meterRegistry);

        // 添加执行监听器
        graph.addListener(GraphListener.builder()
            .onNodeStart((nodeId, state) -> {
                nodeCounter.increment(Tags.of("node", nodeId, "event", "start"));
            })
            .onNodeComplete((nodeId, state) -> {
                nodeCounter.increment(Tags.of("node", nodeId, "event", "complete"));
            })
            .build());
    }
}
```

## 最佳实践

### 1. 节点设计原则

- **单一职责**：每个节点专注于一个特定任务
- **无状态设计**：节点逻辑不依赖外部状态
- **异常处理**：优雅处理节点执行异常
- **性能考虑**：避免长时间阻塞操作

### 2. 状态管理策略

- **合理分层**：区分全局状态和局部状态
- **策略选择**：根据数据特点选择合适的合并策略
- **内存管理**：避免状态对象过大
- **序列化优化**：确保状态对象可序列化

### 3. 工作流设计模式

- **管道模式**：线性处理流程
- **分支模式**：条件分支处理
- **并行模式**：并行处理提升效率
- **循环模式**：迭代处理复杂任务

## 总结

Spring AI Alibaba Graph 提供了强大而灵活的多智能体工作流框架，通过声明式 API 和丰富的特性支持，开发者可以轻松构建复杂的 AI 应用。框架的核心优势包括：

- **声明式设计**：简洁的 API 和链式调用
- **Spring 集成**：完整的依赖注入和配置管理
- **丰富特性**：支持并行、中断、恢复、可视化等
- **生产就绪**：完整的监控、观测和错误处理

通过合理使用 Graph 框架，可以构建出高效、可靠、可维护的多智能体应用系统。
