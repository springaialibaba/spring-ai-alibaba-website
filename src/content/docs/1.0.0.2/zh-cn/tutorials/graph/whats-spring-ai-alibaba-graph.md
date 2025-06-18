---
title: 什么是 Spring AI Alibaba Graph
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---
> Graph 模块文档持续更新中，请关注文档发布进展

Spring AI Alibaba Graph 是社区核心实现之一，也是整个框架在设计理念上区别于 Spring AI 只做底层原子抽象的地方，Spring AI Alibaba 期望帮助开发者更容易的构建智能体应用。基于 Graph 开发者可以构建工作流、多智能体应用。Spring AI Alibaba Graph 在设计理念上借鉴 Langgraph，因此在一定程度上可以理解为是 Java 版的 Langgraph 实现，社区在此基础上增加了大量预置 Node、简化了 State 定义过程等，让开发者更容易编写对等低代码平台的工作流、多智能体等。

## Graph 速览
框架核心概念包括：**StateGraph**（状态图，用于定义节点和边）、**Node**（节点，封装具体操作或模型调用）、**Edge**（边，表示节点间的跳转关系）以及 **OverAllState**（全局状态，贯穿流程共享数据）。这些设计使开发者能够方便地管理工作流中的状态和逻辑流转。

以下代码片段是使用 Graph 开发的一个多智能体架构示例（摘自 Spring AI Alibaba DeepResearch 实际实现）：

```java
StateGraph stateGraph = new StateGraph("deep research", keyStrategyFactory,
				new DeepResearchStateSerializer(OverAllState::new))
			.addNode("coordinator", node_async(new CoordinatorNode(chatClientBuilder)))
			.addNode("background_investigator", node_async(new BackgroundInvestigationNode(tavilySearchService)))
			.addNode("planner", node_async((new PlannerNode(chatClientBuilder))))
			.addNode("human_feedback", node_async(new HumanFeedbackNode()))
			.addNode("research_team", node_async(new ResearchTeamNode()))
			.addNode("researcher", node_async(new ResearcherNode(researchAgent)))
			.addNode("coder", node_async(new CoderNode(coderAgent)))
			.addNode("reporter", node_async((new ReporterNode(chatClientBuilder))))

			.addEdge(START, "coordinator")
			.addConditionalEdges("coordinator", edge_async(new CoordinatorDispatcher()),
					Map.of("background_investigator", "background_investigator", "planner", "planner", END, END))
			.addEdge("background_investigator", "planner")
			.addConditionalEdges("planner", edge_async(new PlannerDispatcher()),
					Map.of("reporter", "reporter", "human_feedback", "human_feedback", "planner", "planner",
							"research_team", "research_team", END, END))
			.addConditionalEdges("human_feedback", edge_async(new HumanFeedbackDispatcher()),
					Map.of("planner", "planner", "research_team", "research_team", END, END))
			.addConditionalEdges("research_team", edge_async(new ResearchTeamDispatcher()),
					Map.of("reporter", "reporter", "researcher", "researcher", "coder", "coder"))
			.addConditionalEdges("researcher", edge_async(new ResearcherDispatcher()),
					Map.of("research_team", "research_team"))
			.addConditionalEdges("coder", edge_async(new CoderDispatcher()), Map.of("research_team", "research_team"))
			.addEdge("reporter", END);
```

## 核心功能

+ 支持 Multi-agent，内置 ReAct Agent、Supervisor 等常规智能体模式
+ 支持工作流，内置工作流节点，与主流低代码平台对齐
+ 原生支持 Streaming
+ Human-in-the-loop，通过人类确认节点，支持修改状态、恢复执行
+ 支持记忆与持久存储
+ 支持流程快照
+ 支持嵌套分支、并行分支
+ PlantUML、Mermaid 可视化导出


