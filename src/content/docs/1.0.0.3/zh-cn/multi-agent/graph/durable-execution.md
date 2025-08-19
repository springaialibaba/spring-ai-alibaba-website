---
title: 持久执行
keywords: ["Spring AI Alibaba", "Graph", "Durable Execution", "持久执行", "故障恢复"]
description: "学习如何使用 Spring AI Alibaba Graph 的持久执行功能，实现可靠的长时间运行任务和故障恢复。"
---

## 概述

持久执行（Durable Execution）是 Spring AI Alibaba Graph 的核心特性之一，它确保图的执行能够在面对各种故障时保持可靠性和一致性。通过持久执行，您的工作流可以在系统重启、网络中断或其他故障后自动恢复并继续执行。

### 持久执行的价值

在生产环境中，持久执行解决了以下关键问题：

1. **故障恢复** — 在系统故障后自动恢复执行
2. **长时间任务** — 支持运行数小时或数天的任务
3. **资源优化** — 避免因故障重新执行昂贵的操作
4. **一致性保证** — 确保状态的一致性和完整性
5. **可观测性** — 提供完整的执行历史和审计跟踪

## 基础持久执行

### 1. 启用持久执行

```java
import com.alibaba.cloud.ai.graph.durable.DurableConfig;
import com.alibaba.cloud.ai.graph.durable.DurableExecutor;

@Configuration
public class DurableExecutionConfiguration {
    
    @Bean
    public DurableConfig durableConfig() {
        return DurableConfig.builder()
            .enableDurableExecution(true)           // 启用持久执行
            .checkpointFrequency(Duration.ofMinutes(5))  // 检查点频率
            .maxRetryAttempts(3)                    // 最大重试次数
            .retryBackoffMultiplier(2.0)            // 重试退避倍数
            .enableAutoRecovery(true)               // 启用自动恢复
            .recoveryTimeout(Duration.ofHours(1))   // 恢复超时时间
            .build();
    }
    
    @Bean
    public CompiledGraph durableGraph(DurableConfig durableConfig) {
        return new StateGraph(keyStrategyFactory)
            .addNode("step1", node_async(durableStep1))
            .addNode("step2", node_async(durableStep2))
            .addNode("step3", node_async(durableStep3))
            
            .addEdge(START, "step1")
            .addEdge("step1", "step2")
            .addEdge("step2", "step3")
            .addEdge("step3", END)
            
            .compile(CompileConfig.builder()
                .durableConfig(durableConfig)
                .build());
    }
}
```

### 2. 持久节点实现

```java
import com.alibaba.cloud.ai.graph.durable.DurableContext;
import com.alibaba.cloud.ai.graph.durable.ActivityOptions;

public class DurableStep1 implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        DurableContext context = DurableContext.current();
        
        try {
            // 标记活动开始
            context.recordActivityStart("data_processing");
            
            // 执行可能失败的操作
            String input = state.value("input", String.class).orElse("");
            String result = processData(input);
            
            // 标记活动成功完成
            context.recordActivitySuccess("data_processing", result);
            
            return Map.of(
                "step1_result", result,
                "processing_time", System.currentTimeMillis()
            );
            
        } catch (Exception e) {
            // 记录活动失败
            context.recordActivityFailure("data_processing", e);
            
            // 根据错误类型决定是否重试
            if (isRetryableError(e)) {
                throw new RetryableException("Temporary failure in step1", e);
            } else {
                throw new NonRetryableException("Permanent failure in step1", e);
            }
        }
    }
    
    private String processData(String input) throws Exception {
        // 模拟可能失败的数据处理
        if (Math.random() < 0.3) {  // 30% 失败率
            throw new RuntimeException("Random processing failure");
        }
        return "Processed: " + input;
    }
    
    private boolean isRetryableError(Exception e) {
        // 判断错误是否可重试
        return e instanceof IOException || 
               e instanceof TimeoutException ||
               e.getMessage().contains("temporary");
    }
}
```

### 3. 故障恢复机制

