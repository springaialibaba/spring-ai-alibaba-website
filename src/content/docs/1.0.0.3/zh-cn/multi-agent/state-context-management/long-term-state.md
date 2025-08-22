---
title: 长期状态管理
description: 持久化和长期记忆管理
---

# 长期状态管理

长期状态管理是多智能体系统中处理跨会话、跨时间的持久状态的核心机制。它包括持久化存储、长期记忆管理和跨会话上下文维护，确保智能体能够在长时间运行中保持连续性和学习能力。

## 持久化机制

Spring AI Alibaba 提供了完整的持久化机制，通过检查点保存器实现图状态的保存和恢复。

### 检查点保存器实现

#### MemorySaver
内存检查点保存器，适用于开发和测试：

```java
@Configuration
public class MemoryPersistenceConfig {

    @Bean
    public StateGraph persistentStateGraph(KeyStrategyFactory keyStrategyFactory) {
        return new StateGraph(keyStrategyFactory)
            .addNode("process", this::processNode)
            .addEdge(StateGraph.START, "process")
            .addEdge("process", StateGraph.END);
    }

    @Bean
    public CompiledGraph createMemoryPersistedGraph(StateGraph stateGraph) {
        MemorySaver saver = new MemorySaver();

        SaverConfig saverConfig = SaverConfig.builder()
            .register(SaverConstant.MEMORY, saver)
            .type(SaverConstant.MEMORY)
            .build();

        CompileConfig compileConfig = CompileConfig.builder()
            .saverConfig(saverConfig)
            .build();

        return stateGraph.compile(compileConfig);
    }

    private NodeAction processNode = state -> {
        // 处理逻辑
        return Map.of("processed", true, "timestamp", Instant.now().toString());
    };
}
```

#### RedisSaver
Redis 检查点保存器，适用于分布式环境：

```java
@Configuration
@ConditionalOnProperty(name = "spring.ai.alibaba.checkpoint.type", havingValue = "redis")
public class RedisPersistenceConfig {

    @Bean
    public RedisSaver redisCheckpointSaver(RedissonClient redissonClient) {
        return new RedisSaver(redissonClient);
    }

    @Bean
    public CompiledGraph createRedisPersistedGraph(StateGraph stateGraph, RedisSaver saver) {
        SaverConfig saverConfig = SaverConfig.builder()
            .register(SaverConstant.REDIS, saver)
            .type(SaverConstant.REDIS)
            .build();

        CompileConfig compileConfig = CompileConfig.builder()
            .saverConfig(saverConfig)
            .build();

        return stateGraph.compile(compileConfig);
    }
}
```

#### FileSystemSaver
文件系统检查点保存器，适用于单机持久化：

```java
@Configuration
@ConditionalOnProperty(name = "spring.ai.alibaba.checkpoint.type", havingValue = "filesystem")
public class FileSystemPersistenceConfig {

    @Value("${spring.ai.alibaba.checkpoint.filesystem.path:./checkpoints}")
    private String checkpointPath;

    @Bean
    public FileSystemSaver fileSystemCheckpointSaver() throws IOException {
        Path targetFolder = Paths.get(checkpointPath);
        Files.createDirectories(targetFolder);
        return new FileSystemSaver(targetFolder);
    }

    @Bean
    public CompiledGraph createFileSystemPersistedGraph(StateGraph stateGraph, FileSystemSaver saver) {
        SaverConfig saverConfig = SaverConfig.builder()
            .register(SaverConstant.FILESYSTEM, saver)
            .type(SaverConstant.FILESYSTEM)
            .build();

        CompileConfig compileConfig = CompileConfig.builder()
            .saverConfig(saverConfig)
            .build();

        return stateGraph.compile(compileConfig);
    }
}
```

### 版本化检查点保存器

Spring AI Alibaba 提供了版本化检查点保存器，支持状态版本管理：

```java
@Configuration
@ConditionalOnProperty(name = "spring.ai.alibaba.checkpoint.versioned", havingValue = "true")
public class VersionedPersistenceConfig {

    @Bean
    public VersionedMemorySaver versionedCheckpointSaver() {
        return new VersionedMemorySaver();
    }

    @Bean
    public CompiledGraph createVersionedPersistedGraph(StateGraph stateGraph, VersionedMemorySaver saver) {
        SaverConfig saverConfig = SaverConfig.builder()
            .register(SaverConstant.VERSIONED_MEMORY, saver)
            .type(SaverConstant.VERSIONED_MEMORY)
            .build();

        CompileConfig compileConfig = CompileConfig.builder()
            .saverConfig(saverConfig)
            .build();

        return stateGraph.compile(compileConfig);
    }
}
```

