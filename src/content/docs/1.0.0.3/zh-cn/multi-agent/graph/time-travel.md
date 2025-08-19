---
title: 时间旅行
keywords: ["Spring AI Alibaba", "Graph", "Time Travel", "时间旅行", "状态回滚"]
description: "学习如何使用 Spring AI Alibaba Graph 的时间旅行功能，实现状态回滚、分支和历史版本管理。"
---

## 概述

时间旅行（Time Travel）是 Spring AI Alibaba Graph 的一个高级特性，它允许您回到图执行的任意历史状态，创建分支执行路径，并探索不同的执行可能性。这个功能对于调试、实验和"假设分析"场景非常有价值。

### 时间旅行的应用场景

1. **调试和故障排查** — 回到问题发生前的状态，重新执行并观察
2. **A/B 测试** — 从同一起点创建多个分支，测试不同的策略
3. **假设分析** — 探索"如果当时选择了不同路径会怎样"
4. **错误恢复** — 从错误发生前的状态重新开始
5. **实验性功能** — 在不影响主流程的情况下测试新功能

## 基础时间旅行操作

### 1. 状态历史记录

```java
import com.alibaba.cloud.ai.graph.timetravel.TimeTravel;
import com.alibaba.cloud.ai.graph.timetravel.StateSnapshot;

@Service
public class TimeTravelService {
    
    @Autowired
    private CompiledGraph workflow;
    
    @Autowired
    private TimeTravel timeTravel;
    
    // 执行图并记录历史状态
    public String executeWithHistory(String sessionId, Map<String, Object> input) {
        try {
            Optional<OverAllState> result = workflow.invoke(
                input,
                RunnableConfig.builder()
                    .configurable(Map.of(
                        "thread_id", sessionId,
                        "enable_time_travel", true  // 启用时间旅行
                    ))
                    .build()
            );
            
            return result.map(state -> 
                state.value("final_result", String.class).orElse("执行完成")
            ).orElse("执行失败");
            
        } catch (Exception e) {
            System.err.println("执行失败: " + e.getMessage());
            throw e;
        }
    }
    
    // 获取执行历史
    public List<StateSnapshot> getExecutionHistory(String sessionId) {
        return timeTravel.getHistory(sessionId);
    }
    
    // 回到指定的历史状态
    public String travelToState(String sessionId, String snapshotId) {
        try {
            Optional<StateSnapshot> snapshot = timeTravel.getSnapshot(sessionId, snapshotId);
            
            if (snapshot.isPresent()) {
                // 恢复到历史状态
                timeTravel.restoreToSnapshot(sessionId, snapshot.get());
                return "已回到状态: " + snapshot.get().getDescription();
            } else {
                return "未找到指定的历史状态";
            }
            
        } catch (Exception e) {
            return "时间旅行失败: " + e.getMessage();
        }
    }
    
    // 从当前状态创建分支
    public String createBranch(String sessionId, String branchName) {
        try {
            String branchId = timeTravel.createBranch(sessionId, branchName);
            return "已创建分支: " + branchName + " (ID: " + branchId + ")";
        } catch (Exception e) {
            return "创建分支失败: " + e.getMessage();
        }
    }
}
```

### 2. 自动状态快照

```java
public class SnapshotNode implements NodeAction {
    
    @Autowired
    private TimeTravel timeTravel;
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        String sessionId = state.value("session_id", String.class).orElse("default");
        
        // 执行业务逻辑
        Object result = performBusinessLogic(state);
        
        // 创建自动快照
        StateSnapshot snapshot = StateSnapshot.builder()
            .sessionId(sessionId)
            .nodeId("snapshot_node")
            .state(state)
            .timestamp(System.currentTimeMillis())
            .description("业务逻辑执行后的自动快照")
            .automatic(true)
            .build();
        
        timeTravel.saveSnapshot(snapshot);
        
        return Map.of(
            "result", result,
            "snapshot_created", true,
            "snapshot_id", snapshot.getId()
        );
    }
}
```

## 高级时间旅行功能

### 1. 分支执行和比较