```java
@Service
public class DurableExecutionService {
    
    @Autowired
    private CompiledGraph durableGraph;
    
    @Autowired
    private DurableExecutor durableExecutor;
    
    // 启动持久执行
    public String startDurableExecution(String workflowId, Map<String, Object> input) {
        try {
            DurableExecutionHandle handle = durableExecutor.start(
                workflowId,
                durableGraph,
                input,
                DurableExecutionOptions.builder()
                    .workflowId(workflowId)
                    .taskQueue("default")
                    .executionTimeout(Duration.ofHours(24))
                    .build()
            );
            
            return "Durable execution started: " + handle.getExecutionId();
            
        } catch (Exception e) {
            return "Failed to start durable execution: " + e.getMessage();
        }
    }
    
    // 检查执行状态
    public ExecutionStatus checkExecutionStatus(String executionId) {
        return durableExecutor.getExecutionStatus(executionId);
    }
    
    // 手动恢复执行
    public String recoverExecution(String executionId) {
        try {
            durableExecutor.recover(executionId);
            return "Execution recovery initiated: " + executionId;
        } catch (Exception e) {
            return "Failed to recover execution: " + e.getMessage();
        }
    }
    
    // 取消执行
    public String cancelExecution(String executionId, String reason) {
        try {
            durableExecutor.cancel(executionId, reason);
            return "Execution cancelled: " + executionId;
        } catch (Exception e) {
            return "Failed to cancel execution: " + e.getMessage();
        }
    }
}
```

## 高级持久执行功能

### 1. 自定义重试策略

```java
import com.alibaba.cloud.ai.graph.durable.RetryPolicy;
import com.alibaba.cloud.ai.graph.durable.RetryOptions;

public class CustomRetryNode implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        DurableContext context = DurableContext.current();
        
        // 定义自定义重试策略
        RetryPolicy retryPolicy = RetryPolicy.builder()
            .maximumAttempts(5)
            .initialInterval(Duration.ofSeconds(1))
            .maximumInterval(Duration.ofMinutes(5))
            .backoffCoefficient(2.0)
            .retryableExceptions(List.of(
                IOException.class,
                TimeoutException.class,
                TemporaryServiceException.class
            ))
            .nonRetryableExceptions(List.of(
                IllegalArgumentException.class,
                SecurityException.class
            ))
            .build();
        
        // 使用重试策略执行活动
        return context.executeWithRetry("custom_operation", retryPolicy, () -> {
            return performRiskyOperation(state);
        });
    }
    
    private Map<String, Object> performRiskyOperation(OverAllState state) {
        // 执行可能失败的操作
        String input = state.value("input", String.class).orElse("");
        
        // 模拟不同类型的异常
        double random = Math.random();
        if (random < 0.2) {
            throw new IOException("Network error");
        } else if (random < 0.3) {
            throw new TimeoutException("Operation timeout");
        } else if (random < 0.4) {
            throw new IllegalArgumentException("Invalid input");
        }
        
        return Map.of("operation_result", "Success for: " + input);
    }
}
```

### 2. 长时间运行任务

```java
public class LongRunningTaskNode implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        DurableContext context = DurableContext.current();
        
        List<String> items = state.value("items", List.class).orElse(List.of());
        List<String> processedItems = new ArrayList<>();
        
        for (int i = 0; i < items.size(); i++) {
            String item = items.get(i);
            
            // 每处理一定数量的项目就创建检查点
            if (i % 100 == 0) {
                context.createCheckpoint(Map.of(
                    "processed_count", i,
                    "processed_items", new ArrayList<>(processedItems),
                    "current_item", item
                ));
            }
            
            // 执行长时间操作
            String result = context.executeActivity("process_item", 
                ActivityOptions.builder()
                    .scheduleToCloseTimeout(Duration.ofMinutes(10))
                    .heartbeatTimeout(Duration.ofMinutes(1))
                    .build(),
                () -> processLongRunningItem(item)
            );
            
            processedItems.add(result);
            
            // 发送心跳以表明任务仍在运行
            context.heartbeat(Map.of(
                "progress", (i + 1) * 100 / items.size(),
                "current_item", item
            ));
        }
        
        return Map.of(
            "processed_items", processedItems,
            "total_processed", processedItems.size()
        );
    }
    
    private String processLongRunningItem(String item) {
        // 模拟长时间运行的操作
        try {
            Thread.sleep(5000);  // 5秒处理时间
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Processing interrupted", e);
        }
        
        return "Processed: " + item;
    }
}
```

### 3. 分布式执行协调