### 检查点操作服务

```java
@Service
public class CheckpointService {

    private final CompiledGraph compiledGraph;

    public CheckpointService(CompiledGraph compiledGraph) {
        this.compiledGraph = compiledGraph;
    }

    public List<Checkpoint> getCheckpointHistory(String threadId) {
        RunnableConfig config = RunnableConfig.builder()
            .threadId(threadId)
            .build();

        return compiledGraph.getCompileConfig()
            .checkpointSaver()
            .map(saver -> saver.list(config))
            .orElse(List.of());
    }

    public Optional<Checkpoint> getLatestCheckpoint(String threadId) {
        RunnableConfig config = RunnableConfig.builder()
            .threadId(threadId)
            .build();

        return compiledGraph.getCompileConfig()
            .checkpointSaver()
            .flatMap(saver -> saver.get(config));
    }

    public void saveCheckpoint(String threadId, Map<String, Object> state, String nodeId, String nextNodeId) {
        RunnableConfig config = RunnableConfig.builder()
            .threadId(threadId)
            .build();

        Checkpoint checkpoint = Checkpoint.builder()
            .state(state)
            .nodeId(nodeId)
            .nextNodeId(nextNodeId)
            .build();

        compiledGraph.getCompileConfig()
            .checkpointSaver()
            .ifPresent(saver -> saver.put(config, checkpoint));
    }
}
```

## 长期记忆

长期记忆允许系统在不同对话或会话之间保留信息。Spring AI Alibaba 提供了基于 `ChatMemoryRepository` 的记忆管理机制。

### ChatMemoryRepository 实现

Spring AI Alibaba 提供了多种 `ChatMemoryRepository` 实现用于长期记忆存储：

```java
@Configuration
public class LongTermMemoryConfig {

    // Redis 长期记忆存储
    @Bean
    @ConditionalOnProperty(name = "spring.ai.alibaba.memory.type", havingValue = "redis")
    public ChatMemoryRepository redisChatMemoryRepository() {
        JedisPool jedisPool = new JedisPool("localhost", 6379);
        return RedisChatMemoryRepository.create(jedisPool);
    }

    // Tablestore 长期记忆存储（推荐用于生产环境）
    @Bean
    @ConditionalOnProperty(name = "spring.ai.alibaba.memory.type", havingValue = "tablestore")
    public ChatMemoryRepository tablestoreChatMemoryRepository(
            @Value("${tablestore.endpoint}") String endpoint,
            @Value("${tablestore.instance}") String instanceName,
            @Value("${tablestore.access-key-id}") String accessKeyId,
            @Value("${tablestore.access-key-secret}") String accessKeySecret) {

        SyncClient client = new SyncClient(endpoint, accessKeyId, accessKeySecret, instanceName);
        MemoryStoreImpl store = MemoryStoreImpl.builder()
            .client(client)
            .sessionTableName("ai_sessions")
            .messageTableName("ai_messages")
            .build();
        store.initTable();

        return new TablestoreChatMemoryRepository(store);
    }

    // JDBC 长期记忆存储
    @Bean
    @ConditionalOnProperty(name = "spring.ai.alibaba.memory.type", havingValue = "jdbc")
    public ChatMemoryRepository jdbcChatMemoryRepository(DataSource dataSource) {
        return new JdbcChatMemoryRepository(dataSource);
    }

    // Elasticsearch 长期记忆存储
    @Bean
    @ConditionalOnProperty(name = "spring.ai.alibaba.memory.type", havingValue = "elasticsearch")
    public ChatMemoryRepository elasticsearchChatMemoryRepository(ElasticsearchClient client) {
        return new ElasticsearchChatMemoryRepository(client);
    }
}
### 长期记忆服务

基于 `ChatMemoryRepository` 的长期记忆管理服务：

```java
@Service
public class LongTermMemoryService {

    private final ChatMemoryRepository chatMemoryRepository;

