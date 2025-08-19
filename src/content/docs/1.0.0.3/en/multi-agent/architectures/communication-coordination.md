---
title: Communication & Coordination
keywords: ["Spring AI Alibaba", "Multi-Agent", "Communication", "Coordination", "Message Passing"]
description: "Learn about communication patterns and coordination mechanisms in Spring AI Alibaba multi-agent systems, including direct communication, message queues, and shared state."
---

## Communication Patterns

Effective communication between agents is crucial for the success of multi-agent systems. Spring AI Alibaba supports multiple communication patterns to meet different application requirements.

## 1. Direct Communication

Agents exchange information directly, suitable for simple point-to-point communication scenarios.

### Characteristics
- **Low Latency**: Direct calls with fast response
- **Simple Implementation**: No middleware required
- **Tight Coupling**: Direct dependencies between agents

### Implementation Example

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

// Interface for agents that can receive messages
public interface MessageReceiver {
    void receiveMessage(String fromAgent, Message message);
    Message getNextMessage();
    boolean hasMessages();
}

// Agent implementation that supports message receiving
@Component
public class CommunicatingAgent implements Agent, MessageReceiver {
    
    private final Queue<ReceivedMessage> messageQueue = new ConcurrentLinkedQueue<>();
    
    @Override
    public void receiveMessage(String fromAgent, Message message) {
        ReceivedMessage receivedMessage = new ReceivedMessage(fromAgent, message, Instant.now());
        messageQueue.offer(receivedMessage);
        
        // Trigger message processing
        processIncomingMessage(receivedMessage);
    }
    
    @Override
    public Message getNextMessage() {
        ReceivedMessage received = messageQueue.poll();
        return received != null ? received.getMessage() : null;
    }
    
    private void processIncomingMessage(ReceivedMessage message) {
        // Process based on message type
        switch (message.getMessage().getType()) {
            case REQUEST -> handleRequest(message);
            case RESPONSE -> handleResponse(message);
            case NOTIFICATION -> handleNotification(message);
        }
    }
}
```

### Use Cases
- Simple request-response patterns
- Real-time collaboration scenarios
- Small-scale agent systems

## 2. Message Queue Communication

Asynchronous communication through message queues, providing better decoupling and reliability.

### Characteristics
- **Asynchronous Processing**: Senders don't need to wait for responses
- **Decoupled Design**: No direct dependencies between agents
- **Reliable Delivery**: Support for message persistence and retry

### Implementation Example

```java
@Component
public class MessageQueueCommunication {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    @Autowired
    private AgentRegistry agentRegistry;
    
    // Publish message
    public void publishMessage(String exchange, String routingKey, AgentMessage message) {
        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, message);
            log.info("Message sent: {} -> {}", message.getFromAgent(), message.getToAgent());
        } catch (Exception e) {
            log.error("Failed to send message", e);
            handleMessageSendFailure(message, e);
        }
    }
    
    // Broadcast message
    public void broadcastMessage(String exchange, AgentMessage message) {
        rabbitTemplate.convertAndSend(exchange, "", message);
        log.info("Broadcast message sent: {}", message.getFromAgent());
    }
    
    // Handle received messages
    @RabbitListener(queues = "agent.messages")
    public void handleMessage(AgentMessage message) {
        try {
            String targetAgentId = message.getToAgent();
            Agent targetAgent = agentRegistry.getAgent(targetAgentId);
            
            if (targetAgent != null) {
                targetAgent.processMessage(message);
            } else {
                log.warn("Target agent not found: {}", targetAgentId);
                handleUndeliverableMessage(message);
            }
        } catch (Exception e) {
            log.error("Message processing failed", e);
            handleMessageProcessingFailure(message, e);
        }
    }
    
    // Handle specific types of messages
    @RabbitListener(queues = "agent.notifications")
    public void handleNotification(NotificationMessage notification) {
        List<Agent> subscribers = agentRegistry.findByCapability(notification.getCapability());
        
        subscribers.forEach(agent -> {
            try {
                agent.handleNotification(notification);
            } catch (Exception e) {
                log.error("Notification processing failed: agent={}", agent.getId(), e);
            }
        });
    }
    
    private void handleMessageSendFailure(AgentMessage message, Exception e) {
        // Implement retry logic or dead letter queue
        retryService.scheduleRetry(message, e);
    }
    
    private void handleUndeliverableMessage(AgentMessage message) {
        // Handle undeliverable messages
        deadLetterService.store(message);
    }
}

// Message definitions
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

### Use Cases
- Large-scale distributed systems
- Scenarios requiring message persistence
- High availability systems

## 3. Shared State Communication

Information exchange through shared state, suitable for scenarios requiring global state synchronization.

### Characteristics
- **State Sharing**: All agents access the same state
- **Consistency Guarantee**: Support for transactions and locking mechanisms
- **Data Persistence**: State can be persistently stored

### Implementation Example

