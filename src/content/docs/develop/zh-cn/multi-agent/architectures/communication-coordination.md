---
title: 通信与协调
keywords: ["Spring AI Alibaba", "多智能体", "通信", "协调", "消息传递"]
description: "学习 Spring AI Alibaba 多智能体系统中的通信模式和协调机制，包括直接通信、消息队列和共享状态等。"
---

## 通信模式

智能体之间的有效通信是多智能体系统成功的关键。Spring AI Alibaba 支持多种通信模式来满足不同的应用需求。

## 1. 直接通信

智能体之间直接交换信息，适用于简单的点对点通信场景。

### 特点
- **低延迟**：直接调用，响应快速
- **简单实现**：无需中间件
- **强耦合**：智能体间直接依赖

### 实现示例

```java
@Component
public class DirectCommunication {
    
    @Autowired
    private AgentRegistry agentRegistry;
    
    public void sendMessage(String fromAgent, String toAgent, Message message) {
        Agent targetAgent = agentRegistry.getAgent(toAgent);
        if (targetAgent instanceof MessageReceiver) {
            ((MessageReceiver) targetAgent).receiveMessage(fromAgent, message);
        }
    }
    
    public Message receiveMessage(String agentId) {
        Agent agent = agentRegistry.getAgent(agentId);
        if (agent instanceof MessageReceiver) {
            return ((MessageReceiver) agent).getNextMessage();
        }
        return null;
    }
}

// 支持消息接收的智能体接口
public interface MessageReceiver {
    void receiveMessage(String fromAgent, Message message);
    Message getNextMessage();
    boolean hasMessages();
}

// 实现消息接收的智能体
@Component
public class CommunicatingAgent implements Agent, MessageReceiver {
    
    private final Queue<ReceivedMessage> messageQueue = new ConcurrentLinkedQueue<>();
    
    @Override
    public void receiveMessage(String fromAgent, Message message) {
        ReceivedMessage receivedMessage = new ReceivedMessage(fromAgent, message, Instant.now());
        messageQueue.offer(receivedMessage);
        
        // 触发消息处理
        processIncomingMessage(receivedMessage);
    }
    
    @Override
    public Message getNextMessage() {
        ReceivedMessage received = messageQueue.poll();
        return received != null ? received.getMessage() : null;
    }
    
    private void processIncomingMessage(ReceivedMessage message) {
        // 根据消息类型进行处理
        switch (message.getMessage().getType()) {
            case REQUEST -> handleRequest(message);
            case RESPONSE -> handleResponse(message);
            case NOTIFICATION -> handleNotification(message);
        }
    }
}
```

### 使用场景
- 简单的请求-响应模式
- 实时协作场景
- 小规模智能体系统

## 2. 消息队列通信

通过消息队列实现异步通信，提供更好的解耦和可靠性。

### 特点
- **异步处理**：发送方不需要等待响应
- **解耦设计**：智能体间无直接依赖
- **可靠传输**：支持消息持久化和重试

### 实现示例

```java
@Component
public class MessageQueueCommunication {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    @Autowired
    private AgentRegistry agentRegistry;
    
    // 发布消息
    public void publishMessage(String exchange, String routingKey, AgentMessage message) {
        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, message);
            log.info("消息已发送: {} -> {}", message.getFromAgent(), message.getToAgent());
        } catch (Exception e) {
            log.error("消息发送失败", e);
            handleMessageSendFailure(message, e);
        }
    }
    
    // 广播消息
    public void broadcastMessage(String exchange, AgentMessage message) {
        rabbitTemplate.convertAndSend(exchange, "", message);
        log.info("广播消息已发送: {}", message.getFromAgent());
    }
    
    // 处理接收到的消息
    @RabbitListener(queues = "agent.messages")
    public void handleMessage(AgentMessage message) {
        try {
            String targetAgentId = message.getToAgent();
            Agent targetAgent = agentRegistry.getAgent(targetAgentId);
            
            if (targetAgent != null) {
                targetAgent.processMessage(message);
            } else {
                log.warn("目标智能体不存在: {}", targetAgentId);
                handleUndeliverableMessage(message);
            }
        } catch (Exception e) {
            log.error("消息处理失败", e);
            handleMessageProcessingFailure(message, e);
        }
    }
    
    // 处理特定类型的消息
    @RabbitListener(queues = "agent.notifications")
    public void handleNotification(NotificationMessage notification) {
        List<Agent> subscribers = agentRegistry.findByCapability(notification.getCapability());
        
        subscribers.forEach(agent -> {
            try {
                agent.handleNotification(notification);
            } catch (Exception e) {
                log.error("通知处理失败: agent={}", agent.getId(), e);
            }
        });
    }
    
    private void handleMessageSendFailure(AgentMessage message, Exception e) {
        // 实现重试逻辑或死信队列
        retryService.scheduleRetry(message, e);
    }
    
    private void handleUndeliverableMessage(AgentMessage message) {
        // 处理无法投递的消息
        deadLetterService.store(message);
    }
}

// 消息定义
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = RequestMessage.class, name = "REQUEST"),
    @JsonSubTypes.Type(value = ResponseMessage.class, name = "RESPONSE"),
    @JsonSubTypes.Type(value = NotificationMessage.class, name = "NOTIFICATION")
})
public abstract class AgentMessage {
    private String messageId;
    private String fromAgent;
    private String toAgent;
    private Instant timestamp;
    private MessageType type;
    
    // getters and setters
}
```

