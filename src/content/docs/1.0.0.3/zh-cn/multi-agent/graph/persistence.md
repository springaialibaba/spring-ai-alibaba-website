---
title: 持久化
keywords: ["Spring AI Alibaba", "Graph", "Persistence", "持久化", "检查点"]
description: "学习如何使用 Spring AI Alibaba Graph 的持久化功能，实现状态保存、检查点和故障恢复。"
---

## 概述

持久化是 Spring AI Alibaba Graph 的核心功能之一，它允许您保存图的执行状态，实现检查点、故障恢复和长时间运行任务的管理。

### 为什么需要持久化？

在复杂的 AI 工作流中，持久化解决了以下关键问题：

1. **故障恢复** — 在系统故障或重启后能够从上次保存的状态继续执行
2. **长时间任务** — 支持运行时间很长的任务，避免因超时而重新开始
3. **人机协作** — 在需要人工干预时保存状态，等待人工输入后继续
4. **成本控制** — 避免因后期失败而重复执行昂贵的前期步骤
5. **调试和测试** — 能够从特定状态开始重复执行，便于调试

## 检查点系统

### 1. 检查点保存器类型

Spring AI Alibaba Graph 支持多种检查点保存器：

```java
import com.alibaba.cloud.ai.graph.checkpoint.*;

// 1. 内存保存器 - 适用于开发和测试
@Bean
public CheckpointSaver memoryCheckpointSaver() {
    return new MemoryCheckpointSaver();
}

// 2. 文件保存器 - 适用于单机部署
@Bean
public CheckpointSaver fileCheckpointSaver() {
    return FileCheckpointSaver.builder()
        .directory("./checkpoints")
        .enableCompression(true)
        .maxCheckpoints(100)
        .build();
}

// 3. 数据库保存器 - 适用于生产环境
@Bean
public CheckpointSaver databaseCheckpointSaver(DataSource dataSource) {
    return DatabaseCheckpointSaver.builder()
        .dataSource(dataSource)
        .tableName("graph_checkpoints")
        .enableEncryption(true)
        .build();
}

// 4. Redis 保存器 - 适用于分布式环境
@Bean
public CheckpointSaver redisCheckpointSaver(RedisTemplate<String, Object> redisTemplate) {
    return RedisCheckpointSaver.builder()
        .redisTemplate(redisTemplate)
        .keyPrefix("graph:checkpoint:")
        .ttl(Duration.ofDays(7))
        .build();
}
```

### 2. 配置检查点策略

```java
import com.alibaba.cloud.ai.graph.checkpoint.CheckpointConfig;

@Configuration
public class CheckpointConfiguration {
    
    @Bean
    public CheckpointConfig checkpointConfig() {
        return CheckpointConfig.builder()
            .saveFrequency(CheckpointFrequency.AFTER_EACH_NODE)  // 每个节点后保存
            .enableAutoSave(true)                               // 启用自动保存
            .maxRetries(3)                                      // 最大重试次数
            .compressionLevel(6)                                // 压缩级别
            .enableMetadata(true)                               // 保存元数据
            .build();
    }
    
    @Bean
    public CompiledGraph persistentGraph(CheckpointSaver checkpointSaver, 
                                       CheckpointConfig checkpointConfig) {
        return new StateGraph(keyStrategyFactory)
            .addNode("step1", node_async(step1Action))
            .addNode("step2", node_async(step2Action))
            .addNode("step3", node_async(step3Action))
            
            .addEdge(START, "step1")
            .addEdge("step1", "step2")
            .addEdge("step2", "step3")
            .addEdge("step3", END)
            
            .compile(CompileConfig.builder()
                .checkpointSaver(checkpointSaver)
                .checkpointConfig(checkpointConfig)
                .build());
    }
}
```

## 基础持久化操作

### 1. 保存和加载检查点

