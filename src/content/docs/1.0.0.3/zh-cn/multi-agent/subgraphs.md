---
title: 子图 (Subgraphs)
description: Spring AI Alibaba 子图功能
---

# 子图 (Subgraphs)

子图（Subgraphs）允许将复杂的多智能体工作流分解为更小、更易管理的组件，支持模块化设计和重用。

## 核心概念

### 子图类型
- **功能子图**: 实现特定功能的独立图
- **并行子图**: 可以并行执行的子图
- **条件子图**: 根据条件选择执行的子图
- **递归子图**: 可以调用自身的子图

### 子图特性
- **独立性**: 子图有自己的状态和上下文
- **可重用性**: 子图可以在多个地方重用
- **可组合性**: 子图可以嵌套和组合
- **可测试性**: 子图可以独立测试

## 基本配置

```java
@Configuration
@EnableSubgraphs
public class SubgraphConfig {
    
    @Bean
    public SubgraphManager subgraphManager() {
        return SubgraphManager.builder()
            .subgraphRegistry(subgraphRegistry())
            .executionContext(executionContext())
            .isolationLevel(IsolationLevel.ISOLATED)
            .build();
    }
    
    @Bean
    public SubgraphRegistry subgraphRegistry() {
        return new InMemorySubgraphRegistry();
    }
}
```

## 创建子图

### 简单子图

```java
@Component
public class DataProcessingSubgraph {
    
    @SubgraphDefinition(name = "data-validation")
    public StateGraph createDataValidationSubgraph() {
        return StateGraph.builder(DataValidationState.class)
            .addNode("check_format", this::checkFormat)
            .addNode("validate_content", this::validateContent)
            .addNode("sanitize_data", this::sanitizeData)
            .addEdge("check_format", "validate_content")
            .addEdge("validate_content", "sanitize_data")
            .setEntryPoint("check_format")
            .setFinishPoint("sanitize_data")
            .build();
    }
    
    private DataValidationState checkFormat(DataValidationState state) {
        String data = state.getRawData();
        boolean isValidFormat = dataFormatValidator.validate(data);
        
        return state.withFormatValid(isValidFormat);
    }
    
    private DataValidationState validateContent(DataValidationState state) {
        if (!state.isFormatValid()) {
            throw new InvalidDataFormatException("Data format validation failed");
        }
        
        String data = state.getRawData();
        ValidationResult result = contentValidator.validate(data);
        
        return state.withValidationResult(result);
    }
    
    private DataValidationState sanitizeData(DataValidationState state) {
        String cleanData = dataSanitizer.sanitize(state.getRawData());
        return state.withCleanData(cleanData);
    }
}
```

### 参数化子图

```java
@Component
public class ParameterizedSubgraph {
    
    @SubgraphDefinition(name = "model-inference")
    public StateGraph createModelInferenceSubgraph(
            @SubgraphParameter("model") String modelName,
            @SubgraphParameter("temperature") double temperature,
            @SubgraphParameter("maxTokens") int maxTokens) {
        
        return StateGraph.builder(InferenceState.class)
            .addNode("prepare_input", state -> prepareInput(state, modelName))
            .addNode("run_inference", state -> runInference(state, temperature, maxTokens))
            .addNode("process_output", this::processOutput)
            .addEdge("prepare_input", "run_inference")
            .addEdge("run_inference", "process_output")
            .setEntryPoint("prepare_input")
            .setFinishPoint("process_output")
            .build();
    }
    
    private InferenceState prepareInput(InferenceState state, String modelName) {
        String formattedInput = inputFormatter.format(state.getRawInput(), modelName);
        return state.withFormattedInput(formattedInput);
    }
    
    private InferenceState runInference(InferenceState state, double temperature, int maxTokens) {
        ChatOptions options = ChatOptionsBuilder.builder()
            .withTemperature(temperature)
            .withMaxTokens(maxTokens)
            .build();
        
        String result = chatClient.prompt()
            .user(state.getFormattedInput())
            .options(options)
            .call()
            .content();
        
        return state.withInferenceResult(result);
    }
}
```

## 子图调用

### 在主图中调用子图

