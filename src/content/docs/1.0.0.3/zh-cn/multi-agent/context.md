---
title: 上下文 (Context)
description: Spring AI Alibaba 多智能体上下文管理
---

# 上下文 (Context)

**上下文工程**是构建动态系统的实践，这些系统以正确的格式提供正确的信息和工具，以便 AI 应用程序能够完成任务。上下文可以沿着两个关键维度进行特征化：

1. 按**可变性**：
    - **静态上下文**：在执行期间不会改变的不可变数据（例如，用户元数据、数据库连接、工具）
    - **动态上下文**：随着应用程序运行而演变的可变数据（例如，对话历史、中间结果、工具调用观察）

2. 按**生命周期**：
    - **运行时上下文**：范围限定为单次运行或调用的数据
    - **跨对话上下文**：跨多个对话或会话持续存在的数据

:::note[运行时上下文与 LLM 上下文的区别]
运行时上下文指的是本地上下文：您的代码运行所需的数据和依赖项。它**不**指：

* LLM 上下文，即传递到 LLM 提示中的数据。
* "上下文窗口"，即可以传递给 LLM 的最大令牌数。

运行时上下文可以用来优化 LLM 上下文。例如，您可以使用运行时上下文中的用户元数据来获取用户偏好并将其输入到上下文窗口中。
:::

Spring AI Alibaba 提供三种管理上下文的方式，结合了可变性和生命周期维度：

