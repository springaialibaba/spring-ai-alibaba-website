---
title: 时间旅行 (Time Travel)
description: Spring AI Alibaba 时间旅行功能
---

# 时间旅行 (Time Travel)

时间旅行功能允许开发者回溯多智能体系统的执行历史，查看任意时间点的状态，并支持从历史状态恢复执行。

## 核心概念

### 时间点快照
- **状态快照**: 特定时间点的完整系统状态
- **增量快照**: 相对于上一个快照的变化
- **自动快照**: 系统自动创建的快照
- **手动快照**: 用户手动创建的快照

### 时间轴管理
- **线性时间轴**: 单一的执行时间线
- **分支时间轴**: 支持多个执行分支
- **合并时间轴**: 将分支合并回主时间线

## 基本配置

```java
@Configuration
@EnableTimeTravel
public class TimeTravelConfig {
    
    @Bean
    public TimeTravelManager timeTravelManager() {
        return TimeTravelManager.builder()
            .snapshotStore(snapshotStore())
            .snapshotInterval(Duration.ofMinutes(5))
            .maxSnapshots(100)
            .compressionEnabled(true)
            .build();
    }
    
    @Bean
    public SnapshotStore snapshotStore() {
        return new DatabaseSnapshotStore(dataSource());
    }
}
```

## 状态快照

### 自动快照创建

```java
@Component
public class AutoSnapshotService {
    
    @Autowired
    private TimeTravelManager timeTravelManager;
    
    @EventListener
    public void onNodeCompletion(NodeCompletionEvent event) {
        if (shouldCreateSnapshot(event)) {
            createSnapshot(event.getExecutionId(), "Auto snapshot after " + event.getNodeId());
        }
    }
    
    @EventListener
    public void onStateChange(StateChangeEvent event) {
        if (isSignificantChange(event)) {
            createSnapshot(event.getExecutionId(), "State change: " + event.getChangeDescription());
        }
    }
    
    @Scheduled(fixedRate = 300000) // 每5分钟
    public void createPeriodicSnapshots() {
        List<String> activeExecutions = executionManager.getActiveExecutionIds();
        
        for (String executionId : activeExecutions) {
            createSnapshot(executionId, "Periodic snapshot");
        }
    }
    
    private void createSnapshot(String executionId, String description) {
        try {
            GraphExecution execution = executionManager.getExecution(executionId);
            
            Snapshot snapshot = Snapshot.builder()
                .id(UUID.randomUUID().toString())
                .executionId(executionId)
                .timestamp(Instant.now())
                .description(description)
                .state(execution.getCurrentState())
                .nodeId(execution.getCurrentNode())
                .metadata(execution.getMetadata())
                .build();
            
            timeTravelManager.saveSnapshot(snapshot);
            
        } catch (Exception e) {
            log.error("Failed to create snapshot for execution: {}", executionId, e);
        }
    }
    
    private boolean shouldCreateSnapshot(NodeCompletionEvent event) {
        return event.getNodeId().endsWith("_checkpoint") || 
               event.getExecutionTime().toSeconds() > 60;
    }
    
    private boolean isSignificantChange(StateChangeEvent event) {
        return event.getChangeType() == ChangeType.MAJOR ||
               event.getAffectedFields().size() > 5;
    }
}
```

### 手动快照管理

