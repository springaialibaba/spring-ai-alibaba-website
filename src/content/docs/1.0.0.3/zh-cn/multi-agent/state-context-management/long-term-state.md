---
title: 长期状态管理
description: 持久化和长期记忆管理
---

# 长期状态管理

长期状态管理是多智能体系统中处理跨会话、跨时间的持久状态的核心机制。它包括持久化存储、长期记忆管理和跨会话上下文维护，确保智能体能够在长时间运行中保持连续性和学习能力。

## 持久化机制

Spring AI Alibaba 提供了完整的持久化机制，通过检查点保存器实现图状态的保存和恢复。

### 检查点保存器实现

#### MemorySaver 内存保存器
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

#### RedisSaver 分布式保存器
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

#### FileSystemSaver 文件系统保存器
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

## 长期记忆 Store

长期记忆是指跨任务、跨会话的持久化记忆存储，它允许系统在不同对话或会话之间保留和检索结构化信息。Spring AI Alibaba 基于 Store 接口提供了强大的长期记忆管理能力。

> **开发状态**：Store 接口和实现正在开发中，将在未来版本中提供。Store 提供了灵活的跨任务记忆管理能力，支持层次化命名空间和结构化数据存储。
### Store 接口设计

参考 LangGraph 的 Store 设计，Spring AI Alibaba 将提供以下接口：

```java
/**
 * Store 接口用于跨任务的长期记忆存储
 * 支持层次化命名空间和结构化数据存储
 */
public interface Store {

    /**
     * 存储项目
     *
     * @param item 要存储的项目，不能为 null
     */
    void putItem(StoreItem item);

    /**
     * 获取指定命名空间和键的项目
     *
     * @param namespace 层次化命名空间，不能为 null
     * @param key 项目键，不能为 null 或空字符串
     * @return 存储的项目，如果不存在则返回 Optional.empty()
     */
    Optional<StoreItem> getItem(List<String> namespace, String key);

    /**
     * 删除指定命名空间和键的项目
     *
     * @param namespace 层次化命名空间，不能为 null
     * @param key 项目键，不能为 null 或空字符串
     * @return true 如果项目存在并被删除，false 如果项目不存在
     */
    boolean deleteItem(List<String> namespace, String key);

    /**
     * 搜索项目
     *
     * @param searchRequest 搜索请求参数
     * @return 搜索结果
     */
    StoreSearchResult searchItems(StoreSearchRequest searchRequest);

    /**
     * 列出命名空间
     *
     * @param namespaceRequest 命名空间列表请求参数
     * @return 命名空间列表
     */
    List<String> listNamespaces(NamespaceListRequest namespaceRequest);
}
```

```java
/**
 * Store 项目数据结构
 */
public final class StoreItem {
    private final List<String> namespace;
    private final String key;
    private final Map<String, Object> value;
}
```

```java
/**
 * Store 搜索请求参数
 */
public final class StoreSearchRequest {
    private final String[] namespace;
    private final Map<String, Object> filter;
    private final int limit;
    private final int offset;
    private final String query;
    private final String cursor;
    private final List<String> sortFields;
    private final boolean ascending;
}
```

```java
/**
 * Store 搜索请求结果
 */
public final class StoreSearchResult {
    private final List<StoreItem> items;
    private final long totalCount;
    private final boolean hasMore;
    private final String nextCursor;
}
```

```java
/**
 * 命名空间列表请求参数
 */
public final class NamespaceListRequest {
    private final List<String> namespace;
    private final List<String> suffix;
    private final Integer maxDepth;
    private final int limit;
    private final int offset;

}
```

### Store 使用方式

Store 提供了跨会话、跨任务的持久化记忆存储能力，让智能体能够在长时间运行中保持连续性和学习能力。

与 CheckpointSaver 专注于图状态的短期持久化不同，Store 专门用于管理长期记忆数据，如用户偏好、历史交互、学习到的知识等。两者协同工作，为多智能体系统提供完整的状态管理解决方案。

