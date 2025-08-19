---
title: 人机协作 (Human-in-the-loop)
description: Spring AI Alibaba 人机协作机制
---

# 人机协作 (Human-in-the-loop)

人机协作（Human-in-the-loop）是多智能体系统中的重要模式，允许人类在关键决策点介入，确保系统的可控性和可靠性。

## 核心概念

### 协作模式
- **人类监督**: 人类监控智能体执行过程
- **人类确认**: 关键决策需要人类确认
- **人类干预**: 在异常情况下人类主动干预
- **人类指导**: 人类提供指导和反馈

### 应用场景
- 高风险决策
- 复杂问题解决
- 质量控制
- 学习和训练

## 基本配置

```java
@Configuration
@EnableHumanInTheLoop
public class HumanInTheLoopConfig {
    
    @Bean
    public HumanInteractionManager humanInteractionManager() {
        return HumanInteractionManager.builder()
            .approvalService(approvalService())
            .notificationService(notificationService())
            .timeoutDuration(Duration.ofMinutes(30))
            .build();
    }
    
    @Bean
    public ApprovalService approvalService() {
        return new DatabaseApprovalService(dataSource());
    }
    
    @Bean
    public NotificationService notificationService() {
        return new EmailNotificationService(mailSender());
    }
}
```

## 人类确认节点

### 创建确认节点

```java
@Component
public class HumanApprovalWorkflow {
    
    public StateGraph createApprovalWorkflow() {
        return StateGraph.builder(ApprovalState.class)
            .addNode("data_analysis", this::analyzeData)
            .addNode("human_review", this::requestHumanReview)
            .addNode("execute_action", this::executeAction)
            .addNode("notify_completion", this::notifyCompletion)
            .addEdge("data_analysis", "human_review")
            .addConditionalEdges("human_review", this::routeAfterReview)
            .addEdge("execute_action", "notify_completion")
            .setEntryPoint("data_analysis")
            .setFinishPoint("notify_completion")
            .build();
    }
    
    @HumanApprovalRequired(
        approvers = {"manager", "senior_analyst"},
        timeout = "PT30M",
        escalation = "director"
    )
    private ApprovalState requestHumanReview(ApprovalState state) {
        // 创建审批请求
        ApprovalRequest request = ApprovalRequest.builder()
            .requestId(UUID.randomUUID().toString())
            .title("数据分析结果审批")
            .description("请审核以下数据分析结果")
            .data(state.getAnalysisResult())
            .requiredApprovers(List.of("manager", "senior_analyst"))
            .deadline(Instant.now().plus(Duration.ofMinutes(30)))
            .build();
        
        // 提交审批请求
        String approvalId = humanInteractionManager.submitApprovalRequest(request);
        
        // 等待审批结果
        ApprovalResult result = humanInteractionManager.waitForApproval(approvalId);
        
        return state.withApprovalResult(result);
    }
    
    private Map<String, String> routeAfterReview(ApprovalState state) {
        ApprovalResult result = state.getApprovalResult();
        
        if (result.isApproved()) {
            return Map.of("approved", "execute_action");
        } else {
            return Map.of("rejected", "notify_completion");
        }
    }
}
```

### 审批服务实现

