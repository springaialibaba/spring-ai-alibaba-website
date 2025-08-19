---
title: 记忆 (Memory)
description: Spring AI Alibaba 多智能体记忆管理
---

# 记忆 (Memory)

多智能体系统中的记忆管理是确保智能体能够学习、适应和协作的关键组件。Spring AI Alibaba 提供了全面的记忆管理解决方案。

## 记忆类型

### 1. 工作记忆 (Working Memory)
短期记忆，用于当前任务执行过程中的信息存储。

### 2. 长期记忆 (Long-term Memory)
持久化存储的记忆，包括知识、经验和学习成果。

### 3. 共享记忆 (Shared Memory)
多个智能体之间共享的记忆空间。

### 4. 情景记忆 (Episodic Memory)
记录特定事件和经历的记忆。

## 基本配置

```java
@Configuration
@EnableMemoryManagement
public class MemoryConfig {
    
    @Bean
    public MemoryManager memoryManager() {
        return MemoryManager.builder()
            .workingMemorySize(1000)
            .longTermMemoryStore(longTermMemoryStore())
            .sharedMemoryStore(sharedMemoryStore())
            .build();
    }
    
    @Bean
    public LongTermMemoryStore longTermMemoryStore() {
        return new VectorLongTermMemoryStore(vectorStore(), embeddingModel());
    }
    
    @Bean
    public SharedMemoryStore sharedMemoryStore() {
        return new RedisSharedMemoryStore(redisTemplate());
    }
}
```

## 工作记忆

### 工作记忆实现

```java
@Component
public class WorkingMemoryService {
    
    private final Map<String, WorkingMemory> agentMemories = new ConcurrentHashMap<>();
    
    public void storeInWorkingMemory(String agentId, String key, Object value) {
        WorkingMemory memory = getOrCreateWorkingMemory(agentId);
        memory.store(key, value);
    }
    
    public <T> T retrieveFromWorkingMemory(String agentId, String key, Class<T> type) {
        WorkingMemory memory = agentMemories.get(agentId);
        return memory != null ? memory.retrieve(key, type) : null;
    }
    
    public void clearWorkingMemory(String agentId) {
        WorkingMemory memory = agentMemories.get(agentId);
        if (memory != null) {
            memory.clear();
        }
    }
    
    private WorkingMemory getOrCreateWorkingMemory(String agentId) {
        return agentMemories.computeIfAbsent(agentId, id -> new WorkingMemory(id));
    }
}

public class WorkingMemory {
    private final String agentId;
    private final Map<String, Object> storage;
    private final int maxSize;
    
    public WorkingMemory(String agentId) {
        this.agentId = agentId;
        this.storage = new LinkedHashMap<String, Object>() {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Object> eldest) {
                return size() > maxSize;
            }
        };
        this.maxSize = 1000;
    }
    
    public void store(String key, Object value) {
        storage.put(key, value);
    }
    
    @SuppressWarnings("unchecked")
    public <T> T retrieve(String key, Class<T> type) {
        Object value = storage.get(key);
        return type.isInstance(value) ? (T) value : null;
    }
    
    public void clear() {
        storage.clear();
    }
}
```

## 长期记忆

### 向量化长期记忆

