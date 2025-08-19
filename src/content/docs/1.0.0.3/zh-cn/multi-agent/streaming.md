---
title: 流式处理 (Streaming)
description: Spring AI Alibaba 多智能体流式处理
---

# 流式处理 (Streaming)

流式处理允许多智能体系统实时处理数据流，提供更好的用户体验和系统响应性。Spring AI Alibaba 提供了完整的流式处理支持。

## 流式处理概述

### 核心概念
- **流式输出**: 实时输出生成的内容
- **流式状态**: 实时更新执行状态
- **流式事件**: 实时推送执行事件
- **背压控制**: 处理流量控制

### 应用场景
- 实时聊天对话
- 长文本生成
- 复杂任务进度展示
- 多智能体协作可视化

## 基本流式处理

### 配置流式支持

```java
@Configuration
public class StreamingConfig {
    
    @Bean
    public ChatClient streamingChatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel)
            .defaultOptions(ChatOptionsBuilder.builder()
                .withStreamUsage(true)
                .build())
            .build();
    }
}
```

### 简单流式聊天

```java
@RestController
public class StreamingChatController {
    
    @Autowired
    private ChatClient chatClient;
    
    @GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestParam String message) {
        return chatClient.prompt()
            .user(message)
            .stream()
            .content()
            .map(content -> "data: " + content + "\n\n");
    }
    
    @GetMapping(value = "/chat/stream/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChatSSE(@RequestParam String message) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        
        chatClient.prompt()
            .user(message)
            .stream()
            .content()
            .subscribe(
                content -> {
                    try {
                        emitter.send(SseEmitter.event()
                            .name("message")
                            .data(content));
                    } catch (IOException e) {
                        emitter.completeWithError(e);
                    }
                },
                error -> emitter.completeWithError(error),
                () -> emitter.complete()
            );
        
        return emitter;
    }
}
```

## Graph 流式执行

### 流式 StateGraph

```java
@Component
public class StreamingGraph {
    
    public StateGraph createStreamingGraph() {
        return StateGraph.builder(OverallState.class)
            .addNode("analyzer", this::analyzeWithStreaming)
            .addNode("generator", this::generateWithStreaming)
            .addNode("reviewer", this::reviewWithStreaming)
            .addEdge("analyzer", "generator")
            .addEdge("generator", "reviewer")
            .setEntryPoint("analyzer")
            .setFinishPoint("reviewer")
            .build();
    }
    
    private OverallState analyzeWithStreaming(OverallState state) {
        // 发送流式状态更新
        streamingService.emitStatus("正在分析输入...");
        
        String analysis = chatClient.prompt()
            .user("分析以下内容：" + state.getInput())
            .stream()
            .content()
            .doOnNext(chunk -> streamingService.emitProgress("分析", chunk))
            .collect(Collectors.joining())
            .block();
        
        return state.withAnalysis(analysis);
    }
}
```

### 流式状态管理

```java
@Service
public class StreamingStateService {
    
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    
    public SseEmitter createStream(String sessionId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.put(sessionId, emitter);
        
        emitter.onCompletion(() -> emitters.remove(sessionId));
        emitter.onTimeout(() -> emitters.remove(sessionId));
        emitter.onError(e -> emitters.remove(sessionId));
        
        return emitter;
    }
    
    public void emitStatus(String sessionId, String status) {
        SseEmitter emitter = emitters.get(sessionId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                    .name("status")
                    .data(Map.of(
                        "type", "status",
                        "message", status,
                        "timestamp", Instant.now()
                    )));
            } catch (IOException e) {
                emitters.remove(sessionId);
            }
        }
    }
    
    public void emitProgress(String sessionId, String node, String content) {
        SseEmitter emitter = emitters.get(sessionId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                    .name("progress")
                    .data(Map.of(
                        "type", "progress",
                        "node", node,
                        "content", content,
                        "timestamp", Instant.now()
                    )));
            } catch (IOException e) {
                emitters.remove(sessionId);
            }
        }
    }
}
```

## WebSocket 流式处理

### WebSocket 配置

