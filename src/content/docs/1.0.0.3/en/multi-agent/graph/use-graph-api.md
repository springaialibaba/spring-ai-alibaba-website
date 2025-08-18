---
title: Use the Graph API
keywords: ["Spring AI Alibaba", "Graph API", "Multi-Agent", "Workflow", "Practice"]
description: "Learn how to use Spring AI Alibaba Graph API to build real multi-agent applications, including practical examples, advanced features, and best practices."
---

## Real-World Application Examples

### 1. Customer Feedback Processing System

```java
@Configuration
public class CustomerFeedbackWorkflow {
    
    @Bean
    public CompiledGraph customerFeedbackGraph(ChatClient chatClient) throws GraphStateException {
        // State factory
        KeyStrategyFactory stateFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("input", new ReplaceStrategy());
            strategies.put("classifier_output", new ReplaceStrategy());
            strategies.put("solution", new ReplaceStrategy());
            return strategies;
        };
        
        // Create nodes
        var feedbackClassifier = new QuestionClassifierNode(
            chatClient,
            "Please classify customer feedback as: positive or negative",
            Map.of("positive", "positive", "negative", "negative")
        );
        
        var specificClassifier = new QuestionClassifierNode(
            chatClient,
            "Please categorize negative feedback as: service, product, or delivery",
            Map.of("service", "service", "product", "product", "delivery", "delivery")
        );
        
        var recorder = new RecorderNode();
        
        // Build workflow
        StateGraph workflow = new StateGraph(stateFactory)
            .addNode("feedback_classifier", node_async(feedbackClassifier))
            .addNode("specific_classifier", node_async(specificClassifier))
            .addNode("recorder", node_async(recorder))
            
            .addEdge(START, "feedback_classifier")
            .addConditionalEdges("feedback_classifier", 
                edge_async(new FeedbackDispatcher()), 
                Map.of(
                    "positive", "recorder",
                    "negative", "specific_classifier"
                ))
            .addConditionalEdges("specific_classifier",
                edge_async(new CategoryDispatcher()),
                Map.of(
                    "service", "recorder",
                    "product", "recorder", 
                    "delivery", "recorder"
                ))
            .addEdge("recorder", END);
        
        return workflow.compile();
    }
}
```

### 2. Intelligent Research Assistant

```java
@Configuration
public class ResearchAssistantWorkflow {
    
    @Bean
    public CompiledGraph researchGraph(ChatClient chatClient) throws GraphStateException {
        KeyStrategyFactory stateFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("query", new ReplaceStrategy());
            strategies.put("research_plan", new ReplaceStrategy());
            strategies.put("collected_info", new AppendStrategy());
            strategies.put("final_report", new ReplaceStrategy());
            return strategies;
        };
        
        // Research planning node
        NodeAction plannerAction = state -> {
            String query = (String) state.value("query").orElse("");
            String plan = chatClient.prompt()
                .system("You are a research planning expert. Please create a detailed research plan for the following query")
                .user(query)
                .call()
                .content();
            
            return Map.of("research_plan", plan);
        };
        
        // Information collection node
        NodeAction collectorAction = state -> {
            String plan = (String) state.value("research_plan").orElse("");
            // Can integrate search engines, databases, etc.
            String info = performResearch(plan);
            
            return Map.of("collected_info", info);
        };
        
        // Report generation node
        NodeAction writerAction = state -> {
            String query = (String) state.value("query").orElse("");
            List<String> info = (List<String>) state.value("collected_info").orElse(List.of());
            
            String context = String.join("\n", info);
            String report = chatClient.prompt()
                .system("Generate a detailed research report based on collected information")
                .user("Query: " + query + "\n\nInformation: " + context)
                .call()
                .content();
            
            return Map.of("final_report", report);
        };
        
        StateGraph workflow = new StateGraph(stateFactory)
            .addNode("planner", node_async(plannerAction))
            .addNode("collector", node_async(collectorAction))
            .addNode("writer", node_async(writerAction))
            
            .addEdge(START, "planner")
            .addEdge("planner", "collector")
            .addEdge("collector", "writer")
            .addEdge("writer", END);
        
        return workflow.compile();
    }
}
```