```java
@RestController
@RequestMapping("/api/time-travel")
public class TimeTravelController {
    
    @Autowired
    private TimeTravelService timeTravelService;
    
    @PostMapping("/snapshots")
    public ResponseEntity<Snapshot> createSnapshot(@RequestBody CreateSnapshotRequest request) {
        Snapshot snapshot = timeTravelService.createManualSnapshot(
            request.getExecutionId(),
            request.getDescription(),
            request.getTags()
        );
        
        return ResponseEntity.ok(snapshot);
    }
    
    @GetMapping("/executions/{executionId}/snapshots")
    public ResponseEntity<List<Snapshot>> getSnapshots(@PathVariable String executionId) {
        List<Snapshot> snapshots = timeTravelService.getSnapshots(executionId);
        return ResponseEntity.ok(snapshots);
    }
    
    @GetMapping("/snapshots/{snapshotId}")
    public ResponseEntity<SnapshotDetail> getSnapshotDetail(@PathVariable String snapshotId) {
        SnapshotDetail detail = timeTravelService.getSnapshotDetail(snapshotId);
        return ResponseEntity.ok(detail);
    }
    
    @PostMapping("/snapshots/{snapshotId}/restore")
    public ResponseEntity<Void> restoreFromSnapshot(@PathVariable String snapshotId) {
        timeTravelService.restoreFromSnapshot(snapshotId);
        return ResponseEntity.ok().build();
    }
}
```

## 时间轴浏览

### 时间轴可视化

```java
@Service
public class TimelineVisualizationService {
    
    @Autowired
    private SnapshotRepository snapshotRepository;
    
    public Timeline generateTimeline(String executionId) {
        List<Snapshot> snapshots = snapshotRepository.findByExecutionIdOrderByTimestamp(executionId);
        
        List<TimelineEvent> events = snapshots.stream()
            .map(this::snapshotToTimelineEvent)
            .collect(Collectors.toList());
        
        return Timeline.builder()
            .executionId(executionId)
            .events(events)
            .startTime(events.isEmpty() ? null : events.get(0).getTimestamp())
            .endTime(events.isEmpty() ? null : events.get(events.size() - 1).getTimestamp())
            .totalDuration(calculateTotalDuration(events))
            .build();
    }
    
    private TimelineEvent snapshotToTimelineEvent(Snapshot snapshot) {
        return TimelineEvent.builder()
            .id(snapshot.getId())
            .timestamp(snapshot.getTimestamp())
            .type("snapshot")
            .title(snapshot.getDescription())
            .nodeId(snapshot.getNodeId())
            .stateHash(calculateStateHash(snapshot.getState()))
            .build();
    }
    
    public TimelineComparison compareTimepoints(String executionId, Instant time1, Instant time2) {
        Snapshot snapshot1 = findSnapshotNearTime(executionId, time1);
        Snapshot snapshot2 = findSnapshotNearTime(executionId, time2);
        
        StateDiff diff = calculateStateDiff(snapshot1.getState(), snapshot2.getState());
        
        return TimelineComparison.builder()
            .snapshot1(snapshot1)
            .snapshot2(snapshot2)
            .stateDiff(diff)
            .timeDifference(Duration.between(time1, time2))
            .build();
    }
}
```

### 状态差异分析

```java
@Component
public class StateDiffAnalyzer {
    
    public StateDiff calculateStateDiff(OverallState state1, OverallState state2) {
        Map<String, Object> map1 = state1.toMap();
        Map<String, Object> map2 = state2.toMap();
        
        List<FieldChange> changes = new ArrayList<>();
        
        // 检查修改和删除的字段
        for (Map.Entry<String, Object> entry : map1.entrySet()) {
            String key = entry.getKey();
            Object value1 = entry.getValue();
            Object value2 = map2.get(key);
            
            if (value2 == null) {
                changes.add(FieldChange.deleted(key, value1));
            } else if (!Objects.equals(value1, value2)) {
                changes.add(FieldChange.modified(key, value1, value2));
            }
        }
        
        // 检查新增的字段
        for (Map.Entry<String, Object> entry : map2.entrySet()) {
            String key = entry.getKey();
            if (!map1.containsKey(key)) {
                changes.add(FieldChange.added(key, entry.getValue()));
            }
        }
        
        return StateDiff.builder()
            .changes(changes)
            .totalChanges(changes.size())
            .addedFields(countChangesByType(changes, ChangeType.ADDED))
            .modifiedFields(countChangesByType(changes, ChangeType.MODIFIED))
            .deletedFields(countChangesByType(changes, ChangeType.DELETED))
            .build();
    }
    
    private int countChangesByType(List<FieldChange> changes, ChangeType type) {
        return (int) changes.stream()
            .filter(change -> change.getType() == type)
            .count();
    }
}
```