```java
@Service
public class ApprovalService {
    
    @Autowired
    private ApprovalRequestRepository approvalRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    public String submitApprovalRequest(ApprovalRequest request) {
        ApprovalRequestEntity entity = ApprovalRequestEntity.builder()
            .id(request.getRequestId())
            .title(request.getTitle())
            .description(request.getDescription())
            .data(request.getData())
            .requiredApprovers(request.getRequiredApprovers())
            .status(ApprovalStatus.PENDING)
            .createdAt(Instant.now())
            .deadline(request.getDeadline())
            .build();
        
        approvalRepository.save(entity);
        
        // 发送通知给审批人
        for (String approver : request.getRequiredApprovers()) {
            notificationService.sendApprovalNotification(approver, request);
        }
        
        return request.getRequestId();
    }
    
    public ApprovalResult processApproval(String requestId, String approverId, ApprovalDecision decision) {
        ApprovalRequestEntity request = approvalRepository.findById(requestId)
            .orElseThrow(() -> new ApprovalRequestNotFoundException(requestId));
        
        if (request.getStatus() != ApprovalStatus.PENDING) {
            throw new ApprovalAlreadyProcessedException(requestId);
        }
        
        // 记录审批决策
        ApprovalDecisionEntity decisionEntity = ApprovalDecisionEntity.builder()
            .requestId(requestId)
            .approverId(approverId)
            .decision(decision.getDecision())
            .comment(decision.getComment())
            .timestamp(Instant.now())
            .build();
        
        approvalDecisionRepository.save(decisionEntity);
        
        // 检查是否所有必需的审批都已完成
        List<ApprovalDecisionEntity> decisions = approvalDecisionRepository.findByRequestId(requestId);
        ApprovalResult result = evaluateApprovalResult(request, decisions);
        
        if (result.isFinal()) {
            request.setStatus(result.isApproved() ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
            request.setCompletedAt(Instant.now());
            approvalRepository.save(request);
            
            // 通知结果
            notificationService.sendApprovalResultNotification(request, result);
        }
        
        return result;
    }
    
    private ApprovalResult evaluateApprovalResult(ApprovalRequestEntity request, List<ApprovalDecisionEntity> decisions) {
        Set<String> requiredApprovers = new HashSet<>(request.getRequiredApprovers());
        Set<String> approvedBy = new HashSet<>();
        Set<String> rejectedBy = new HashSet<>();
        
        for (ApprovalDecisionEntity decision : decisions) {
            if (requiredApprovers.contains(decision.getApproverId())) {
                if (decision.getDecision() == DecisionType.APPROVED) {
                    approvedBy.add(decision.getApproverId());
                } else {
                    rejectedBy.add(decision.getApproverId());
                }
            }
        }
        
        // 如果有任何拒绝，则整体拒绝
        if (!rejectedBy.isEmpty()) {
            return ApprovalResult.rejected(rejectedBy, "Request rejected by: " + String.join(", ", rejectedBy));
        }
        
        // 如果所有必需的审批人都已批准
        if (approvedBy.containsAll(requiredApprovers)) {
            return ApprovalResult.approved(approvedBy, "Request approved by all required approvers");
        }
        
        // 还在等待更多审批
        return ApprovalResult.pending(approvedBy, "Waiting for approval from: " + 
            requiredApprovers.stream()
                .filter(approver -> !approvedBy.contains(approver))
                .collect(Collectors.joining(", ")));
    }
}
```

## 人类干预

### 干预机制

```java
@Component
public class HumanInterventionService {
    
    @Autowired
    private ExecutionManager executionManager;
    
    @EventListener
    public void onExecutionError(ExecutionErrorEvent event) {
        if (requiresHumanIntervention(event)) {
            requestHumanIntervention(event);
        }
    }
    
    private boolean requiresHumanIntervention(ExecutionErrorEvent event) {
        return event.getErrorType() == ErrorType.CRITICAL ||
               event.getRetryCount() >= 3 ||
               event.getError().getMessage().contains("human_intervention_required");
    }
    
    private void requestHumanIntervention(ExecutionErrorEvent event) {
        InterventionRequest request = InterventionRequest.builder()
            .executionId(event.getExecutionId())
            .nodeId(event.getNodeId())
            .errorMessage(event.getError().getMessage())
            .currentState(event.getCurrentState())
            .suggestedActions(generateSuggestedActions(event))
            .priority(InterventionPriority.HIGH)
            .build();
        
        String interventionId = interventionManager.submitInterventionRequest(request);
        
        // 暂停执行等待人类干预
        executionManager.pauseExecution(event.getExecutionId(), "Waiting for human intervention: " + interventionId);
        
        // 发送通知
        notificationService.sendInterventionNotification(request);
    }
    
    private List<String> generateSuggestedActions(ExecutionErrorEvent event) {
        return List.of(
            "重试当前节点",
            "跳过当前节点",
            "修改执行状态",
            "终止执行",
            "回滚到上一个检查点"
        );
    }
}
```

### 干预处理

```java
@RestController
@RequestMapping("/api/intervention")
public class InterventionController {
    
    @Autowired
    private InterventionService interventionService;
    
    @GetMapping("/pending")
    public ResponseEntity<List<InterventionRequest>> getPendingInterventions() {
        List<InterventionRequest> pending = interventionService.getPendingInterventions();
        return ResponseEntity.ok(pending);
    }
    
    @PostMapping("/{interventionId}/resolve")
    public ResponseEntity<Void> resolveIntervention(
            @PathVariable String interventionId,
            @RequestBody InterventionResolution resolution) {
        
        interventionService.resolveIntervention(interventionId, resolution);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{interventionId}/escalate")
    public ResponseEntity<Void> escalateIntervention(
            @PathVariable String interventionId,
            @RequestBody EscalationRequest escalation) {
        
        interventionService.escalateIntervention(interventionId, escalation);
        return ResponseEntity.ok().build();
    }
}

@Service
public class InterventionService {
    
    public void resolveIntervention(String interventionId, InterventionResolution resolution) {
        InterventionRequest request = interventionRepository.findById(interventionId)
            .orElseThrow(() -> new InterventionNotFoundException(interventionId));
        
        switch (resolution.getAction()) {
            case RETRY:
                retryExecution(request);
                break;
            case SKIP:
                skipNode(request);
                break;
            case MODIFY_STATE:
                modifyState(request, resolution.getNewState());
                break;
            case TERMINATE:
                terminateExecution(request);
                break;
            case ROLLBACK:
                rollbackExecution(request, resolution.getCheckpointId());
                break;
        }
        
        // 标记干预已解决
        request.setStatus(InterventionStatus.RESOLVED);
        request.setResolvedAt(Instant.now());
        request.setResolvedBy(resolution.getResolvedBy());
        interventionRepository.save(request);
        
        // 恢复执行
        executionManager.resumeExecution(request.getExecutionId());
    }
}
```