```java
import com.alibaba.cloud.ai.graph.checkpoint.Checkpoint;
import com.alibaba.cloud.ai.graph.checkpoint.CheckpointMetadata;

@Service
public class GraphPersistenceService {
    
    @Autowired
    private CompiledGraph persistentGraph;
    
    @Autowired
    private CheckpointSaver checkpointSaver;
    
    // 执行图并自动保存检查点
    public String executeWithCheckpoints(String sessionId, Map<String, Object> input) {
        try {
            Optional<OverAllState> result = persistentGraph.invoke(
                input, 
                RunnableConfig.builder()
                    .configurable(Map.of("thread_id", sessionId))
                    .build()
            );
            
            return result.map(state -> 
                state.value("final_result", String.class).orElse("无结果")
            ).orElse("执行失败");
            
        } catch (Exception e) {
            // 即使执行失败，检查点也已保存
            System.out.println("执行失败，但可以从检查点恢复: " + e.getMessage());
            throw e;
        }
    }
    
    // 从检查点恢复执行
    public String resumeFromCheckpoint(String sessionId) {
        try {
            // 获取最新的检查点
            Optional<Checkpoint> latestCheckpoint = checkpointSaver.getLatest(sessionId);
            
            if (latestCheckpoint.isPresent()) {
                Checkpoint checkpoint = latestCheckpoint.get();
                System.out.println("从检查点恢复: " + checkpoint.getMetadata().getNodeId());
                
                // 从检查点继续执行
                Optional<OverAllState> result = persistentGraph.invoke(
                    checkpoint.getState().data(),
                    RunnableConfig.builder()
                        .configurable(Map.of("thread_id", sessionId))
                        .build()
                );
                
                return result.map(state -> 
                    state.value("final_result", String.class).orElse("无结果")
                ).orElse("恢复执行失败");
            } else {
                return "未找到检查点";
            }
            
        } catch (Exception e) {
            System.err.println("从检查点恢复失败: " + e.getMessage());
            throw e;
        }
    }
    
    // 列出所有检查点
    public List<CheckpointMetadata> listCheckpoints(String sessionId) {
        return checkpointSaver.list(sessionId);
    }
    
    // 删除检查点
    public void deleteCheckpoints(String sessionId) {
        checkpointSaver.delete(sessionId);
    }
}
```

### 2. 手动检查点管理

```java
public class ManualCheckpointNode implements NodeAction {
    
    @Autowired
    private CheckpointSaver checkpointSaver;
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        String sessionId = state.value("session_id", String.class).orElse("default");
        
        try {
            // 执行一些重要的处理
            Object importantResult = performCriticalOperation(state);
            
            // 手动创建检查点
            Checkpoint checkpoint = Checkpoint.builder()
                .sessionId(sessionId)
                .state(state)
                .metadata(CheckpointMetadata.builder()
                    .nodeId("manual_checkpoint")
                    .timestamp(System.currentTimeMillis())
                    .description("关键操作完成后的检查点")
                    .build())
                .build();
            
            checkpointSaver.save(checkpoint);
            
            return Map.of(
                "important_result", importantResult,
                "checkpoint_saved", true
            );
            
        } catch (Exception e) {
            // 即使操作失败，也保存错误状态的检查点
            Checkpoint errorCheckpoint = Checkpoint.builder()
                .sessionId(sessionId)
                .state(state)
                .metadata(CheckpointMetadata.builder()
                    .nodeId("error_checkpoint")
                    .timestamp(System.currentTimeMillis())
                    .description("操作失败: " + e.getMessage())
                    .error(true)
                    .build())
                .build();
            
            checkpointSaver.save(errorCheckpoint);
            throw e;
        }
    }
}
```

## 高级持久化功能

### 1. 条件检查点