```java
@Configuration
public class GraphWithStoreConfig {

    @Bean
    public CompiledGraph createGraphWithStore(Store store, BaseCheckpointSaver checkpointSaver) {
        // 创建 StateGraph 实例
        StateGraph workflow = new StateGraph()
                .addNode("agent", new AgentNode())
                .addNode("memory_manager", new MemoryManagerNode())
                .addEdge(START, "agent")
                .addEdge("agent", "memory_manager")
                .addEdge("memory_manager", END);

        // 编译时配置 CheckpointSaver 和 Store
        CompileConfig compileConfig = CompileConfig.builder()
                .saverConfig(SaverConfig.builder()
                    .type(SaverConstant.MEMORY)
                    .register(SaverConstant.MEMORY, checkpointSaver)
                    .build())
                .store(store)  // 关键：在编译时配置 Store
                .build();

        return workflow.compile(compileConfig);
    }

    /**
     * 智能体节点 - 演示如何在节点中访问和使用 Store
     *
     * 节点实现 NodeAction 接口，接收 OverAllState 参数并返回状态更新。
     * Store 实例通过 OverAllState 直接获取，确保访问的线程安全性。
     */
    public class AgentNode implements NodeAction {

        @Override
        public Map<String, Object> apply(OverAllState state) throws Exception {
            // 直接从 OverAllState 获取 Store 实例
            // Store 在图编译时配置，在节点执行时可通过状态对象访问
            Store store = state.getStore();
            String userId = (String) state.value("user_id").orElse(null);

            // 读取用户的语言偏好
            // 使用层次化命名空间组织数据：["users", userId, "preferences"]
            Optional<StoreItem> preference = store.getItem(
                new String[]{"users", userId, "preferences"},
                "language"
            );

            // 基于用户偏好生成个性化响应
            String preferredLanguage = preference
                .map(item -> (String) item.getValue().get("value"))
                .orElse("zh-CN");

            String response = generateResponse(state.data(), preferredLanguage);

            return Map.of("messages", response, "language", preferredLanguage);
        }

        private String generateResponse(Map<String, Object> stateData, String language) {
            // 实现响应生成逻辑
            return "Generated response in " + language;
        }
    }

    /**
     * 记忆管理节点 - 演示如何保存长期记忆
     *
     * 这个节点专门负责处理长期记忆的保存和更新，体现了关注点分离的设计原则。
     * 通过独立的记忆管理节点，可以统一处理所有的长期记忆操作。
     */
    public class MemoryManagerNode implements NodeAction {

        @Override
        public Map<String, Object> apply(OverAllState state) throws Exception {
            // 直接从 OverAllState 获取 Store 实例
            Store store = state.getStore();

            String userId = (String) state.value("user_id").orElse(null);
            String sessionId = (String) state.value("session_id").orElse(null);

            // 提取并保存会话摘要
            // 会话摘要是重要的长期记忆，用于后续的上下文理解
            Map<String, Object> summary = extractSessionSummary(state.data());
            StoreItem summaryItem = StoreItem.of(
                new String[]{"users", userId, "sessions", sessionId},
                "summary",
                summary
            );
            store.putItem(summaryItem);

            // 基于当前交互更新用户偏好
            // 这是一个学习过程，系统会根据用户行为调整偏好设置
            updateUserPreferences(store, userId, state.data());

            return Map.of(); // 返回空 Map，保持状态不变
        }

        private Map<String, Object> extractSessionSummary(Map<String, Object> stateData) {
            // 实现会话摘要提取逻辑
            return Map.of("summary", "Session summary", "timestamp", System.currentTimeMillis());
        }

        private void updateUserPreferences(Store store, String userId, Map<String, Object> stateData) {
            // 实现用户偏好更新逻辑
        }
    }
}
```

## 下一步

- [持久执行](./durable-execution.md) - 了解持久执行机制
- [上下文工程](./context-engineering.md) - 学习上下文管理技巧
- [基础概念](./fundamentals.md) - 回顾状态管理基础
