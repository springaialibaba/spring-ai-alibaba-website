---
title: 子图
keywords: ["Spring AI Alibaba", "Graph", "Subgraphs", "子图", "模块化"]
description: "学习如何使用 Spring AI Alibaba Graph 的子图功能，构建模块化、可复用的工作流组件。"
---

## 概述

子图（Subgraphs）是 Spring AI Alibaba Graph 的一个强大特性，它允许您将复杂的工作流分解为更小、更易管理的模块化组件。子图可以独立开发、测试和维护，然后在多个父图中重复使用。

### 为什么使用子图？

子图解决了大型工作流开发中的几个关键问题：

1. **模块化设计** — 将复杂逻辑分解为独立的、可重用的组件
2. **代码复用** — 在多个工作流中重复使用相同的处理逻辑
3. **团队协作** — 不同团队可以独立开发不同的子图模块
4. **维护性** — 更容易测试、调试和维护小型的功能模块
5. **版本管理** — 可以独立版本化和升级子图组件

## 基础子图概念

### 1. 创建简单子图

```java
import com.alibaba.cloud.ai.graph.SubGraph;
import com.alibaba.cloud.ai.graph.StateGraph;

@Component
public class DataValidationSubGraph {
    
    @Bean
    public CompiledGraph dataValidationGraph() {
        // 定义子图的状态策略
        KeyStrategyFactory subGraphStateFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("input_data", KeyStrategy.REPLACE);
            strategies.put("validation_errors", KeyStrategy.APPEND);
            strategies.put("validated_data", KeyStrategy.REPLACE);
            strategies.put("validation_status", KeyStrategy.REPLACE);
            return strategies;
        };
        
        // 数据格式验证节点
        NodeAction formatValidationAction = state -> {
            Object inputData = state.value("input_data", Object.class).orElse(null);
            List<String> errors = validateFormat(inputData);
            
            if (errors.isEmpty()) {
                return Map.of(
                    "validation_status", "format_valid",
                    "formatted_data", inputData
                );
            } else {
                return Map.of(
                    "validation_status", "format_invalid",
                    "validation_errors", errors
                );
            }
        };
        
        // 业务规则验证节点
        NodeAction businessValidationAction = state -> {
            Object formattedData = state.value("formatted_data", Object.class).orElse(null);
            List<String> errors = validateBusinessRules(formattedData);
            
            if (errors.isEmpty()) {
                return Map.of(
                    "validation_status", "business_valid",
                    "validated_data", formattedData
                );
            } else {
                return Map.of(
                    "validation_status", "business_invalid",
                    "validation_errors", errors
                );
            }
        };
        
        // 路由逻辑
        EdgeAction validationRouter = state -> {
            String status = state.value("validation_status", String.class).orElse("unknown");
            switch (status) {
                case "format_valid":
                    return "business_validation";
                case "business_valid":
                    return END;
                default:
                    return END;  // 验证失败，结束子图
            }
        };
        
        // 构建子图
        return new StateGraph(subGraphStateFactory)
            .addNode("format_validation", node_async(formatValidationAction))
            .addNode("business_validation", node_async(businessValidationAction))
            
            .addEdge(START, "format_validation")
            .addConditionalEdges("format_validation", edge_async(validationRouter))
            .addConditionalEdges("business_validation", edge_async(validationRouter))
            
            .compile();
    }
    
    private List<String> validateFormat(Object data) {
        // 实现格式验证逻辑
        List<String> errors = new ArrayList<>();
        if (data == null) {
            errors.add("数据不能为空");
        }
        return errors;
    }
    
    private List<String> validateBusinessRules(Object data) {
        // 实现业务规则验证逻辑
        List<String> errors = new ArrayList<>();
        // 添加具体的业务验证逻辑
        return errors;
    }
}
```

### 2. 在父图中使用子图