## 人类反馈

### 反馈收集

```java
@Component
public class FeedbackCollectionService {
    
    @Autowired
    private FeedbackRepository feedbackRepository;
    
    public void collectFeedback(String executionId, String nodeId, FeedbackRequest request) {
        Feedback feedback = Feedback.builder()
            .id(UUID.randomUUID().toString())
            .executionId(executionId)
            .nodeId(nodeId)
            .userId(request.getUserId())
            .rating(request.getRating())
            .comment(request.getComment())
            .suggestions(request.getSuggestions())
            .timestamp(Instant.now())
            .build();
        
        feedbackRepository.save(feedback);
        
        // 分析反馈并应用改进
        analyzeFeedbackAndImprove(feedback);
    }
    
    private void analyzeFeedbackAndImprove(Feedback feedback) {
        if (feedback.getRating() < 3) {
            // 低评分，需要分析问题
            String analysisPrompt = String.format("""
                分析以下用户反馈，识别问题和改进建议：
                
                评分：%d/5
                评论：%s
                建议：%s
                
                请提供：
                1. 问题分析
                2. 改进建议
                3. 优先级评估
                """, 
                feedback.getRating(),
                feedback.getComment(),
                String.join(", ", feedback.getSuggestions())
            );
            
            FeedbackAnalysis analysis = chatClient.prompt()
                .user(analysisPrompt)
                .call()
                .entity(FeedbackAnalysis.class);
            
            // 创建改进任务
            createImprovementTask(feedback, analysis);
        }
    }
    
    private void createImprovementTask(Feedback feedback, FeedbackAnalysis analysis) {
        ImprovementTask task = ImprovementTask.builder()
            .feedbackId(feedback.getId())
            .description(analysis.getProblemDescription())
            .suggestions(analysis.getImprovementSuggestions())
            .priority(analysis.getPriority())
            .status(TaskStatus.PENDING)
            .createdAt(Instant.now())
            .build();
        
        improvementTaskRepository.save(task);
        
        // 通知开发团队
        notificationService.sendImprovementTaskNotification(task);
    }
}
```

## 人类指导

### 指导系统

```java
@Component
public class HumanGuidanceService {
    
    @Autowired
    private GuidanceRepository guidanceRepository;
    
    public void provideGuidance(String agentId, String context, GuidanceRequest request) {
        Guidance guidance = Guidance.builder()
            .id(UUID.randomUUID().toString())
            .agentId(agentId)
            .context(context)
            .instruction(request.getInstruction())
            .examples(request.getExamples())
            .constraints(request.getConstraints())
            .providedBy(request.getProvidedBy())
            .timestamp(Instant.now())
            .build();
        
        guidanceRepository.save(guidance);
        
        // 应用指导到智能体
        applyGuidanceToAgent(agentId, guidance);
    }
    
    private void applyGuidanceToAgent(String agentId, Guidance guidance) {
        // 更新智能体的行为模式
        AgentBehavior behavior = agentService.getAgentBehavior(agentId);
        behavior.addGuidance(guidance);
        
        // 更新智能体上下文
        agentContextService.setAgentContext(agentId, "human_guidance", guidance);
        
        // 记录指导应用
        GuidanceApplication application = GuidanceApplication.builder()
            .guidanceId(guidance.getId())
            .agentId(agentId)
            .appliedAt(Instant.now())
            .build();
        
        guidanceApplicationRepository.save(application);
    }
    
    public List<Guidance> getRelevantGuidance(String agentId, String currentContext) {
        List<Guidance> allGuidance = guidanceRepository.findByAgentId(agentId);
        
        return allGuidance.stream()
            .filter(guidance -> isRelevantToContext(guidance, currentContext))
            .sorted(Comparator.comparing(Guidance::getTimestamp).reversed())
            .limit(5)
            .collect(Collectors.toList());
    }
    
    private boolean isRelevantToContext(Guidance guidance, String currentContext) {
        // 使用向量相似度或关键词匹配判断相关性
        double similarity = calculateContextSimilarity(guidance.getContext(), currentContext);
        return similarity > 0.7;
    }
}
```