## 状态恢复

### 精确恢复

```java
@Service
public class StateRestorationService {
    
    @Autowired
    private TimeTravelManager timeTravelManager;
    
    @Autowired
    private ExecutionManager executionManager;
    
    public void restoreToSnapshot(String snapshotId) {
        Snapshot snapshot = timeTravelManager.getSnapshot(snapshotId);
        
        GraphExecution execution = executionManager.getExecution(snapshot.getExecutionId());
        
        // 暂停当前执行
        execution.pause();
        
        try {
            // 恢复状态
            execution.restoreState(snapshot.getState());
            execution.setCurrentNode(snapshot.getNodeId());
            
            // 清理后续状态
            cleanupFutureState(execution, snapshot.getTimestamp());
            
            // 恢复执行
            execution.resume();
            
            log.info("Successfully restored execution {} to snapshot {}", 
                snapshot.getExecutionId(), snapshotId);
                
        } catch (Exception e) {
            log.error("Failed to restore to snapshot: {}", snapshotId, e);
            execution.resume(); // 恢复原始执行
            throw new StateRestorationException("Failed to restore state", e);
        }
    }
    
    public void restoreToTimepoint(String executionId, Instant timepoint) {
        Snapshot nearestSnapshot = findNearestSnapshot(executionId, timepoint);
        
        if (nearestSnapshot == null) {
            throw new NoSnapshotFoundException("No snapshot found near timepoint: " + timepoint);
        }
        
        restoreToSnapshot(nearestSnapshot.getId());
    }
    
    private void cleanupFutureState(GraphExecution execution, Instant cutoffTime) {
        // 删除快照时间点之后的所有快照
        timeTravelManager.deleteSnapshotsAfter(execution.getId(), cutoffTime);
        
        // 清理执行历史
        execution.clearHistoryAfter(cutoffTime);
    }
    
    private Snapshot findNearestSnapshot(String executionId, Instant timepoint) {
        return snapshotRepository.findNearestSnapshot(executionId, timepoint);
    }
}
```

### 分支恢复

```java
@Service
public class BranchRestorationService {
    
    public String createBranchFromSnapshot(String snapshotId, String branchName) {
        Snapshot snapshot = timeTravelManager.getSnapshot(snapshotId);
        
        // 创建新的执行分支
        String branchExecutionId = UUID.randomUUID().toString();
        
        GraphExecution originalExecution = executionManager.getExecution(snapshot.getExecutionId());
        GraphExecution branchExecution = originalExecution.createBranch(branchExecutionId);
        
        // 恢复到快照状态
        branchExecution.restoreState(snapshot.getState());
        branchExecution.setCurrentNode(snapshot.getNodeId());
        
        // 注册分支
        executionManager.registerBranch(branchExecutionId, branchExecution);
        
        // 记录分支信息
        ExecutionBranch branch = ExecutionBranch.builder()
            .branchId(branchExecutionId)
            .parentExecutionId(snapshot.getExecutionId())
            .branchPoint(snapshot.getTimestamp())
            .branchName(branchName)
            .createdAt(Instant.now())
            .build();
        
        branchRepository.save(branch);
        
        return branchExecutionId;
    }
    
    public void mergeBranch(String branchExecutionId, String targetExecutionId) {
        GraphExecution branchExecution = executionManager.getExecution(branchExecutionId);
        GraphExecution targetExecution = executionManager.getExecution(targetExecutionId);
        
        // 分析分支差异
        BranchDiff diff = analyzeBranchDiff(branchExecution, targetExecution);
        
        // 执行合并策略
        MergeStrategy strategy = determineMergeStrategy(diff);
        strategy.merge(branchExecution, targetExecution);
        
        // 清理分支
        executionManager.removeBranch(branchExecutionId);
        branchRepository.deleteByBranchId(branchExecutionId);
    }
}
```