```java
@Configuration
public class MainWorkflowConfiguration {
    
    @Autowired
    private CompiledGraph dataValidationGraph;
    
    @Bean
    public CompiledGraph mainWorkflow() {
        KeyStrategyFactory mainStateFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("raw_input", KeyStrategy.REPLACE);
            strategies.put("processed_data", KeyStrategy.REPLACE);
            strategies.put("final_result", KeyStrategy.REPLACE);
            strategies.put("validation_errors", KeyStrategy.APPEND);
            return strategies;
        };
        
        // 数据预处理节点
        NodeAction preprocessAction = state -> {
            String rawInput = state.value("raw_input", String.class).orElse("");
            Object preprocessedData = preprocessData(rawInput);
            
            return Map.of("input_data", preprocessedData);
        };
        
        // 数据处理节点
        NodeAction processAction = state -> {
            Object validatedData = state.value("validated_data", Object.class).orElse(null);
            
            if (validatedData != null) {
                Object processedData = processValidatedData(validatedData);
                return Map.of("processed_data", processedData);
            } else {
                return Map.of("error", "没有有效数据可处理");
            }
        };
        
        // 构建主工作流，包含子图
        return new StateGraph(mainStateFactory)
            .addNode("preprocess", node_async(preprocessAction))
            .addNode("validation", dataValidationGraph)  // 添加子图作为节点
            .addNode("process", node_async(processAction))
            
            .addEdge(START, "preprocess")
            .addEdge("preprocess", "validation")
            .addEdge("validation", "process")
            .addEdge("process", END)
            
            .compile();
    }
}
```

## 高级子图模式

### 1. 参数化子图

```java
@Component
public class ParameterizedSubGraphFactory {
    
    public CompiledGraph createDataProcessingSubGraph(ProcessingConfig config) {
        KeyStrategyFactory stateFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("input", KeyStrategy.REPLACE);
            strategies.put("output", KeyStrategy.REPLACE);
            strategies.put("config", KeyStrategy.REPLACE);
            return strategies;
        };
        
        // 配置注入节点
        NodeAction configInjectionAction = state -> {
            return Map.of("config", config);
        };
        
        // 可配置的处理节点
        NodeAction configurableProcessingAction = state -> {
            Object input = state.value("input", Object.class).orElse(null);
            ProcessingConfig processingConfig = state.value("config", ProcessingConfig.class)
                .orElse(ProcessingConfig.defaultConfig());
            
            Object result = processWithConfig(input, processingConfig);
            return Map.of("output", result);
        };
        
        return new StateGraph(stateFactory)
            .addNode("inject_config", node_async(configInjectionAction))
            .addNode("process", node_async(configurableProcessingAction))
            
            .addEdge(START, "inject_config")
            .addEdge("inject_config", "process")
            .addEdge("process", END)
            
            .compile();
    }
    
    // 使用示例
    @Bean
    public CompiledGraph textProcessingWorkflow() {
        ProcessingConfig textConfig = ProcessingConfig.builder()
            .algorithm("nlp")
            .parameters(Map.of("language", "zh-CN", "model", "bert"))
            .build();
        
        CompiledGraph textProcessingSubGraph = createDataProcessingSubGraph(textConfig);
        
        return new StateGraph(keyStrategyFactory)
            .addNode("text_processing", textProcessingSubGraph)
            .addEdge(START, "text_processing")
            .addEdge("text_processing", END)
            .compile();
    }
}
```

### 2. 嵌套子图

