---
title: 上下文管理
keywords: ["Spring AI Alibaba", "Graph", "Context", "上下文", "配置管理"]
description: "学习如何在 Spring AI Alibaba Graph 中管理执行上下文，包括配置传递、环境变量和运行时参数。"
---

## 概述

上下文管理是 Spring AI Alibaba Graph 的重要组成部分，它允许您在图执行过程中传递配置、环境变量、认证信息和其他运行时参数。良好的上下文管理确保图的不同部分能够访问所需的配置和资源。

### 上下文的作用

在复杂的图执行中，上下文提供以下功能：

1. **配置传递** — 在节点间传递配置参数和设置
2. **认证管理** — 传递用户身份和权限信息
3. **环境变量** — 管理不同环境下的配置差异
4. **资源访问** — 提供对外部资源和服务的访问
5. **执行控制** — 控制图的执行行为和策略

## 基础上下文使用

### 1. RunnableConfig 配置

```java
import com.alibaba.cloud.ai.graph.RunnableConfig;
import com.alibaba.cloud.ai.graph.CompiledGraph;

@Service
public class GraphContextService {
    
    @Autowired
    private CompiledGraph workflow;
    
    public String executeWithContext(String sessionId, Map<String, Object> input) {
        // 创建运行时配置
        RunnableConfig config = RunnableConfig.builder()
            .configurable(Map.of(
                "thread_id", sessionId,
                "user_id", "user123",
                "environment", "production",
                "api_timeout", 30000,
                "retry_count", 3
            ))
            .tags(Set.of("production", "high-priority"))
            .metadata(Map.of(
                "request_id", UUID.randomUUID().toString(),
                "timestamp", System.currentTimeMillis(),
                "source", "api"
            ))
            .build();
        
        // 使用配置执行图
        Optional<OverAllState> result = workflow.invoke(input, config);
        
        return result.map(state -> 
            state.value("final_result", String.class).orElse("No result")
        ).orElse("Execution failed");
    }
}
```

### 2. 在节点中访问上下文

```java
import com.alibaba.cloud.ai.graph.context.GraphContext;

public class ContextAwareNode implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        // 获取当前执行上下文
        GraphContext context = GraphContext.current();
        
        // 访问配置参数
        String userId = context.getConfigurable("user_id", String.class).orElse("anonymous");
        String environment = context.getConfigurable("environment", String.class).orElse("development");
        Integer timeout = context.getConfigurable("api_timeout", Integer.class).orElse(10000);
        
        // 访问元数据
        String requestId = context.getMetadata("request_id", String.class).orElse("unknown");
        
        // 检查标签
        boolean isHighPriority = context.hasTag("high-priority");
        
        // 根据上下文执行不同逻辑
        if ("production".equals(environment)) {
            return executeProductionLogic(state, userId, timeout, requestId);
        } else {
            return executeDevelopmentLogic(state, userId);
        }
    }
    
    private Map<String, Object> executeProductionLogic(OverAllState state, String userId, 
                                                      Integer timeout, String requestId) {
        // 生产环境逻辑
        return Map.of(
            "result", "Production result for user: " + userId,
            "request_id", requestId,
            "timeout_used", timeout
        );
    }
    
    private Map<String, Object> executeDevelopmentLogic(OverAllState state, String userId) {
        // 开发环境逻辑
        return Map.of(
            "result", "Development result for user: " + userId,
            "debug_info", "Additional debug information"
        );
    }
}
```

## 高级上下文管理

### 1. 上下文继承和传播