## 时间查询

### 时间范围查询

```java
@Service
public class TimeRangeQueryService {
    
    public List<StateSnapshot> queryStateInRange(String executionId, Instant startTime, Instant endTime) {
        List<Snapshot> snapshots = snapshotRepository
            .findByExecutionIdAndTimestampBetween(executionId, startTime, endTime);
        
        return snapshots.stream()
            .map(this::snapshotToStateSnapshot)
            .collect(Collectors.toList());
    }
    
    public ExecutionSummary summarizeExecution(String executionId, Instant startTime, Instant endTime) {
        List<Snapshot> snapshots = queryStateInRange(executionId, startTime, endTime)
            .stream()
            .map(StateSnapshot::getSnapshot)
            .collect(Collectors.toList());
        
        return ExecutionSummary.builder()
            .executionId(executionId)
            .timeRange(TimeRange.of(startTime, endTime))
            .totalSnapshots(snapshots.size())
            .nodesExecuted(countUniqueNodes(snapshots))
            .stateChanges(countStateChanges(snapshots))
            .averageExecutionTime(calculateAverageExecutionTime(snapshots))
            .build();
    }
    
    public List<PerformanceMetric> analyzePerformanceOverTime(String executionId, Duration interval) {
        List<Snapshot> snapshots = snapshotRepository.findByExecutionId(executionId);
        
        return snapshots.stream()
            .collect(Collectors.groupingBy(
                snapshot -> truncateToInterval(snapshot.getTimestamp(), interval)))
            .entrySet().stream()
            .map(entry -> PerformanceMetric.builder()
                .timestamp(entry.getKey())
                .snapshotCount(entry.getValue().size())
                .averageStateSize(calculateAverageStateSize(entry.getValue()))
                .executionVelocity(calculateExecutionVelocity(entry.getValue()))
                .build())
            .sorted(Comparator.comparing(PerformanceMetric::getTimestamp))
            .collect(Collectors.toList());
    }
}
```

## 时间旅行调试

### 调试工具

```java
@Component
public class TimeTravelDebugger {
    
    @Autowired
    private TimeTravelManager timeTravelManager;
    
    public DebugSession startDebugSession(String executionId) {
        List<Snapshot> snapshots = timeTravelManager.getSnapshots(executionId);
        
        DebugSession session = DebugSession.builder()
            .sessionId(UUID.randomUUID().toString())
            .executionId(executionId)
            .snapshots(snapshots)
            .currentSnapshotIndex(snapshots.size() - 1)
            .startTime(Instant.now())
            .build();
        
        debugSessionRepository.save(session);
        return session;
    }
    
    public DebugStepResult stepBackward(String sessionId) {
        DebugSession session = debugSessionRepository.findById(sessionId)
            .orElseThrow(() -> new DebugSessionNotFoundException(sessionId));
        
        if (session.getCurrentSnapshotIndex() > 0) {
            session.setCurrentSnapshotIndex(session.getCurrentSnapshotIndex() - 1);
            Snapshot currentSnapshot = session.getSnapshots().get(session.getCurrentSnapshotIndex());
            
            return DebugStepResult.builder()
                .snapshot(currentSnapshot)
                .direction(StepDirection.BACKWARD)
                .canStepBackward(session.getCurrentSnapshotIndex() > 0)
                .canStepForward(session.getCurrentSnapshotIndex() < session.getSnapshots().size() - 1)
                .build();
        }
        
        return DebugStepResult.noStep("Already at the beginning");
    }
    
    public DebugStepResult stepForward(String sessionId) {
        DebugSession session = debugSessionRepository.findById(sessionId)
            .orElseThrow(() -> new DebugSessionNotFoundException(sessionId));
        
        if (session.getCurrentSnapshotIndex() < session.getSnapshots().size() - 1) {
            session.setCurrentSnapshotIndex(session.getCurrentSnapshotIndex() + 1);
            Snapshot currentSnapshot = session.getSnapshots().get(session.getCurrentSnapshotIndex());
            
            return DebugStepResult.builder()
                .snapshot(currentSnapshot)
                .direction(StepDirection.FORWARD)
                .canStepBackward(session.getCurrentSnapshotIndex() > 0)
                .canStepForward(session.getCurrentSnapshotIndex() < session.getSnapshots().size() - 1)
                .build();
        }
        
        return DebugStepResult.noStep("Already at the end");
    }
    
    public void setBreakpoint(String executionId, String nodeId) {
        Breakpoint breakpoint = Breakpoint.builder()
            .executionId(executionId)
            .nodeId(nodeId)
            .enabled(true)
            .createdAt(Instant.now())
            .build();
        
        breakpointRepository.save(breakpoint);
    }
}
```