```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new StreamingWebSocketHandler(), "/ws/stream")
                .setAllowedOrigins("*");
    }
}

@Component
public class StreamingWebSocketHandler extends TextWebSocketHandler {
    
    @Autowired
    private ChatClient chatClient;
    
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(), session);
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        ChatRequest request = objectMapper.readValue(payload, ChatRequest.class);
        
        chatClient.prompt()
            .user(request.getMessage())
            .stream()
            .content()
            .subscribe(
                content -> sendMessage(session, "content", content),
                error -> sendMessage(session, "error", error.getMessage()),
                () -> sendMessage(session, "complete", "")
            );
    }
    
    private void sendMessage(WebSocketSession session, String type, String data) {
        try {
            Map<String, Object> response = Map.of(
                "type", type,
                "data", data,
                "timestamp", Instant.now()
            );
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
        } catch (Exception e) {
            log.error("Failed to send WebSocket message", e);
        }
    }
}
```

## 响应式流处理

### Reactor 集成

```java
@Service
public class ReactiveStreamingService {
    
    @Autowired
    private ChatClient chatClient;
    
    public Flux<StreamingResponse> processStreamingWorkflow(String input) {
        return Flux.just(input)
            .flatMap(this::analyzeStep)
            .flatMap(this::generateStep)
            .flatMap(this::reviewStep);
    }
    
    private Flux<StreamingResponse> analyzeStep(String input) {
        return chatClient.prompt()
            .user("分析：" + input)
            .stream()
            .content()
            .map(content -> StreamingResponse.builder()
                .step("analyze")
                .content(content)
                .timestamp(Instant.now())
                .build());
    }
    
    private Flux<StreamingResponse> generateStep(StreamingResponse previous) {
        return chatClient.prompt()
            .user("基于分析结果生成内容：" + previous.getContent())
            .stream()
            .content()
            .map(content -> StreamingResponse.builder()
                .step("generate")
                .content(content)
                .timestamp(Instant.now())
                .build());
    }
}
```

### 背压控制

```java
@Component
public class BackpressureController {
    
    public Flux<String> controlledStream(String input) {
        return chatClient.prompt()
            .user(input)
            .stream()
            .content()
            .onBackpressureBuffer(1000) // 缓冲区大小
            .onBackpressureDrop(dropped -> log.warn("Dropped content: {}", dropped))
            .limitRate(10); // 限制速率
    }
    
    public Flux<String> adaptiveStream(String input) {
        return chatClient.prompt()
            .user(input)
            .stream()
            .content()
            .sample(Duration.ofMillis(100)) // 采样间隔
            .distinctUntilChanged(); // 去重
    }
}
```

## 多智能体流式协作

### 协作流式处理

```java
@Component
public class CollaborativeStreaming {
    
    public Flux<CollaborationEvent> streamCollaboration(String task) {
        return Flux.create(sink -> {
            StateGraph graph = createCollaborativeGraph(sink);
            
            CompletableFuture.runAsync(() -> {
                try {
                    graph.invoke(new OverallState().withTask(task));
                    sink.complete();
                } catch (Exception e) {
                    sink.error(e);
                }
            });
        });
    }
    
    private StateGraph createCollaborativeGraph(FluxSink<CollaborationEvent> sink) {
        return StateGraph.builder(OverallState.class)
            .addNode("planner", state -> planWithStreaming(state, sink))
            .addNode("executor", state -> executeWithStreaming(state, sink))
            .addNode("reviewer", state -> reviewWithStreaming(state, sink))
            .addEdge("planner", "executor")
            .addEdge("executor", "reviewer")
            .setEntryPoint("planner")
            .setFinishPoint("reviewer")
            .build();
    }
    
    private OverallState planWithStreaming(OverallState state, FluxSink<CollaborationEvent> sink) {
        sink.next(CollaborationEvent.agentStarted("planner"));
        
        String plan = chatClient.prompt()
            .user("制定计划：" + state.getTask())
            .stream()
            .content()
            .doOnNext(chunk -> sink.next(CollaborationEvent.contentGenerated("planner", chunk)))
            .collect(Collectors.joining())
            .block();
        
        sink.next(CollaborationEvent.agentCompleted("planner"));
        return state.withPlan(plan);
    }
}
```

### 实时协作监控