```java
@Component
public class DistributedExecutionCoordinator {
    
    @Autowired
    private DurableExecutor durableExecutor;
    
    public String coordinateDistributedExecution(String coordinatorId, 
                                               List<String> workerTasks) {
        try {
            // 启动协调器工作流
            DurableExecutionHandle coordinatorHandle = durableExecutor.start(
                coordinatorId,
                createCoordinatorGraph(),
                Map.of("worker_tasks", workerTasks),
                DurableExecutionOptions.builder()
                    .workflowId(coordinatorId)
                    .taskQueue("coordinator")
                    .build()
            );
            
            return "Distributed execution coordinated: " + coordinatorHandle.getExecutionId();
            
        } catch (Exception e) {
            return "Failed to coordinate distributed execution: " + e.getMessage();
        }
    }
    
    private CompiledGraph createCoordinatorGraph() {
        NodeAction coordinatorAction = state -> {
            DurableContext context = DurableContext.current();
            List<String> workerTasks = state.value("worker_tasks", List.class).orElse(List.of());
            
            // 并行启动所有工作节点
            List<CompletableFuture<String>> workerFutures = workerTasks.stream()
                .map(task -> context.executeChildWorkflow(
                    "worker_workflow",
                    Map.of("task", task),
                    ChildWorkflowOptions.builder()
                        .workflowId("worker_" + task)
                        .taskQueue("workers")
                        .build()
                ))
                .collect(Collectors.toList());
            
            // 等待所有工作节点完成
            List<String> results = workerFutures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());
            
            return Map.of(
                "coordination_result", "All workers completed",
                "worker_results", results
            );
        };
        
        return new StateGraph(keyStrategyFactory)
            .addNode("coordinate", node_async(coordinatorAction))
            .addEdge(START, "coordinate")
            .addEdge("coordinate", END)
            .compile();
    }
}
```

## 监控和观测

### 1. 执行监控

```java
@Component
public class DurableExecutionMonitor {
    
    @Autowired
    private MeterRegistry meterRegistry;
    
    @EventListener
    public void handleExecutionStart(DurableExecutionStartEvent event) {
        meterRegistry.counter("durable.execution.started", 
            "workflow", event.getWorkflowType()).increment();
        
        meterRegistry.timer("durable.execution.duration",
            "workflow", event.getWorkflowType()).start();
    }
    
    @EventListener
    public void handleExecutionComplete(DurableExecutionCompleteEvent event) {
        meterRegistry.counter("durable.execution.completed",
            "workflow", event.getWorkflowType(),
            "status", event.getStatus().toString()).increment();
        
        meterRegistry.timer("durable.execution.duration",
            "workflow", event.getWorkflowType())
            .stop(Timer.Sample.start(meterRegistry));
    }
    
    @EventListener
    public void handleExecutionFailure(DurableExecutionFailureEvent event) {
        meterRegistry.counter("durable.execution.failed",
            "workflow", event.getWorkflowType(),
            "error", event.getError().getClass().getSimpleName()).increment();
    }
    
    @EventListener
    public void handleRetryAttempt(DurableRetryAttemptEvent event) {
        meterRegistry.counter("durable.retry.attempts",
            "workflow", event.getWorkflowType(),
            "activity", event.getActivityName()).increment();
    }
}
```

### 2. 执行历史查询

```java
@RestController
@RequestMapping("/api/durable")
public class DurableExecutionController {
    
    @Autowired
    private DurableExecutionService executionService;
    
    @Autowired
    private DurableExecutionHistory executionHistory;
    
    @GetMapping("/executions/{executionId}")
    public ResponseEntity<ExecutionDetails> getExecutionDetails(@PathVariable String executionId) {
        try {
            ExecutionDetails details = executionHistory.getExecutionDetails(executionId);
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/executions/{executionId}/history")
    public ResponseEntity<List<ExecutionEvent>> getExecutionHistory(@PathVariable String executionId) {
        List<ExecutionEvent> history = executionHistory.getExecutionEvents(executionId);
        return ResponseEntity.ok(history);
    }
    
    @PostMapping("/executions/{executionId}/recover")
    public ResponseEntity<String> recoverExecution(@PathVariable String executionId) {
        String result = executionService.recoverExecution(executionId);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/executions/{executionId}/cancel")
    public ResponseEntity<String> cancelExecution(
            @PathVariable String executionId,
            @RequestBody Map<String, String> request) {
        String reason = request.get("reason");
        String result = executionService.cancelExecution(executionId, reason);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/executions")
    public ResponseEntity<List<ExecutionSummary>> listExecutions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        
        List<ExecutionSummary> executions = executionHistory.listExecutions(page, size, status);
        return ResponseEntity.ok(executions);
    }
}
```

## 故障处理策略