```java
@Component
public class MainWorkflow {
    
    @Autowired
    private SubgraphManager subgraphManager;
    
    public StateGraph createMainWorkflow() {
        return StateGraph.builder(MainWorkflowState.class)
            .addNode("collect_data", this::collectData)
            .addNode("validate_data", this::callDataValidationSubgraph)
            .addNode("process_data", this::callDataProcessingSubgraph)
            .addNode("generate_report", this::generateReport)
            .addEdge("collect_data", "validate_data")
            .addEdge("validate_data", "process_data")
            .addEdge("process_data", "generate_report")
            .setEntryPoint("collect_data")
            .setFinishPoint("generate_report")
            .build();
    }
    
    private MainWorkflowState callDataValidationSubgraph(MainWorkflowState state) {
        // 准备子图输入
        DataValidationState subgraphInput = DataValidationState.builder()
            .rawData(state.getCollectedData())
            .build();
        
        // 调用子图
        SubgraphExecution execution = subgraphManager.executeSubgraph(
            "data-validation", 
            subgraphInput
        );
        
        // 等待子图完成
        DataValidationState result = execution.waitForCompletion(Duration.ofMinutes(5));
        
        // 将结果合并到主状态
        return state.withValidatedData(result.getCleanData());
    }
    
    private MainWorkflowState callDataProcessingSubgraph(MainWorkflowState state) {
        // 并行调用多个子图
        List<CompletableFuture<ProcessingResult>> futures = new ArrayList<>();
        
        for (String dataChunk : splitData(state.getValidatedData())) {
            CompletableFuture<ProcessingResult> future = CompletableFuture.supplyAsync(() -> {
                ProcessingState input = ProcessingState.builder()
                    .dataChunk(dataChunk)
                    .build();
                
                SubgraphExecution execution = subgraphManager.executeSubgraph(
                    "data-processing", 
                    input
                );
                
                return execution.waitForCompletion(Duration.ofMinutes(10));
            });
            
            futures.add(future);
        }
        
        // 等待所有子图完成
        List<ProcessingResult> results = futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());
        
        return state.withProcessingResults(results);
    }
}
```

### 动态子图调用

```java
@Service
public class DynamicSubgraphService {
    
    @Autowired
    private SubgraphRegistry subgraphRegistry;
    
    public <T> T executeSubgraphByName(String subgraphName, Object input, Class<T> outputType) {
        SubgraphDefinition definition = subgraphRegistry.getSubgraph(subgraphName);
        
        if (definition == null) {
            throw new SubgraphNotFoundException("Subgraph not found: " + subgraphName);
        }
        
        SubgraphExecution execution = subgraphManager.executeSubgraph(subgraphName, input);
        Object result = execution.waitForCompletion(Duration.ofMinutes(30));
        
        return outputType.cast(result);
    }
    
    public <T> CompletableFuture<T> executeSubgraphAsync(String subgraphName, Object input, Class<T> outputType) {
        return CompletableFuture.supplyAsync(() -> 
            executeSubgraphByName(subgraphName, input, outputType));
    }
    
    public List<String> getAvailableSubgraphs() {
        return subgraphRegistry.getAllSubgraphNames();
    }
    
    public SubgraphMetadata getSubgraphMetadata(String subgraphName) {
        SubgraphDefinition definition = subgraphRegistry.getSubgraph(subgraphName);
        
        return SubgraphMetadata.builder()
            .name(definition.getName())
            .description(definition.getDescription())
            .inputType(definition.getInputType())
            .outputType(definition.getOutputType())
            .parameters(definition.getParameters())
            .estimatedDuration(definition.getEstimatedDuration())
            .build();
    }
}
```

## 子图状态管理

### 状态隔离

```java
@Component
public class SubgraphStateManager {
    
    private final Map<String, SubgraphContext> subgraphContexts = new ConcurrentHashMap<>();
    
    public SubgraphContext createSubgraphContext(String executionId, String subgraphName) {
        SubgraphContext context = SubgraphContext.builder()
            .executionId(executionId)
            .subgraphName(subgraphName)
            .isolatedState(new HashMap<>())
            .parentContext(getCurrentContext())
            .createdAt(Instant.now())
            .build();
        
        subgraphContexts.put(executionId, context);
        return context;
    }
    
    public void setSubgraphState(String executionId, String key, Object value) {
        SubgraphContext context = subgraphContexts.get(executionId);
        if (context != null) {
            context.getIsolatedState().put(key, value);
        }
    }
    
    public <T> T getSubgraphState(String executionId, String key, Class<T> type) {
        SubgraphContext context = subgraphContexts.get(executionId);
        if (context != null) {
            Object value = context.getIsolatedState().get(key);
            return type.isInstance(value) ? type.cast(value) : null;
        }
        return null;
    }
    
    public void inheritFromParent(String executionId, String key) {
        SubgraphContext context = subgraphContexts.get(executionId);
        if (context != null && context.getParentContext() != null) {
            Object value = context.getParentContext().get(key);
            if (value != null) {
                context.getIsolatedState().put(key, value);
            }
        }
    }
    
    public void cleanupSubgraphContext(String executionId) {
        subgraphContexts.remove(executionId);
    }
}
```