### 3. Parallel Processing Workflow

```java
@Configuration
public class ParallelProcessingWorkflow {
    
    @Bean
    public CompiledGraph parallelGraph(ChatClient chatClient) throws GraphStateException {
        KeyStrategyFactory stateFactory = () -> {
            Map<String, KeyStrategy> strategies = new HashMap<>();
            strategies.put("input", new ReplaceStrategy());
            strategies.put("results", new MergeStrategy());
            return strategies;
        };
        
        // Data dispatcher node
        NodeAction dispatcherAction = state -> {
            String input = (String) state.value("input").orElse("");
            // Distribute input to multiple processors
            return Map.of("task_data", input);
        };
        
        // Parallel processing nodes
        NodeAction processor1Action = state -> {
            String data = (String) state.value("task_data").orElse("");
            String result = processWithModel1(data);
            return Map.of("result1", result);
        };
        
        NodeAction processor2Action = state -> {
            String data = (String) state.value("task_data").orElse("");
            String result = processWithModel2(data);
            return Map.of("result2", result);
        };
        
        NodeAction processor3Action = state -> {
            String data = (String) state.value("task_data").orElse("");
            String result = processWithModel3(data);
            return Map.of("result3", result);
        };
        
        // Result aggregation node
        NodeAction aggregatorAction = state -> {
            String result1 = (String) state.value("result1").orElse("");
            String result2 = (String) state.value("result2").orElse("");
            String result3 = (String) state.value("result3").orElse("");
            
            String finalResult = aggregateResults(result1, result2, result3);
            return Map.of("final_result", finalResult);
        };
        
        StateGraph workflow = new StateGraph(stateFactory)
            .addNode("dispatcher", node_async(dispatcherAction))
            .addNode("processor1", node_async(processor1Action))
            .addNode("processor2", node_async(processor2Action))
            .addNode("processor3", node_async(processor3Action))
            .addNode("aggregator", node_async(aggregatorAction))
            
            .addEdge(START, "dispatcher")
            // Parallel branches
            .addEdge("dispatcher", "processor1")
            .addEdge("dispatcher", "processor2")
            .addEdge("dispatcher", "processor3")
            // Converge to aggregator
            .addEdge("processor1", "aggregator")
            .addEdge("processor2", "aggregator")
            .addEdge("processor3", "aggregator")
            .addEdge("aggregator", END);
        
        return workflow.compile();
    }
}
```

## Advanced Features

### 1. Human-in-the-Loop

```java
@Configuration
public class HumanInTheLoopWorkflow {

    @Bean
    public CompiledGraph humanInteractionGraph() throws GraphStateException {
        // Configure interrupt points
        CompileConfig config = CompileConfig.builder()
            .interruptBefore("human_review")  // Interrupt before human review
            .interruptAfter("critical_decision")  // Interrupt after critical decision
            .build();

        StateGraph workflow = new StateGraph(keyStrategyFactory)
            .addNode("analyzer", node_async(analyzerAction))
            .addNode("human_review", node_async(humanReviewAction))
            .addNode("finalizer", node_async(finalizerAction))

            .addEdge(START, "analyzer")
            .addEdge("analyzer", "human_review")
            .addEdge("human_review", "finalizer")
            .addEdge("finalizer", END);

        return workflow.compile(config);
    }
}

// Usage example
@Service
public class HumanInteractionService {

    public String processWithHumanReview(String input) {
        // Start workflow
        CompiledGraph graph = humanInteractionGraph();

        // Execute to interrupt point
        Optional<OverAllState> state = graph.invoke(Map.of("input", input));

        // Wait for human intervention...
        // Can allow users to modify state through Web interface

        // Resume execution
        RunnableConfig config = RunnableConfig.builder()
            .resumeFrom(state.get())
            .build();

        return graph.invoke(Map.of(), config)
            .map(s -> (String) s.value("result").orElse(""))
            .orElse("");
    }
}
```

### 2. Checkpoints and State Recovery