    public LongTermMemoryService(ChatMemoryRepository chatMemoryRepository) {
        this.chatMemoryRepository = chatMemoryRepository;
    }

    public void saveConversation(String conversationId, List<Message> messages) {
        chatMemoryRepository.saveAll(conversationId, messages);
    }

    public List<Message> getConversationHistory(String conversationId) {
        return chatMemoryRepository.findByConversationId(conversationId);
    }

    public void deleteConversation(String conversationId) {
        chatMemoryRepository.deleteByConversationId(conversationId);
    }

    public void addMessageToConversation(String conversationId, Message message) {
        List<Message> existingMessages = getConversationHistory(conversationId);
        existingMessages.add(message);
        saveConversation(conversationId, existingMessages);
    }

    public List<Message> getRecentMessages(String conversationId, int limit) {
        List<Message> allMessages = getConversationHistory(conversationId);
        if (allMessages.size() <= limit) {
            return allMessages;
        }
        return allMessages.subList(allMessages.size() - limit, allMessages.size());
    }
}
```

### 跨会话状态管理

> **注意**: 以下高级记忆功能正在开发中，当前可以通过自定义实现来支持。

```java
@Service
public class CrossSessionStateService {

    private final ChatMemoryRepository memoryRepository;
    private final VectorStore vectorStore; // 用于语义搜索

    public CrossSessionStateService(ChatMemoryRepository memoryRepository, VectorStore vectorStore) {
        this.memoryRepository = memoryRepository;
        this.vectorStore = vectorStore;
    }

    // 保存用户偏好（基于对话历史分析）
    public void saveUserPreference(String userId, String preference) {
        String conversationId = "user_preferences:" + userId;
        Message preferenceMessage = new SystemMessage("用户偏好: " + preference);
        memoryRepository.saveAll(conversationId, List.of(preferenceMessage));
    }

    // 获取用户偏好
    public List<String> getUserPreferences(String userId) {
        String conversationId = "user_preferences:" + userId;
        return memoryRepository.findByConversationId(conversationId)
            .stream()
            .map(Message::getContent)
            .collect(Collectors.toList());
    }

    // 基于向量存储的语义记忆（开发中）
    public void storeSemanticMemory(String userId, String content, Map<String, Object> metadata) {
        metadata.put("userId", userId);
        metadata.put("timestamp", Instant.now().toString());

        Document document = new Document(content, metadata);
        vectorStore.add(List.of(document));
    }

    // 搜索相关记忆
    public List<Document> searchRelevantMemories(String userId, String query, int limit) {
        Map<String, Object> filter = Map.of("userId", userId);
        SearchRequest searchRequest = SearchRequest.query(query)
            .withTopK(limit)
            .withFilterExpression("userId == '" + userId + "'");

        return vectorStore.similaritySearch(searchRequest);
    }
}
    }
}
```

## 实际应用示例

### 多会话聊天机器人

```java
@RestController
@RequestMapping("/api/chat")
public class MultiSessionChatController {

    private final CompiledGraph chatGraph;
    private final LongTermMemoryService memoryService;
    private final CrossSessionStateService crossSessionService;

    public MultiSessionChatController(
            CompiledGraph chatGraph,
            LongTermMemoryService memoryService,
            CrossSessionStateService crossSessionService) {
        this.chatGraph = chatGraph;
        this.memoryService = memoryService;
        this.crossSessionService = crossSessionService;
    }