```java
@Configuration
public class NestedSubGraphConfiguration {
    
    // 最内层子图：单个文档处理
    @Bean
    public CompiledGraph documentProcessingSubGraph() {
        return new StateGraph(documentStateFactory)
            .addNode("extract_text", node_async(textExtractionAction))
            .addNode("analyze_sentiment", node_async(sentimentAnalysisAction))
            .addNode("extract_entities", node_async(entityExtractionAction))
            
            .addEdge(START, "extract_text")
            .addEdge("extract_text", "analyze_sentiment")
            .addEdge("analyze_sentiment", "extract_entities")
            .addEdge("extract_entities", END)
            
            .compile();
    }
    
    // 中层子图：批量文档处理
    @Bean
    public CompiledGraph batchProcessingSubGraph() {
        return new StateGraph(batchStateFactory)
            .addNode("split_batch", node_async(batchSplitAction))
            .addNode("process_document", documentProcessingSubGraph())  // 嵌套子图
            .addNode("aggregate_results", node_async(aggregationAction))
            
            .addEdge(START, "split_batch")
            .addEdge("split_batch", "process_document")
            .addEdge("process_document", "aggregate_results")
            .addEdge("aggregate_results", END)
            
            .compile();
    }
    
    // 顶层主图：完整的文档处理流水线
    @Bean
    public CompiledGraph documentPipelineWorkflow() {
        return new StateGraph(pipelineStateFactory)
            .addNode("validate_input", node_async(inputValidationAction))
            .addNode("batch_processing", batchProcessingSubGraph())  // 使用中层子图
            .addNode("generate_report", node_async(reportGenerationAction))
            
            .addEdge(START, "validate_input")
            .addEdge("validate_input", "batch_processing")
            .addEdge("batch_processing", "generate_report")
            .addEdge("generate_report", END)
            
            .compile();
    }
}
```

### 3. 条件子图选择

```java
public class ConditionalSubGraphNode implements NodeAction {
    
    @Autowired
    private Map<String, CompiledGraph> processingSubGraphs;
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        String dataType = state.value("data_type", String.class).orElse("default");
        Object inputData = state.value("input_data", Object.class).orElse(null);
        
        // 根据数据类型选择相应的子图
        CompiledGraph selectedSubGraph = processingSubGraphs.get(dataType + "_processing");
        
        if (selectedSubGraph == null) {
            selectedSubGraph = processingSubGraphs.get("default_processing");
        }
        
        try {
            // 执行选定的子图
            Optional<OverAllState> result = selectedSubGraph.invoke(
                Map.of("input", inputData),
                RunnableConfig.builder()
                    .configurable(Map.of("thread_id", UUID.randomUUID().toString()))
                    .build()
            );
            
            return result.map(resultState -> Map.of(
                "subgraph_result", resultState.value("output", Object.class).orElse(null),
                "selected_subgraph", dataType + "_processing"
            )).orElse(Map.of("error", "子图执行失败"));
            
        } catch (Exception e) {
            return Map.of(
                "error", "子图执行异常: " + e.getMessage(),
                "selected_subgraph", dataType + "_processing"
            );
        }
    }
}

@Configuration
public class ConditionalSubGraphConfiguration {
    
    @Bean
    public Map<String, CompiledGraph> processingSubGraphs() {
        Map<String, CompiledGraph> subGraphs = new HashMap<>();
        
        // 文本处理子图
        subGraphs.put("text_processing", createTextProcessingSubGraph());
        
        // 图像处理子图
        subGraphs.put("image_processing", createImageProcessingSubGraph());
        
        // 音频处理子图
        subGraphs.put("audio_processing", createAudioProcessingSubGraph());
        
        // 默认处理子图
        subGraphs.put("default_processing", createDefaultProcessingSubGraph());
        
        return subGraphs;
    }
}
```

## 子图通信和状态管理

### 1. 状态映射和转换

