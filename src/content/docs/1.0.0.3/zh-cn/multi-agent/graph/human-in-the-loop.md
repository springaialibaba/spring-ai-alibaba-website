---
title: 人机协作
keywords: ["Spring AI Alibaba", "Graph", "Human-in-the-loop", "人机协作", "中断恢复"]
description: "学习如何在 Spring AI Alibaba Graph 工作流中集成人工干预，实现智能的人机协作模式。"
---

## 概述

人机协作（Human-in-the-loop）是 Spring AI Alibaba Graph 的一个强大特性，它允许在图执行过程中暂停工作流，等待人工输入或决策，然后继续执行。这种模式在需要人工判断、审核或创造性输入的场景中非常有价值。

### 为什么需要人机协作？

在复杂的 AI 工作流中，完全自动化并不总是最佳选择：

1. **质量控制** — 在关键决策点需要人工审核和确认
2. **创造性任务** — 某些任务需要人类的创造力和直觉
3. **合规要求** — 法律或业务规定要求人工监督
4. **异常处理** — 当自动化系统遇到无法处理的情况时
5. **学习改进** — 通过人工反馈改进 AI 系统的表现

## 基础人机协作

### 1. 中断配置

```java
import com.alibaba.cloud.ai.graph.interrupt.InterruptConfig;
import com.alibaba.cloud.ai.graph.interrupt.InterruptType;

@Configuration
public class HumanInTheLoopConfiguration {
    
    @Bean
    public CompiledGraph humanInteractiveGraph() {
        return new StateGraph(keyStrategyFactory)
            .addNode("analyze", node_async(analyzeAction))
            .addNode("human_review", node_async(humanReviewAction))
            .addNode("finalize", node_async(finalizeAction))
            
            .addEdge(START, "analyze")
            .addEdge("analyze", "human_review")
            .addEdge("human_review", "finalize")
            .addEdge("finalize", END)
            
            .compile(CompileConfig.builder()
                .interruptBefore("human_review")  // 在人工审核前中断
                .interruptAfter("analyze")        // 在分析后中断
                .build());
    }
}
```

### 2. 基础中断和恢复

```java
@Service
public class HumanInteractionService {
    
    @Autowired
    private CompiledGraph humanInteractiveGraph;
    
    @Autowired
    private CheckpointSaver checkpointSaver;
    
    // 启动需要人工干预的工作流
    public String startInteractiveWorkflow(String sessionId, Map<String, Object> input) {
        try {
            // 执行到中断点
            humanInteractiveGraph.invoke(
                input,
                RunnableConfig.builder()
                    .configurable(Map.of("thread_id", sessionId))
                    .build()
            );
            
            return "工作流已启动，等待人工干预";
            
        } catch (InterruptedException e) {
            // 预期的中断，工作流正常暂停
            return "工作流已暂停，等待人工输入";
        }
    }
    
    // 提供人工输入并恢复执行
    public String resumeWithHumanInput(String sessionId, Map<String, Object> humanInput) {
        try {
            // 获取当前状态
            Optional<Checkpoint> checkpoint = checkpointSaver.getLatest(sessionId);
            if (!checkpoint.isPresent()) {
                return "未找到暂停的工作流";
            }
            
            // 合并人工输入到状态中
            Map<String, Object> updatedState = new HashMap<>(checkpoint.get().getState().data());
            updatedState.putAll(humanInput);
            
            // 从中断点继续执行
            Optional<OverAllState> result = humanInteractiveGraph.invoke(
                updatedState,
                RunnableConfig.builder()
                    .configurable(Map.of("thread_id", sessionId))
                    .build()
            );
            
            return result.map(state -> 
                state.value("final_result", String.class).orElse("执行完成")
            ).orElse("执行失败");
            
        } catch (Exception e) {
            return "恢复执行失败: " + e.getMessage();
        }
    }
    
    // 获取等待人工输入的任务列表
    public List<PendingTask> getPendingTasks() {
        return checkpointSaver.listPendingInterrupts()
            .stream()
            .map(this::convertToPendingTask)
            .collect(Collectors.toList());
    }
}
```

### 3. 人工审核节点