```java
@Service
public class LongTermMemoryService {
    
    @Autowired
    private VectorStore vectorStore;
    
    @Autowired
    private EmbeddingModel embeddingModel;
    
    public void storeMemory(String agentId, Memory memory) {
        Document document = new Document(memory.getContent());
        document.getMetadata().put("agentId", agentId);
        document.getMetadata().put("memoryType", memory.getType());
        document.getMetadata().put("timestamp", memory.getTimestamp());
        document.getMetadata().put("importance", memory.getImportance());
        
        vectorStore.add(List.of(document));
    }
    
    public List<Memory> retrieveRelevantMemories(String agentId, String query, int limit) {
        List<Document> documents = vectorStore.similaritySearch(
            SearchRequest.query(query)
                .withTopK(limit)
                .withSimilarityThreshold(0.7)
                .withFilterExpression("agentId == '" + agentId + "'")
        );
        
        return documents.stream()
            .map(this::documentToMemory)
            .collect(Collectors.toList());
    }
    
    public List<Memory> retrieveMemoriesByType(String agentId, MemoryType type) {
        List<Document> documents = vectorStore.similaritySearch(
            SearchRequest.query("")
                .withTopK(100)
                .withFilterExpression("agentId == '" + agentId + "' && memoryType == '" + type + "'")
        );
        
        return documents.stream()
            .map(this::documentToMemory)
            .sorted(Comparator.comparing(Memory::getTimestamp).reversed())
            .collect(Collectors.toList());
    }
    
    private Memory documentToMemory(Document document) {
        return Memory.builder()
            .content(document.getContent())
            .type(MemoryType.valueOf(document.getMetadata().get("memoryType").toString()))
            .timestamp(Instant.parse(document.getMetadata().get("timestamp").toString()))
            .importance((Double) document.getMetadata().get("importance"))
            .build();
    }
}
```

### 记忆重要性评估

```java
@Component
public class MemoryImportanceEvaluator {
    
    @Autowired
    private ChatClient chatClient;
    
    public double evaluateImportance(Memory memory, String agentContext) {
        String prompt = String.format("""
            评估以下记忆对智能体的重要性（0-1之间的分数）：
            
            记忆内容：%s
            记忆类型：%s
            智能体上下文：%s
            
            考虑因素：
            1. 与当前任务的相关性
            2. 信息的独特性
            3. 未来可能的用途
            4. 情感或经验价值
            
            请只返回数字分数。
            """, 
            memory.getContent(),
            memory.getType(),
            agentContext
        );
        
        String response = chatClient.prompt()
            .user(prompt)
            .call()
            .content();
        
        try {
            return Double.parseDouble(response.trim());
        } catch (NumberFormatException e) {
            log.warn("无法解析重要性分数: {}", response);
            return 0.5; // 默认中等重要性
        }
    }
}
```

## 共享记忆

### 多智能体共享记忆

```java
@Service
public class SharedMemoryService {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    private static final String SHARED_MEMORY_PREFIX = "shared:memory:";
    
    public void shareMemory(String memorySpace, String key, Object value, Duration ttl) {
        String redisKey = SHARED_MEMORY_PREFIX + memorySpace + ":" + key;
        redisTemplate.opsForValue().set(redisKey, value, ttl);
        
        // 通知其他智能体
        notifyMemoryUpdate(memorySpace, key);
    }
    
    public <T> T getSharedMemory(String memorySpace, String key, Class<T> type) {
        String redisKey = SHARED_MEMORY_PREFIX + memorySpace + ":" + key;
        Object value = redisTemplate.opsForValue().get(redisKey);
        return type.isInstance(value) ? type.cast(value) : null;
    }
    
    public void subscribeToMemoryUpdates(String memorySpace, MemoryUpdateListener listener) {
        String channel = "memory:updates:" + memorySpace;
        redisTemplate.getConnectionFactory().getConnection()
            .subscribe((message, pattern) -> {
                MemoryUpdateEvent event = parseMemoryUpdateEvent(message);
                listener.onMemoryUpdate(event);
            }, channel.getBytes());
    }
    
    private void notifyMemoryUpdate(String memorySpace, String key) {
        String channel = "memory:updates:" + memorySpace;
        MemoryUpdateEvent event = new MemoryUpdateEvent(memorySpace, key, Instant.now());
        redisTemplate.convertAndSend(channel, event);
    }
}
```

### 记忆同步机制

