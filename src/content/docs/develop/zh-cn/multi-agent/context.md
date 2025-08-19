---
title: 上下文 (Context)
description: Spring AI Alibaba 多智能体上下文管理
---

# 上下文 (Context)

上下文管理是多智能体系统中确保信息一致性和协作效率的关键组件。Spring AI Alibaba 提供了全面的上下文管理解决方案。

## 上下文类型

### 1. 全局上下文 (Global Context)
整个系统共享的上下文信息。

### 2. 会话上下文 (Session Context)
特定会话或任务的上下文信息。

### 3. 智能体上下文 (Agent Context)
单个智能体的私有上下文信息。

### 4. 团队上下文 (Team Context)
智能体团队共享的上下文信息。

## 基本配置

```java
@Configuration
@EnableContextManagement
public class ContextConfig {
    
    @Bean
    public ContextManager contextManager() {
        return ContextManager.builder()
            .globalContextStore(globalContextStore())
            .sessionContextStore(sessionContextStore())
            .agentContextStore(agentContextStore())
            .build();
    }
    
    @Bean
    public GlobalContextStore globalContextStore() {
        return new RedisGlobalContextStore(redisTemplate());
    }
    
    @Bean
    public SessionContextStore sessionContextStore() {
        return new DatabaseSessionContextStore(dataSource());
    }
    
    @Bean
    public AgentContextStore agentContextStore() {
        return new InMemoryAgentContextStore();
    }
}
```

## 全局上下文

### 全局上下文管理

```java
@Service
public class GlobalContextService {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    private static final String GLOBAL_CONTEXT_KEY = "global:context";
    
    public void setGlobalContext(String key, Object value) {
        redisTemplate.opsForHash().put(GLOBAL_CONTEXT_KEY, key, value);
        
        // 通知所有智能体上下文更新
        notifyContextUpdate(ContextScope.GLOBAL, key, value);
    }
    
    public <T> T getGlobalContext(String key, Class<T> type) {
        Object value = redisTemplate.opsForHash().get(GLOBAL_CONTEXT_KEY, key);
        return type.isInstance(value) ? type.cast(value) : null;
    }
    
    public Map<String, Object> getAllGlobalContext() {
        return redisTemplate.opsForHash().entries(GLOBAL_CONTEXT_KEY);
    }
    
    public void removeGlobalContext(String key) {
        redisTemplate.opsForHash().delete(GLOBAL_CONTEXT_KEY, key);
        notifyContextUpdate(ContextScope.GLOBAL, key, null);
    }
    
    private void notifyContextUpdate(ContextScope scope, String key, Object value) {
        ContextUpdateEvent event = ContextUpdateEvent.builder()
            .scope(scope)
            .key(key)
            .value(value)
            .timestamp(Instant.now())
            .build();
        
        applicationEventPublisher.publishEvent(event);
    }
}
```

## 会话上下文

### 会话上下文实现

```java
@Entity
@Table(name = "session_contexts")
public class SessionContext {
    @Id
    private String sessionId;
    
    @Column(name = "context_data", columnDefinition = "jsonb")
    private Map<String, Object> contextData;
    
    @Column(name = "created_at")
    private Instant createdAt;
    
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    @Column(name = "expires_at")
    private Instant expiresAt;
    
    // getters and setters
}

@Service
public class SessionContextService {
    
    @Autowired
    private SessionContextRepository sessionContextRepository;
    
    public void setSessionContext(String sessionId, String key, Object value) {
        SessionContext context = getOrCreateSessionContext(sessionId);
        context.getContextData().put(key, value);
        context.setUpdatedAt(Instant.now());
        
        sessionContextRepository.save(context);
    }
    
    public <T> T getSessionContext(String sessionId, String key, Class<T> type) {
        Optional<SessionContext> contextOpt = sessionContextRepository.findById(sessionId);
        
        if (contextOpt.isPresent()) {
            Object value = contextOpt.get().getContextData().get(key);
            return type.isInstance(value) ? type.cast(value) : null;
        }
        
        return null;
    }
    
    public void clearSessionContext(String sessionId) {
        sessionContextRepository.deleteById(sessionId);
    }
    
    private SessionContext getOrCreateSessionContext(String sessionId) {
        return sessionContextRepository.findById(sessionId)
            .orElseGet(() -> {
                SessionContext newContext = new SessionContext();
                newContext.setSessionId(sessionId);
                newContext.setContextData(new HashMap<>());
                newContext.setCreatedAt(Instant.now());
                newContext.setExpiresAt(Instant.now().plus(Duration.ofHours(24)));
                return newContext;
            });
    }
    
    @Scheduled(fixedRate = 3600000) // 每小时清理一次过期上下文
    public void cleanupExpiredContexts() {
        List<SessionContext> expiredContexts = sessionContextRepository
            .findByExpiresAtBefore(Instant.now());
        
        sessionContextRepository.deleteAll(expiredContexts);
        log.info("Cleaned up {} expired session contexts", expiredContexts.size());
    }
}
```

