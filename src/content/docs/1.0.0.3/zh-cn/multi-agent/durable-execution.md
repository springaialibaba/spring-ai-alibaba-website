---
title: 持久执行 (Durable Execution)
description: Spring AI Alibaba 持久执行机制
---

# 持久执行 (Durable Execution)

持久执行确保多智能体系统能够在面对故障、重启或长时间运行时保持执行状态的连续性和一致性。

## 核心概念

### 执行持久性
- **状态保存**: 自动保存执行状态
- **故障恢复**: 从故障点恢复执行
- **长期运行**: 支持长时间运行的任务
- **资源管理**: 高效的资源使用和清理

### 应用场景
- 长时间数据处理任务
- 复杂的多步骤工作流
- 需要人工干预的流程
- 分布式任务执行

## 基本配置

```java
@Configuration
@EnableDurableExecution
public class DurableExecutionConfig {
    
    @Bean
    public DurableExecutionManager executionManager() {
        return DurableExecutionManager.builder()
            .stateStore(stateStore())
            .checkpointInterval(Duration.ofMinutes(5))
            .maxRetryAttempts(3)
            .build();
    }
    
    @Bean
    public StateStore stateStore() {
        return new DatabaseStateStore(dataSource());
    }
}
```

## 持久化工作流

### 创建持久化 Graph

```java
@Component
public class DurableWorkflow {
    
    public StateGraph createDurableGraph() {
        return StateGraph.builder(DurableState.class)
            .addNode("data_collection", this::collectData)
            .addNode("data_processing", this::processData)
            .addNode("analysis", this::analyzeData)
            .addNode("report_generation", this::generateReport)
            .addEdge("data_collection", "data_processing")
            .addEdge("data_processing", "analysis")
            .addEdge("analysis", "report_generation")
            .setEntryPoint("data_collection")
            .setFinishPoint("report_generation")
            .enableDurableExecution(true)
            .setCheckpointStrategy(CheckpointStrategy.AFTER_EACH_NODE)
            .build();
    }
    
    @DurableNode
    private DurableState collectData(DurableState state) {
        log.info("开始数据收集，执行ID: {}", state.getExecutionId());
        
        try {
            List<DataSource> sources = dataSourceService.getActiveSources();
            List<CollectedData> data = new ArrayList<>();
            
            for (DataSource source : sources) {
                // 检查是否已经处理过这个数据源
                if (!state.isSourceProcessed(source.getId())) {
                    CollectedData collected = source.collect();
                    data.add(collected);
                    
                    // 标记数据源已处理
                    state.markSourceProcessed(source.getId());
                    
                    // 创建中间检查点
                    checkpointManager.createCheckpoint(state);
                }
            }
            
            return state.withCollectedData(data);
            
        } catch (Exception e) {
            log.error("数据收集失败", e);
            throw new DurableExecutionException("数据收集失败", e);
        }
    }
}
```

### 执行管理

```java
@Service
public class DurableExecutionService {
    
    @Autowired
    private DurableExecutionManager executionManager;
    
    public String startDurableExecution(StateGraph graph, Object initialState) {
        DurableExecution execution = executionManager.createExecution(
            DurableExecutionRequest.builder()
                .graph(graph)
                .initialState(initialState)
                .executionId(UUID.randomUUID().toString())
                .build()
        );
        
        // 异步执行
        CompletableFuture.runAsync(() -> {
            try {
                execution.start();
            } catch (Exception e) {
                log.error("持久执行失败", e);
                execution.markFailed(e);
            }
        });
        
        return execution.getId();
    }
    
    public ExecutionStatus getExecutionStatus(String executionId) {
        DurableExecution execution = executionManager.getExecution(executionId);
        return execution.getStatus();
    }
    
    public void pauseExecution(String executionId) {
        DurableExecution execution = executionManager.getExecution(executionId);
        execution.pause();
    }
    
    public void resumeExecution(String executionId) {
        DurableExecution execution = executionManager.getExecution(executionId);
        execution.resume();
    }
}
```

## 故障恢复

### 自动恢复机制