```java
@Component
public class ContextPropagationService {
    
    public void executeWithInheritedContext(String parentSessionId, String childSessionId, 
                                          Map<String, Object> input) {
        // 获取父上下文
        RunnableConfig parentConfig = getStoredConfig(parentSessionId);
        
        // 创建子上下文，继承父配置
        RunnableConfig childConfig = RunnableConfig.builder()
            .inheritFrom(parentConfig)  // 继承父配置
            .configurable(Map.of(
                "thread_id", childSessionId,
                "parent_session", parentSessionId,
                "inheritance_level", 1
            ))
            .addTag("child-execution")
            .metadata(Map.of(
                "parent_request_id", parentConfig.getMetadata("request_id", String.class).orElse(""),
                "child_request_id", UUID.randomUUID().toString()
            ))
            .build();
        
        // 执行子图
        workflow.invoke(input, childConfig);
    }
    
    private RunnableConfig getStoredConfig(String sessionId) {
        // 从存储中获取配置（Redis、数据库等）
        return configStorage.get(sessionId);
    }
}
```

### 2. 动态上下文修改

```java
public class DynamicContextNode implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        GraphContext context = GraphContext.current();
        
        // 根据状态动态修改上下文
        String currentUser = state.value("current_user", String.class).orElse("");
        if (!currentUser.isEmpty()) {
            // 更新用户上下文
            context.updateConfigurable("user_id", currentUser);
            context.addTag("user-authenticated");
        }
        
        // 根据处理结果调整超时时间
        Integer currentTimeout = context.getConfigurable("api_timeout", Integer.class).orElse(10000);
        if (isComplexOperation(state)) {
            context.updateConfigurable("api_timeout", currentTimeout * 2);
            context.addTag("extended-timeout");
        }
        
        // 添加执行跟踪信息
        context.updateMetadata("last_node", "dynamic_context");
        context.updateMetadata("execution_time", System.currentTimeMillis());
        
        return Map.of(
            "context_updated", true,
            "current_timeout", context.getConfigurable("api_timeout", Integer.class).orElse(0)
        );
    }
    
    private boolean isComplexOperation(OverAllState state) {
        return state.value("operation_complexity", String.class)
            .map("high"::equals)
            .orElse(false);
    }
}
```

### 3. 上下文作用域管理

```java
@Component
public class ContextScopeManager {
    
    private final ThreadLocal<Stack<GraphContext>> contextStack = ThreadLocal.withInitial(Stack::new);
    
    public <T> T executeInScope(GraphContext scopedContext, Supplier<T> operation) {
        Stack<GraphContext> stack = contextStack.get();
        
        // 推入新的上下文作用域
        stack.push(scopedContext);
        
        try {
            // 在新作用域中执行操作
            return operation.get();
        } finally {
            // 恢复之前的上下文作用域
            stack.pop();
        }
    }
    
    public GraphContext getCurrentContext() {
        Stack<GraphContext> stack = contextStack.get();
        return stack.isEmpty() ? null : stack.peek();
    }
    
    public void clearContext() {
        contextStack.remove();
    }
}

// 使用示例
public class ScopedExecutionNode implements NodeAction {
    
    @Autowired
    private ContextScopeManager scopeManager;
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        // 创建特殊作用域的上下文
        GraphContext specialContext = GraphContext.builder()
            .configurable(Map.of(
                "special_mode", true,
                "debug_level", "verbose"
            ))
            .build();
        
        // 在特殊作用域中执行操作
        String result = scopeManager.executeInScope(specialContext, () -> {
            return performSpecialOperation(state);
        });
        
        return Map.of("scoped_result", result);
    }
}
```

## 环境和配置管理

### 1. 多环境配置