```java
@Component
public class MemorySynchronizer {
    
    @Autowired
    private SharedMemoryService sharedMemoryService;
    
    @EventListener
    public void onAgentMemoryUpdate(AgentMemoryUpdateEvent event) {
        if (event.isShareable()) {
            // 将重要记忆同步到共享空间
            sharedMemoryService.shareMemory(
                event.getMemorySpace(),
                event.getKey(),
                event.getValue(),
                Duration.ofHours(24)
            );
        }
    }
    
    @Scheduled(fixedRate = 300000) // 每5分钟同步一次
    public void synchronizeMemories() {
        List<Agent> agents = agentService.getActiveAgents();
        
        for (Agent agent : agents) {
            synchronizeAgentMemory(agent);
        }
    }
    
    private void synchronizeAgentMemory(Agent agent) {
        // 获取智能体的重要记忆
        List<Memory> importantMemories = longTermMemoryService
            .retrieveMemoriesByImportance(agent.getId(), 0.8, 10);
        
        for (Memory memory : importantMemories) {
            if (memory.isShareable()) {
                sharedMemoryService.shareMemory(
                    agent.getTeam(),
                    memory.getId(),
                    memory,
                    Duration.ofDays(1)
                );
            }
        }
    }
}
```

## 情景记忆

### 情景记忆管理

```java
@Service
public class EpisodicMemoryService {
    
    @Autowired
    private EpisodicMemoryRepository episodicMemoryRepository;
    
    public void recordEpisode(String agentId, Episode episode) {
        EpisodicMemory memory = EpisodicMemory.builder()
            .agentId(agentId)
            .episodeId(episode.getId())
            .title(episode.getTitle())
            .description(episode.getDescription())
            .context(episode.getContext())
            .outcome(episode.getOutcome())
            .lessons(episode.getLessons())
            .timestamp(episode.getTimestamp())
            .build();
        
        episodicMemoryRepository.save(memory);
    }
    
    public List<Episode> findSimilarEpisodes(String agentId, String currentSituation) {
        List<EpisodicMemory> memories = episodicMemoryRepository.findByAgentId(agentId);
        
        return memories.stream()
            .filter(memory -> isSimilarSituation(memory.getContext(), currentSituation))
            .map(this::memoryToEpisode)
            .sorted(Comparator.comparing(Episode::getTimestamp).reversed())
            .limit(5)
            .collect(Collectors.toList());
    }
    
    private boolean isSimilarSituation(String episodeContext, String currentSituation) {
        // 使用向量相似度或其他方法判断情况相似性
        double similarity = calculateSimilarity(episodeContext, currentSituation);
        return similarity > 0.7;
    }
    
    public List<String> extractLessons(String agentId, String domain) {
        List<EpisodicMemory> memories = episodicMemoryRepository
            .findByAgentIdAndDomain(agentId, domain);
        
        return memories.stream()
            .flatMap(memory -> memory.getLessons().stream())
            .distinct()
            .collect(Collectors.toList());
    }
}
```

## 记忆整合

### 记忆融合和整理

```java
@Component
public class MemoryConsolidationService {
    
    @Autowired
    private ChatClient chatClient;
    
    @Scheduled(cron = "0 0 3 * * ?") // 每天凌晨3点执行
    public void consolidateMemories() {
        List<Agent> agents = agentService.getAllAgents();
        
        for (Agent agent : agents) {
            consolidateAgentMemories(agent.getId());
        }
    }
    
    private void consolidateAgentMemories(String agentId) {
        // 获取最近的记忆
        List<Memory> recentMemories = longTermMemoryService
            .getRecentMemories(agentId, Duration.ofDays(1));
        
        if (recentMemories.size() < 5) {
            return; // 记忆太少，不需要整合
        }
        
        // 使用AI进行记忆整合
        String consolidationPrompt = String.format("""
            整合以下记忆，提取共同模式和重要洞察：
            
            记忆列表：
            %s
            
            请提供：
            1. 主要模式和趋势
            2. 重要的学习点
            3. 可以合并的相似记忆
            4. 需要保留的独特记忆
            """, formatMemoriesForConsolidation(recentMemories));
        
        ConsolidationResult result = chatClient.prompt()
            .user(consolidationPrompt)
            .call()
            .entity(ConsolidationResult.class);
        
        // 应用整合结果
        applyConsolidation(agentId, result);
    }
    
    private void applyConsolidation(String agentId, ConsolidationResult result) {
        // 创建整合后的记忆
        for (ConsolidatedMemory consolidated : result.getConsolidatedMemories()) {
            Memory newMemory = Memory.builder()
                .content(consolidated.getContent())
                .type(MemoryType.CONSOLIDATED)
                .importance(consolidated.getImportance())
                .timestamp(Instant.now())
                .build();
            
            longTermMemoryService.storeMemory(agentId, newMemory);
        }
        
        // 删除被合并的记忆
        for (String memoryId : result.getMemoriesToRemove()) {
            longTermMemoryService.removeMemory(agentId, memoryId);
        }
    }
}
```