```java
@Component
public class FailureRecoveryManager {
    
    @EventListener
    public void onExecutionFailure(ExecutionFailureEvent event) {
        DurableExecution execution = event.getExecution();
        
        if (execution.getRetryCount() < execution.getMaxRetryAttempts()) {
            // 延迟重试
            scheduleRetry(execution, calculateRetryDelay(execution.getRetryCount()));
        } else {
            // 标记为失败，需要人工干预
            execution.markRequiresIntervention();
            notificationService.sendFailureAlert(execution);
        }
    }
    
    private void scheduleRetry(DurableExecution execution, Duration delay) {
        taskScheduler.schedule(() -> {
            try {
                execution.retry();
            } catch (Exception e) {
                log.error("重试执行失败", e);
                onExecutionFailure(new ExecutionFailureEvent(execution, e));
            }
        }, Instant.now().plus(delay));
    }
    
    private Duration calculateRetryDelay(int retryCount) {
        // 指数退避策略
        return Duration.ofSeconds((long) Math.pow(2, retryCount));
    }
}
```

### 手动恢复

```java
@RestController
@RequestMapping("/api/execution")
public class ExecutionRecoveryController {
    
    @PostMapping("/{executionId}/recover")
    public ResponseEntity<Void> recoverExecution(
            @PathVariable String executionId,
            @RequestBody RecoveryRequest request) {
        
        DurableExecution execution = executionManager.getExecution(executionId);
        
        switch (request.getRecoveryType()) {
            case RETRY_FROM_FAILURE:
                execution.retryFromFailurePoint();
                break;
            case RESTART_FROM_CHECKPOINT:
                execution.restartFromCheckpoint(request.getCheckpointId());
                break;
            case SKIP_FAILED_NODE:
                execution.skipFailedNode();
                break;
            case MANUAL_INTERVENTION:
                execution.applyManualFix(request.getManualState());
                break;
        }
        
        return ResponseEntity.ok().build();
    }
}
```

## 长期运行支持

### 资源管理

```java
@Component
public class LongRunningExecutionManager {
    
    @Scheduled(fixedRate = 300000) // 每5分钟检查一次
    public void manageResources() {
        List<DurableExecution> longRunningExecutions = 
            executionRepository.findLongRunningExecutions(Duration.ofHours(1));
        
        for (DurableExecution execution : longRunningExecutions) {
            // 检查资源使用情况
            ResourceUsage usage = resourceMonitor.getUsage(execution.getId());
            
            if (usage.getMemoryUsage() > 0.8) {
                // 内存使用过高，创建检查点并释放资源
                checkpointManager.createCheckpoint(execution);
                execution.releaseResources();
            }
            
            if (usage.getCpuUsage() > 0.9) {
                // CPU使用过高，降低优先级
                execution.reducePriority();
            }
        }
    }
    
    @Scheduled(cron = "0 0 2 * * ?") // 每天凌晨2点
    public void cleanupCompletedExecutions() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(7));
        List<DurableExecution> completedExecutions = 
            executionRepository.findCompletedBefore(cutoff);
        
        for (DurableExecution execution : completedExecutions) {
            archiveExecution(execution);
            executionRepository.delete(execution);
        }
    }
}
```

### 进度跟踪

```java
@Component
public class ExecutionProgressTracker {
    
    public ExecutionProgress getProgress(String executionId) {
        DurableExecution execution = executionManager.getExecution(executionId);
        StateGraph graph = execution.getGraph();
        
        int totalNodes = graph.getNodes().size();
        int completedNodes = execution.getCompletedNodes().size();
        String currentNode = execution.getCurrentNode();
        
        return ExecutionProgress.builder()
            .executionId(executionId)
            .totalNodes(totalNodes)
            .completedNodes(completedNodes)
            .currentNode(currentNode)
            .progressPercentage((double) completedNodes / totalNodes * 100)
            .estimatedTimeRemaining(estimateRemainingTime(execution))
            .build();
    }
    
    private Duration estimateRemainingTime(DurableExecution execution) {
        Duration elapsed = Duration.between(execution.getStartTime(), Instant.now());
        int completedNodes = execution.getCompletedNodes().size();
        int totalNodes = execution.getGraph().getNodes().size();
        
        if (completedNodes == 0) {
            return Duration.ZERO;
        }
        
        Duration avgTimePerNode = elapsed.dividedBy(completedNodes);
        int remainingNodes = totalNodes - completedNodes;
        
        return avgTimePerNode.multipliedBy(remainingNodes);
    }
}
```

## 分布式执行

### 分布式协调