```java
@Service
public class BranchExecutionService {
    
    @Autowired
    private TimeTravel timeTravel;
    
    @Autowired
    private CompiledGraph workflow;
    
    // 创建多个分支并并行执行不同策略
    public Map<String, Object> executeMultipleBranches(String sessionId, 
                                                      Map<String, Object> baseState,
                                                      List<ExecutionStrategy> strategies) {
        Map<String, Object> results = new HashMap<>();
        
        try {
            // 保存基础状态作为分支起点
            StateSnapshot baseSnapshot = timeTravel.createSnapshot(sessionId, baseState, "分支起点");
            
            // 为每个策略创建分支并执行
            for (ExecutionStrategy strategy : strategies) {
                String branchId = timeTravel.createBranch(sessionId, strategy.getName());
                
                // 在分支中执行策略
                Map<String, Object> strategyInput = strategy.prepareInput(baseState);
                
                Optional<OverAllState> branchResult = workflow.invoke(
                    strategyInput,
                    RunnableConfig.builder()
                        .configurable(Map.of(
                            "thread_id", branchId,
                            "strategy", strategy.getName()
                        ))
                        .build()
                );
                
                results.put(strategy.getName(), branchResult.orElse(null));
            }
            
            return results;
            
        } catch (Exception e) {
            System.err.println("分支执行失败: " + e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }
    
    // 比较不同分支的执行结果
    public BranchComparison compareBranches(String sessionId, List<String> branchIds) {
        List<StateSnapshot> branchSnapshots = branchIds.stream()
            .map(branchId -> timeTravel.getLatestSnapshot(branchId))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toList());
        
        return BranchComparison.builder()
            .sessionId(sessionId)
            .branches(branchSnapshots)
            .differences(calculateDifferences(branchSnapshots))
            .recommendations(generateRecommendations(branchSnapshots))
            .build();
    }
    
    private List<StateDifference> calculateDifferences(List<StateSnapshot> snapshots) {
        List<StateDifference> differences = new ArrayList<>();
        
        for (int i = 0; i < snapshots.size(); i++) {
            for (int j = i + 1; j < snapshots.size(); j++) {
                StateDifference diff = StateDifference.compare(
                    snapshots.get(i), snapshots.get(j));
                differences.add(diff);
            }
        }
        
        return differences;
    }
}
```

### 2. 条件时间旅行

```java
public class ConditionalTimeTravelNode implements NodeAction {
    
    @Autowired
    private TimeTravel timeTravel;
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        String sessionId = state.value("session_id", String.class).orElse("default");
        
        // 执行主要逻辑
        ProcessingResult result = performProcessing(state);
        
        // 根据结果质量决定是否需要时间旅行
        if (result.getQualityScore() < 0.7) {
            // 质量不佳，尝试回到之前的状态并使用不同策略
            Optional<StateSnapshot> alternativePoint = findAlternativeStartPoint(sessionId);
            
            if (alternativePoint.isPresent()) {
                // 创建分支用于替代执行
                String alternativeBranch = timeTravel.createBranch(sessionId, "alternative_execution");
                
                // 回到替代起点
                timeTravel.restoreToSnapshot(alternativeBranch, alternativePoint.get());
                
                // 使用不同策略重新执行
                ProcessingResult alternativeResult = performAlternativeProcessing(
                    alternativePoint.get().getState());
                
                // 比较结果并选择更好的
                if (alternativeResult.getQualityScore() > result.getQualityScore()) {
                    return Map.of(
                        "result", alternativeResult,
                        "strategy", "alternative",
                        "time_travel_used", true
                    );
                }
            }
        }
        
        return Map.of(
            "result", result,
            "strategy", "original",
            "time_travel_used", false
        );
    }
    
    private Optional<StateSnapshot> findAlternativeStartPoint(String sessionId) {
        List<StateSnapshot> history = timeTravel.getHistory(sessionId);
        
        // 寻找可以尝试不同策略的历史点
        return history.stream()
            .filter(snapshot -> snapshot.getMetadata().containsKey("decision_point"))
            .findFirst();
    }
}
```

### 3. 交互式时间旅行

