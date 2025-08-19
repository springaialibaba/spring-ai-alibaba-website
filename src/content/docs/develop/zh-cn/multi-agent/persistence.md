---
title: 持久化 (Persistence)
description: Spring AI Alibaba 多智能体持久化
---

# 持久化 (Persistence)

持久化是多智能体系统的重要组成部分，确保智能体状态、对话历史和执行进度能够可靠保存和恢复。

## 持久化类型

### 1. 状态持久化
保存智能体的执行状态，支持中断恢复。

### 2. 对话持久化
保存完整的对话历史和上下文。

### 3. 知识持久化
保存智能体学习的知识和经验。

### 4. 配置持久化
保存智能体的配置和设置。

## 状态持久化

### 基本配置

```java
@Configuration
public class PersistenceConfig {
    
    @Bean
    public StateStore stateStore() {
        return new RedisStateStore(redisTemplate());
    }
    
    @Bean
    public CheckpointManager checkpointManager() {
        return new DatabaseCheckpointManager(dataSource());
    }
}
```

### 状态保存

```java
@Component
public class StatePersistenceService {
    
    @Autowired
    private StateStore stateStore;
    
    public void saveState(String executionId, OverallState state) {
        StateSnapshot snapshot = StateSnapshot.builder()
            .executionId(executionId)
            .state(state)
            .timestamp(Instant.now())
            .version(generateVersion())
            .build();
        
        stateStore.save(executionId, snapshot);
    }
    
    public OverallState loadState(String executionId) {
        StateSnapshot snapshot = stateStore.load(executionId);
        return snapshot != null ? snapshot.getState() : null;
    }
    
    public List<StateSnapshot> getStateHistory(String executionId) {
        return stateStore.getHistory(executionId);
    }
}
```

## 检查点机制

### 自动检查点

```java
@Component
public class AutoCheckpointService {
    
    @Autowired
    private CheckpointManager checkpointManager;
    
    @EventListener
    public void onNodeCompletion(NodeCompletionEvent event) {
        if (shouldCreateCheckpoint(event)) {
            Checkpoint checkpoint = Checkpoint.builder()
                .executionId(event.getExecutionId())
                .nodeId(event.getNodeId())
                .state(event.getState())
                .timestamp(Instant.now())
                .build();
            
            checkpointManager.createCheckpoint(checkpoint);
        }
    }
    
    private boolean shouldCreateCheckpoint(NodeCompletionEvent event) {
        // 检查点创建策略
        return event.getNodeId().endsWith("_checkpoint") || 
               event.getExecutionTime().toSeconds() > 30;
    }
}
```

### 手动检查点

```java
@Service
public class ManualCheckpointService {
    
    public String createCheckpoint(String executionId, String description) {
        GraphExecution execution = executionRegistry.getExecution(executionId);
        OverallState currentState = execution.getCurrentState();
        
        Checkpoint checkpoint = Checkpoint.builder()
            .id(UUID.randomUUID().toString())
            .executionId(executionId)
            .state(currentState)
            .description(description)
            .timestamp(Instant.now())
            .build();
        
        checkpointManager.createCheckpoint(checkpoint);
        return checkpoint.getId();
    }
    
    public void restoreFromCheckpoint(String checkpointId) {
        Checkpoint checkpoint = checkpointManager.getCheckpoint(checkpointId);
        
        GraphExecution execution = executionRegistry.getExecution(checkpoint.getExecutionId());
        execution.restoreState(checkpoint.getState());
    }
}
```

## 数据库持久化

### 实体定义

```java
@Entity
@Table(name = "agent_executions")
public class AgentExecution {
    @Id
    private String id;
    
    @Column(name = "graph_id")
    private String graphId;
    
    @Column(name = "current_node")
    private String currentNode;
    
    @Column(name = "state", columnDefinition = "jsonb")
    private Map<String, Object> state;
    
    @Enumerated(EnumType.STRING)
    private ExecutionStatus status;
    
    @Column(name = "created_at")
    private Instant createdAt;
    
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    // getters and setters
}

@Entity
@Table(name = "execution_checkpoints")
public class ExecutionCheckpoint {
    @Id
    private String id;
    
    @Column(name = "execution_id")
    private String executionId;
    
    @Column(name = "node_id")
    private String nodeId;
    
    @Column(name = "state", columnDefinition = "jsonb")
    private Map<String, Object> state;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "created_at")
    private Instant createdAt;
    
    // getters and setters
}
```

### Repository 实现

```java
@Repository
public interface AgentExecutionRepository extends JpaRepository<AgentExecution, String> {
    List<AgentExecution> findByGraphIdAndStatus(String graphId, ExecutionStatus status);
    List<AgentExecution> findByStatusAndCreatedAtBefore(ExecutionStatus status, Instant before);
}

@Repository
public interface ExecutionCheckpointRepository extends JpaRepository<ExecutionCheckpoint, String> {
    List<ExecutionCheckpoint> findByExecutionIdOrderByCreatedAtDesc(String executionId);
    Optional<ExecutionCheckpoint> findFirstByExecutionIdOrderByCreatedAtDesc(String executionId);
}
```