```java
public class HumanReviewNode implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        // 准备需要人工审核的数据
        Object analysisResult = state.value("analysis_result", Object.class).orElse(null);
        String reviewPrompt = generateReviewPrompt(analysisResult);
        
        // 创建人工任务
        HumanTask task = HumanTask.builder()
            .taskId(UUID.randomUUID().toString())
            .title("分析结果审核")
            .description("请审核以下分析结果并提供反馈")
            .prompt(reviewPrompt)
            .data(analysisResult)
            .requiredFields(List.of("approval", "feedback", "modifications"))
            .deadline(LocalDateTime.now().plusHours(24))
            .build();
        
        // 触发中断，等待人工输入
        InterruptContext.current().requestHumanInput(task);
        
        // 这里的代码在人工输入后才会执行
        Boolean approved = state.value("human_approval", Boolean.class).orElse(false);
        String feedback = state.value("human_feedback", String.class).orElse("");
        
        if (approved) {
            return Map.of(
                "review_status", "approved",
                "human_feedback", feedback,
                "approved_result", analysisResult
            );
        } else {
            return Map.of(
                "review_status", "rejected",
                "human_feedback", feedback,
                "requires_revision", true
            );
        }
    }
    
    private String generateReviewPrompt(Object analysisResult) {
        return "请审核以下分析结果：\n\n" + 
               analysisResult.toString() + 
               "\n\n请确认是否批准此结果，并提供任何必要的反馈。";
    }
}
```

## 高级人机协作模式

### 1. 条件中断

```java
public class ConditionalInterruptNode implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        Object result = performAnalysis(state);
        Double confidence = calculateConfidence(result);
        
        // 只有在置信度低于阈值时才需要人工干预
        if (confidence < 0.8) {
            HumanTask task = HumanTask.builder()
                .taskId(UUID.randomUUID().toString())
                .title("低置信度结果确认")
                .description("系统置信度较低，需要人工确认")
                .data(Map.of(
                    "result", result,
                    "confidence", confidence,
                    "threshold", 0.8
                ))
                .requiredFields(List.of("confirmation", "alternative_result"))
                .priority(TaskPriority.HIGH)
                .build();
            
            InterruptContext.current().requestHumanInput(task);
            
            // 处理人工输入
            Boolean confirmed = state.value("human_confirmation", Boolean.class).orElse(false);
            if (confirmed) {
                return Map.of("final_result", result, "human_confirmed", true);
            } else {
                Object alternativeResult = state.value("alternative_result", Object.class).orElse(result);
                return Map.of("final_result", alternativeResult, "human_modified", true);
            }
        } else {
            // 置信度足够高，直接通过
            return Map.of("final_result", result, "auto_approved", true);
        }
    }
}
```

### 2. 多人协作

```java
public class MultiPersonReviewNode implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        Object document = state.value("document", Object.class).orElse(null);
        
        // 创建多个并行的人工任务
        List<HumanTask> reviewTasks = List.of(
            createReviewTask("legal_review", "法务审核", document, "legal_team"),
            createReviewTask("technical_review", "技术审核", document, "tech_team"),
            createReviewTask("business_review", "业务审核", document, "business_team")
        );
        
        // 请求多人并行审核
        InterruptContext.current().requestParallelHumanInput(reviewTasks);
        
        // 收集所有审核结果
        Boolean legalApproved = state.value("legal_approval", Boolean.class).orElse(false);
        Boolean techApproved = state.value("technical_approval", Boolean.class).orElse(false);
        Boolean businessApproved = state.value("business_approval", Boolean.class).orElse(false);
        
        List<String> feedback = new ArrayList<>();
        feedback.add(state.value("legal_feedback", String.class).orElse(""));
        feedback.add(state.value("technical_feedback", String.class).orElse(""));
        feedback.add(state.value("business_feedback", String.class).orElse(""));
        
        boolean allApproved = legalApproved && techApproved && businessApproved;
        
        return Map.of(
            "all_approved", allApproved,
            "individual_approvals", Map.of(
                "legal", legalApproved,
                "technical", techApproved,
                "business", businessApproved
            ),
            "consolidated_feedback", feedback
        );
    }
    
    private HumanTask createReviewTask(String taskId, String title, Object document, String assignee) {
        return HumanTask.builder()
            .taskId(taskId)
            .title(title)
            .description("请审核以下文档")
            .data(document)
            .assignee(assignee)
            .requiredFields(List.of("approval", "feedback"))
            .deadline(LocalDateTime.now().plusDays(2))
            .build();
    }
}
```