```java
@Component
public class DistributedExecutionCoordinator {
    
    @Autowired
    private ClusterManager clusterManager;
    
    public void distributeExecution(DurableExecution execution) {
        StateGraph graph = execution.getGraph();
        List<ExecutionNode> parallelNodes = findParallelNodes(graph);
        
        if (!parallelNodes.isEmpty()) {
            List<ClusterNode> availableNodes = clusterManager.getAvailableNodes();
            
            for (int i = 0; i < parallelNodes.size() && i < availableNodes.size(); i++) {
                ExecutionNode node = parallelNodes.get(i);
                ClusterNode clusterNode = availableNodes.get(i);
                
                // 在远程节点上执行
                RemoteExecutionRequest request = RemoteExecutionRequest.builder()
                    .executionId(execution.getId())
                    .nodeId(node.getId())
                    .state(execution.getCurrentState())
                    .build();
                
                clusterNode.executeRemotely(request);
            }
        }
    }
    
    @EventListener
    public void onRemoteNodeCompletion(RemoteNodeCompletionEvent event) {
        DurableExecution execution = executionManager.getExecution(event.getExecutionId());
        execution.mergeRemoteResult(event.getNodeId(), event.getResult());
        
        // 检查是否所有并行节点都完成
        if (execution.areAllParallelNodesComplete()) {
            execution.continueExecution();
        }
    }
}
```

## 监控和告警

### 执行监控

```java
@Component
public class ExecutionMonitor {
    
    @EventListener
    public void onExecutionStart(ExecutionStartEvent event) {
        ExecutionMetrics metrics = ExecutionMetrics.builder()
            .executionId(event.getExecutionId())
            .startTime(Instant.now())
            .status("RUNNING")
            .build();
        
        metricsRepository.save(metrics);
    }
    
    @EventListener
    public void onNodeCompletion(NodeCompletionEvent event) {
        NodeMetrics metrics = NodeMetrics.builder()
            .executionId(event.getExecutionId())
            .nodeId(event.getNodeId())
            .executionTime(event.getExecutionTime())
            .memoryUsage(event.getMemoryUsage())
            .build();
        
        nodeMetricsRepository.save(metrics);
        
        // 检查是否需要告警
        if (event.getExecutionTime().toMinutes() > 30) {
            alertService.sendSlowNodeAlert(event);
        }
    }
    
    @Scheduled(fixedRate = 60000) // 每分钟检查一次
    public void checkStuckExecutions() {
        List<DurableExecution> stuckExecutions = 
            executionRepository.findStuckExecutions(Duration.ofMinutes(30));
        
        for (DurableExecution execution : stuckExecutions) {
            alertService.sendStuckExecutionAlert(execution);
        }
    }
}
```

## 配置选项

```properties
# 持久执行配置
spring.ai.durable-execution.enabled=true
spring.ai.durable-execution.checkpoint-interval=5m
spring.ai.durable-execution.max-retry-attempts=3

# 状态存储配置
spring.ai.durable-execution.state-store.type=database
spring.ai.durable-execution.state-store.cleanup-interval=1h

# 资源管理配置
spring.ai.durable-execution.resource.max-memory-usage=0.8
spring.ai.durable-execution.resource.max-cpu-usage=0.9
spring.ai.durable-execution.resource.cleanup-threshold=7d

# 分布式配置
spring.ai.durable-execution.distributed.enabled=false
spring.ai.durable-execution.distributed.cluster-name=spring-ai-cluster

# 监控配置
spring.ai.durable-execution.monitoring.enabled=true
spring.ai.durable-execution.monitoring.stuck-threshold=30m
spring.ai.durable-execution.monitoring.slow-node-threshold=30m
```

## 最佳实践

### 1. 设计原则
- 保持节点幂等性
- 最小化状态大小
- 合理设置检查点

### 2. 错误处理
- 实现优雅的错误恢复
- 提供人工干预机制
- 记录详细的错误信息

### 3. 性能优化
- 合理分配资源
- 监控执行性能
- 及时清理过期数据

### 4. 运维管理
- 建立监控告警
- 定期备份状态
- 制定恢复预案

## 下一步

- [学习记忆管理](/docs/1.0.0.3/multi-agent/memory/)
- [了解上下文管理](/docs/1.0.0.3/multi-agent/context/)
- [探索人机协作](/docs/1.0.0.3/multi-agent/human-in-the-loop/)