```java
import com.alibaba.cloud.ai.graph.checkpoint.CheckpointCondition;

public class ConditionalCheckpointNode implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        Object result = performOperation(state);
        
        // 只在满足特定条件时保存检查点
        CheckpointCondition condition = CheckpointCondition.builder()
            .saveIf(s -> {
                // 只在处理重要数据时保存检查点
                return s.value("importance_level", String.class)
                    .map("high"::equals)
                    .orElse(false);
            })
            .description("高重要性数据处理检查点")
            .build();
        
        // 应用条件检查点
        CheckpointContext.current().setCondition(condition);
        
        return Map.of("result", result);
    }
}
```

### 2. 增量检查点

```java
public class IncrementalCheckpointNode implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        List<String> items = state.value("items", List.class).orElse(List.of());
        List<String> processedItems = new ArrayList<>();
        
        for (int i = 0; i < items.size(); i++) {
            String item = items.get(i);
            String processed = processItem(item);
            processedItems.add(processed);
            
            // 每处理10个项目保存一次增量检查点
            if ((i + 1) % 10 == 0) {
                CheckpointContext.current().saveIncremental(Map.of(
                    "processed_items", new ArrayList<>(processedItems),
                    "current_index", i + 1,
                    "progress", (i + 1) * 100 / items.size()
                ));
            }
        }
        
        return Map.of("processed_items", processedItems);
    }
}
```

### 3. 检查点版本管理

```java
@Service
public class CheckpointVersionService {
    
    @Autowired
    private CheckpointSaver checkpointSaver;
    
    // 创建命名版本的检查点
    public void createNamedCheckpoint(String sessionId, String versionName, 
                                    OverAllState state, String description) {
        Checkpoint checkpoint = Checkpoint.builder()
            .sessionId(sessionId)
            .state(state)
            .metadata(CheckpointMetadata.builder()
                .nodeId("named_version")
                .versionName(versionName)
                .timestamp(System.currentTimeMillis())
                .description(description)
                .build())
            .build();
        
        checkpointSaver.save(checkpoint);
    }
    
    // 从命名版本恢复
    public Optional<OverAllState> restoreFromNamedVersion(String sessionId, String versionName) {
        return checkpointSaver.getByVersion(sessionId, versionName)
            .map(Checkpoint::getState);
    }
    
    // 比较两个检查点版本
    public CheckpointDiff compareVersions(String sessionId, String version1, String version2) {
        Optional<Checkpoint> cp1 = checkpointSaver.getByVersion(sessionId, version1);
        Optional<Checkpoint> cp2 = checkpointSaver.getByVersion(sessionId, version2);
        
        if (cp1.isPresent() && cp2.isPresent()) {
            return CheckpointDiff.compare(cp1.get(), cp2.get());
        }
        
        throw new IllegalArgumentException("找不到指定的检查点版本");
    }
}
```

## 数据库持久化配置

### 1. 数据库表结构

```sql
-- 检查点表
CREATE TABLE graph_checkpoints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) NOT NULL,
    node_id VARCHAR(255) NOT NULL,
    version_name VARCHAR(255),
    state_data LONGTEXT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_session_id (session_id),
    INDEX idx_session_node (session_id, node_id),
    INDEX idx_session_version (session_id, version_name),
    INDEX idx_created_at (created_at)
);

-- 检查点元数据表
CREATE TABLE checkpoint_metadata (
    checkpoint_id BIGINT,
    key_name VARCHAR(255),
    value_data TEXT,
    
    FOREIGN KEY (checkpoint_id) REFERENCES graph_checkpoints(id) ON DELETE CASCADE,
    INDEX idx_checkpoint_key (checkpoint_id, key_name)
);
```

### 2. JPA 实体配置