## 智能体上下文

### 智能体上下文管理

```java
@Component
public class AgentContextService {
    
    private final Map<String, AgentContext> agentContexts = new ConcurrentHashMap<>();
    
    public void setAgentContext(String agentId, String key, Object value) {
        AgentContext context = getOrCreateAgentContext(agentId);
        context.set(key, value);
        
        // 触发上下文更新事件
        publishContextUpdateEvent(agentId, key, value);
    }
    
    public <T> T getAgentContext(String agentId, String key, Class<T> type) {
        AgentContext context = agentContexts.get(agentId);
        return context != null ? context.get(key, type) : null;
    }
    
    public void mergeContext(String agentId, Map<String, Object> contextData) {
        AgentContext context = getOrCreateAgentContext(agentId);
        context.merge(contextData);
    }
    
    public Map<String, Object> getFullContext(String agentId) {
        AgentContext context = agentContexts.get(agentId);
        return context != null ? context.getAll() : new HashMap<>();
    }
    
    public void clearAgentContext(String agentId) {
        agentContexts.remove(agentId);
    }
    
    private AgentContext getOrCreateAgentContext(String agentId) {
        return agentContexts.computeIfAbsent(agentId, AgentContext::new);
    }
    
    private void publishContextUpdateEvent(String agentId, String key, Object value) {
        AgentContextUpdateEvent event = AgentContextUpdateEvent.builder()
            .agentId(agentId)
            .key(key)
            .value(value)
            .timestamp(Instant.now())
            .build();
        
        applicationEventPublisher.publishEvent(event);
    }
}

public class AgentContext {
    private final String agentId;
    private final Map<String, Object> contextData;
    private final ReadWriteLock lock;
    
    public AgentContext(String agentId) {
        this.agentId = agentId;
        this.contextData = new HashMap<>();
        this.lock = new ReentrantReadWriteLock();
    }
    
    public void set(String key, Object value) {
        lock.writeLock().lock();
        try {
            contextData.put(key, value);
        } finally {
            lock.writeLock().unlock();
        }
    }
    
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> type) {
        lock.readLock().lock();
        try {
            Object value = contextData.get(key);
            return type.isInstance(value) ? (T) value : null;
        } finally {
            lock.readLock().unlock();
        }
    }
    
    public void merge(Map<String, Object> data) {
        lock.writeLock().lock();
        try {
            contextData.putAll(data);
        } finally {
            lock.writeLock().unlock();
        }
    }
    
    public Map<String, Object> getAll() {
        lock.readLock().lock();
        try {
            return new HashMap<>(contextData);
        } finally {
            lock.readLock().unlock();
        }
    }
}
```

## 团队上下文

### 团队协作上下文

```java
@Service
public class TeamContextService {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    private static final String TEAM_CONTEXT_PREFIX = "team:context:";
    
    public void setTeamContext(String teamId, String key, Object value) {
        String redisKey = TEAM_CONTEXT_PREFIX + teamId;
        redisTemplate.opsForHash().put(redisKey, key, value);
        
        // 设置过期时间
        redisTemplate.expire(redisKey, Duration.ofHours(24));
        
        // 通知团队成员
        notifyTeamMembers(teamId, key, value);
    }
    
    public <T> T getTeamContext(String teamId, String key, Class<T> type) {
        String redisKey = TEAM_CONTEXT_PREFIX + teamId;
        Object value = redisTemplate.opsForHash().get(redisKey, key);
        return type.isInstance(value) ? type.cast(value) : null;
    }
    
    public Map<String, Object> getAllTeamContext(String teamId) {
        String redisKey = TEAM_CONTEXT_PREFIX + teamId;
        return redisTemplate.opsForHash().entries(redisKey);
    }
    
    public void shareContextBetweenAgents(String fromAgentId, String toAgentId, String key) {
        Object value = agentContextService.getAgentContext(fromAgentId, key, Object.class);
        if (value != null) {
            agentContextService.setAgentContext(toAgentId, key, value);
        }
    }
    
    private void notifyTeamMembers(String teamId, String key, Object value) {
        List<String> teamMembers = teamService.getTeamMembers(teamId);
        
        TeamContextUpdateEvent event = TeamContextUpdateEvent.builder()
            .teamId(teamId)
            .key(key)
            .value(value)
            .timestamp(Instant.now())
            .build();
        
        for (String memberId : teamMembers) {
            messagingTemplate.convertAndSend("/topic/team/" + teamId + "/context", event);
        }
    }
}
```