```java
@RestController
@RequestMapping("/api/time-travel")
public class TimeTravelController {
    
    @Autowired
    private TimeTravelService timeTravelService;
    
    // 获取执行历史时间线
    @GetMapping("/{sessionId}/timeline")
    public ResponseEntity<TimelineResponse> getTimeline(@PathVariable String sessionId) {
        try {
            List<StateSnapshot> history = timeTravelService.getExecutionHistory(sessionId);
            
            TimelineResponse timeline = TimelineResponse.builder()
                .sessionId(sessionId)
                .snapshots(history.stream()
                    .map(this::convertToTimelineItem)
                    .collect(Collectors.toList()))
                .build();
            
            return ResponseEntity.ok(timeline);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 时间旅行到指定状态
    @PostMapping("/{sessionId}/travel")
    public ResponseEntity<String> travelToState(
            @PathVariable String sessionId,
            @RequestBody TimeTravelRequest request) {
        try {
            String result = timeTravelService.travelToState(sessionId, request.getSnapshotId());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("时间旅行失败: " + e.getMessage());
        }
    }
    
    // 创建分支
    @PostMapping("/{sessionId}/branch")
    public ResponseEntity<String> createBranch(
            @PathVariable String sessionId,
            @RequestBody BranchRequest request) {
        try {
            String result = timeTravelService.createBranch(sessionId, request.getBranchName());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("创建分支失败: " + e.getMessage());
        }
    }
    
    // 比较不同时间点的状态
    @PostMapping("/{sessionId}/compare")
    public ResponseEntity<StateComparison> compareStates(
            @PathVariable String sessionId,
            @RequestBody CompareRequest request) {
        try {
            StateComparison comparison = timeTravelService.compareStates(
                sessionId, request.getSnapshot1Id(), request.getSnapshot2Id());
            return ResponseEntity.ok(comparison);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    private TimelineItem convertToTimelineItem(StateSnapshot snapshot) {
        return TimelineItem.builder()
            .id(snapshot.getId())
            .timestamp(snapshot.getTimestamp())
            .nodeId(snapshot.getNodeId())
            .description(snapshot.getDescription())
            .automatic(snapshot.isAutomatic())
            .branchable(snapshot.isBranchable())
            .build();
    }
}
```

## 时间旅行可视化

### 1. 前端时间线组件