```java
public class StateTransformationSubGraph {
    
    public static CompiledGraph createWithStateMapping(
            CompiledGraph innerSubGraph,
            Function<OverAllState, Map<String, Object>> inputMapper,
            Function<OverAllState, Map<String, Object>> outputMapper) {
        
        KeyStrategyFactory wrapperStateFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("original_state", KeyStrategy.REPLACE);
            strategies.put("mapped_input", KeyStrategy.REPLACE);
            strategies.put("subgraph_output", KeyStrategy.REPLACE);
            strategies.put("final_output", KeyStrategy.REPLACE);
            return strategies;
        };
        
        // 输入映射节点
        NodeAction inputMappingAction = state -> {
            Map<String, Object> mappedInput = inputMapper.apply(state);
            return Map.of(
                "original_state", state.data(),
                "mapped_input", mappedInput
            );
        };
        
        // 子图执行节点
        NodeAction subGraphExecutionAction = state -> {
            Map<String, Object> mappedInput = state.value("mapped_input", Map.class)
                .orElse(Map.of());
            
            try {
                Optional<OverAllState> result = innerSubGraph.invoke(mappedInput);
                return result.map(resultState -> Map.of(
                    "subgraph_output", resultState.data()
                )).orElse(Map.of("error", "子图执行失败"));
            } catch (Exception e) {
                return Map.of("error", "子图执行异常: " + e.getMessage());
            }
        };
        
        // 输出映射节点
        NodeAction outputMappingAction = state -> {
            Map<String, Object> subGraphOutput = state.value("subgraph_output", Map.class)
                .orElse(Map.of());
            
            // 创建临时状态对象用于输出映射
            OverAllState tempState = OverAllState.builder()
                .data(subGraphOutput)
                .build();
            
            Map<String, Object> mappedOutput = outputMapper.apply(tempState);
            return Map.of("final_output", mappedOutput);
        };
        
        return new StateGraph(wrapperStateFactory)
            .addNode("input_mapping", node_async(inputMappingAction))
            .addNode("subgraph_execution", node_async(subGraphExecutionAction))
            .addNode("output_mapping", node_async(outputMappingAction))
            
            .addEdge(START, "input_mapping")
            .addEdge("input_mapping", "subgraph_execution")
            .addEdge("subgraph_execution", "output_mapping")
            .addEdge("output_mapping", END)
            
            .compile();
    }
}

// 使用示例
@Bean
public CompiledGraph mappedSubGraphWorkflow() {
    CompiledGraph coreProcessingSubGraph = createCoreProcessingSubGraph();
    
    // 定义输入映射：从主图状态提取子图需要的数据
    Function<OverAllState, Map<String, Object>> inputMapper = state -> {
        return Map.of(
            "data", state.value("raw_data", Object.class).orElse(null),
            "config", state.value("processing_config", Object.class).orElse(null)
        );
    };
    
    // 定义输出映射：将子图结果映射回主图状态
    Function<OverAllState, Map<String, Object>> outputMapper = state -> {
        return Map.of(
            "processed_result", state.value("result", Object.class).orElse(null),
            "processing_metadata", state.value("metadata", Object.class).orElse(null)
        );
    };
    
    CompiledGraph mappedSubGraph = StateTransformationSubGraph.createWithStateMapping(
        coreProcessingSubGraph, inputMapper, outputMapper);
    
    return new StateGraph(mainStateFactory)
        .addNode("prepare_data", node_async(dataPreparationAction))
        .addNode("mapped_processing", mappedSubGraph)
        .addNode("finalize_result", node_async(finalizationAction))
        
        .addEdge(START, "prepare_data")
        .addEdge("prepare_data", "mapped_processing")
        .addEdge("mapped_processing", "finalize_result")
        .addEdge("finalize_result", END)
        
        .compile();
}
```

### 2. 子图间通信

```java
@Component
public class InterSubGraphCommunication {
    
    private final Map<String, BlockingQueue<Message>> messageQueues = new ConcurrentHashMap<>();
    
    // 发送消息到其他子图
    public void sendMessage(String targetSubGraph, Message message) {
        messageQueues.computeIfAbsent(targetSubGraph, k -> new LinkedBlockingQueue<>())
            .offer(message);
    }
    
    // 接收来自其他子图的消息
    public Optional<Message> receiveMessage(String subGraphId, long timeoutMs) {
        try {
            BlockingQueue<Message> queue = messageQueues.get(subGraphId);
            if (queue != null) {
                Message message = queue.poll(timeoutMs, TimeUnit.MILLISECONDS);
                return Optional.ofNullable(message);
            }
            return Optional.empty();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        }
    }
}

public class CommunicatingSubGraphNode implements NodeAction {
    
    @Autowired
    private InterSubGraphCommunication communication;
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        String subGraphId = state.value("subgraph_id", String.class).orElse("unknown");
        
        // 处理本地逻辑
        Object localResult = performLocalProcessing(state);
        
        // 发送结果给其他子图
        Message message = Message.builder()
            .senderId(subGraphId)
            .type("PROCESSING_COMPLETE")
            .data(localResult)
            .timestamp(System.currentTimeMillis())
            .build();
        
        communication.sendMessage("coordinator_subgraph", message);
        
        // 等待协调器的响应
        Optional<Message> response = communication.receiveMessage(subGraphId, 5000);
        
        if (response.isPresent()) {
            return Map.of(
                "local_result", localResult,
                "coordinator_response", response.get().getData()
            );
        } else {
            return Map.of(
                "local_result", localResult,
                "coordinator_response", "超时无响应"
            );
        }
    }
}
```