```java
@Configuration
public class CheckpointWorkflow {

    @Bean
    public CompiledGraph checkpointGraph() throws GraphStateException {
        // Configure checkpoint saver
        CheckpointSaver checkpointSaver = new MemoryCheckpointSaver();

        CompileConfig config = CompileConfig.builder()
            .checkpointer(checkpointSaver)
            .build();

        StateGraph workflow = new StateGraph(keyStrategyFactory)
            .addNode("step1", node_async(step1Action))
            .addNode("step2", node_async(step2Action))
            .addNode("step3", node_async(step3Action))

            .addEdge(START, "step1")
            .addEdge("step1", "step2")
            .addEdge("step2", "step3")
            .addEdge("step3", END);

        return workflow.compile(config);
    }
}
```

### 3. Streaming Output

```java
@RestController
public class StreamingController {

    private final CompiledGraph workflow;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamProcess(@RequestParam String input) {
        return workflow.stream(Map.of("input", input))
            .map(state -> {
                // Extract current state output
                return extractStreamContent(state);
            })
            .filter(content -> !content.isEmpty());
    }

    private String extractStreamContent(OverAllState state) {
        // Extract streaming content based on business requirements
        return state.value("current_output", String.class).orElse("");
    }
}
```

## Visualization and Debugging

### 1. Graph Structure Visualization

```java
@Service
public class GraphVisualizationService {

    public String generateMermaidDiagram(CompiledGraph graph) {
        GraphRepresentation mermaid = graph.getGraph(GraphRepresentation.Type.MERMAID);
        return mermaid.content();
    }

    public String generatePlantUMLDiagram(CompiledGraph graph) {
        GraphRepresentation plantuml = graph.getGraph(GraphRepresentation.Type.PLANTUML);
        return plantuml.content();
    }
}
```

### 2. Execution Monitoring

```java
@Component
public class GraphExecutionMonitor {

    private final MeterRegistry meterRegistry;

    public void monitorExecution(CompiledGraph graph, String workflowName) {
        Timer executionTimer = Timer.builder("graph.execution.duration")
            .tag("workflow", workflowName)
            .register(meterRegistry);

        Counter nodeCounter = Counter.builder("graph.node.executions")
            .tag("workflow", workflowName)
            .register(meterRegistry);

        // Add execution listeners
        graph.addListener(GraphListener.builder()
            .onNodeStart((nodeId, state) -> {
                nodeCounter.increment(Tags.of("node", nodeId, "event", "start"));
            })
            .onNodeComplete((nodeId, state) -> {
                nodeCounter.increment(Tags.of("node", nodeId, "event", "complete"));
            })
            .build());
    }
}
```

## Best Practices

### 1. Node Design Principles

- **Single Responsibility**: Each node focuses on one specific task
- **Stateless Design**: Node logic doesn't depend on external state
- **Exception Handling**: Gracefully handle node execution exceptions
- **Performance Considerations**: Avoid long-blocking operations

### 2. State Management Strategy

- **Reasonable Layering**: Distinguish between global and local state
- **Strategy Selection**: Choose appropriate merge strategies based on data characteristics
- **Memory Management**: Avoid oversized state objects
- **Serialization Optimization**: Ensure state objects are serializable

### 3. Workflow Design Patterns

- **Pipeline Pattern**: Linear processing flow
- **Branch Pattern**: Conditional branch processing
- **Parallel Pattern**: Parallel processing for efficiency
- **Loop Pattern**: Iterative processing for complex tasks

## Summary

Spring AI Alibaba Graph provides a powerful and flexible multi-agent workflow framework. Through declarative APIs and rich feature support, developers can easily build complex AI applications. The core advantages of the framework include:

- **Declarative Design**: Clean APIs and fluent calls
- **Spring Integration**: Complete dependency injection and configuration management
- **Rich Features**: Support for parallelism, interruption, recovery, visualization, etc.
- **Production Ready**: Complete monitoring, observability, and error handling

By properly using the Graph framework, you can build efficient, reliable, and maintainable multi-agent application systems.