## 上下文传播

### 上下文传播机制

```java
@Component
public class ContextPropagationService {
    
    @EventListener
    public void onContextUpdate(ContextUpdateEvent event) {
        switch (event.getScope()) {
            case GLOBAL:
                propagateGlobalContext(event);
                break;
            case SESSION:
                propagateSessionContext(event);
                break;
            case TEAM:
                propagateTeamContext(event);
                break;
        }
    }
    
    private void propagateGlobalContext(ContextUpdateEvent event) {
        // 全局上下文更新，通知所有活跃的智能体
        List<String> activeAgents = agentService.getActiveAgentIds();
        
        for (String agentId : activeAgents) {
            try {
                agentContextService.setAgentContext(
                    agentId, 
                    "global." + event.getKey(), 
                    event.getValue()
                );
            } catch (Exception e) {
                log.warn("Failed to propagate global context to agent {}: {}", agentId, e.getMessage());
            }
        }
    }
    
    private void propagateSessionContext(ContextUpdateEvent event) {
        // 会话上下文更新，通知会话中的智能体
        String sessionId = event.getSessionId();
        List<String> sessionAgents = agentService.getSessionAgents(sessionId);
        
        for (String agentId : sessionAgents) {
            agentContextService.setAgentContext(
                agentId, 
                "session." + event.getKey(), 
                event.getValue()
            );
        }
    }
    
    private void propagateTeamContext(ContextUpdateEvent event) {
        // 团队上下文更新，通知团队成员
        String teamId = event.getTeamId();
        List<String> teamMembers = teamService.getTeamMembers(teamId);
        
        for (String memberId : teamMembers) {
            agentContextService.setAgentContext(
                memberId, 
                "team." + event.getKey(), 
                event.getValue()
            );
        }
    }
}
```

## 上下文继承

### 上下文继承机制

```java
@Component
public class ContextInheritanceService {
    
    public void inheritContext(String parentAgentId, String childAgentId, ContextInheritanceRule rule) {
        Map<String, Object> parentContext = agentContextService.getFullContext(parentAgentId);
        
        Map<String, Object> inheritedContext = applyInheritanceRule(parentContext, rule);
        
        agentContextService.mergeContext(childAgentId, inheritedContext);
    }
    
    private Map<String, Object> applyInheritanceRule(Map<String, Object> parentContext, ContextInheritanceRule rule) {
        Map<String, Object> inherited = new HashMap<>();
        
        for (Map.Entry<String, Object> entry : parentContext.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            
            if (rule.shouldInherit(key, value)) {
                Object inheritedValue = rule.transformValue(key, value);
                inherited.put(key, inheritedValue);
            }
        }
        
        return inherited;
    }
}

public interface ContextInheritanceRule {
    boolean shouldInherit(String key, Object value);
    Object transformValue(String key, Object value);
}

@Component
public class DefaultInheritanceRule implements ContextInheritanceRule {
    
    private static final Set<String> INHERITABLE_KEYS = Set.of(
        "user_preferences", "session_config", "task_context"
    );
    
    @Override
    public boolean shouldInherit(String key, Object value) {
        return INHERITABLE_KEYS.contains(key) || key.startsWith("shared.");
    }
    
    @Override
    public Object transformValue(String key, Object value) {
        // 可以在这里对继承的值进行转换
        if (key.equals("task_context") && value instanceof Map) {
            Map<String, Object> taskContext = new HashMap<>((Map<String, Object>) value);
            taskContext.put("inherited", true);
            return taskContext;
        }
        
        return value;
    }
}
```

## 上下文查询

### 智能上下文查询