### 使用场景
- 大规模分布式系统
- 需要消息持久化的场景
- 高可用性要求的系统

## 3. 共享状态通信

通过共享状态进行信息交换，适用于需要全局状态同步的场景。

### 特点
- **状态共享**：所有智能体访问相同的状态
- **一致性保证**：支持事务和锁机制
- **数据持久化**：状态可以持久化存储

### 实现示例

```java
@Component
public class SharedStateCommunication {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private RedissonClient redissonClient;
    
    // 更新共享状态
    public void updateSharedState(String key, Object value) {
        try {
            redisTemplate.opsForValue().set("shared:" + key, value);
            publishStateChangeEvent(key, value);
        } catch (Exception e) {
            log.error("更新共享状态失败: key={}", key, e);
            throw new StateUpdateException("Failed to update shared state", e);
        }
    }
    
    // 获取共享状态
    public <T> T getSharedState(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForValue().get("shared:" + key);
            return value != null ? type.cast(value) : null;
        } catch (Exception e) {
            log.error("获取共享状态失败: key={}", key, e);
            return null;
        }
    }
    
    // 原子性更新
    public <T> T updateSharedStateAtomically(String key, Function<T, T> updater, Class<T> type) {
        RLock lock = redissonClient.getLock("lock:shared:" + key);
        
        try {
            if (lock.tryLock(5, TimeUnit.SECONDS)) {
                T currentValue = getSharedState(key, type);
                T newValue = updater.apply(currentValue);
                updateSharedState(key, newValue);
                return newValue;
            } else {
                throw new StateUpdateException("Failed to acquire lock for key: " + key);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new StateUpdateException("Interrupted while waiting for lock", e);
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
    
    // 监听状态变化
    @EventListener
    public void handleStateChange(StateChangeEvent event) {
        // 通知相关智能体状态变化
        List<Agent> interestedAgents = agentRegistry.findByStateInterest(event.getKey());
        
        interestedAgents.forEach(agent -> {
            try {
                agent.onStateChanged(event.getKey(), event.getOldValue(), event.getNewValue());
            } catch (Exception e) {
                log.error("状态变化通知失败: agent={}", agent.getId(), e);
            }
        });
    }
    
    private void publishStateChangeEvent(String key, Object value) {
        StateChangeEvent event = new StateChangeEvent(key, value);
        applicationEventPublisher.publishEvent(event);
    }
}

// 状态变化事件
public class StateChangeEvent {
    private final String key;
    private final Object oldValue;
    private final Object newValue;
    private final Instant timestamp;
    
    // constructors, getters
}
```

### 使用场景
- 需要全局状态的系统
- 协作决策场景
- 数据一致性要求高的应用

## 协调机制

协调机制确保多个智能体能够有序、高效地协作完成复杂任务。

## 1. 中央协调器

由中央协调器统一管理智能体的执行，适用于需要集中控制的场景。

### 实现示例

```java
@Component
public class CentralCoordinator {
    
    @Autowired
    private List<Agent> agents;
    
    @Autowired
    private TaskScheduler taskScheduler;
    
    public ExecutionResult coordinate(Task task) {
        try {
            // 创建执行计划
            ExecutionPlan plan = createExecutionPlan(task);
            
            // 按计划执行
            ExecutionContext context = new ExecutionContext();
            
            for (ExecutionStep step : plan.getSteps()) {
                ExecutionResult stepResult = executeStep(step, context);
                
                if (!stepResult.isSuccess()) {
                    return handleStepFailure(step, stepResult, context);
                }
                
                updateExecutionContext(context, stepResult);
            }
            
            return ExecutionResult.success(context.getFinalResult());
            
        } catch (Exception e) {
            log.error("协调执行失败", e);
            return ExecutionResult.failure("Coordination failed: " + e.getMessage());
        }
    }
    
    private ExecutionPlan createExecutionPlan(Task task) {
        TaskAnalyzer analyzer = new TaskAnalyzer();
        TaskDecomposition decomposition = analyzer.decompose(task);
        
        return ExecutionPlanBuilder.builder()
            .withTask(task)
            .withDecomposition(decomposition)
            .withAvailableAgents(agents)
            .build();
    }
    
    private ExecutionResult executeStep(ExecutionStep step, ExecutionContext context) {
        Agent agent = findSuitableAgent(step);
        
        if (agent == null) {
            return ExecutionResult.failure("No suitable agent found for step: " + step.getId());
        }
        
        // 设置执行超时
        CompletableFuture<TaskResult> future = CompletableFuture
            .supplyAsync(() -> agent.execute(step.getTask()))
            .orTimeout(step.getTimeoutSeconds(), TimeUnit.SECONDS);
        
        try {
            TaskResult result = future.get();
            return ExecutionResult.success(result);
        } catch (TimeoutException e) {
            return ExecutionResult.failure("Step execution timeout: " + step.getId());
        } catch (Exception e) {
            return ExecutionResult.failure("Step execution failed: " + e.getMessage());
        }
    }
    
    private Agent findSuitableAgent(ExecutionStep step) {
        return agents.stream()
            .filter(agent -> agent.canHandle(step.getTask()))
            .filter(Agent::isHealthy)
            .min(Comparator.comparing(Agent::getCurrentLoad))
            .orElse(null);
    }
    
    private ExecutionResult handleStepFailure(ExecutionStep step, ExecutionResult result, ExecutionContext context) {
        // 实现失败处理策略
        FailureHandlingStrategy strategy = step.getFailureHandlingStrategy();
        
        return switch (strategy) {
            case RETRY -> retryStep(step, context);
            case SKIP -> skipStep(step, context);
            case ABORT -> ExecutionResult.failure("Execution aborted at step: " + step.getId());
            case FALLBACK -> executeFallbackStep(step, context);
        };
    }
}
```