```javascript
class TimeTravelTimeline {
    constructor(containerId, sessionId) {
        this.container = document.getElementById(containerId);
        this.sessionId = sessionId;
        this.snapshots = [];
        this.currentSnapshot = null;
        
        this.loadTimeline();
        this.setupEventListeners();
    }
    
    async loadTimeline() {
        try {
            const response = await fetch(`/api/time-travel/${this.sessionId}/timeline`);
            const timeline = await response.json();
            this.snapshots = timeline.snapshots;
            this.renderTimeline();
        } catch (error) {
            console.error('加载时间线失败:', error);
        }
    }
    
    renderTimeline() {
        this.container.innerHTML = '';
        
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-container';
        
        this.snapshots.forEach((snapshot, index) => {
            const item = this.createTimelineItem(snapshot, index);
            timelineContainer.appendChild(item);
        });
        
        this.container.appendChild(timelineContainer);
    }
    
    createTimelineItem(snapshot, index) {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.dataset.snapshotId = snapshot.id;
        
        const isCurrentSnapshot = snapshot.id === this.currentSnapshot;
        if (isCurrentSnapshot) {
            item.classList.add('current');
        }
        
        item.innerHTML = `
            <div class="timeline-marker ${snapshot.automatic ? 'auto' : 'manual'}"></div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <span class="timeline-time">${new Date(snapshot.timestamp).toLocaleString()}</span>
                    <span class="timeline-node">${snapshot.nodeId}</span>
                </div>
                <div class="timeline-description">${snapshot.description}</div>
                <div class="timeline-actions">
                    <button onclick="timeline.travelTo('${snapshot.id}')" 
                            ${isCurrentSnapshot ? 'disabled' : ''}>
                        时间旅行
                    </button>
                    ${snapshot.branchable ? 
                        `<button onclick="timeline.createBranch('${snapshot.id}')">创建分支</button>` : 
                        ''}
                </div>
            </div>
        `;
        
        return item;
    }
    
    async travelTo(snapshotId) {
        try {
            const response = await fetch(`/api/time-travel/${this.sessionId}/travel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ snapshotId: snapshotId })
            });
            
            if (response.ok) {
                const result = await response.text();
                this.showNotification('时间旅行成功: ' + result, 'success');
                this.currentSnapshot = snapshotId;
                this.renderTimeline();
            } else {
                const error = await response.text();
                this.showNotification('时间旅行失败: ' + error, 'error');
            }
        } catch (error) {
            this.showNotification('时间旅行失败: ' + error.message, 'error');
        }
    }
    
    async createBranch(snapshotId) {
        const branchName = prompt('请输入分支名称:');
        if (!branchName) return;
        
        try {
            const response = await fetch(`/api/time-travel/${this.sessionId}/branch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    snapshotId: snapshotId,
                    branchName: branchName 
                })
            });
            
            if (response.ok) {
                const result = await response.text();
                this.showNotification('分支创建成功: ' + result, 'success');
            } else {
                const error = await response.text();
                this.showNotification('分支创建失败: ' + error, 'error');
            }
        } catch (error) {
            this.showNotification('分支创建失败: ' + error.message, 'error');
        }
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// 初始化时间线
const timeline = new TimeTravelTimeline('timeline-container', 'session-123');
```

### 2. 状态差异可视化

```javascript
class StateDiffViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }
    
    async compareStates(sessionId, snapshot1Id, snapshot2Id) {
        try {
            const response = await fetch(`/api/time-travel/${sessionId}/compare`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    snapshot1Id: snapshot1Id,
                    snapshot2Id: snapshot2Id
                })
            });
            
            const comparison = await response.json();
            this.renderComparison(comparison);
        } catch (error) {
            console.error('状态比较失败:', error);
        }
    }
    
    renderComparison(comparison) {
        this.container.innerHTML = `
            <div class="diff-header">
                <h3>状态差异比较</h3>
                <div class="diff-info">
                    <span>快照1: ${comparison.snapshot1.description}</span>
                    <span>快照2: ${comparison.snapshot2.description}</span>
                </div>
            </div>
            <div class="diff-content">
                ${this.renderDifferences(comparison.differences)}
            </div>
        `;
    }
    
    renderDifferences(differences) {
        return differences.map(diff => `
            <div class="diff-item ${diff.type}">
                <div class="diff-key">${diff.key}</div>
                <div class="diff-values">
                    <div class="diff-old">
                        <label>原值:</label>
                        <pre>${JSON.stringify(diff.oldValue, null, 2)}</pre>
                    </div>
                    <div class="diff-new">
                        <label>新值:</label>
                        <pre>${JSON.stringify(diff.newValue, null, 2)}</pre>
                    </div>
                </div>
            </div>
        `).join('');
    }
}
```

## 性能优化和最佳实践

### 1. 快照存储优化

```java
@Component
public class OptimizedSnapshotStorage {
    
    private final Map<String, StateSnapshot> snapshotCache = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleanupExecutor = Executors.newScheduledThreadPool(1);
    
    @PostConstruct
    public void init() {
        // 定期清理过期快照
        cleanupExecutor.scheduleAtFixedRate(this::cleanupExpiredSnapshots, 1, 1, TimeUnit.HOURS);
    }
    
    public void saveSnapshot(StateSnapshot snapshot) {
        // 压缩状态数据
        StateSnapshot compressedSnapshot = compressSnapshot(snapshot);
        
        // 保存到缓存
        snapshotCache.put(snapshot.getId(), compressedSnapshot);
        
        // 异步持久化
        CompletableFuture.runAsync(() -> persistSnapshot(compressedSnapshot));
    }
    
    private StateSnapshot compressSnapshot(StateSnapshot snapshot) {
        // 实现状态压缩逻辑
        Map<String, Object> compressedState = compressStateData(snapshot.getState().data());
        
        return StateSnapshot.builder()
            .id(snapshot.getId())
            .sessionId(snapshot.getSessionId())
            .state(OverAllState.builder().data(compressedState).build())
            .timestamp(snapshot.getTimestamp())
            .compressed(true)
            .build();
    }
    
    private void cleanupExpiredSnapshots() {
        long cutoffTime = System.currentTimeMillis() - TimeUnit.DAYS.toMillis(7);
        
        snapshotCache.entrySet().removeIf(entry -> 
            entry.getValue().getTimestamp() < cutoffTime);
    }
}
```

### 2. 最佳实践指南

- **快照频率控制**：不要在每个节点都创建快照，选择关键决策点
- **存储优化**：使用压缩和增量存储减少空间占用
- **分支管理**：及时清理不需要的分支，避免存储膨胀
- **权限控制**：限制时间旅行功能的访问权限
- **性能监控**：监控时间旅行操作对系统性能的影响

## 下一步

- [持久执行](./durable-execution) - 了解持久执行和故障恢复
- [内存管理](./memory) - 学习图的内存管理和优化
- [上下文管理](./context) - 探索上下文传递和管理机制
