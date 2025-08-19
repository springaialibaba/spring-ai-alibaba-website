---
title: 记忆 (Memory)
description: Spring AI Alibaba 多智能体记忆管理
---

# 记忆 (Memory)

[记忆](../how-tos/memory/add-memory.md)是一个记住先前交互信息的系统。对于 AI 智能体来说，记忆至关重要，因为它让智能体能够记住先前的交互、从反馈中学习并适应用户偏好。随着智能体处理更复杂的任务和众多用户交互，这种能力对于效率和用户满意度都变得至关重要。

本概念指南基于记忆的召回范围涵盖两种类型的记忆：

- [短期记忆](#短期记忆)，或[线程](./persistence.md#线程)范围的记忆，通过在会话中维护消息历史来跟踪正在进行的对话。Spring AI Alibaba 将短期记忆作为智能体[状态](./graph/overview.md#状态)的一部分进行管理。状态使用[检查点保存器](./persistence.md#检查点)持久化到数据库，因此线程可以随时恢复。短期记忆在图被调用或步骤完成时更新，状态在每个步骤开始时读取。

- [长期记忆](#长期记忆)存储跨会话的用户特定或应用程序级数据，并在对话线程_之间_共享。它可以在_任何时间_和_任何线程_中被召回。记忆的范围是任何自定义命名空间，而不仅仅是在单个线程 ID 内。Spring AI Alibaba 提供[存储](./persistence.md#记忆存储)来让您保存和召回长期记忆。

![短期记忆与长期记忆对比](https://langchain-ai.github.io/langgraph/concepts/img/memory/short-vs-long.png)

## 短期记忆

[短期记忆](../how-tos/memory/add-memory.md#添加短期记忆)让您的应用程序记住单个[线程](./persistence.md#线程)或对话中的先前交互。[线程](./persistence.md#线程)在会话中组织多个交互，类似于电子邮件在单个对话中分组消息的方式。

Spring AI Alibaba 将短期记忆作为智能体状态的一部分进行管理，通过线程范围的检查点进行持久化。此状态通常可以包括对话历史以及其他有状态数据，如上传的文件、检索的文档或生成的工件。通过将这些存储在图的状态中，机器人可以访问给定对话的完整上下文，同时保持不同线程之间的分离。

### 管理短期记忆

对话历史是短期记忆最常见的形式，长对话对当今的 LLM 构成挑战。完整的历史可能无法适应 LLM 的上下文窗口，导致不可恢复的错误。即使您的 LLM 支持完整的上下文长度，大多数 LLM 在长上下文上仍然表现不佳。它们会被陈旧或偏离主题的内容"分散注意力"，同时遭受更慢的响应时间和更高的成本。

聊天模型使用消息接受上下文，包括开发者提供的指令（系统消息）和用户输入（人类消息）。在聊天应用程序中，消息在人类输入和模型响应之间交替，导致消息列表随时间变长。由于上下文窗口有限且富含令牌的消息列表可能成本高昂，许多应用程序可以从使用技术手动删除或遗忘陈旧信息中受益。

![消息过滤](https://langchain-ai.github.io/langgraph/concepts/img/memory/filter.png)

### 基本短期记忆实现

```java
@Component
public class ShortTermMemoryService {

    @Autowired
    private CheckpointSaver checkpointSaver;

    public void addMessage(String threadId, Message message) {
        // 获取当前状态
        Map<String, Object> config = Map.of(
            "configurable", Map.of("thread_id", threadId)
        );

        StateSnapshot state = graph.getState(config);
        List<Message> messages = (List<Message>) state.getValues().get("messages");

        if (messages == null) {
            messages = new ArrayList<>();
        }

        // 添加新消息
        messages.add(message);

        // 管理消息长度
        messages = manageMessageLength(messages);

        // 更新状态
        Map<String, Object> newState = new HashMap<>(state.getValues());
        newState.put("messages", messages);

        // 保存到检查点
        checkpointSaver.put(config, newState);
    }

    private List<Message> manageMessageLength(List<Message> messages) {
        // 如果消息太多，保留最近的消息
        int maxMessages = 20;
        if (messages.size() > maxMessages) {
            // 保留系统消息和最近的消息
            List<Message> managedMessages = new ArrayList<>();

            // 添加系统消息
            messages.stream()
                .filter(msg -> msg.getType() == MessageType.SYSTEM)
                .findFirst()
                .ifPresent(managedMessages::add);

            // 添加最近的用户和助手消息
            List<Message> recentMessages = messages.stream()
                .filter(msg -> msg.getType() != MessageType.SYSTEM)
                .skip(Math.max(0, messages.size() - maxMessages + 1))
                .collect(Collectors.toList());

            managedMessages.addAll(recentMessages);
            return managedMessages;
        }

        return messages;
    }

    public List<Message> getMessages(String threadId) {
        Map<String, Object> config = Map.of(
            "configurable", Map.of("thread_id", threadId)
        );

        StateSnapshot state = graph.getState(config);
        return (List<Message>) state.getValues().getOrDefault("messages", new ArrayList<>());
    }
}
```

## 长期记忆

Spring AI Alibaba 中的[长期记忆](../how-tos/memory/add-memory.md#添加长期记忆)允许系统在不同对话或会话之间保留信息。与**线程范围**的短期记忆不同，长期记忆保存在自定义"命名空间"内。

长期记忆是一个复杂的挑战，没有一刀切的解决方案。但是，以下问题提供了一个框架来帮助您导航不同的技术：

- [记忆类型是什么？](#记忆类型) 人类使用记忆来记住事实（[语义记忆](#语义记忆)）、经验（[情景记忆](#情景记忆)）和规则（[程序记忆](#程序记忆)）。AI 智能体可以以相同的方式使用记忆。例如，AI 智能体可以使用记忆来记住关于用户的特定事实以完成任务。

- [何时更新记忆？](#写入记忆) 记忆可以作为智能体应用程序逻辑的一部分进行更新（例如，"在热路径上"）。在这种情况下，智能体通常在响应用户之前决定记住事实。或者，记忆可以作为后台任务进行更新（在后台/异步运行并生成记忆的逻辑）。我们在[下面的部分](#写入记忆)中解释这些方法之间的权衡。

### 记忆类型

不同的应用程序需要各种类型的记忆。虽然类比并不完美，但检查[人类记忆类型](https://www.psychologytoday.com/us/basics/memory/types-of-memory)可能很有见地。一些研究（例如，[CoALA 论文](https://arxiv.org/pdf/2309.02427)）甚至将这些人类记忆类型映射到 AI 智能体中使用的记忆类型。

| 记忆类型 | 存储内容 | 人类示例 | 智能体示例 |
|----------|----------|----------|------------|
| [语义](#语义记忆) | 事实 | 在学校学到的东西 | 关于用户的事实 |
| [情景](#情景记忆) | 经验 | 我做过的事情 | 过去的智能体行动 |
| [程序](#程序记忆) | 指令 | 本能或运动技能 | 智能体系统提示 |

#### 语义记忆

[语义记忆](https://en.wikipedia.org/wiki/Semantic_memory)，无论是在人类还是 AI 智能体中，都涉及特定事实和概念的保留。在人类中，它可以包括在学校学到的信息以及对概念及其关系的理解。对于 AI 智能体，语义记忆通常用于通过记住过去交互中的事实或概念来个性化应用程序。

:::note[语义记忆与语义搜索的区别]
语义记忆不同于"语义搜索"，后者是一种使用"含义"（通常作为嵌入）查找相似内容的技术。语义记忆是心理学中的一个术语，指的是存储事实和知识，而语义搜索是一种基于含义而不是精确匹配检索信息的方法。
:::

##### 配置文件

语义记忆可以通过不同的方式管理。例如，记忆可以是关于用户、组织或其他实体（包括智能体本身）的范围明确且具体信息的单个、持续更新的"配置文件"。配置文件通常只是一个 JSON 文档，包含您选择用来表示您的域的各种键值对。

当记住配置文件时，您需要确保每次都**更新**配置文件。因此，您需要传入先前的配置文件并[要求模型生成新配置文件](https://github.com/langchain-ai/memory-template)（或一些要应用于旧配置文件的 [JSON 补丁](https://github.com/hinthornw/trustcall)）。随着配置文件变大，这可能变得容易出错，并且可能受益于将配置文件拆分为多个文档或在生成文档时使用**严格**解码以确保记忆模式保持有效。

![更新配置文件](https://langchain-ai.github.io/langgraph/concepts/img/memory/update-profile.png)

##### 集合

或者，记忆可以是随时间持续更新和扩展的文档集合。每个单独的记忆可以更窄范围且更容易生成，这意味着您不太可能随时间**丢失**信息。对于 LLM 来说，为新信息生成_新_对象比将新信息与现有配置文件协调更容易。因此，文档集合往往导致[下游更高的召回率](https://en.wikipedia.org/wiki/Precision_and_recall)。

但是，这将一些复杂性转移到记忆更新。模型现在必须_删除_或_更新_列表中的现有项目，这可能很棘手。此外，一些模型可能默认过度插入，而其他模型可能默认过度更新。请参阅 [Trustcall](https://github.com/hinthornw/trustcall) 包作为管理此问题的一种方法，并考虑评估（例如，使用 [LangSmith](https://docs.smith.langchain.com/tutorials/Developers/evaluation) 等工具）来帮助您调整行为。

使用文档集合还将复杂性转移到对列表的记忆**搜索**。存储当前支持[语义搜索](https://langchain-ai.github.io/langgraph/reference/store/#langgraph.store.base.SearchOp.query)和[按内容过滤](https://langchain-ai.github.io/langgraph/reference/store/#langgraph.store.base.SearchOp.filter)。

最后，使用记忆集合可能使向模型提供全面上下文变得具有挑战性。虽然单个记忆可能遵循特定模式，但这种结构可能无法捕获记忆之间的完整上下文或关系。因此，当使用这些记忆生成响应时，模型可能缺乏在统一配置文件方法中更容易获得的重要上下文信息。

![更新列表](https://langchain-ai.github.io/langgraph/concepts/img/memory/update-list.png)

无论记忆管理方法如何，中心点是智能体将使用语义记忆来[基础其响应](https://python.langchain.com/docs/concepts/rag/)，这通常导致更个性化和相关的交互。

#### 情景记忆

[情景记忆](https://en.wikipedia.org/wiki/Episodic_memory)，无论是在人类还是 AI 智能体中，都涉及回忆过去的事件或行动。[CoALA 论文](https://arxiv.org/pdf/2309.02427)很好地阐述了这一点：事实可以写入语义记忆，而*经验*可以写入情景记忆。对于 AI 智能体，情景记忆通常用于帮助智能体记住如何完成任务。

在实践中，情景记忆通常通过[少样本示例提示](https://python.langchain.com/docs/concepts/few_shot_prompting/)实现，智能体从过去的序列中学习以正确执行任务。有时"展示"比"告诉"更容易，LLM 从示例中学习得很好。少样本学习让您通过使用输入-输出示例更新提示来说明预期行为，从而["编程"](https://x.com/karpathy/status/1627366413840322562)您的 LLM。虽然可以使用各种[最佳实践](https://python.langchain.com/docs/concepts/#1-generating-examples)来生成少样本示例，但挑战通常在于根据用户输入选择最相关的示例。

#### 程序记忆

[程序记忆](https://en.wikipedia.org/wiki/Procedural_memory)，无论是在人类还是 AI 智能体中，都涉及记住用于执行任务的规则。在人类中，程序记忆就像执行任务的内化知识，例如通过基本运动技能和平衡骑自行车。另一方面，情景记忆涉及回忆特定经验，例如第一次成功骑自行车而不用训练轮或通过风景路线的难忘自行车骑行。对于 AI 智能体，程序记忆是模型权重、智能体代码和智能体提示的组合，共同决定智能体的功能。

在实践中，智能体修改其模型权重或重写其代码是相当不常见的。但是，智能体修改自己的提示更常见。

改进智能体指令的一种有效方法是通过["反思"](https://blog.langchain.dev/reflection-agents/)或元提示。这涉及使用其当前指令（例如，系统提示）以及最近的对话或明确的用户反馈来提示智能体。然后智能体根据此输入改进自己的指令。这种方法对于难以预先指定指令的任务特别有用，因为它允许智能体从其交互中学习和适应。

例如，我们使用外部反馈和提示重写构建了一个[推文生成器](https://www.youtube.com/watch?v=Vn8A3BxfplE)，为 Twitter 生成高质量的论文摘要。在这种情况下，特定的摘要提示很难*先验*指定，但用户批评生成的推文并提供如何改进摘要过程的反馈相当容易。

以下伪代码显示了如何使用 Spring AI Alibaba 记忆[存储](./persistence.md#记忆存储)实现这一点，使用存储保存提示，`updateInstructions` 节点获取当前提示（以及从与用户的对话中捕获的反馈，在 `state.getMessages()` 中），更新提示，并将新提示保存回存储。然后，`callModel` 从存储获取更新的提示并使用它生成响应。

```java
// 使用指令的节点
public State callModel(State state, BaseStore store) {
    String namespace = "agent_instructions";
    StoreItem instructions = store.get(namespace, "agent_a").get(0);

    // 应用程序逻辑
    String prompt = promptTemplate.format(
        Map.of("instructions", instructions.getValue().get("instructions"))
    );
    // ...
    return state;
}

// 更新指令的节点
public State updateInstructions(State state, BaseStore store) {
    String namespace = "instructions";
    List<StoreItem> currentInstructions = store.search(namespace, null, null);

    // 记忆逻辑
    String prompt = promptTemplate.format(Map.of(
        "instructions", currentInstructions.get(0).getValue().get("instructions"),
        "conversation", state.getMessages()
    ));

    ChatResponse output = chatClient.prompt().user(prompt).call();
    String newInstructions = output.getResult().getOutput().getContent();

    store.put("agent_instructions", "agent_a",
        Map.of("instructions", newInstructions));
    // ...
    return state;
}
```

![更新指令](https://langchain-ai.github.io/langgraph/concepts/img/memory/update-instructions.png)

### 写入记忆

智能体写入记忆有两种主要方法：["在热路径上"](#在热路径上)和["在后台"](#在后台)。

![热路径与后台](https://langchain-ai.github.io/langgraph/concepts/img/memory/hot_path_vs_background.png)

#### 在热路径上

在运行时创建记忆既有优势也有挑战。在积极的一面，这种方法允许实时更新，使新记忆立即可用于后续交互。它还支持透明度，因为可以在创建和存储记忆时通知用户。

但是，这种方法也带来了挑战。如果智能体需要新工具来决定提交什么到记忆，可能会增加复杂性。此外，推理保存什么到记忆的过程可能影响智能体延迟。最后，智能体必须在记忆创建和其他职责之间进行多任务处理，可能影响创建的记忆的数量和质量。

例如，ChatGPT 使用 [save_memories](https://openai.com/index/memory-and-new-controls-for-chatgpt/) 工具将记忆作为内容字符串进行更新插入，决定是否以及如何在每个用户消息中使用此工具。请参阅我们的 [memory-agent](https://github.com/langchain-ai/memory-agent) 模板作为参考实现。

```java
@Component
public class HotPathMemoryService {

    @Autowired
    private BaseStore store;

    @Autowired
    private ChatClient chatClient;

    public void saveMemoryInHotPath(String userId, String conversation, String newInfo) {
        // 在智能体响应过程中保存记忆
        String namespace = "user_memories:" + userId;

        // 获取现有记忆
        List<StoreItem> existingMemories = store.search(namespace, null, null);

        // 使用 LLM 决定是否保存新记忆
        String prompt = String.format("""
            基于以下对话，决定是否需要保存新的记忆：

            对话：%s
            新信息：%s
            现有记忆：%s

            如果需要保存，请提供记忆内容。如果不需要，返回 "NO_MEMORY"。
            """, conversation, newInfo, formatMemories(existingMemories));

        String response = chatClient.prompt()
            .user(prompt)
            .call()
            .content();

        if (!"NO_MEMORY".equals(response.trim())) {
            // 保存新记忆
            String memoryId = UUID.randomUUID().toString();
            Map<String, Object> memoryData = Map.of(
                "content", response.trim(),
                "timestamp", Instant.now().toString(),
                "source", "conversation"
            );

            store.put(namespace, memoryId, memoryData);
        }
    }

    private String formatMemories(List<StoreItem> memories) {
        return memories.stream()
            .map(item -> item.getValue().get("content").toString())
            .collect(Collectors.joining("\n"));
    }
}
```

#### 在后台

将记忆创建作为单独的后台任务提供了几个优势。它消除了主应用程序中的延迟，将应用程序逻辑与记忆管理分离，并允许智能体更专注地完成任务。这种方法还提供了在记忆创建时间上的灵活性，以避免冗余工作。

但是，这种方法有其自己的挑战。确定记忆写入的频率变得至关重要，因为不频繁的更新可能使其他线程没有新上下文。决定何时触发记忆形成也很重要。常见策略包括在设定时间段后调度（如果发生新事件则重新调度）、使用 cron 调度或允许用户或应用程序逻辑手动触发。

请参阅我们的 [memory-service](https://github.com/langchain-ai/memory-template) 模板作为参考实现。

```java
@Component
public class BackgroundMemoryService {

    @Autowired
    private BaseStore store;

    @Autowired
    private ChatClient chatClient;

    @Scheduled(fixedRate = 300000) // 每5分钟运行一次
    public void processMemoriesInBackground() {
        // 获取所有活跃用户的最近对话
        List<String> activeUsers = getActiveUsers();

        for (String userId : activeUsers) {
            processUserMemories(userId);
        }
    }

    private void processUserMemories(String userId) {
        // 获取用户最近的对话
        List<Message> recentMessages = getRecentMessages(userId);

        if (recentMessages.size() < 3) {
            return; // 对话太少，不需要处理
        }

        // 使用 LLM 提取记忆
        String conversation = formatMessages(recentMessages);
        String prompt = String.format("""
            从以下对话中提取重要的用户信息和偏好：

            对话：%s

            请提取：
            1. 用户偏好
            2. 重要事实
            3. 上下文信息

            以 JSON 格式返回，如果没有重要信息则返回空对象。
            """, conversation);

        String response = chatClient.prompt()
            .user(prompt)
            .call()
            .content();

        try {
            Map<String, Object> memories = parseMemoriesFromResponse(response);
            if (!memories.isEmpty()) {
                saveExtractedMemories(userId, memories);
            }
        } catch (Exception e) {
            log.warn("解析记忆失败: {}", e.getMessage());
        }
    }

    private void saveExtractedMemories(String userId, Map<String, Object> memories) {
        String namespace = "user_memories:" + userId;
        String memoryId = "background_" + Instant.now().toEpochMilli();

        Map<String, Object> memoryData = Map.of(
            "memories", memories,
            "timestamp", Instant.now().toString(),
            "source", "background_processing"
        );

        store.put(namespace, memoryId, memoryData);
    }
}
```

### 记忆存储

Spring AI Alibaba 将长期记忆作为 JSON 文档存储在[存储](./persistence.md#记忆存储)中。每个记忆在自定义 `namespace`（类似于文件夹）和不同的 `key`（如文件名）下组织。命名空间通常包括用户或组织 ID 或其他标签，使信息更容易组织。这种结构支持记忆的分层组织。然后通过内容过滤器支持跨命名空间搜索。

```java
@Service
public class MemoryStorageService {

    @Autowired
    private BaseStore store;

    @Autowired
    private EmbeddingModel embeddingModel;

    public void putMemory(String userId, String applicationContext, String memoryKey, Map<String, Object> memoryData) {
        String namespace = userId + ":" + applicationContext;
        store.put(namespace, memoryKey, memoryData);
    }

    public StoreItem getMemory(String userId, String applicationContext, String memoryKey) {
        String namespace = userId + ":" + applicationContext;
        List<StoreItem> items = store.get(namespace, memoryKey);
        return items.isEmpty() ? null : items.get(0);
    }

    public List<StoreItem> searchMemories(String userId, String applicationContext, String query, Map<String, Object> filter) {
        String namespace = userId + ":" + applicationContext;
        return store.search(namespace, filter, query);
    }

    public void deleteMemory(String userId, String applicationContext, String memoryKey) {
        String namespace = userId + ":" + applicationContext;
        store.delete(namespace, memoryKey);
    }
}
```

### 使用示例

```java
@Service
public class UserMemoryExample {

    @Autowired
    private MemoryStorageService memoryStorage;

    public void demonstrateMemoryUsage() {
        String userId = "user123";
        String context = "chitchat";

        // 存储用户偏好
        Map<String, Object> preferences = Map.of(
            "rules", List.of(
                "用户喜欢简短、直接的语言",
                "用户只说中文和 Java"
            ),
            "communication_style", "direct",
            "technical_level", "advanced"
        );

        memoryStorage.putMemory(userId, context, "preferences", preferences);

        // 获取记忆
        StoreItem memory = memoryStorage.getMemory(userId, context, "preferences");
        if (memory != null) {
            Map<String, Object> data = memory.getValue();
            System.out.println("用户偏好: " + data);
        }

        // 搜索记忆
        Map<String, Object> filter = Map.of("communication_style", "direct");
        List<StoreItem> searchResults = memoryStorage.searchMemories(
            userId, context, "语言偏好", filter
        );

        for (StoreItem item : searchResults) {
            System.out.println("找到记忆: " + item.getValue());
        }
    }
}
```

## 管理检查点

您可以查看和删除检查点保存器存储的信息。

### 查看线程状态（检查点）

```java
@Service
public class CheckpointManagementService {

    @Autowired
    private StateGraph graph;

    public StateSnapshot getThreadState(String threadId, String checkpointId) {
        Map<String, Object> config = Map.of(
            "configurable", Map.of(
                "thread_id", threadId
                // 可选择提供特定检查点的 ID，否则显示最新检查点
                // "checkpoint_id", checkpointId
            )
        );

        return graph.getState(config);
    }

    public List<StateSnapshot> getThreadHistory(String threadId) {
        Map<String, Object> config = Map.of(
            "configurable", Map.of("thread_id", threadId)
        );

        return graph.getStateHistory(config);
    }

    public void deleteThread(String threadId) {
        checkpointSaver.deleteThread(threadId);
    }
}
```

### 实际应用示例

```java
@Component
public class ChatBotWithMemory {

    @Autowired
    private StateGraph<ChatState> graph;

    @Autowired
    private MemoryStorageService memoryStorage;

    public ChatState processMessage(String threadId, String userMessage) {
        // 创建配置
        Map<String, Object> config = Map.of(
            "configurable", Map.of("thread_id", threadId)
        );

        // 获取用户记忆
        StoreItem userMemory = memoryStorage.getMemory(threadId, "profile", "user_info");

        // 创建初始状态
        ChatState initialState = new ChatState();
        initialState.setMessages(List.of(new HumanMessage(userMessage)));

        if (userMemory != null) {
            // 将用户记忆添加到上下文
            Map<String, Object> memoryData = userMemory.getValue();
            initialState.setUserContext(memoryData);
        }

        // 调用图
        ChatState result = graph.invoke(initialState, config);

        // 在后台更新记忆
        updateUserMemoryAsync(threadId, userMessage, result);

        return result;
    }

    @Async
    private void updateUserMemoryAsync(String threadId, String userMessage, ChatState result) {
        // 分析对话并更新用户记忆
        String conversation = formatConversation(result.getMessages());

        // 使用 LLM 提取新的用户信息
        String prompt = String.format("""
            从以下对话中提取用户的新信息或偏好：

            对话：%s

            请提取任何新的用户偏好、兴趣或重要信息。
            如果没有新信息，返回空对象 {}。
            """, conversation);

        try {
            String response = chatClient.prompt().user(prompt).call().content();
            Map<String, Object> newInfo = parseUserInfo(response);

            if (!newInfo.isEmpty()) {
                // 获取现有记忆并合并
                StoreItem existingMemory = memoryStorage.getMemory(threadId, "profile", "user_info");
                Map<String, Object> updatedMemory = mergeMemories(existingMemory, newInfo);

                // 保存更新的记忆
                memoryStorage.putMemory(threadId, "profile", "user_info", updatedMemory);
            }
        } catch (Exception e) {
            log.warn("更新用户记忆失败: {}", e.getMessage());
        }
    }

    private Map<String, Object> mergeMemories(StoreItem existing, Map<String, Object> newInfo) {
        Map<String, Object> merged = new HashMap<>();

        if (existing != null) {
            merged.putAll(existing.getValue());
        }

        // 智能合并新信息
        for (Map.Entry<String, Object> entry : newInfo.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (merged.containsKey(key)) {
                // 如果是列表，合并列表
                if (value instanceof List && merged.get(key) instanceof List) {
                    List<Object> existingList = (List<Object>) merged.get(key);
                    List<Object> newList = (List<Object>) value;
                    Set<Object> combinedSet = new HashSet<>(existingList);
                    combinedSet.addAll(newList);
                    merged.put(key, new ArrayList<>(combinedSet));
                } else {
                    // 否则覆盖
                    merged.put(key, value);
                }
            } else {
                merged.put(key, value);
            }
        }

        merged.put("last_updated", Instant.now().toString());
        return merged;
    }
}
```

## 配置选项

```properties
# 记忆管理配置
spring.ai.alibaba.memory.enabled=true
spring.ai.alibaba.memory.short-term.max-messages=20
spring.ai.alibaba.memory.short-term.cleanup-interval=1h

# 长期记忆配置
spring.ai.alibaba.memory.long-term.store-type=database
spring.ai.alibaba.memory.long-term.embedding-model=text-embedding-v1
spring.ai.alibaba.memory.long-term.similarity-threshold=0.7

# 记忆存储配置
spring.ai.alibaba.memory.store.namespace-separator=:
spring.ai.alibaba.memory.store.max-items-per-namespace=1000
spring.ai.alibaba.memory.store.ttl=30d

# 后台处理配置
spring.ai.alibaba.memory.background.enabled=true
spring.ai.alibaba.memory.background.interval=5m
spring.ai.alibaba.memory.background.batch-size=10
```

## 最佳实践

### 1. 记忆设计
- **明确记忆类型**：根据用途选择短期记忆、语义记忆、情景记忆或程序记忆
- **合理设计命名空间**：使用用户 ID、应用上下文等组织记忆
- **控制记忆大小**：避免存储过大的记忆对象，影响检索性能

### 2. 性能优化
- **使用向量搜索**：为语义记忆启用向量搜索以提高检索准确性
- **实施记忆过期**：设置合理的 TTL 避免记忆无限增长
- **批量处理**：在后台批量处理记忆更新以减少延迟

### 3. 隐私和安全
- **敏感信息处理**：避免存储敏感个人信息，或进行适当脱敏
- **访问控制**：确保记忆只能被授权的智能体访问
- **数据保留策略**：制定明确的记忆保留和删除策略

### 4. 开发建议
- **渐进式实现**：从简单的短期记忆开始，逐步添加长期记忆功能
- **监控和调试**：实施记忆使用情况的监控和日志记录
- **测试策略**：为记忆功能编写全面的测试用例

## 预构建记忆工具

Spring AI Alibaba 提供了一些预构建的记忆管理工具和模板：

- **记忆代理模板**：实现热路径记忆管理的参考实现
- **记忆服务模板**：实现后台记忆处理的参考实现
- **向量记忆存储**：基于向量数据库的高性能记忆存储实现

## 下一步

- [了解上下文管理](./context.md)
- [学习人机协作](./human-in-the-loop.md)
- [探索持久化机制](./persistence.md)