    @PostMapping("/message")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestParam String userId,
            @RequestParam String sessionId,
            @RequestParam String message) {

        try {
            // 创建线程ID（结合用户ID和会话ID）
            String threadId = userId + ":" + sessionId;

            // 获取用户偏好
            List<String> userPreferences = crossSessionService.getUserPreferences(userId);

            // 创建运行时配置
            RunnableConfig config = RunnableConfig.builder()
                .threadId(threadId)
                .addMetadata("userId", userId)
                .addMetadata("sessionId", sessionId)
                .addMetadata("userPreferences", String.join(", ", userPreferences))
                .build();

            // 准备输入
            Map<String, Object> input = Map.of(
                "user_input", message,
                "user_id", userId,
                "session_id", sessionId
            );

            // 执行图
            Optional<OverAllState> result = chatGraph.invoke(input, config);

            if (result.isPresent()) {
                String aiResponse = (String) result.get().value("ai_response").orElse("无响应");

                // 保存到长期记忆
                List<Message> messages = List.of(
                    new UserMessage(message),
                    new AssistantMessage(aiResponse)
                );
                memoryService.saveConversation(threadId, messages);

                return ResponseEntity.ok(Map.of(
                    "response", aiResponse,
                    "userId", userId,
                    "sessionId", sessionId,
                    "threadId", threadId
                ));
            }

            return ResponseEntity.ok(Map.of("error", "处理消息失败"));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "系统错误: " + e.getMessage()));
        }
    }

    @GetMapping("/history/{userId}/{sessionId}")
    public ResponseEntity<List<Message>> getConversationHistory(
            @PathVariable String userId,
            @PathVariable String sessionId) {

        String threadId = userId + ":" + sessionId;
        List<Message> history = memoryService.getConversationHistory(threadId);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/preference")
    public ResponseEntity<Map<String, Object>> saveUserPreference(
            @RequestParam String userId,
            @RequestParam String preference) {

        crossSessionService.saveUserPreference(userId, preference);
        return ResponseEntity.ok(Map.of("status", "preference_saved"));
    }

    @GetMapping("/preferences/{userId}")
    public ResponseEntity<List<String>> getUserPreferences(@PathVariable String userId) {
        List<String> preferences = crossSessionService.getUserPreferences(userId);
        return ResponseEntity.ok(preferences);
    }
}

### 配置示例

```java
@Configuration
public class LongTermStateConfiguration {

    @Value("${spring.ai.alibaba.memory.type:memory}")
    private String memoryType;

    @Bean
    public StateGraph longTermStateGraph(KeyStrategyFactory keyStrategyFactory) {
        return new StateGraph(keyStrategyFactory)
            .addNode("process_with_memory", this::processWithMemory)
            .addEdge(StateGraph.START, "process_with_memory")
            .addEdge("process_with_memory", StateGraph.END);
    }

    @Bean
    public CompiledGraph longTermCompiledGraph(
            StateGraph longTermStateGraph,
            ChatMemoryRepository memoryRepository) {

        // 根据配置选择检查点保存器
        BaseCheckpointSaver saver = switch (memoryType) {
            case "redis" -> new RedisSaver(redissonClient());
            case "filesystem" -> new FileSystemSaver(Paths.get("./checkpoints"));
            default -> new MemorySaver();
        };

        SaverConfig saverConfig = SaverConfig.builder()
            .register(SaverConstant.MEMORY, saver)
            .type(SaverConstant.MEMORY)
            .build();

        CompileConfig compileConfig = CompileConfig.builder()
            .saverConfig(saverConfig)
            .build();

        return longTermStateGraph.compile(compileConfig);
    }

    private NodeAction processWithMemory = state -> {
        String userId = (String) state.value("user_id").orElse("");
        String userInput = (String) state.value("user_input").orElse("");

        // 处理逻辑，可以访问长期记忆
        return Map.of(
            "processed", true,
            "user_id", userId,
            "response", "基于长期记忆的响应: " + userInput
        );
    };

    private RedissonClient redissonClient() {
        Config config = new Config();
        config.useSingleServer().setAddress("redis://localhost:6379");
        return Redisson.create(config);
    }
}
```

## 数据迁移和备份

### 检查点数据迁移

```java
@Service
public class CheckpointMigrationService {

    public void migrateFromMemoryToRedis(MemorySaver memorySaver, RedisSaver redisSaver) {
        // 获取所有线程的检查点
        // 注意：这需要访问 MemorySaver 的内部数据结构
        // 实际实现需要根据具体的 API 调整

        System.out.println("检查点迁移功能正在开发中...");
        // 实际的迁移逻辑将在后续版本中提供
    }

    public void backupCheckpoints(String threadId, String backupPath) throws IOException {
        // 备份特定线程的检查点数据
        System.out.println("检查点备份功能正在开发中...");
        // 实际的备份逻辑将在后续版本中提供
    }
}
```

### 记忆数据清理