### 状态传递

```java
@Component
public class SubgraphStateTransfer {
    
    public <T> T transferStateToSubgraph(Object parentState, Class<T> subgraphStateType) {
        StateTransferRule rule = getTransferRule(parentState.getClass(), subgraphStateType);
        return rule.transfer(parentState, subgraphStateType);
    }
    
    public <T> T transferStateFromSubgraph(Object subgraphState, Object parentState, Class<T> parentStateType) {
        StateTransferRule rule = getTransferRule(subgraphState.getClass(), parentStateType);
        return rule.merge(subgraphState, parentState, parentStateType);
    }
    
    private StateTransferRule getTransferRule(Class<?> sourceType, Class<?> targetType) {
        String ruleKey = sourceType.getName() + "->" + targetType.getName();
        
        return transferRules.computeIfAbsent(ruleKey, key -> {
            // 使用反射或配置创建转换规则
            return createDefaultTransferRule(sourceType, targetType);
        });
    }
    
    private StateTransferRule createDefaultTransferRule(Class<?> sourceType, Class<?> targetType) {
        return new ReflectionBasedTransferRule(sourceType, targetType);
    }
}
```

## 子图组合

### 顺序组合

```java
@Component
public class SequentialSubgraphComposition {
    
    public StateGraph composeSequentially(List<String> subgraphNames, String compositionName) {
        StateGraphBuilder<CompositeState> builder = StateGraph.builder(CompositeState.class);
        
        String previousNode = null;
        
        for (int i = 0; i < subgraphNames.size(); i++) {
            String subgraphName = subgraphNames.get(i);
            String nodeName = "subgraph_" + i;
            
            builder.addNode(nodeName, state -> executeSubgraphInComposition(state, subgraphName));
            
            if (previousNode != null) {
                builder.addEdge(previousNode, nodeName);
            } else {
                builder.setEntryPoint(nodeName);
            }
            
            previousNode = nodeName;
        }
        
        if (previousNode != null) {
            builder.setFinishPoint(previousNode);
        }
        
        StateGraph compositeGraph = builder.build();
        
        // 注册组合子图
        subgraphRegistry.registerSubgraph(compositionName, compositeGraph);
        
        return compositeGraph;
    }
    
    private CompositeState executeSubgraphInComposition(CompositeState state, String subgraphName) {
        Object subgraphInput = extractSubgraphInput(state, subgraphName);
        
        SubgraphExecution execution = subgraphManager.executeSubgraph(subgraphName, subgraphInput);
        Object result = execution.waitForCompletion(Duration.ofMinutes(15));
        
        return mergeSubgraphResult(state, subgraphName, result);
    }
}
```

### 并行组合

```java
@Component
public class ParallelSubgraphComposition {
    
    public StateGraph composeInParallel(List<String> subgraphNames, String compositionName) {
        return StateGraph.builder(CompositeState.class)
            .addNode("dispatch", this::dispatchToParallelSubgraphs)
            .addNode("collect", this::collectFromParallelSubgraphs)
            .addEdge("dispatch", "collect")
            .setEntryPoint("dispatch")
            .setFinishPoint("collect")
            .build();
    }
    
    private CompositeState dispatchToParallelSubgraphs(CompositeState state) {
        List<String> subgraphNames = state.getParallelSubgraphs();
        List<CompletableFuture<SubgraphResult>> futures = new ArrayList<>();
        
        for (String subgraphName : subgraphNames) {
            CompletableFuture<SubgraphResult> future = CompletableFuture.supplyAsync(() -> {
                Object input = extractSubgraphInput(state, subgraphName);
                SubgraphExecution execution = subgraphManager.executeSubgraph(subgraphName, input);
                Object result = execution.waitForCompletion(Duration.ofMinutes(20));
                
                return SubgraphResult.builder()
                    .subgraphName(subgraphName)
                    .result(result)
                    .executionTime(execution.getExecutionTime())
                    .build();
            });
            
            futures.add(future);
        }
        
        return state.withParallelFutures(futures);
    }
    
    private CompositeState collectFromParallelSubgraphs(CompositeState state) {
        List<CompletableFuture<SubgraphResult>> futures = state.getParallelFutures();
        
        List<SubgraphResult> results = futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList());
        
        return state.withParallelResults(results);
    }
}
```

## 子图监控

### 执行监控