## 性能优化

### 快照压缩

```java
@Component
public class SnapshotCompression {
    
    public CompressedSnapshot compressSnapshot(Snapshot snapshot) {
        try {
            byte[] stateBytes = serializeState(snapshot.getState());
            byte[] compressedBytes = compress(stateBytes);
            
            return CompressedSnapshot.builder()
                .originalSnapshot(snapshot)
                .compressedData(compressedBytes)
                .originalSize(stateBytes.length)
                .compressedSize(compressedBytes.length)
                .compressionRatio((double) compressedBytes.length / stateBytes.length)
                .build();
                
        } catch (Exception e) {
            log.error("Failed to compress snapshot: {}", snapshot.getId(), e);
            return CompressedSnapshot.uncompressed(snapshot);
        }
    }
    
    public Snapshot decompressSnapshot(CompressedSnapshot compressed) {
        try {
            byte[] decompressedBytes = decompress(compressed.getCompressedData());
            OverallState state = deserializeState(decompressedBytes);
            
            return compressed.getOriginalSnapshot().withState(state);
            
        } catch (Exception e) {
            log.error("Failed to decompress snapshot", e);
            throw new SnapshotDecompressionException("Failed to decompress snapshot", e);
        }
    }
    
    private byte[] compress(byte[] data) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (GZIPOutputStream gzos = new GZIPOutputStream(baos)) {
            gzos.write(data);
        }
        return baos.toByteArray();
    }
    
    private byte[] decompress(byte[] compressedData) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (GZIPInputStream gzis = new GZIPInputStream(new ByteArrayInputStream(compressedData))) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = gzis.read(buffer)) != -1) {
                baos.write(buffer, 0, len);
            }
        }
        return baos.toByteArray();
    }
}
```

## 配置选项

```properties
# 时间旅行配置
spring.ai.time-travel.enabled=true
spring.ai.time-travel.auto-snapshot.enabled=true
spring.ai.time-travel.auto-snapshot.interval=5m

# 快照存储配置
spring.ai.time-travel.snapshot.store=database
spring.ai.time-travel.snapshot.compression.enabled=true
spring.ai.time-travel.snapshot.max-count=100

# 性能配置
spring.ai.time-travel.performance.async-save=true
spring.ai.time-travel.performance.batch-size=10
spring.ai.time-travel.performance.cleanup-interval=1h

# 调试配置
spring.ai.time-travel.debug.enabled=true
spring.ai.time-travel.debug.breakpoints.enabled=true
spring.ai.time-travel.debug.session-timeout=1h
```

## 最佳实践

### 1. 快照策略
- 在关键节点创建快照
- 合理设置快照间隔
- 实施快照压缩

### 2. 性能优化
- 异步保存快照
- 批量处理操作
- 定期清理过期快照

### 3. 调试效率
- 设置有意义的断点
- 使用状态比较功能
- 利用时间轴可视化

### 4. 存储管理
- 监控存储使用
- 实施数据归档
- 优化查询性能

## 下一步

- [学习子图](/docs/1.0.0.3/multi-agent/subgraphs/)
- [探索 Playground](/docs/1.0.0.3/playground/studio/)
- [了解 JManus](/docs/1.0.0.3/playground/jmanus/)