## 协作界面

### Web 界面

```java
@Controller
@RequestMapping("/human-collaboration")
public class HumanCollaborationController {
    
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        List<ApprovalRequest> pendingApprovals = approvalService.getPendingApprovals();
        List<InterventionRequest> pendingInterventions = interventionService.getPendingInterventions();
        List<FeedbackRequest> feedbackRequests = feedbackService.getPendingFeedbackRequests();
        
        model.addAttribute("pendingApprovals", pendingApprovals);
        model.addAttribute("pendingInterventions", pendingInterventions);
        model.addAttribute("feedbackRequests", feedbackRequests);
        
        return "human-collaboration/dashboard";
    }
    
    @GetMapping("/approval/{requestId}")
    public String approvalDetail(@PathVariable String requestId, Model model) {
        ApprovalRequest request = approvalService.getApprovalRequest(requestId);
        model.addAttribute("request", request);
        return "human-collaboration/approval-detail";
    }
    
    @PostMapping("/approval/{requestId}/decide")
    public String processApproval(
            @PathVariable String requestId,
            @RequestParam String decision,
            @RequestParam String comment,
            HttpServletRequest httpRequest) {
        
        String approverId = getCurrentUserId(httpRequest);
        
        ApprovalDecision approvalDecision = ApprovalDecision.builder()
            .decision(DecisionType.valueOf(decision))
            .comment(comment)
            .build();
        
        approvalService.processApproval(requestId, approverId, approvalDecision);
        
        return "redirect:/human-collaboration/dashboard";
    }
}
```

## 实时通信

### WebSocket 支持

```java
@Configuration
@EnableWebSocket
public class CollaborationWebSocketConfig implements WebSocketConfigurer {
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new CollaborationWebSocketHandler(), "/ws/collaboration")
                .setAllowedOrigins("*");
    }
}

@Component
public class CollaborationWebSocketHandler extends TextWebSocketHandler {
    
    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String userId = getUserId(session);
        userSessions.put(userId, session);
    }
    
    @EventListener
    public void onApprovalRequest(ApprovalRequestEvent event) {
        for (String approverId : event.getRequiredApprovers()) {
            WebSocketSession session = userSessions.get(approverId);
            if (session != null && session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(
                        objectMapper.writeValueAsString(event)
                    ));
                } catch (IOException e) {
                    log.error("Failed to send approval notification", e);
                }
            }
        }
    }
    
    @EventListener
    public void onInterventionRequest(InterventionRequestEvent event) {
        // 通知所有在线的管理员
        List<String> administrators = userService.getAdministrators();
        
        for (String adminId : administrators) {
            WebSocketSession session = userSessions.get(adminId);
            if (session != null && session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(
                        objectMapper.writeValueAsString(event)
                    ));
                } catch (IOException e) {
                    log.error("Failed to send intervention notification", e);
                }
            }
        }
    }
}
```

## 配置选项

```properties
# 人机协作配置
spring.ai.human-in-the-loop.enabled=true
spring.ai.human-in-the-loop.approval.timeout=30m
spring.ai.human-in-the-loop.intervention.auto-escalation=true

# 审批配置
spring.ai.human-in-the-loop.approval.require-all=true
spring.ai.human-in-the-loop.approval.escalation-timeout=1h
spring.ai.human-in-the-loop.approval.notification.email=true

# 干预配置
spring.ai.human-in-the-loop.intervention.priority-threshold=HIGH
spring.ai.human-in-the-loop.intervention.auto-pause=true
spring.ai.human-in-the-loop.intervention.escalation-delay=15m

# 反馈配置
spring.ai.human-in-the-loop.feedback.enabled=true
spring.ai.human-in-the-loop.feedback.auto-collect=true
spring.ai.human-in-the-loop.feedback.analysis.enabled=true

# 通知配置
spring.ai.human-in-the-loop.notification.email.enabled=true
spring.ai.human-in-the-loop.notification.websocket.enabled=true
spring.ai.human-in-the-loop.notification.sms.enabled=false
```

## 最佳实践

### 1. 设计原则
- 明确人类介入的时机
- 提供清晰的上下文信息
- 设计直观的交互界面

### 2. 流程优化
- 合理设置超时时间
- 实施升级机制
- 提供快速决策选项

### 3. 用户体验
- 简化操作流程
- 提供实时通知
- 支持移动端访问

### 4. 质量保证
- 记录所有人类决策
- 分析决策模式
- 持续改进系统

## 下一步

- [了解时间旅行](/docs/1.0.0.3/multi-agent/time-travel/)
- [学习子图](/docs/1.0.0.3/multi-agent/subgraphs/)
- [探索可观测性](/docs/1.0.0.3/multi-agent/observability/)