```java
@Component
public class SharedStateCommunication {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private RedissonClient redissonClient;
    
    // Update shared state
    public void updateSharedState(String key, Object value) {
        try {
            redisTemplate.opsForValue().set("shared:" + key, value);
            publishStateChangeEvent(key, value);
        } catch (Exception e) {
            log.error("Failed to update shared state: key={}", key, e);
            throw new StateUpdateException("Failed to update shared state", e);
        }
    }
    
    // Get shared state
    public <T> T getSharedState(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForValue().get("shared:" + key);
            return value != null ? type.cast(value) : null;
        } catch (Exception e) {
            log.error("Failed to get shared state: key={}", key, e);
            return null;
        }
    }
    
    // Atomic update
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
    
    // Listen for state changes
    @EventListener
    public void handleStateChange(StateChangeEvent event) {
        // Notify relevant agents of state changes
        List<Agent> interestedAgents = agentRegistry.findByStateInterest(event.getKey());
        
        interestedAgents.forEach(agent -> {
            try {
                agent.onStateChanged(event.getKey(), event.getOldValue(), event.getNewValue());
            } catch (Exception e) {
                log.error("State change notification failed: agent={}", agent.getId(), e);
            }
        });
    }
    
    private void publishStateChangeEvent(String key, Object value) {
        StateChangeEvent event = new StateChangeEvent(key, value);
        applicationEventPublisher.publishEvent(event);
    }
}

// State change event
public class StateChangeEvent {
    private final String key;
    private final Object oldValue;
    private final Object newValue;
    private final Instant timestamp;
    
    // constructors, getters
}
```

### Use Cases
- Systems requiring global state
- Collaborative decision scenarios
- Applications with high data consistency requirements

## Coordination Mechanisms

Coordination mechanisms ensure that multiple agents can work together in an orderly and efficient manner to complete complex tasks.

## 1. Central Coordinator

A central coordinator manages agent execution uniformly, suitable for scenarios requiring centralized control.

### Implementation Example

```java
@Component
public class CentralCoordinator {
    
    @Autowired
    private List<Agent> agents;
    
    @Autowired
    private TaskScheduler taskScheduler;
    
    public ExecutionResult coordinate(Task task) {
        try {
            // Create execution plan
            ExecutionPlan plan = createExecutionPlan(task);
            
            // Execute according to plan
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
            log.error("Coordination execution failed", e);
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
        
        // Set execution timeout
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
        // Implement failure handling strategy
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

### Use Cases
- Complex workflow management
- Processes requiring strict control
- Resource scheduling systems

## 2. Distributed Coordination

Agents coordinate autonomously without central control, suitable for decentralized scenarios.

### Implementation Example

```java
@Component
public class DistributedCoordination {
    
    public void initiateConsensus(String proposalId, Proposal proposal) {
        List<Agent> participants = getParticipants(proposal);
        
        try {
            // Phase 1: Prepare phase
            Map<String, Boolean> prepareResponses = executePhase1(proposalId, proposal, participants);
            
            // Phase 2: Commit phase
            boolean consensus = executePhase2(proposalId, prepareResponses, participants);
            
            if (consensus) {
                log.info("Consensus reached: proposalId={}", proposalId);
                notifyConsensusReached(proposalId, proposal);
            } else {
                log.info("Consensus failed: proposalId={}", proposalId);
                notifyConsensusFailed(proposalId, proposal);
            }
            
        } catch (Exception e) {
            log.error("Consensus process exception: proposalId={}", proposalId, e);
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
            // Wait for all participants to respond, maximum 30 seconds
            if (!latch.await(30, TimeUnit.SECONDS)) {
                log.warn("Prepare phase timeout: proposalId={}", proposalId);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Prepare phase interrupted: proposalId={}", proposalId);
        }
        
        return responses;
    }
    
    private boolean executePhase2(String proposalId, Map<String, Boolean> prepareResponses, List<Agent> participants) {
        // Check if all participants are prepared
        boolean allPrepared = prepareResponses.values().stream()
            .allMatch(Boolean::booleanValue);
        
        if (allPrepared) {
            // Commit phase
            participants.forEach(agent -> {
                try {
                    agent.commit(proposalId);
                } catch (Exception e) {
                    log.error("Commit failed: agent={}, proposalId={}", agent.getId(), proposalId, e);
                }
            });
            return true;
        } else {
            // Abort phase
            participants.forEach(agent -> {
                try {
                    agent.abort(proposalId);
                } catch (Exception e) {
                    log.error("Abort failed: agent={}, proposalId={}", agent.getId(), proposalId, e);
                }
            });
            return false;
        }
    }
}
```

### Use Cases
- Blockchain and distributed ledgers
- P2P network applications
- Self-organizing systems

## Best Practices

### 1. Communication Pattern Selection
- **Low latency requirements**: Choose direct communication
- **High reliability requirements**: Choose message queues
- **State synchronization requirements**: Choose shared state

### 2. Coordination Mechanism Design
- **Clear responsibility boundaries**: Avoid coordination conflicts
- **Implement timeout mechanisms**: Prevent infinite waiting
- **Design degradation strategies**: Handle coordination failures

### 3. Performance Optimization
- **Batch process messages**: Reduce communication overhead
- **Use connection pools**: Reuse network connections
- **Implement caching mechanisms**: Reduce redundant computations

## Next Steps

After understanding communication and coordination mechanisms, you can continue learning:

- [Fault Tolerance & Performance](./fault-tolerance-performance) - Fault tolerance design and performance optimization