### 服务实现

```java
@Service
@Transactional
public class DatabasePersistenceService {
    
    @Autowired
    private AgentExecutionRepository executionRepository;
    
    @Autowired
    private ExecutionCheckpointRepository checkpointRepository;
    
    public void saveExecution(GraphExecution execution) {
        AgentExecution entity = new AgentExecution();
        entity.setId(execution.getId());
        entity.setGraphId(execution.getGraphId());
        entity.setCurrentNode(execution.getCurrentNode());
        entity.setState(execution.getState().toMap());
        entity.setStatus(execution.getStatus());
        entity.setUpdatedAt(Instant.now());
        
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(Instant.now());
        }
        
        executionRepository.save(entity);
    }
    
    public GraphExecution loadExecution(String executionId) {
        AgentExecution entity = executionRepository.findById(executionId)
            .orElseThrow(() -> new ExecutionNotFoundException(executionId));
        
        return GraphExecution.builder()
            .id(entity.getId())
            .graphId(entity.getGraphId())
            .currentNode(entity.getCurrentNode())
            .state(OverallState.fromMap(entity.getState()))
            .status(entity.getStatus())
            .build();
    }
}
```

## Redis 持久化

### Redis 配置

```java
@Configuration
public class RedisPersistenceConfig {
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
    
    @Bean
    public RedisStateStore redisStateStore(RedisTemplate<String, Object> redisTemplate) {
        return new RedisStateStore(redisTemplate);
    }
}
```

### Redis 状态存储

```java
@Component
public class RedisStateStore implements StateStore {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String STATE_PREFIX = "agent:state:";
    private static final String HISTORY_PREFIX = "agent:history:";
    
    public RedisStateStore(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    @Override
    public void save(String executionId, StateSnapshot snapshot) {
        String key = STATE_PREFIX + executionId;
        redisTemplate.opsForValue().set(key, snapshot, Duration.ofHours(24));
        
        // 保存到历史记录
        String historyKey = HISTORY_PREFIX + executionId;
        redisTemplate.opsForList().rightPush(historyKey, snapshot);
        redisTemplate.expire(historyKey, Duration.ofDays(7));
    }
    
    @Override
    public StateSnapshot load(String executionId) {
        String key = STATE_PREFIX + executionId;
        return (StateSnapshot) redisTemplate.opsForValue().get(key);
    }
    
    @Override
    public List<StateSnapshot> getHistory(String executionId) {
        String historyKey = HISTORY_PREFIX + executionId;
        List<Object> history = redisTemplate.opsForList().range(historyKey, 0, -1);
        
        return history.stream()
            .map(obj -> (StateSnapshot) obj)
            .collect(Collectors.toList());
    }
}
```

## 对话持久化

### 对话存储

```java
@Service
public class ConversationPersistenceService {
    
    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    public void saveMessage(String conversationId, Message message) {
        ConversationMessage entity = ConversationMessage.builder()
            .id(UUID.randomUUID().toString())
            .conversationId(conversationId)
            .messageType(message.getMessageType().name())
            .content(message.getContent())
            .metadata(message.getMetadata())
            .timestamp(Instant.now())
            .build();
        
        messageRepository.save(entity);
        
        // 更新对话的最后活动时间
        updateConversationActivity(conversationId);
    }
    
    public List<Message> loadConversationHistory(String conversationId) {
        List<ConversationMessage> messages = messageRepository
            .findByConversationIdOrderByTimestamp(conversationId);
        
        return messages.stream()
            .map(this::toMessage)
            .collect(Collectors.toList());
    }
    
    private Message toMessage(ConversationMessage entity) {
        MessageType type = MessageType.valueOf(entity.getMessageType());
        
        switch (type) {
            case USER:
                return new UserMessage(entity.getContent(), entity.getMetadata());
            case ASSISTANT:
                return new AssistantMessage(entity.getContent(), entity.getMetadata());
            case SYSTEM:
                return new SystemMessage(entity.getContent(), entity.getMetadata());
            default:
                throw new IllegalArgumentException("Unknown message type: " + type);
        }
    }
}
```

## 知识持久化

### 向量数据库

```java
@Service
public class VectorKnowledgePersistence {
    
    @Autowired
    private VectorStore vectorStore;
    
    @Autowired
    private EmbeddingModel embeddingModel;
    
    public void saveKnowledge(String agentId, String content, Map<String, Object> metadata) {
        Document document = new Document(content);
        document.getMetadata().putAll(metadata);
        document.getMetadata().put("agentId", agentId);
        document.getMetadata().put("timestamp", Instant.now());
        
        vectorStore.add(List.of(document));
    }
    
    public List<Document> searchKnowledge(String agentId, String query, int limit) {
        return vectorStore.similaritySearch(
            SearchRequest.query(query)
                .withTopK(limit)
                .withSimilarityThreshold(0.7)
                .withFilterExpression("agentId == '" + agentId + "'")
        );
    }
    
    public void updateKnowledge(String documentId, String newContent) {
        // 删除旧文档
        vectorStore.delete(List.of(documentId));
        
        // 添加新文档
        Document newDocument = new Document(newContent);
        newDocument.getMetadata().put("updated", Instant.now());
        vectorStore.add(List.of(newDocument));
    }
}
```