```java
@Component
public class SubgraphMonitoring {
    
    @EventListener
    public void onSubgraphStart(SubgraphStartEvent event) {
        SubgraphExecution execution = SubgraphExecution.builder()
            .executionId(event.getExecutionId())
            .subgraphName(event.getSubgraphName())
            .parentExecutionId(event.getParentExecutionId())
            .startTime(event.getTimestamp())
            .status(ExecutionStatus.RUNNING)
            .build();
        
        subgraphExecutionRepository.save(execution);
        
        // 发送监控指标
        meterRegistry.counter("subgraph.executions.started", 
            "subgraph", event.getSubgraphName()).increment();
    }
    
    @EventListener
    public void onSubgraphComplete(SubgraphCompleteEvent event) {
        SubgraphExecution execution = subgraphExecutionRepository
            .findById(event.getExecutionId())
            .orElseThrow(() -> new ExecutionNotFoundException(event.getExecutionId()));
        
        execution.setEndTime(event.getTimestamp());
        execution.setStatus(event.isSuccess() ? ExecutionStatus.COMPLETED : ExecutionStatus.FAILED);
        execution.setResult(event.getResult());
        
        subgraphExecutionRepository.save(execution);
        
        // 记录执行时间
        Duration executionTime = Duration.between(execution.getStartTime(), execution.getEndTime());
        meterRegistry.timer("subgraph.execution.duration", 
            "subgraph", event.getSubgraphName()).record(executionTime);
    }
    
    public SubgraphMetrics getSubgraphMetrics(String subgraphName, Duration period) {
        Instant since = Instant.now().minus(period);
        
        List<SubgraphExecution> executions = subgraphExecutionRepository
            .findBySubgraphNameAndStartTimeAfter(subgraphName, since);
        
        return SubgraphMetrics.builder()
            .subgraphName(subgraphName)
            .totalExecutions(executions.size())
            .successfulExecutions(countSuccessful(executions))
            .failedExecutions(countFailed(executions))
            .averageExecutionTime(calculateAverageExecutionTime(executions))
            .successRate(calculateSuccessRate(executions))
            .build();
    }
}
```

## 子图测试

### 单元测试

```java
@ExtendWith(SpringExtension.class)
@SpringBootTest
public class DataValidationSubgraphTest {
    
    @Autowired
    private SubgraphManager subgraphManager;
    
    @Test
    public void testDataValidationSubgraph() {
        // 准备测试数据
        DataValidationState input = DataValidationState.builder()
            .rawData("test data")
            .build();
        
        // 执行子图
        SubgraphExecution execution = subgraphManager.executeSubgraph("data-validation", input);
        DataValidationState result = execution.waitForCompletion(Duration.ofSeconds(30));
        
        // 验证结果
        assertThat(result.isFormatValid()).isTrue();
        assertThat(result.getCleanData()).isNotNull();
        assertThat(result.getValidationResult().isValid()).isTrue();
    }
    
    @Test
    public void testDataValidationSubgraphWithInvalidData() {
        DataValidationState input = DataValidationState.builder()
            .rawData("invalid data format")
            .build();
        
        assertThatThrownBy(() -> {
            SubgraphExecution execution = subgraphManager.executeSubgraph("data-validation", input);
            execution.waitForCompletion(Duration.ofSeconds(30));
        }).isInstanceOf(InvalidDataFormatException.class);
    }
}
```

## 配置选项

```properties
# 子图配置
spring.ai.subgraphs.enabled=true
spring.ai.subgraphs.isolation-level=ISOLATED
spring.ai.subgraphs.max-concurrent=10

# 执行配置
spring.ai.subgraphs.execution.timeout=30m
spring.ai.subgraphs.execution.retry-attempts=3
spring.ai.subgraphs.execution.async=true

# 监控配置
spring.ai.subgraphs.monitoring.enabled=true
spring.ai.subgraphs.monitoring.metrics.enabled=true
spring.ai.subgraphs.monitoring.tracing.enabled=true

# 注册表配置
spring.ai.subgraphs.registry.type=memory
spring.ai.subgraphs.registry.auto-discovery=true
spring.ai.subgraphs.registry.cache-enabled=true
```

## 最佳实践

### 1. 设计原则
- 保持子图功能单一
- 设计清晰的输入输出接口
- 实现适当的错误处理

### 2. 性能优化
- 合理使用并行执行
- 实施状态传递优化
- 监控子图性能

### 3. 可维护性
- 提供完整的文档
- 实施全面的测试
- 版本化子图定义

### 4. 重用性
- 设计通用的子图
- 支持参数化配置
- 建立子图库

## 下一步

- [探索 Playground](/docs/1.0.0.3/playground/studio/)
- [了解 JManus](/docs/1.0.0.3/playground/jmanus/)
- [学习 DeepResearch](/docs/1.0.0.3/playground/deepresearch/)