```java
@Service
public class ContextQueryService {
    
    @Autowired
    private ChatClient chatClient;
    
    public ContextQueryResult queryContext(String agentId, String query) {
        // 收集所有相关上下文
        Map<String, Object> agentContext = agentContextService.getFullContext(agentId);
        Map<String, Object> globalContext = globalContextService.getAllGlobalContext();
        
        String sessionId = (String) agentContext.get("sessionId");
        Map<String, Object> sessionContext = sessionId != null ? 
            sessionContextService.getAllSessionContext(sessionId) : new HashMap<>();
        
        String teamId = (String) agentContext.get("teamId");
        Map<String, Object> teamContext = teamId != null ? 
            teamContextService.getAllTeamContext(teamId) : new HashMap<>();
        
        // 使用AI进行上下文查询
        String prompt = String.format("""
            基于以下上下文信息回答查询：
            
            查询：%s
            
            智能体上下文：%s
            会话上下文：%s
            团队上下文：%s
            全局上下文：%s
            
            请提供相关的上下文信息和解释。
            """, 
            query,
            formatContext(agentContext),
            formatContext(sessionContext),
            formatContext(teamContext),
            formatContext(globalContext)
        );
        
        String response = chatClient.prompt()
            .user(prompt)
            .call()
            .content();
        
        return ContextQueryResult.builder()
            .query(query)
            .response(response)
            .relevantContexts(findRelevantContexts(query, agentContext, sessionContext, teamContext, globalContext))
            .build();
    }
    
    private String formatContext(Map<String, Object> context) {
        if (context.isEmpty()) {
            return "无";
        }
        
        return context.entrySet().stream()
            .map(entry -> entry.getKey() + ": " + entry.getValue())
            .collect(Collectors.joining("\n"));
    }
}
```

## 上下文版本控制

### 上下文版本管理

```java
@Service
public class ContextVersionService {
    
    @Autowired
    private ContextVersionRepository versionRepository;
    
    public void saveContextVersion(String contextId, Map<String, Object> contextData, String description) {
        ContextVersion version = ContextVersion.builder()
            .id(UUID.randomUUID().toString())
            .contextId(contextId)
            .contextData(contextData)
            .description(description)
            .version(getNextVersion(contextId))
            .createdAt(Instant.now())
            .build();
        
        versionRepository.save(version);
    }
    
    public Map<String, Object> getContextVersion(String contextId, int version) {
        ContextVersion contextVersion = versionRepository
            .findByContextIdAndVersion(contextId, version)
            .orElseThrow(() -> new ContextVersionNotFoundException(contextId, version));
        
        return contextVersion.getContextData();
    }
    
    public void rollbackContext(String contextId, int targetVersion) {
        Map<String, Object> targetContextData = getContextVersion(contextId, targetVersion);
        
        // 根据上下文类型进行回滚
        if (contextId.startsWith("agent:")) {
            String agentId = contextId.substring(6);
            agentContextService.mergeContext(agentId, targetContextData);
        } else if (contextId.startsWith("session:")) {
            String sessionId = contextId.substring(8);
            sessionContextService.replaceSessionContext(sessionId, targetContextData);
        }
        
        // 保存回滚记录
        saveContextVersion(contextId, targetContextData, "Rollback to version " + targetVersion);
    }
    
    private int getNextVersion(String contextId) {
        return versionRepository.findMaxVersionByContextId(contextId).orElse(0) + 1;
    }
}
```

## 配置选项

```properties
# 上下文管理配置
spring.ai.context.enabled=true
spring.ai.context.propagation.enabled=true
spring.ai.context.inheritance.enabled=true

# 全局上下文配置
spring.ai.context.global.redis.ttl=24h
spring.ai.context.global.max-size=1000

# 会话上下文配置
spring.ai.context.session.ttl=24h
spring.ai.context.session.cleanup-interval=1h
spring.ai.context.session.max-size=500

# 智能体上下文配置
spring.ai.context.agent.max-size=200
spring.ai.context.agent.auto-cleanup=true

# 团队上下文配置
spring.ai.context.team.enabled=true
spring.ai.context.team.ttl=24h
spring.ai.context.team.max-teams=100

# 版本控制配置
spring.ai.context.versioning.enabled=true
spring.ai.context.versioning.max-versions=10
spring.ai.context.versioning.auto-save=true
```

## 最佳实践

### 1. 上下文设计
- 合理划分上下文范围
- 避免上下文过度膨胀
- 设计清晰的继承规则

### 2. 性能优化
- 使用适当的存储后端
- 实施上下文缓存
- 定期清理过期上下文

### 3. 数据一致性
- 实施上下文同步机制
- 处理并发更新冲突
- 维护上下文版本

### 4. 安全考虑
- 控制上下文访问权限
- 敏感信息加密存储
- 审计上下文变更

## 下一步

- [学习人机协作](/docs/develop/multi-agent/human-in-the-loop/)
- [了解时间旅行](/docs/develop/multi-agent/time-travel/)
- [探索子图](/docs/develop/multi-agent/subgraphs/)