```java
@Configuration
public class EnvironmentContextConfiguration {
    
    @Value("${spring.profiles.active:development}")
    private String activeProfile;
    
    @Bean
    public EnvironmentContextProvider environmentContextProvider() {
        return new EnvironmentContextProvider(activeProfile);
    }
}

@Component
public class EnvironmentContextProvider {
    
    private final String environment;
    private final Map<String, EnvironmentConfig> environmentConfigs;
    
    public EnvironmentContextProvider(String environment) {
        this.environment = environment;
        this.environmentConfigs = loadEnvironmentConfigs();
    }
    
    public RunnableConfig createEnvironmentConfig(String sessionId) {
        EnvironmentConfig envConfig = environmentConfigs.get(environment);
        
        return RunnableConfig.builder()
            .configurable(Map.of(
                "thread_id", sessionId,
                "environment", environment,
                "api_base_url", envConfig.getApiBaseUrl(),
                "api_timeout", envConfig.getApiTimeout(),
                "retry_count", envConfig.getRetryCount(),
                "log_level", envConfig.getLogLevel()
            ))
            .tags(Set.of(environment, envConfig.getTier()))
            .metadata(Map.of(
                "config_version", envConfig.getVersion(),
                "loaded_at", System.currentTimeMillis()
            ))
            .build();
    }
    
    private Map<String, EnvironmentConfig> loadEnvironmentConfigs() {
        Map<String, EnvironmentConfig> configs = new HashMap<>();
        
        // 开发环境配置
        configs.put("development", EnvironmentConfig.builder()
            .apiBaseUrl("http://localhost:8080")
            .apiTimeout(5000)
            .retryCount(1)
            .logLevel("DEBUG")
            .tier("development")
            .version("1.0.0")
            .build());
        
        // 测试环境配置
        configs.put("testing", EnvironmentConfig.builder()
            .apiBaseUrl("https://test-api.example.com")
            .apiTimeout(10000)
            .retryCount(2)
            .logLevel("INFO")
            .tier("testing")
            .version("1.0.0")
            .build());
        
        // 生产环境配置
        configs.put("production", EnvironmentConfig.builder()
            .apiBaseUrl("https://api.example.com")
            .apiTimeout(15000)
            .retryCount(3)
            .logLevel("WARN")
            .tier("production")
            .version("1.0.0")
            .build());
        
        return configs;
    }
}
```

### 2. 安全上下文管理

```java
@Component
public class SecurityContextManager {
    
    public RunnableConfig createSecureContext(String sessionId, UserPrincipal user) {
        // 验证用户权限
        Set<String> permissions = getUserPermissions(user);
        
        return RunnableConfig.builder()
            .configurable(Map.of(
                "thread_id", sessionId,
                "user_id", user.getId(),
                "user_name", user.getName(),
                "user_roles", user.getRoles(),
                "permissions", permissions,
                "security_level", determineSecurityLevel(user)
            ))
            .tags(createSecurityTags(user))
            .metadata(Map.of(
                "auth_time", user.getAuthenticationTime(),
                "session_timeout", calculateSessionTimeout(user),
                "ip_address", user.getIpAddress()
            ))
            .build();
    }
    
    private Set<String> getUserPermissions(UserPrincipal user) {
        // 从权限系统获取用户权限
        return permissionService.getPermissions(user.getId());
    }
    
    private String determineSecurityLevel(UserPrincipal user) {
        if (user.getRoles().contains("ADMIN")) {
            return "HIGH";
        } else if (user.getRoles().contains("MANAGER")) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }
    
    private Set<String> createSecurityTags(UserPrincipal user) {
        Set<String> tags = new HashSet<>();
        tags.add("authenticated");
        tags.addAll(user.getRoles().stream()
            .map(role -> "role:" + role.toLowerCase())
            .collect(Collectors.toSet()));
        return tags;
    }
}

// 在节点中使用安全上下文
public class SecureNode implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        GraphContext context = GraphContext.current();
        
        // 检查权限
        Set<String> permissions = context.getConfigurable("permissions", Set.class).orElse(Set.of());
        if (!permissions.contains("READ_SENSITIVE_DATA")) {
            throw new SecurityException("Insufficient permissions");
        }
        
        // 根据安全级别执行不同逻辑
        String securityLevel = context.getConfigurable("security_level", String.class).orElse("LOW");
        
        switch (securityLevel) {
            case "HIGH":
                return executeHighSecurityLogic(state);
            case "MEDIUM":
                return executeMediumSecurityLogic(state);
            default:
                return executeLowSecurityLogic(state);
        }
    }
}
```

