---
title: Graph Overview
keywords: ["Spring AI Alibaba", "Graph", "StateGraph", "Multi-Agent", "Workflow"]
description: "Deep dive into the core concepts of Spring AI Alibaba Graph framework, including StateGraph, Node, Edge, CompiledGraph and other fundamental components."
---

## Overview

Spring AI Alibaba Graph is a **workflow and multi-agent framework** for Java developers to build complex applications composed of multiple AI models or steps. It is deeply integrated with the Spring Boot ecosystem, providing a declarative API to orchestrate workflows. This allows developers to abstract each step of an AI application as a node (Node) and connect these nodes in the form of a directed graph (Graph) to create a customizable execution flow.

Compared to traditional single-agent (one-turn Q&A) solutions, Spring AI Alibaba Graph supports more complex multi-step task flows, helping to address the issue of a **single large model being insufficient for complex tasks**.

## Core Concepts

### 1. StateGraph (State Graph)

StateGraph is the main class for defining the entire workflow, supporting:

- **Add Nodes**: Add workflow steps through `addNode()` method
- **Add Edges**: Connect nodes through `addEdge()` and `addConditionalEdges()`
- **Conditional Branching**: Support complex conditional logic and parallel processing
- **Graph Structure Validation**: Ensure graph completeness and correctness
- **Compile and Execute**: Finally compile to CompiledGraph for execution

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

### 2. Node

Node represents a single step in the workflow, which can encapsulate:

- **Model Calls**: LLM inference, embedding computation, etc.
- **Data Processing**: Business logic, data transformation, etc.
- **External Services**: API calls, database operations, etc.
- **Tool Calling**: Function execution, system integration, etc.

```java
// Async node definition
NodeAction classifierAction = state -> {
    String input = (String) state.value("input").orElse("");
    String classification = chatClient.prompt()
        .user("Please classify the following text: " + input)
        .call()
        .content();
    
    return Map.of("classification", classification);
};

// Register as async node
.addNode("classifier", node_async(classifierAction))
```

### 3. Edge

Edge represents transition relationships between nodes, supporting:

- **Static Edges**: Fixed node transitions
- **Conditional Edges**: Dynamically determine next node based on state
- **Parallel Edges**: Execute multiple branches simultaneously

```java
// Static edge
.addEdge("nodeA", "nodeB")

// Conditional edge
.addConditionalEdges("classifier", edge_async(dispatcher), Map.of(
    "category1", "handler1",
    "category2", "handler2",
    "default", "defaultHandler"
))

// Parallel edge
.addEdge("start", List.of("branch1", "branch2", "branch3"))
```

### 4. OverAllState (Global State)

OverAllState is a global state object that spans the entire workflow, supporting:

- **Data Passing**: Share data between nodes
- **State Management**: Support different merge strategies
- **Checkpoint Resume**: Support checkpoints and state recovery
- **Serialization**: Support state persistence

```java
// State factory definition
KeyStrategyFactory keyStrategyFactory = () -> {
    Map<String, KeyStrategy> strategies = new HashMap<>();
    strategies.put("input", new ReplaceStrategy());           // Replace strategy
    strategies.put("messages", new AppendStrategy());         // Append strategy
    strategies.put("results", new MergeStrategy());           // Merge strategy
    return strategies;
};
```

### 5. CompiledGraph

CompiledGraph is the executable version of StateGraph, responsible for:

- **Node Execution**: Execute nodes according to graph structure
- **State Flow**: Manage state passing between nodes
- **Result Output**: Support synchronous and streaming output
- **Interrupt Resume**: Support execution interruption and recovery
- **Parallel Processing**: Support parallel node execution

```java
CompiledGraph app = workflow.compile();

// Synchronous execution
Optional<OverAllState> result = app.invoke(Map.of("input", "user input"));

// Streaming execution
Flux<OverAllState> stream = app.stream(Map.of("input", "user input"));
```

## Next Steps

Now that you understand the core concepts of Spring AI Alibaba Graph, you can learn how to use these APIs in real projects to build complex multi-agent applications. Please refer to [Use the Graph API](./use-graph-api) for detailed implementation examples and best practices.