```java
@Service
public class MemoryCleanupService {

    private final ChatMemoryRepository memoryRepository;

    public MemoryCleanupService(ChatMemoryRepository memoryRepository) {
        this.memoryRepository = memoryRepository;
    }

    @Scheduled(cron = "0 0 2 * * ?") // 每天凌晨2点执行
    public void cleanupOldMemories() {
        // 清理超过30天的对话记录
        // 注意：具体的清理逻辑取决于 ChatMemoryRepository 的实现
        System.out.println("执行记忆数据清理...");

        // 示例：清理特定模式的对话ID
        // 实际实现需要根据业务需求调整
    }

    public void cleanupUserMemories(String userId) {
        // 清理特定用户的记忆数据
        List<String> conversationIds = findUserConversations(userId);
        for (String conversationId : conversationIds) {
            memoryRepository.deleteByConversationId(conversationId);
        }
    }

    private List<String> findUserConversations(String userId) {
        // 查找用户的所有对话ID
        // 这需要根据你的对话ID命名规则来实现
        return List.of(); // 占位符实现
    }
}
```

## 配置选项

```properties
# 记忆存储类型配置
spring.ai.alibaba.memory.type=tablestore
# spring.ai.alibaba.memory.type=redis
# spring.ai.alibaba.memory.type=jdbc
# spring.ai.alibaba.memory.type=elasticsearch

# 检查点保存器类型
spring.ai.alibaba.checkpoint.type=redis
# spring.ai.alibaba.checkpoint.type=filesystem
# spring.ai.alibaba.checkpoint.type=memory

# Tablestore 配置
tablestore.endpoint=https://your-instance.cn-hangzhou.ots.aliyuncs.com
tablestore.instance=your-instance-name
tablestore.access-key-id=your-access-key-id
tablestore.access-key-secret=your-access-key-secret

# Redis 配置
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.database=0
spring.redis.timeout=2000ms

# 文件系统检查点配置
spring.ai.alibaba.checkpoint.filesystem.path=./checkpoints

# 数据库配置（用于 JDBC 记忆存储）
spring.datasource.url=jdbc:mysql://localhost:3306/ai_memory
spring.datasource.username=root
spring.datasource.password=password

# Elasticsearch 配置
elasticsearch.host=localhost
elasticsearch.port=9200
```

## 监控和指标

```java
@Component
public class LongTermStateMetrics {

    private final MeterRegistry meterRegistry;
    private final CompiledGraph compiledGraph;

    public LongTermStateMetrics(MeterRegistry meterRegistry, CompiledGraph compiledGraph) {
        this.meterRegistry = meterRegistry;
        this.compiledGraph = compiledGraph;
    }

    @EventListener
    public void onCheckpointSaved(CheckpointSavedEvent event) {
        Counter.builder("checkpoint.saved")
            .tag("thread_id", event.getThreadId())
            .register(meterRegistry)
            .increment();
    }

    @Scheduled(fixedRate = 60000) // 每分钟收集一次指标
    public void collectMetrics() {
        // 收集检查点数量
        int checkpointCount = getCheckpointCount();
        Gauge.builder("checkpoint.count")
            .register(meterRegistry, checkpointCount, Number::intValue);

        // 收集活跃线程数
        int activeThreads = getActiveThreadCount();
        Gauge.builder("threads.active")
            .register(meterRegistry, activeThreads, Number::intValue);
    }

    private int getCheckpointCount() {
        // 获取检查点总数的逻辑
        return 0; // 占位符实现
    }

    private int getActiveThreadCount() {
        // 获取活跃线程数的逻辑
        return 0; // 占位符实现
    }
}
```

## 最佳实践

### 1. 选择合适的存储方案
- **开发环境**: 使用 `MemorySaver` 和 `InMemoryChatMemoryRepository`
- **测试环境**: 使用 `FileSystemSaver` 和 `JdbcChatMemoryRepository`
- **生产环境**: 使用 `RedisSaver` 和 `TablestoreChatMemoryRepository`

### 2. 数据生命周期管理
- 定期清理过期的检查点数据
- 实施数据备份和恢复策略
- 监控存储使用情况

### 3. 性能优化
- 合理设置检查点保存频率
- 使用批量操作处理大量数据
- 实施缓存策略减少存储访问

### 4. 安全考虑
- 加密敏感的状态数据
- 实施访问控制和审计
- 定期更新访问凭证

## 下一步

- [持久执行](./durable-execution.md) - 了解持久执行机制
- [上下文工程](./context-engineering.md) - 学习上下文管理技巧
- [实践指南](./best-practices.md) - 掌握最佳实践