### 1. 故障分类和处理

```java
@Component
public class DurableFailureHandler {
    
    public void handleExecutionFailure(String executionId, Exception error) {
        FailureType failureType = classifyFailure(error);
        
        switch (failureType) {
            case TRANSIENT:
                handleTransientFailure(executionId, error);
                break;
            case PERMANENT:
                handlePermanentFailure(executionId, error);
                break;
            case RESOURCE_EXHAUSTION:
                handleResourceExhaustionFailure(executionId, error);
                break;
            case TIMEOUT:
                handleTimeoutFailure(executionId, error);
                break;
            default:
                handleUnknownFailure(executionId, error);
        }
    }
    
    private FailureType classifyFailure(Exception error) {
        if (error instanceof IOException || error instanceof TimeoutException) {
            return FailureType.TRANSIENT;
        } else if (error instanceof IllegalArgumentException || error instanceof SecurityException) {
            return FailureType.PERMANENT;
        } else if (error instanceof OutOfMemoryError) {
            return FailureType.RESOURCE_EXHAUSTION;
        } else if (error.getMessage().contains("timeout")) {
            return FailureType.TIMEOUT;
        } else {
            return FailureType.UNKNOWN;
        }
    }
    
    private void handleTransientFailure(String executionId, Exception error) {
        // 对于临时性故障，安排重试
        scheduleRetry(executionId, Duration.ofMinutes(1));
    }
    
    private void handlePermanentFailure(String executionId, Exception error) {
        // 对于永久性故障，标记为失败并通知
        markAsPermanentlyFailed(executionId, error);
        sendFailureNotification(executionId, error);
    }
    
    private void handleResourceExhaustionFailure(String executionId, Exception error) {
        // 资源耗尽，等待资源释放后重试
        scheduleRetry(executionId, Duration.ofMinutes(10));
    }
    
    private void handleTimeoutFailure(String executionId, Exception error) {
        // 超时故障，增加超时时间后重试
        increaseTimeoutAndRetry(executionId);
    }
}
```

### 2. 自动恢复机制

```java
@Component
@Scheduled(fixedDelay = 60000)  // 每分钟检查一次
public class AutoRecoveryService {
    
    @Autowired
    private DurableExecutionService executionService;
    
    @Autowired
    private DurableExecutionHistory executionHistory;
    
    public void performAutoRecovery() {
        // 查找需要恢复的执行
        List<ExecutionSummary> failedExecutions = executionHistory.findFailedExecutions();
        
        for (ExecutionSummary execution : failedExecutions) {
            if (shouldAttemptRecovery(execution)) {
                attemptRecovery(execution);
            }
        }
    }
    
    private boolean shouldAttemptRecovery(ExecutionSummary execution) {
        // 检查是否应该尝试恢复
        return execution.getFailureCount() < 3 &&
               execution.getLastFailureTime().isAfter(Instant.now().minus(Duration.ofMinutes(5))) &&
               isRecoverableFailure(execution.getLastError());
    }
    
    private void attemptRecovery(ExecutionSummary execution) {
        try {
            executionService.recoverExecution(execution.getExecutionId());
            System.out.println("Auto-recovery attempted for: " + execution.getExecutionId());
        } catch (Exception e) {
            System.err.println("Auto-recovery failed for: " + execution.getExecutionId() + " - " + e.getMessage());
        }
    }
}
```

## 最佳实践

### 持久执行设计原则

1. **幂等性** — 确保节点操作是幂等的，可以安全重试
2. **检查点策略** — 在关键点创建检查点，平衡性能和恢复粒度
3. **超时管理** — 设置合理的超时时间，避免无限等待
4. **错误分类** — 正确分类错误类型，采用适当的处理策略

### 性能优化

- **批量操作** — 将小操作批量处理以减少检查点开销
- **异步执行** — 使用异步操作提高并发性
- **资源管理** — 合理管理内存和连接资源
- **监控调优** — 基于监控数据调优执行参数

### 可靠性保证

- **数据一致性** — 确保状态更新的原子性
- **故障隔离** — 隔离不同执行实例的故障影响
- **备份策略** — 定期备份执行状态和历史
- **测试验证** — 充分测试故障恢复场景

## 下一步

- [时间旅行](./time-travel) - 学习状态回滚和分支功能
- [人机协作](./human-in-the-loop) - 了解在持久执行中集成人工干预
- [监控和观测](./monitoring) - 深入了解执行监控和调试技术