### 3. 渐进式人工输入

```java
public class ProgressiveHumanInputNode implements NodeAction {
    
    @Override
    public Map<String, Object> execute(OverAllState state) {
        List<String> items = state.value("items", List.class).orElse(List.of());
        List<String> processedItems = new ArrayList<>();
        
        for (int i = 0; i < items.size(); i++) {
            String item = items.get(i);
            
            // 尝试自动处理
            ProcessingResult autoResult = attemptAutoProcessing(item);
            
            if (autoResult.isSuccessful()) {
                processedItems.add(autoResult.getResult());
            } else {
                // 自动处理失败，请求人工干预
                HumanTask task = HumanTask.builder()
                    .taskId("manual_processing_" + i)
                    .title("手动处理项目 " + (i + 1))
                    .description("自动处理失败，需要手动处理")
                    .data(Map.of(
                        "item", item,
                        "auto_error", autoResult.getError(),
                        "suggestions", autoResult.getSuggestions()
                    ))
                    .requiredFields(List.of("processed_item"))
                    .build();
                
                InterruptContext.current().requestHumanInput(task);
                
                // 获取人工处理结果
                String manualResult = state.value("processed_item", String.class)
                    .orElse("处理失败");
                processedItems.add(manualResult);
            }
        }
        
        return Map.of("processed_items", processedItems);
    }
}
```

## Web 界面集成

### 1. 任务管理 API

```java
@RestController
@RequestMapping("/api/human-tasks")
public class HumanTaskController {
    
    @Autowired
    private HumanTaskService humanTaskService;
    
    // 获取待处理任务列表
    @GetMapping
    public ResponseEntity<List<HumanTaskDTO>> getPendingTasks(
            @RequestParam(required = false) String assignee) {
        List<HumanTaskDTO> tasks = humanTaskService.getPendingTasks(assignee);
        return ResponseEntity.ok(tasks);
    }
    
    // 获取特定任务详情
    @GetMapping("/{taskId}")
    public ResponseEntity<HumanTaskDTO> getTask(@PathVariable String taskId) {
        return humanTaskService.getTask(taskId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    // 提交任务结果
    @PostMapping("/{taskId}/submit")
    public ResponseEntity<String> submitTask(
            @PathVariable String taskId,
            @RequestBody Map<String, Object> submission) {
        try {
            humanTaskService.submitTask(taskId, submission);
            return ResponseEntity.ok("任务提交成功");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("提交失败: " + e.getMessage());
        }
    }
    
    // 拒绝或跳过任务
    @PostMapping("/{taskId}/reject")
    public ResponseEntity<String> rejectTask(
            @PathVariable String taskId,
            @RequestBody Map<String, String> reason) {
        try {
            humanTaskService.rejectTask(taskId, reason.get("reason"));
            return ResponseEntity.ok("任务已拒绝");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("拒绝失败: " + e.getMessage());
        }
    }
    
    // 请求任务延期
    @PostMapping("/{taskId}/extend")
    public ResponseEntity<String> extendDeadline(
            @PathVariable String taskId,
            @RequestBody Map<String, Object> extension) {
        try {
            LocalDateTime newDeadline = LocalDateTime.parse(
                (String) extension.get("new_deadline"));
            String reason = (String) extension.get("reason");
            
            humanTaskService.extendDeadline(taskId, newDeadline, reason);
            return ResponseEntity.ok("截止时间已延长");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("延期失败: " + e.getMessage());
        }
    }
}
```

### 2. 实时通知系统