| 上下文类型 | 描述 | 可变性 | 生命周期 | 访问方法 |
|-----------|------|--------|----------|----------|
| [**静态运行时上下文**](#静态运行时上下文) | 在启动时传递的用户元数据、工具、数据库连接 | 静态 | 单次运行 | `invoke`/`stream` 的 `context` 参数 |
| [**动态运行时上下文（状态）**](#动态运行时上下文状态) | 在单次运行期间演变的可变数据 | 动态 | 单次运行 | Spring AI Alibaba 状态对象 |
| [**动态跨对话上下文（存储）**](#动态跨对话上下文存储) | 跨对话共享的持久数据 | 动态 | 跨对话 | Spring AI Alibaba 存储 |

## 静态运行时上下文

**静态运行时上下文**表示不可变数据，如用户元数据、工具和数据库连接，这些数据在运行开始时通过 `invoke`/`stream` 的 `context` 参数传递给应用程序。这些数据在执行期间不会改变。

```java
// 定义上下文模式
public class ContextSchema {
    private String userName;
    private String userId;
    private Map<String, Object> userPreferences;

    // constructors, getters and setters
    public ContextSchema(String userName, String userId) {
        this.userName = userName;
        this.userId = userId;
        this.userPreferences = new HashMap<>();
    }

    public String getUserName() { return userName; }
    public String getUserId() { return userId; }
    public Map<String, Object> getUserPreferences() { return userPreferences; }
}

// 调用图时传递上下文
Map<String, Object> input = Map.of(
    "messages", List.of(Map.of("role", "user", "content", "你好！"))
);

ContextSchema context = new ContextSchema("张三", "user123");
context.getUserPreferences().put("language", "zh-CN");
context.getUserPreferences().put("timezone", "Asia/Shanghai");

graph.invoke(input, context);
```

### 在智能体提示中使用静态上下文

```java
@Component
public class AgentPromptService {

    public List<Message> createPrompt(AgentState state, ContextSchema context) {
        String systemMessage = String.format(
            "您是一个有用的助手。请称呼用户为 %s。用户偏好语言：%s",
            context.getUserName(),
            context.getUserPreferences().get("language")
        );

        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(systemMessage));
        messages.addAll(state.getMessages());

        return messages;
    }
}

@Component
public class ChatAgent {

    @Autowired
    private AgentPromptService promptService;

    @Autowired
    private ChatClient chatClient;

    public AgentState processMessage(AgentState state, ContextSchema context) {
        List<Message> prompt = promptService.createPrompt(state, context);

        ChatResponse response = chatClient.prompt()
            .messages(prompt)
            .call();

        state.getMessages().add(response.getResult().getOutput());
        return state;
    }
}
```

### 在工具中使用静态上下文

```java
@Component
public class UserInfoTool {

    @Autowired
    private UserService userService;

    @Tool("获取用户邮箱")
    public String getUserEmail(ContextSchema context) {
        // 从数据库获取用户信息
        return userService.getUserEmail(context.getUserId());
    }

    @Tool("获取用户偏好")
    public Map<String, Object> getUserPreferences(ContextSchema context) {
        return context.getUserPreferences();
    }
}
```

### 在工作流节点中使用静态上下文

```java
@Component
public class WorkflowNodes {

    public State processNode(State state, ContextSchema context) {
        String userName = context.getUserName();
        String language = (String) context.getUserPreferences().get("language");

        // 根据用户上下文处理逻辑
        if ("zh-CN".equals(language)) {
            state.setResponse("您好，" + userName + "！");
        } else {
            state.setResponse("Hello, " + userName + "!");
        }

        return state;
    }
}
```

## 动态运行时上下文（状态）

**动态运行时上下文**表示可以在单次运行期间演变的可变数据，通过 Spring AI Alibaba 状态对象进行管理。这包括对话历史、中间结果以及从工具或 LLM 输出派生的值。在 Spring AI Alibaba 中，状态对象在运行期间充当[短期记忆](./memory.md)。

### 在智能体中使用动态状态

```java
// 定义自定义状态模式
public class CustomAgentState extends AgentState {
    private String userName;
    private Map<String, Object> sessionData;
    private List<String> taskHistory;

    public CustomAgentState() {
        super();
        this.sessionData = new HashMap<>();
        this.taskHistory = new ArrayList<>();
    }

    // getters and setters
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public Map<String, Object> getSessionData() { return sessionData; }
    public void setSessionData(Map<String, Object> sessionData) { this.sessionData = sessionData; }

    public List<String> getTaskHistory() { return taskHistory; }
    public void setTaskHistory(List<String> taskHistory) { this.taskHistory = taskHistory; }
}

@Component
public class CustomChatAgent {

    @Autowired
    private ChatClient chatClient;

    public List<Message> createPrompt(CustomAgentState state) {
        String userName = state.getUserName();
        String systemMessage = String.format("您是一个有用的助手。用户名是 %s", userName);

        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(systemMessage));
        messages.addAll(state.getMessages());

        return messages;
    }

    public CustomAgentState processMessage(CustomAgentState state) {
        List<Message> prompt = createPrompt(state);

        ChatResponse response = chatClient.prompt()
            .messages(prompt)
            .call();

        // 更新状态
        state.getMessages().add(response.getResult().getOutput());
        state.getTaskHistory().add("processed_message_" + System.currentTimeMillis());

        return state;
    }
}
```

### 在工作流中使用动态状态

```java
// 定义工作流状态
public class WorkflowState {
    private List<Message> messages;
    private String currentStep;
    private Map<String, Object> intermediateResults;
    private int stepCount;

    public WorkflowState() {
        this.messages = new ArrayList<>();
        this.intermediateResults = new HashMap<>();
        this.stepCount = 0;
    }

    // getters and setters
    public List<Message> getMessages() { return messages; }
    public void setMessages(List<Message> messages) { this.messages = messages; }

    public String getCurrentStep() { return currentStep; }
    public void setCurrentStep(String currentStep) { this.currentStep = currentStep; }

    public Map<String, Object> getIntermediateResults() { return intermediateResults; }
    public void setIntermediateResults(Map<String, Object> results) { this.intermediateResults = results; }

    public int getStepCount() { return stepCount; }
    public void setStepCount(int stepCount) { this.stepCount = stepCount; }
}

@Component
public class WorkflowNodes {

    public WorkflowState dataProcessingNode(WorkflowState state) {
        // 访问状态中的消息
        List<Message> messages = state.getMessages();

        // 处理数据并更新状态
        state.setCurrentStep("data_processing");
        state.setStepCount(state.getStepCount() + 1);
        state.getIntermediateResults().put("processed_at", Instant.now());

        return state;
    }

    public WorkflowState analysisNode(WorkflowState state) {
        // 使用中间结果
        Object processedAt = state.getIntermediateResults().get("processed_at");

        // 更新状态
        state.setCurrentStep("analysis");
        state.setStepCount(state.getStepCount() + 1);
        state.getIntermediateResults().put("analysis_result", "completed");

        return state;
    }
}

// 构建状态图
@Configuration
public class WorkflowConfig {

    @Bean
    public StateGraph<WorkflowState> createWorkflow() {
        return StateGraph.<WorkflowState>builder()
            .addNode("data_processing", workflowNodes::dataProcessingNode)
            .addNode("analysis", workflowNodes::analysisNode)
            .addEdge("__start__", "data_processing")
            .addEdge("data_processing", "analysis")
            .addEdge("analysis", "__end__")
            .build();
    }
}
```

:::note[启用记忆功能]
请参阅[记忆指南](./memory.md)了解如何启用记忆的更多详细信息。这是一个强大的功能，允许您在多次调用之间持久化智能体的状态。否则，状态仅限于单次运行。
:::

## 动态跨对话上下文（存储）

**动态跨对话上下文**表示跨多个对话或会话的持久、可变数据，通过 Spring AI Alibaba 存储进行管理。这包括用户配置文件、偏好和历史交互。Spring AI Alibaba 存储充当跨多次运行的[长期记忆](./memory.md#长期记忆)。这可以用来读取或更新持久事实（例如，用户配置文件、偏好、先前交互）。

### 基本存储操作

```java
@Service
public class CrossConversationContextService {

    @Autowired
    private BaseStore store;

    // 存储用户配置文件
    public void saveUserProfile(String userId, Map<String, Object> profile) {
        String namespace = "user_profiles";
        store.put(namespace, userId, profile);
    }

    // 获取用户配置文件
    public Map<String, Object> getUserProfile(String userId) {
        String namespace = "user_profiles";
        List<StoreItem> items = store.get(namespace, userId);
        return items.isEmpty() ? new HashMap<>() : items.get(0).getValue();
    }

    // 更新用户偏好
    public void updateUserPreferences(String userId, String key, Object value) {
        Map<String, Object> profile = getUserProfile(userId);

        @SuppressWarnings("unchecked")
        Map<String, Object> preferences = (Map<String, Object>) profile.computeIfAbsent("preferences", k -> new HashMap<>());
        preferences.put(key, value);

        saveUserProfile(userId, profile);
    }

    // 搜索用户交互历史
    public List<StoreItem> searchUserInteractions(String userId, String query) {
        String namespace = "user_interactions:" + userId;
        return store.search(namespace, null, query);
    }

    // 保存交互记录
    public void saveInteraction(String userId, String interactionId, Map<String, Object> interaction) {
        String namespace = "user_interactions:" + userId;
        interaction.put("timestamp", Instant.now().toString());
        store.put(namespace, interactionId, interaction);
    }
}
```

### 在智能体中使用跨对话上下文

```java
@Component
public class ContextAwareChatAgent {

    @Autowired
    private CrossConversationContextService contextService;

    @Autowired
    private ChatClient chatClient;

    public AgentState processMessage(AgentState state, ContextSchema context) {
        String userId = context.getUserId();

        // 获取用户的长期上下文
        Map<String, Object> userProfile = contextService.getUserProfile(userId);

        // 构建包含长期上下文的提示
        String systemMessage = buildSystemMessage(userProfile, context);

        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(systemMessage));
        messages.addAll(state.getMessages());

        ChatResponse response = chatClient.prompt()
            .messages(messages)
            .call();

        // 更新状态
        state.getMessages().add(response.getResult().getOutput());

        // 异步保存交互记录
        saveInteractionAsync(userId, state, response);

        return state;
    }

    private String buildSystemMessage(Map<String, Object> userProfile, ContextSchema context) {
        StringBuilder systemMessage = new StringBuilder();
        systemMessage.append("您是一个有用的助手。");

        if (userProfile.containsKey("preferences")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> preferences = (Map<String, Object>) userProfile.get("preferences");

            if (preferences.containsKey("communication_style")) {
                systemMessage.append(" 用户偏好的沟通风格：")
                    .append(preferences.get("communication_style"));
            }

            if (preferences.containsKey("topics_of_interest")) {
                systemMessage.append(" 用户感兴趣的话题：")
                    .append(preferences.get("topics_of_interest"));
            }
        }

        systemMessage.append(" 请称呼用户为 ").append(context.getUserName()).append("。");

        return systemMessage.toString();
    }

    @Async
    private void saveInteractionAsync(String userId, AgentState state, ChatResponse response) {
        try {
            String interactionId = UUID.randomUUID().toString();
            Map<String, Object> interaction = Map.of(
                "user_message", state.getMessages().get(state.getMessages().size() - 2).getContent(),
                "assistant_response", response.getResult().getOutput().getContent(),
                "session_id", state.getSessionId()
            );

            contextService.saveInteraction(userId, interactionId, interaction);
        } catch (Exception e) {
            log.warn("保存交互记录失败: {}", e.getMessage());
        }
    }
}
```

## 上下文集成示例

以下示例展示了如何在一个完整的聊天应用程序中集成所有三种类型的上下文：

```java
@Component
public class ComprehensiveContextExample {

    @Autowired
    private CrossConversationContextService crossContextService;

    @Autowired
    private StateGraph<ChatState> chatGraph;

    @Autowired
    private ChatClient chatClient;

    public ChatResponse processUserMessage(String userId, String message, String threadId) {
        // 1. 静态运行时上下文 - 用户元数据和偏好
        ContextSchema staticContext = buildStaticContext(userId);

        // 2. 动态运行时上下文 - 当前对话状态
        ChatState dynamicState = new ChatState();
        dynamicState.setMessages(List.of(new HumanMessage(message)));
        dynamicState.setUserId(userId);
        dynamicState.setThreadId(threadId);

        // 3. 动态跨对话上下文 - 用户历史和偏好
        enhanceStateWithCrossConversationContext(dynamicState, userId);

        // 执行图
        Map<String, Object> config = Map.of(
            "configurable", Map.of("thread_id", threadId)
        );

        ChatState result = chatGraph.invoke(dynamicState, staticContext, config);

        // 异步更新跨对话上下文
        updateCrossConversationContextAsync(userId, message, result);

        return new ChatResponse(result.getMessages().get(result.getMessages().size() - 1));
    }

    private ContextSchema buildStaticContext(String userId) {
        // 获取用户基本信息
        User user = userService.getUser(userId);

        ContextSchema context = new ContextSchema(user.getName(), userId);
        context.getUserPreferences().put("language", user.getPreferredLanguage());
        context.getUserPreferences().put("timezone", user.getTimezone());
        context.getUserPreferences().put("notification_enabled", user.isNotificationEnabled());

        return context;
    }

    private void enhanceStateWithCrossConversationContext(ChatState state, String userId) {
        // 获取用户配置文件
        Map<String, Object> userProfile = crossContextService.getUserProfile(userId);

        if (!userProfile.isEmpty()) {
            state.setUserProfile(userProfile);

            // 获取相关的历史交互
            List<StoreItem> recentInteractions = crossContextService
                .searchUserInteractions(userId, "recent:5");

            state.setRecentInteractions(recentInteractions);
        }
    }

    @Async
    private void updateCrossConversationContextAsync(String userId, String userMessage, ChatState result) {
        try {
            // 分析用户消息以提取偏好
            analyzeAndUpdateUserPreferences(userId, userMessage);

            // 保存交互记录
            String interactionId = UUID.randomUUID().toString();
            Map<String, Object> interaction = Map.of(
                "user_message", userMessage,
                "assistant_response", result.getMessages().get(result.getMessages().size() - 1).getContent(),
                "timestamp", Instant.now().toString(),
                "thread_id", result.getThreadId()
            );

            crossContextService.saveInteraction(userId, interactionId, interaction);

        } catch (Exception e) {
            log.warn("更新跨对话上下文失败: {}", e.getMessage());
        }
    }

    private void analyzeAndUpdateUserPreferences(String userId, String message) {
        // 使用 LLM 分析用户消息以提取偏好
        String analysisPrompt = String.format("""
            分析以下用户消息，提取任何用户偏好或兴趣：

            消息：%s

            请以 JSON 格式返回提取的偏好，如果没有发现偏好则返回空对象 {}。
            """, message);

        try {
            String response = chatClient.prompt()
                .user(analysisPrompt)
                .call()
                .content();

            Map<String, Object> preferences = parsePreferences(response);

            if (!preferences.isEmpty()) {
                for (Map.Entry<String, Object> entry : preferences.entrySet()) {
                    crossContextService.updateUserPreferences(userId, entry.getKey(), entry.getValue());
                }
            }
        } catch (Exception e) {
            log.debug("偏好分析失败: {}", e.getMessage());
        }
    }
}
```

## 配置选项

```properties
# 上下文管理配置
spring.ai.alibaba.context.enabled=true
spring.ai.alibaba.context.static.cache-size=1000
spring.ai.alibaba.context.static.ttl=1h

# 动态运行时上下文配置
spring.ai.alibaba.context.dynamic.max-state-size=10MB
spring.ai.alibaba.context.dynamic.checkpoint-interval=5m

# 跨对话上下文配置
spring.ai.alibaba.context.cross-conversation.store-type=database
spring.ai.alibaba.context.cross-conversation.namespace-ttl=30d
spring.ai.alibaba.context.cross-conversation.max-items-per-namespace=1000

# 存储配置
spring.ai.alibaba.context.store.connection-pool-size=10
spring.ai.alibaba.context.store.query-timeout=30s
spring.ai.alibaba.context.store.batch-size=100
```

## 最佳实践

### 1. 上下文设计原则

- **明确上下文边界**：根据数据的可变性和生命周期选择合适的上下文类型
- **最小化上下文大小**：只存储必要的信息，避免上下文过度膨胀
- **合理使用命名空间**：为跨对话上下文设计清晰的命名空间结构

### 2. 性能优化

- **缓存静态上下文**：对不经常变化的静态上下文进行缓存
- **批量操作**：在可能的情况下使用批量操作来减少数据库访问
- **异步更新**：对于非关键的上下文更新使用异步处理

### 3. 数据管理

- **定期清理**：设置合理的 TTL 和清理策略
- **版本控制**：对重要的上下文变更进行版本控制
- **备份策略**：制定上下文数据的备份和恢复策略

### 4. 安全考虑

- **访问控制**：确保只有授权的组件可以访问特定的上下文
- **敏感数据处理**：对敏感信息进行适当的加密和脱敏
- **审计日志**：记录重要的上下文变更操作

### 5. 开发建议

- **渐进式实现**：从简单的静态上下文开始，逐步添加动态和跨对话上下文
- **测试策略**：为上下文管理功能编写全面的测试用例
- **监控和调试**：实施上下文使用情况的监控和日志记录
- **文档维护**：保持上下文结构和使用方式的文档更新

## 常见问题

### Q: 什么时候应该使用静态上下文？
A: 当您需要传递在整个执行过程中不会改变的数据时，如用户元数据、配置信息、工具定义等。

### Q: 动态运行时上下文和跨对话上下文有什么区别？
A:
- **动态运行时上下文**：仅在单次运行期间存在，如对话历史、中间结果
- **跨对话上下文**：跨多个会话持续存在，如用户偏好、历史交互记录

### Q: 如何优化上下文的性能？
A:
- 使用适当的缓存策略
- 设置合理的 TTL
- 批量处理上下文操作
- 定期清理过期数据

### Q: 如何确保上下文的安全性？
A:
- 实施访问控制机制
- 对敏感数据进行加密
- 记录上下文访问日志
- 定期审计上下文内容

## 下一步

- [学习人机协作](./human-in-the-loop.md)
- [了解时间旅行](./time-travel.md)
- [探索子图](./subgraphs.md)