```java
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "graph_checkpoints")
public class CheckpointEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "session_id", nullable = false)
    private String sessionId;
    
    @Column(name = "node_id", nullable = false)
    private String nodeId;
    
    @Column(name = "version_name")
    private String versionName;
    
    @Lob
    @Column(name = "state_data", nullable = false)
    private String stateData;
    
    @Column(name = "metadata", columnDefinition = "JSON")
    private String metadata;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // 构造函数、getter 和 setter
}

@Repository
public interface CheckpointRepository extends JpaRepository<CheckpointEntity, Long> {
    
    List<CheckpointEntity> findBySessionIdOrderByCreatedAtDesc(String sessionId);
    
    Optional<CheckpointEntity> findBySessionIdAndVersionName(String sessionId, String versionName);
    
    @Query("SELECT c FROM CheckpointEntity c WHERE c.sessionId = :sessionId " +
           "ORDER BY c.createdAt DESC LIMIT 1")
    Optional<CheckpointEntity> findLatestBySessionId(@Param("sessionId") String sessionId);
    
    void deleteBySessionId(String sessionId);
}
```

## 性能优化

### 1. 检查点压缩和序列化

```java
@Component
public class OptimizedCheckpointSaver implements CheckpointSaver {
    
    private final ObjectMapper objectMapper;
    private final Compressor compressor;
    
    public OptimizedCheckpointSaver() {
        this.objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .registerModule(new JavaTimeModule());
        this.compressor = new GzipCompressor();
    }
    
    @Override
    public void save(Checkpoint checkpoint) {
        try {
            // 序列化状态
            String stateJson = objectMapper.writeValueAsString(checkpoint.getState().data());
            
            // 压缩数据
            byte[] compressedData = compressor.compress(stateJson.getBytes(StandardCharsets.UTF_8));
            
            // 保存到存储
            saveCompressedCheckpoint(checkpoint.getSessionId(), compressedData, checkpoint.getMetadata());
            
        } catch (Exception e) {
            throw new CheckpointException("保存检查点失败", e);
        }
    }
    
    @Override
    public Optional<Checkpoint> getLatest(String sessionId) {
        try {
            return loadLatestCompressedCheckpoint(sessionId)
                .map(this::decompressAndDeserialize);
        } catch (Exception e) {
            throw new CheckpointException("加载检查点失败", e);
        }
    }
}
```

### 2. 异步检查点保存

```java
@Service
public class AsyncCheckpointService {
    
    private final ExecutorService checkpointExecutor;
    private final CheckpointSaver checkpointSaver;
    
    public AsyncCheckpointService(CheckpointSaver checkpointSaver) {
        this.checkpointSaver = checkpointSaver;
        this.checkpointExecutor = Executors.newFixedThreadPool(4, 
            new ThreadFactoryBuilder()
                .setNameFormat("checkpoint-saver-%d")
                .setDaemon(true)
                .build());
    }
    
    public CompletableFuture<Void> saveAsync(Checkpoint checkpoint) {
        return CompletableFuture.runAsync(() -> {
            try {
                checkpointSaver.save(checkpoint);
            } catch (Exception e) {
                System.err.println("异步保存检查点失败: " + e.getMessage());
                throw new RuntimeException(e);
            }
        }, checkpointExecutor);
    }
    
    @PreDestroy
    public void shutdown() {
        checkpointExecutor.shutdown();
        try {
            if (!checkpointExecutor.awaitTermination(30, TimeUnit.SECONDS)) {
                checkpointExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            checkpointExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
```

## 最佳实践

### 1. 检查点策略选择

- **频繁保存** vs **性能考虑**：在数据安全和性能之间找到平衡
- **关键节点**：在重要的计算节点后保存检查点
- **长时间操作**：在耗时操作前后保存检查点
- **用户交互点**：在需要用户输入的节点前保存检查点

### 2. 存储管理

- **定期清理**：删除过期的检查点以节省存储空间
- **压缩策略**：对大状态对象使用压缩以减少存储需求
- **备份机制**：为重要的检查点创建备份
- **监控告警**：监控检查点保存失败和存储空间使用情况

## 下一步

- [持久执行](./durable-execution) - 了解持久执行和故障恢复
- [人机协作](./human-in-the-loop) - 学习如何在工作流中集成人工干预
- [时间旅行](./time-travel) - 探索状态回滚和分支功能
