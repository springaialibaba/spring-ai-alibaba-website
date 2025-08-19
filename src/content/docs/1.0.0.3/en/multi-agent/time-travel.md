---
title: Time Travel
description: Spring AI Alibaba time travel capabilities
---

# Time Travel

Time travel functionality allows developers to trace back the execution history of multi-agent systems, view states at any point in time, and support recovery from historical states.

## Core Concepts

### Time Point Snapshots
- **State Snapshots**: Complete system state at specific time points
- **Incremental Snapshots**: Changes relative to the previous snapshot
- **Automatic Snapshots**: System-generated snapshots
- **Manual Snapshots**: User-created snapshots

### Timeline Management
- **Linear Timeline**: Single execution timeline
- **Branching Timeline**: Support for multiple execution branches
- **Merged Timeline**: Merging branches back to main timeline

## Basic Configuration

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

## State Snapshots

### Automatic Snapshot Creation

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
    
    @Scheduled(fixedRate = 300000) // Every 5 minutes
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

### Manual Snapshot Management

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

## Timeline Browsing

### Timeline Visualization

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

### State Difference Analysis

```java
@Component
public class StateDiffAnalyzer {
    
    public StateDiff calculateStateDiff(OverallState state1, OverallState state2) {
        Map<String, Object> map1 = state1.toMap();
        Map<String, Object> map2 = state2.toMap();
        
        List<FieldChange> changes = new ArrayList<>();
        
        // Check modified and deleted fields
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
        
        // Check added fields
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

## State Restoration

### Precise Restoration

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
        
        // Pause current execution
        execution.pause();
        
        try {
            // Restore state
            execution.restoreState(snapshot.getState());
            execution.setCurrentNode(snapshot.getNodeId());
            
            // Clean up future state
            cleanupFutureState(execution, snapshot.getTimestamp());
            
            // Resume execution
            execution.resume();
            
            log.info("Successfully restored execution {} to snapshot {}", 
                snapshot.getExecutionId(), snapshotId);
                
        } catch (Exception e) {
            log.error("Failed to restore to snapshot: {}", snapshotId, e);
            execution.resume(); // Resume original execution
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
        // Delete all snapshots after the snapshot time
        timeTravelManager.deleteSnapshotsAfter(execution.getId(), cutoffTime);
        
        // Clean up execution history
        execution.clearHistoryAfter(cutoffTime);
    }
    
    private Snapshot findNearestSnapshot(String executionId, Instant timepoint) {
        return snapshotRepository.findNearestSnapshot(executionId, timepoint);
    }
}
```

### Branch Restoration

```java
@Service
public class BranchRestorationService {
    
    public String createBranchFromSnapshot(String snapshotId, String branchName) {
        Snapshot snapshot = timeTravelManager.getSnapshot(snapshotId);
        
        // Create new execution branch
        String branchExecutionId = UUID.randomUUID().toString();
        
        GraphExecution originalExecution = executionManager.getExecution(snapshot.getExecutionId());
        GraphExecution branchExecution = originalExecution.createBranch(branchExecutionId);
        
        // Restore to snapshot state
        branchExecution.restoreState(snapshot.getState());
        branchExecution.setCurrentNode(snapshot.getNodeId());
        
        // Register branch
        executionManager.registerBranch(branchExecutionId, branchExecution);
        
        // Record branch information
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
        
        // Analyze branch differences
        BranchDiff diff = analyzeBranchDiff(branchExecution, targetExecution);
        
        // Execute merge strategy
        MergeStrategy strategy = determineMergeStrategy(diff);
        strategy.merge(branchExecution, targetExecution);
        
        // Clean up branch
        executionManager.removeBranch(branchExecutionId);
        branchRepository.deleteByBranchId(branchExecutionId);
    }
}
```

## Time Queries

### Time Range Queries

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

## Time Travel Debugging

### Debug Tools

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

## Performance Optimization

### Snapshot Compression

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

## Configuration Options

```properties
# Time travel configuration
spring.ai.time-travel.enabled=true
spring.ai.time-travel.auto-snapshot.enabled=true
spring.ai.time-travel.auto-snapshot.interval=5m

# Snapshot storage configuration
spring.ai.time-travel.snapshot.store=database
spring.ai.time-travel.snapshot.compression.enabled=true
spring.ai.time-travel.snapshot.max-count=100

# Performance configuration
spring.ai.time-travel.performance.async-save=true
spring.ai.time-travel.performance.batch-size=10
spring.ai.time-travel.performance.cleanup-interval=1h

# Debug configuration
spring.ai.time-travel.debug.enabled=true
spring.ai.time-travel.debug.breakpoints.enabled=true
spring.ai.time-travel.debug.session-timeout=1h
```

## Best Practices

### 1. Snapshot Strategy
- Create snapshots at key nodes
- Set reasonable snapshot intervals
- Implement snapshot compression

### 2. Performance Optimization
- Save snapshots asynchronously
- Process operations in batches
- Regularly clean up expired snapshots

### 3. Debugging Efficiency
- Set meaningful breakpoints
- Use state comparison features
- Utilize timeline visualization

### 4. Storage Management
- Monitor storage usage
- Implement data archiving
- Optimize query performance

## Next Steps

- [Learn about Subgraphs](/docs/1.0.0.3/multi-agent/subgraphs/)
- [Explore Playground](/docs/1.0.0.3/playground/studio/)
- [Understand JManus](/docs/1.0.0.3/playground/jmanus/)