### 使用场景
- 复杂工作流管理
- 需要严格控制的流程
- 资源调度系统

## 2. 分布式协调

智能体自主协调，无需中央控制，适用于去中心化的场景。

### 实现示例

```java
@Component
public class DistributedCoordination {
    
    public void initiateConsensus(String proposalId, Proposal proposal) {
        List<Agent> participants = getParticipants(proposal);
        
        try {
            // 第一阶段：准备阶段
            Map<String, Boolean> prepareResponses = executePhase1(proposalId, proposal, participants);
            
            // 第二阶段：提交阶段
            boolean consensus = executePhase2(proposalId, prepareResponses, participants);
            
            if (consensus) {
                log.info("共识达成: proposalId={}", proposalId);
                notifyConsensusReached(proposalId, proposal);
            } else {
                log.info("共识失败: proposalId={}", proposalId);
                notifyConsensusFailed(proposalId, proposal);
            }
            
        } catch (Exception e) {
            log.error("共识过程异常: proposalId={}", proposalId, e);
            handleConsensusException(proposalId, proposal, e);
        }
    }
    
    private Map<String, Boolean> executePhase1(String proposalId, Proposal proposal, List<Agent> participants) {
        Map<String, Boolean> responses = new ConcurrentHashMap<>();
        CountDownLatch latch = new CountDownLatch(participants.size());
        
        participants.forEach(agent -> {
            CompletableFuture.supplyAsync(() -> {
                try {
                    boolean prepared = agent.prepare(proposalId, proposal);
                    responses.put(agent.getId(), prepared);
                    return prepared;
                } finally {
                    latch.countDown();
                }
            });
        });
        
        try {
            // 等待所有参与者响应，最多等待30秒
            if (!latch.await(30, TimeUnit.SECONDS)) {
                log.warn("准备阶段超时: proposalId={}", proposalId);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("准备阶段被中断: proposalId={}", proposalId);
        }
        
        return responses;
    }
    
    private boolean executePhase2(String proposalId, Map<String, Boolean> prepareResponses, List<Agent> participants) {
        // 检查是否所有参与者都准备好了
        boolean allPrepared = prepareResponses.values().stream()
            .allMatch(Boolean::booleanValue);
        
        if (allPrepared) {
            // 提交阶段
            participants.forEach(agent -> {
                try {
                    agent.commit(proposalId);
                } catch (Exception e) {
                    log.error("提交失败: agent={}, proposalId={}", agent.getId(), proposalId, e);
                }
            });
            return true;
        } else {
            // 中止阶段
            participants.forEach(agent -> {
                try {
                    agent.abort(proposalId);
                } catch (Exception e) {
                    log.error("中止失败: agent={}, proposalId={}", agent.getId(), proposalId, e);
                }
            });
            return false;
        }
    }
}
```

### 使用场景
- 区块链和分布式账本
- P2P网络应用
- 自组织系统

## 最佳实践

### 1. 通信模式选择
- **低延迟需求**：选择直接通信
- **高可靠性需求**：选择消息队列
- **状态同步需求**：选择共享状态

### 2. 协调机制设计
- **明确职责边界**：避免协调冲突
- **实现超时机制**：防止无限等待
- **设计降级策略**：处理协调失败

### 3. 性能优化
- **批量处理消息**：减少通信开销
- **使用连接池**：复用网络连接
- **实现缓存机制**：减少重复计算

## 下一步

了解了通信与协调机制后，您可以继续学习：

- [容错与性能](./fault-tolerance-performance) - 系统的容错设计和性能优化