```java
@Component
public class HumanTaskNotificationService {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private EmailService emailService;
    
    @EventListener
    public void handleNewTask(HumanTaskCreatedEvent event) {
        HumanTask task = event.getTask();
        
        // 发送 WebSocket 通知
        messagingTemplate.convertAndSendToUser(
            task.getAssignee(),
            "/queue/tasks",
            TaskNotification.builder()
                .type("NEW_TASK")
                .taskId(task.getTaskId())
                .title(task.getTitle())
                .priority(task.getPriority())
                .deadline(task.getDeadline())
                .build()
        );
        
        // 发送邮件通知
        emailService.sendTaskNotification(task);
    }
    
    @EventListener
    public void handleTaskDeadlineApproaching(TaskDeadlineEvent event) {
        HumanTask task = event.getTask();
        
        messagingTemplate.convertAndSendToUser(
            task.getAssignee(),
            "/queue/notifications",
            TaskNotification.builder()
                .type("DEADLINE_WARNING")
                .taskId(task.getTaskId())
                .message("任务即将到期: " + task.getTitle())
                .deadline(task.getDeadline())
                .build()
        );
    }
}
```

### 3. 前端任务界面

```javascript
// 任务管理组件
class HumanTaskManager {
    constructor() {
        this.socket = new SockJS('/ws');
        this.stompClient = Stomp.over(this.socket);
        this.connectWebSocket();
        this.loadPendingTasks();
    }
    
    connectWebSocket() {
        this.stompClient.connect({}, (frame) => {
            console.log('Connected: ' + frame);
            
            // 订阅新任务通知
            this.stompClient.subscribe('/user/queue/tasks', (notification) => {
                const task = JSON.parse(notification.body);
                this.handleNewTaskNotification(task);
            });
            
            // 订阅一般通知
            this.stompClient.subscribe('/user/queue/notifications', (notification) => {
                const notif = JSON.parse(notification.body);
                this.showNotification(notif);
            });
        });
    }
    
    async loadPendingTasks() {
        try {
            const response = await fetch('/api/human-tasks');
            const tasks = await response.json();
            this.renderTaskList(tasks);
        } catch (error) {
            console.error('加载任务失败:', error);
        }
    }
    
    async submitTask(taskId, formData) {
        try {
            const response = await fetch(`/api/human-tasks/${taskId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                this.showSuccess('任务提交成功');
                this.removeTaskFromList(taskId);
            } else {
                const error = await response.text();
                this.showError('提交失败: ' + error);
            }
        } catch (error) {
            this.showError('提交失败: ' + error.message);
        }
    }
    
    renderTaskList(tasks) {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }
    
    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `
            <div class="task-header">
                <h3>${task.title}</h3>
                <span class="priority ${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
            <div class="task-description">${task.description}</div>
            <div class="task-deadline">截止时间: ${new Date(task.deadline).toLocaleString()}</div>
            <div class="task-actions">
                <button onclick="taskManager.openTask('${task.taskId}')">处理</button>
                <button onclick="taskManager.rejectTask('${task.taskId}')">拒绝</button>
            </div>
        `;
        return div;
    }
    
    handleNewTaskNotification(task) {
        this.showNotification({
            type: 'info',
            message: `新任务: ${task.title}`,
            duration: 5000
        });
        
        // 刷新任务列表
        this.loadPendingTasks();
    }
}

// 初始化任务管理器
const taskManager = new HumanTaskManager();
```

## 最佳实践

### 1. 任务设计原则

- **清晰的指令**：提供明确、具体的任务描述和要求
- **适当的上下文**：提供足够的背景信息帮助人工决策
- **合理的截止时间**：设置现实可行的任务截止时间
- **优先级管理**：根据业务重要性设置任务优先级

### 2. 用户体验优化

- **直观的界面**：设计简洁、易用的任务处理界面
- **实时通知**：及时通知用户新任务和重要更新
- **进度跟踪**：显示工作流的整体进度和当前状态
- **历史记录**：保留任务处理历史以供审计和学习

### 3. 系统集成

- **身份认证**：确保只有授权用户能够处理相应任务
- **权限控制**：根据用户角色限制任务访问权限
- **审计日志**：记录所有人工操作以满足合规要求
- **备份机制**：为关键任务设置备用处理人员

## 下一步

- [时间旅行](./time-travel) - 学习状态回滚和分支功能
- [子图](./subgraphs) - 了解如何构建可复用的子图组件
- [持久执行](./durable-execution) - 探索持久执行和故障恢复机制
