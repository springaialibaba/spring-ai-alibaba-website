---
title: Graph 概览
keywords: ["Spring AI Alibaba", "Graph", "StateGraph", "多智能体", "工作流"]
description: "深入了解 Spring AI Alibaba Graph 框架的核心概念，包括 StateGraph、Node、Edge、CompiledGraph 等基础组件。"
---

## 概述

Spring AI Alibaba Graph 是一款面向 Java 开发者的**工作流、多智能体框架**，用于构建由多个 AI 模型或步骤组成的复杂应用。它基于 Spring Boot 生态进行深度集成，提供声明式的 API 来编排工作流，让开发者能将 AI 应用的各个步骤抽象为节点（Node），并通过有向图（Graph）的形式连接这些节点，形成可定制的执行流程。

与传统单 Agent（一问一答式）方案相比，Spring AI Alibaba Graph 支持更复杂的多步骤任务流程，有助于解决**单一大模型对复杂任务力不从心**的问题。

## 核心概念

### 1. StateGraph（状态图）

StateGraph 是定义整个工作流的主类，它支持：

- **添加节点**：通过 `addNode()` 方法添加工作流步骤
- **添加边**：通过 `addEdge()` 和 `addConditionalEdges()` 连接节点
- **条件分支**：支持复杂的条件逻辑和并行处理
- **图结构校验**：确保图的完整性和正确性
- **编译执行**：最终编译为 CompiledGraph 以供执行

```java
StateGraph workflow = new StateGraph(keyStrategyFactory)
    .addNode("classifier", node_async(classifierNode))
    .addNode("processor", node_async(processorNode))
    .addNode("recorder", node_async(recorderNode))
    
    .addEdge(START, "classifier")
    .addConditionalEdges("classifier", edge_async(dispatcher), Map.of(
        "positive", "recorder",
        "negative", "processor"
    ))
    .addEdge("processor", "recorder")
    .addEdge("recorder", END);
```

### 2. Node（节点）

Node 表示工作流中的单个步骤，可以封装：

- **模型调用**：LLM 推理、嵌入计算等
- **数据处理**：业务逻辑、数据转换等
- **外部服务**：API 调用、数据库操作等
- **工具调用**：函数执行、系统集成等

```java
// 异步节点定义
NodeAction classifierAction = state -> {
    String input = (String) state.value("input").orElse("");
    String classification = chatClient.prompt()
        .user("请对以下文本进行分类：" + input)
        .call()
        .content();
    
    return Map.of("classification", classification);
};

// 注册为异步节点
.addNode("classifier", node_async(classifierAction))
```

### 3. Edge（边）

Edge 表示节点之间的转移关系，支持：

- **静态边**：固定的节点跳转
- **条件边**：根据状态动态决定下一个节点
- **并行边**：同时执行多个分支

```java
// 静态边
.addEdge("nodeA", "nodeB")

// 条件边
.addConditionalEdges("classifier", edge_async(dispatcher), Map.of(
    "category1", "handler1",
    "category2", "handler2",
    "default", "defaultHandler"
))

// 并行边
.addEdge("start", List.of("branch1", "branch2", "branch3"))
```

### 4. OverAllState（全局状态）

OverAllState 是贯穿整个工作流的全局状态对象，支持：

- **数据传递**：在节点间共享数据
- **状态管理**：支持不同的合并策略
- **断点续跑**：支持检查点和状态恢复
- **序列化**：支持状态的持久化存储

```java
// 状态工厂定义
KeyStrategyFactory keyStrategyFactory = () -> {
    Map<String, KeyStrategy> strategies = new HashMap<>();
    strategies.put("input", new ReplaceStrategy());           // 替换策略
    strategies.put("messages", new AppendStrategy());         // 追加策略
    strategies.put("results", new MergeStrategy());           // 合并策略
    return strategies;
};
```

### 5. CompiledGraph（已编译图）

CompiledGraph 是 StateGraph 的可执行版本，负责：

- **节点执行**：按照图结构执行节点
- **状态流转**：管理状态在节点间的传递
- **结果输出**：支持同步和流式输出
- **中断恢复**：支持执行中断和恢复
- **并行处理**：支持并行节点执行

```java
CompiledGraph app = workflow.compile();

// 同步执行
Optional<OverAllState> result = app.invoke(Map.of("input", "用户输入"));

// 流式执行
Flux<OverAllState> stream = app.stream(Map.of("input", "用户输入"));
```

## 下一步

现在您已经了解了 Spring AI Alibaba Graph 的核心概念，接下来可以学习如何在实际项目中使用这些 API 来构建复杂的多智能体应用。请参阅 [使用 Graph API](./use-graph-api) 了解详细的实现示例和最佳实践。