## 子图测试和调试

### 1. 单元测试子图

```java
@SpringBootTest
public class DataValidationSubGraphTest {
    
    @Autowired
    private CompiledGraph dataValidationGraph;
    
    @Test
    public void testValidDataProcessing() {
        // 准备测试数据
        Map<String, Object> validInput = Map.of(
            "input_data", createValidTestData()
        );
        
        // 执行子图
        Optional<OverAllState> result = dataValidationGraph.invoke(validInput);
        
        // 验证结果
        assertTrue(result.isPresent());
        assertEquals("business_valid", 
            result.get().value("validation_status", String.class).orElse(""));
        assertNotNull(result.get().value("validated_data", Object.class).orElse(null));
    }
    
    @Test
    public void testInvalidDataHandling() {
        // 准备无效测试数据
        Map<String, Object> invalidInput = Map.of(
            "input_data", createInvalidTestData()
        );
        
        // 执行子图
        Optional<OverAllState> result = dataValidationGraph.invoke(invalidInput);
        
        // 验证错误处理
        assertTrue(result.isPresent());
        assertEquals("format_invalid", 
            result.get().value("validation_status", String.class).orElse(""));
        
        List<String> errors = result.get().value("validation_errors", List.class)
            .orElse(List.of());
        assertFalse(errors.isEmpty());
    }
}
```

### 2. 集成测试

```java
@SpringBootTest
public class MainWorkflowIntegrationTest {
    
    @Autowired
    private CompiledGraph mainWorkflow;
    
    @Test
    public void testCompleteWorkflowWithSubGraphs() {
        // 准备端到端测试数据
        Map<String, Object> input = Map.of(
            "raw_input", "测试输入数据"
        );
        
        // 执行完整工作流
        Optional<OverAllState> result = mainWorkflow.invoke(input);
        
        // 验证整体结果
        assertTrue(result.isPresent());
        assertNotNull(result.get().value("processed_data", Object.class).orElse(null));
        
        // 验证子图的执行痕迹
        assertNotNull(result.get().value("validated_data", Object.class).orElse(null));
    }
}
```

## 最佳实践

### 1. 子图设计原则

- **单一职责**：每个子图应该专注于一个明确的功能领域
- **松耦合**：子图之间应该通过明确定义的接口进行交互
- **可测试性**：设计子图时考虑独立测试的需求
- **可重用性**：避免在子图中硬编码特定于某个父图的逻辑

### 2. 状态管理

- **状态隔离**：子图应该有自己的状态空间，避免与父图状态冲突
- **接口定义**：明确定义子图的输入和输出状态结构
- **状态转换**：在必要时使用状态映射来适配不同的状态结构
- **错误传播**：确保子图中的错误能够正确传播到父图

### 3. 性能考虑

- **资源共享**：合理共享资源，避免重复初始化
- **并行执行**：在可能的情况下并行执行独立的子图
- **缓存策略**：对于重复使用的子图结果考虑缓存
- **监控指标**：为子图添加独立的性能监控指标

## 下一步

- [时间旅行](./time-travel) - 学习状态回滚和分支功能
- [持久执行](./durable-execution) - 了解持久执行和故障恢复
- [内存管理](./memory) - 探索图的内存管理和优化策略