```java
@Component
public class CollaborationMonitor {
    
    private final Map<String, CollaborationSession> sessions = new ConcurrentHashMap<>();
    
    public void startMonitoring(String sessionId) {
        CollaborationSession session = new CollaborationSession(sessionId);
        sessions.put(sessionId, session);
        
        // 监控智能体状态
        Flux.interval(Duration.ofSeconds(1))
            .takeWhile(tick -> sessions.containsKey(sessionId))
            .subscribe(tick -> {
                CollaborationStatus status = getCurrentStatus(sessionId);
                broadcastStatus(sessionId, status);
            });
    }
    
    private void broadcastStatus(String sessionId, CollaborationStatus status) {
        // 广播状态到所有订阅者
        messagingTemplate.convertAndSend("/topic/collaboration/" + sessionId, status);
    }
    
    @EventListener
    public void onAgentEvent(AgentEvent event) {
        String sessionId = event.getSessionId();
        CollaborationSession session = sessions.get(sessionId);
        
        if (session != null) {
            session.updateAgentStatus(event.getAgentId(), event.getStatus());
            
            CollaborationUpdate update = CollaborationUpdate.builder()
                .agentId(event.getAgentId())
                .status(event.getStatus())
                .timestamp(Instant.now())
                .build();
            
            messagingTemplate.convertAndSend("/topic/collaboration/" + sessionId + "/updates", update);
        }
    }
}
```

## 流式数据持久化

### 流式状态保存

```java
@Component
public class StreamingPersistence {
    
    @Autowired
    private StreamingStateRepository repository;
    
    public void persistStreamingState(String sessionId, String nodeId, String content) {
        StreamingState state = StreamingState.builder()
            .sessionId(sessionId)
            .nodeId(nodeId)
            .content(content)
            .timestamp(Instant.now())
            .build();
        
        repository.save(state);
    }
    
    public Flux<StreamingState> replaySession(String sessionId) {
        return repository.findBySessionIdOrderByTimestamp(sessionId)
            .delayElements(Duration.ofMillis(100)); // 模拟实时播放
    }
}
```

## 性能优化

### 流式缓存

```java
@Component
public class StreamingCache {
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    public Flux<String> cachedStream(String key, Supplier<Flux<String>> streamSupplier) {
        return Flux.defer(() -> {
            List<String> cached = redisTemplate.opsForList().range(key, 0, -1);
            
            if (!cached.isEmpty()) {
                return Flux.fromIterable(cached)
                    .delayElements(Duration.ofMillis(50));
            } else {
                return streamSupplier.get()
                    .doOnNext(content -> redisTemplate.opsForList().rightPush(key, content))
                    .doOnComplete(() -> redisTemplate.expire(key, Duration.ofHours(1)));
            }
        });
    }
}
```

### 流式压缩

```java
@Component
public class StreamingCompression {
    
    public Flux<String> compressedStream(Flux<String> source) {
        return source
            .buffer(Duration.ofMillis(100)) // 批量处理
            .filter(batch -> !batch.isEmpty())
            .map(batch -> String.join("", batch))
            .filter(content -> !content.trim().isEmpty());
    }
}
```

## 配置选项

```properties
# 流式处理配置
spring.ai.streaming.enabled=true
spring.ai.streaming.buffer-size=1024
spring.ai.streaming.timeout=30s

# WebSocket 配置
spring.ai.streaming.websocket.enabled=true
spring.ai.streaming.websocket.max-sessions=1000

# SSE 配置
spring.ai.streaming.sse.enabled=true
spring.ai.streaming.sse.heartbeat-interval=30s

# 背压控制
spring.ai.streaming.backpressure.strategy=buffer
spring.ai.streaming.backpressure.buffer-size=10000
```

## 最佳实践

### 1. 性能优化
- 合理设置缓冲区大小
- 实施背压控制
- 使用流式压缩

### 2. 错误处理
- 实现优雅的错误恢复
- 提供错误重试机制
- 记录详细的错误日志

### 3. 资源管理
- 及时清理连接
- 监控内存使用
- 设置合理的超时时间

### 4. 用户体验
- 提供实时进度反馈
- 实现平滑的内容展示
- 支持暂停和恢复

## 下一步

- [了解持久化](/docs/1.0.0.3/multi-agent/persistence/)
- [学习持久执行](/docs/1.0.0.3/multi-agent/durable-execution/)
- [探索记忆管理](/docs/1.0.0.3/multi-agent/memory/)