## 上下文监控和调试

### 1. 上下文跟踪

```java
@Component
public class ContextTracker {
    
    private final Map<String, List<ContextSnapshot>> contextHistory = new ConcurrentHashMap<>();
    
    public void trackContext(String sessionId, String nodeId, GraphContext context) {
        ContextSnapshot snapshot = ContextSnapshot.builder()
            .sessionId(sessionId)
            .nodeId(nodeId)
            .timestamp(System.currentTimeMillis())
            .configurable(new HashMap<>(context.getConfigurable()))
            .tags(new HashSet<>(context.getTags()))
            .metadata(new HashMap<>(context.getMetadata()))
            .build();
        
        contextHistory.computeIfAbsent(sessionId, k -> new ArrayList<>()).add(snapshot);
    }
    
    public List<ContextSnapshot> getContextHistory(String sessionId) {
        return contextHistory.getOrDefault(sessionId, List.of());
    }
    
    public void clearHistory(String sessionId) {
        contextHistory.remove(sessionId);
    }
}

// 上下文跟踪节点
public class ContextTrackingNode implements NodeAction {
    
    @Autowired
    private ContextTracker contextTracker;
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        GraphContext context = GraphContext.current();
        String sessionId = context.getConfigurable("thread_id", String.class).orElse("unknown");
        
        // 跟踪上下文变化
        contextTracker.trackContext(sessionId, "context_tracking", context);
        
        // 执行业务逻辑
        Object result = performBusinessLogic(state);
        
        return Map.of(
            "result", result,
            "context_tracked", true
        );
    }
}
```

### 2. 上下文调试工具

```java
@RestController
@RequestMapping("/api/context")
public class ContextDebugController {
    
    @Autowired
    private ContextTracker contextTracker;
    
    @GetMapping("/{sessionId}/history")
    public ResponseEntity<List<ContextSnapshot>> getContextHistory(@PathVariable String sessionId) {
        List<ContextSnapshot> history = contextTracker.getContextHistory(sessionId);
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/{sessionId}/current")
    public ResponseEntity<Map<String, Object>> getCurrentContext(@PathVariable String sessionId) {
        // 获取当前活跃的上下文信息
        Map<String, Object> contextInfo = contextService.getCurrentContextInfo(sessionId);
        return ResponseEntity.ok(contextInfo);
    }
    
    @PostMapping("/{sessionId}/validate")
    public ResponseEntity<ContextValidationResult> validateContext(
            @PathVariable String sessionId,
            @RequestBody Map<String, Object> expectedContext) {
        
        ContextValidationResult result = contextValidator.validate(sessionId, expectedContext);
        return ResponseEntity.ok(result);
    }
}
```

## 最佳实践

### 上下文设计原则

1. **最小权限原则** — 只传递节点需要的最少上下文信息
2. **不可变性** — 尽量保持上下文的不可变性，避免意外修改
3. **类型安全** — 使用强类型访问上下文数据
4. **作用域清晰** — 明确上下文的作用域和生命周期

### 性能优化

- **上下文缓存** — 缓存频繁访问的上下文数据
- **延迟加载** — 只在需要时加载上下文信息
- **批量操作** — 批量更新上下文以减少开销
- **内存管理** — 及时清理不需要的上下文数据

### 安全考虑

- **敏感信息保护** — 避免在上下文中存储敏感信息
- **权限验证** — 在访问上下文前验证权限
- **审计日志** — 记录上下文的访问和修改
- **加密传输** — 在网络传输中加密上下文数据

## 下一步

- [持久化](./persistence) - 了解如何持久化上下文信息
- [人机协作](./human-in-the-loop) - 学习在人机交互中管理上下文
- [子图](./subgraphs) - 在子图中传递和管理上下文