## 记忆检索

### 智能记忆检索

```java
@Service
public class MemoryRetrievalService {
    
    @Autowired
    private LongTermMemoryService longTermMemoryService;
    
    @Autowired
    private EpisodicMemoryService episodicMemoryService;
    
    @Autowired
    private WorkingMemoryService workingMemoryService;
    
    public MemoryRetrievalResult retrieveRelevantMemories(String agentId, String context, String query) {
        // 从工作记忆检索
        List<Memory> workingMemories = retrieveFromWorkingMemory(agentId, query);
        
        // 从长期记忆检索
        List<Memory> longTermMemories = longTermMemoryService
            .retrieveRelevantMemories(agentId, query, 10);
        
        // 从情景记忆检索
        List<Episode> relevantEpisodes = episodicMemoryService
            .findSimilarEpisodes(agentId, context);
        
        // 合并和排序结果
        List<Memory> allMemories = new ArrayList<>();
        allMemories.addAll(workingMemories);
        allMemories.addAll(longTermMemories);
        
        // 按相关性和重要性排序
        allMemories.sort((m1, m2) -> {
            double score1 = calculateRelevanceScore(m1, query, context);
            double score2 = calculateRelevanceScore(m2, query, context);
            return Double.compare(score2, score1);
        });
        
        return MemoryRetrievalResult.builder()
            .memories(allMemories.stream().limit(5).collect(Collectors.toList()))
            .episodes(relevantEpisodes)
            .totalFound(allMemories.size())
            .build();
    }
    
    private double calculateRelevanceScore(Memory memory, String query, String context) {
        double contentRelevance = calculateContentSimilarity(memory.getContent(), query);
        double contextRelevance = calculateContentSimilarity(memory.getContent(), context);
        double importance = memory.getImportance();
        double recency = calculateRecencyScore(memory.getTimestamp());
        
        return contentRelevance * 0.4 + contextRelevance * 0.3 + importance * 0.2 + recency * 0.1;
    }
}
```

## 配置选项

```properties
# 记忆管理配置
spring.ai.memory.enabled=true
spring.ai.memory.working-memory-size=1000
spring.ai.memory.consolidation-enabled=true

# 长期记忆配置
spring.ai.memory.long-term.vector-store=pinecone
spring.ai.memory.long-term.embedding-model=text-embedding-ada-002
spring.ai.memory.long-term.similarity-threshold=0.7

# 共享记忆配置
spring.ai.memory.shared.enabled=true
spring.ai.memory.shared.redis.ttl=24h
spring.ai.memory.shared.sync-interval=5m

# 情景记忆配置
spring.ai.memory.episodic.enabled=true
spring.ai.memory.episodic.max-episodes=1000
spring.ai.memory.episodic.similarity-threshold=0.7

# 记忆整合配置
spring.ai.memory.consolidation.schedule=0 0 3 * * ?
spring.ai.memory.consolidation.min-memories=5
spring.ai.memory.consolidation.retention-days=30
```

## 最佳实践

### 1. 记忆设计
- 合理分类记忆类型
- 设置适当的重要性评估
- 实施有效的检索策略

### 2. 性能优化
- 使用向量化存储
- 实施记忆整合机制
- 定期清理过期记忆

### 3. 隐私保护
- 敏感信息脱敏
- 实施访问控制
- 定期审计记忆内容

### 4. 协作优化
- 合理共享记忆
- 避免记忆冲突
- 实施同步机制

## 下一步

- [了解上下文管理](/docs/1.0.0.3/multi-agent/context/)
- [学习人机协作](/docs/1.0.0.3/multi-agent/human-in-the-loop/)
- [探索时间旅行](/docs/1.0.0.3/multi-agent/time-travel/)