## 配置持久化

### 配置管理

```java
@Service
public class ConfigurationPersistenceService {
    
    @Autowired
    private AgentConfigRepository configRepository;
    
    public void saveAgentConfig(String agentId, AgentConfiguration config) {
        AgentConfigEntity entity = AgentConfigEntity.builder()
            .agentId(agentId)
            .configuration(config.toMap())
            .version(generateVersion())
            .createdAt(Instant.now())
            .build();
        
        configRepository.save(entity);
    }
    
    public AgentConfiguration loadAgentConfig(String agentId) {
        AgentConfigEntity entity = configRepository
            .findFirstByAgentIdOrderByCreatedAtDesc(agentId)
            .orElseThrow(() -> new ConfigNotFoundException(agentId));
        
        return AgentConfiguration.fromMap(entity.getConfiguration());
    }
    
    public List<AgentConfiguration> getConfigHistory(String agentId) {
        List<AgentConfigEntity> entities = configRepository
            .findByAgentIdOrderByCreatedAtDesc(agentId);
        
        return entities.stream()
            .map(entity -> AgentConfiguration.fromMap(entity.getConfiguration()))
            .collect(Collectors.toList());
    }
}
```

## 数据清理

### 自动清理

```java
@Component
public class DataCleanupService {
    
    @Scheduled(cron = "0 0 2 * * ?") // 每天凌晨2点执行
    public void cleanupOldData() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(30));
        
        // 清理过期的执行记录
        List<AgentExecution> expiredExecutions = executionRepository
            .findByStatusAndCreatedAtBefore(ExecutionStatus.COMPLETED, cutoff);
        
        for (AgentExecution execution : expiredExecutions) {
            cleanupExecution(execution.getId());
        }
        
        // 清理过期的检查点
        checkpointRepository.deleteByCreatedAtBefore(cutoff);
        
        log.info("Cleaned up {} expired executions", expiredExecutions.size());
    }
    
    private void cleanupExecution(String executionId) {
        // 删除状态快照
        stateStore.delete(executionId);
        
        // 删除检查点
        checkpointRepository.deleteByExecutionId(executionId);
        
        // 删除执行记录
        executionRepository.deleteById(executionId);
    }
}
```

## 备份和恢复

### 数据备份

```java
@Service
public class BackupService {
    
    public void createBackup(String backupName) {
        BackupMetadata metadata = BackupMetadata.builder()
            .name(backupName)
            .timestamp(Instant.now())
            .build();
        
        // 备份执行数据
        List<AgentExecution> executions = executionRepository.findAll();
        backupExecutions(metadata, executions);
        
        // 备份检查点数据
        List<ExecutionCheckpoint> checkpoints = checkpointRepository.findAll();
        backupCheckpoints(metadata, checkpoints);
        
        // 备份配置数据
        List<AgentConfigEntity> configs = configRepository.findAll();
        backupConfigs(metadata, configs);
        
        saveBackupMetadata(metadata);
    }
    
    public void restoreBackup(String backupName) {
        BackupMetadata metadata = loadBackupMetadata(backupName);
        
        // 恢复数据
        restoreExecutions(metadata);
        restoreCheckpoints(metadata);
        restoreConfigs(metadata);
        
        log.info("Backup restored: {}", backupName);
    }
}
```

## 配置选项

```properties
# 持久化配置
spring.ai.persistence.enabled=true
spring.ai.persistence.type=database

# 数据库配置
spring.ai.persistence.database.auto-checkpoint=true
spring.ai.persistence.database.checkpoint-interval=5m

# Redis 配置
spring.ai.persistence.redis.ttl=24h
spring.ai.persistence.redis.history-size=100

# 清理配置
spring.ai.persistence.cleanup.enabled=true
spring.ai.persistence.cleanup.retention-days=30
spring.ai.persistence.cleanup.schedule=0 0 2 * * ?

# 备份配置
spring.ai.persistence.backup.enabled=true
spring.ai.persistence.backup.schedule=0 0 3 * * SUN
spring.ai.persistence.backup.retention-count=4
```

## 最佳实践

### 1. 存储策略
- 选择合适的存储后端
- 设计合理的数据模型
- 实施数据分片策略

### 2. 性能优化
- 使用连接池
- 实施缓存机制
- 优化查询性能

### 3. 数据安全
- 实施数据加密
- 设置访问控制
- 定期备份数据

### 4. 监控维护
- 监控存储使用情况
- 定期清理过期数据
- 验证备份完整性

## 下一步

- [了解持久执行](/docs/develop/multi-agent/durable-execution/)
- [学习记忆管理](/docs/develop/multi-agent/memory/)
- [探索上下文管理](/docs/develop/multi-agent/context/)
