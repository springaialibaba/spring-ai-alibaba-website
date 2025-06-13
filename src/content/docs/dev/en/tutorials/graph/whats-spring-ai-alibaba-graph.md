---
title: 什么是 Spring AI Alibaba Graph
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

Spring AI Alibaba Graph enables the adaptation of graph structure construction. By invoking methods from the `spring-ai-alibaba-graph-core` module, you can easily implement custom Graph structures.

## Quick Experience Example

> Note: Since Spring AI Alibaba is developed based on Spring Boot 3.x, the local JDK version must be 17 or higher.

This section introduces how to quickly get started with the Spring AI Alibaba Graph module.

1. Create a Sample Workflow

   We are going to create the following workflow as shown in the diagram:

    ![img.png](img.png)

    As shown in the figure, the workflow contains four nodes connected by edges. Here is a brief introduction to each node:

   1. **SummarizerNode**: Summarizes the input text. Input: String, Output: String.
   
      ```java
      public class SummarizerNode implements NodeAction {
         
          private final ChatClient chatClient;
         
          public SummarizerNode(ChatClient chatClient) {
              this.chatClient = chatClient;
          }
         
          @Override
          public Map<String, Object> apply(OverAllState state) {
              String text = (String) state.value("original_text").orElse("");
              String prompt = "请对以下中文文本进行简洁明了的摘要：\n\n" + text;
         
              ChatResponse response = chatClient.prompt(prompt).call().chatResponse();
              String summary = response.getResult().getOutput().getText();
         
              Map<String, Object> result = new HashMap<>();
              result.put("summary", summary);
              return result;
          }
         
      }
      ```

   2. **SummaryFeedbackClassifierNode**: Classify the summary based on user input. Input: String (summary), Output: Map<String, Object>.
   
      ```java
      public class SummaryFeedbackClassifierNode implements NodeAction {
         
          private final ChatClient chatClient;
         
          private final String inputKey;
         
          public SummaryFeedbackClassifierNode(ChatClient chatClient, String inputKey) {
              this.chatClient = chatClient;
              this.inputKey = inputKey;
          }
         
          @Override
          public Map<String, Object> apply(OverAllState state) {
              String summary = (String) state.value(inputKey).orElse("");
              if (!StringUtils.hasText(summary)) {
                  throw new IllegalArgumentException("summary is empty in state");
              }
         
              String prompt = """
                      以下是一个自动生成的中文摘要。请你判断它是否让用户满意。如果满意，请返回 "positive"，否则返回 "negative"：
         
                      摘要内容：
                      %s
                      """.formatted(summary);
         
              ChatResponse response = chatClient.prompt(prompt).call().chatResponse();
              String output = response.getResult().getOutput().getText();
         
              String classification = output.toLowerCase().contains("positive") ? "positive" : "negative";
         
              Map<String, Object> updated = new HashMap<>();
              updated.put("summary_feedback", classification);
         
              return updated;
          }
         
      }
      ```

   3. **RewordingNode**: Rewrites the provided summary. Input: String (summary), Output: String (rewritten).
   
      ```java
      public class RewordingNode implements NodeAction {
         
          private final ChatClient chatClient;
         
          public RewordingNode(ChatClient chatClient) {
              this.chatClient = chatClient;
          }
         
          @Override
          public Map<String, Object> apply(OverAllState state) {
              String summary = (String) state.value("summary").orElse("");
              String prompt = "请将以下摘要用更优美、生动的语言改写，同时保持信息不变：\n\n" + summary;
         
              ChatResponse response = chatClient.prompt(prompt).call().chatResponse();
              String reworded = response.getResult().getOutput().getText();
         
              Map<String, Object> result = new HashMap<>();
              result.put("reworded", reworded);
              return result;
          }
         
      }
      ```

   4. **TitleGeneratorNode**: Generates a title based on the provided summary. Input: String (summary), Output: String (title).
   
      ```java
         public class TitleGeneratorNode implements NodeAction {
            
             private final ChatClient chatClient;
            
             public TitleGeneratorNode(ChatClient chatClient) {
                 this.chatClient = chatClient;
             }
            
             @Override
             public Map<String, Object> apply(OverAllState state) {
                 String content = (String) state.value("reworded").orElse("");
                 String prompt = "请为以下内容生成一个简洁有吸引力的中文标题：\n\n" + content;
            
                 ChatResponse response = chatClient.prompt(prompt).call().chatResponse();
                 String title = response.getResult().getOutput().getText();
            
                 Map<String, Object> result = new HashMap<>();
                 result.put("title", title);
                 return result;
             }
            
         }
      ```

   After introducing the node functions, here's the execution logic of the workflow:
   1. `start -> SummarizerNode` (executed when the controller is called)
   2. `SummarizerNode -> SummaryFeedbackClassifierNode` (unconditional)
   3. `SummaryFeedbackClassifierNode -> RewordingNode` (if the classification is "positive")
   4. `SummaryFeedbackClassifierNode -> SummarizerNode` (if the classification is "negative")
   5. `RewordingNode -> TitleGeneratorNode` (unconditional)
   6. `TitleGeneratorNode -> stop` (returns the result upon method completion)

2. Implementation Details

   1. Custom node classes inherit from `NodeAction`, with business logic implemented in the `apply` method.
   
   2. Conditional edge logic is defined in classes that inherit from `EdgeAction`, also placed in the `apply` method.
   
      ```java
      public class FeedbackDispatcher implements EdgeAction {
      
          @Override
          public String apply(OverAllState state) {
              String feedback = (String) state.value("summary_feedback").orElse("");
              if (feedback.contains("positive")) {
                  return "positive";
              }
              return "negative";
          }
      
      }
      ```

   3. Global state registration and update strategies (currently supports replace and append strategies):
   
      ```java
      OverAllStateFactory stateFactory = () -> {
          OverAllState state = new OverAllState();
          state.registerKeyAndStrategy("original_text", new ReplaceStrategy());
          state.registerKeyAndStrategy("summary", new ReplaceStrategy());
          state.registerKeyAndStrategy("summary_feedback", new ReplaceStrategy());
          state.registerKeyAndStrategy("reworded", new ReplaceStrategy());
          state.registerKeyAndStrategy("title", new ReplaceStrategy());
          return state;
      };
      ```

   4. Workflow visualization (supports PlantUML and Mermaid syntax):
   
      ```java
      // Add PlantUML representation
      GraphRepresentation representation = graph.getGraph(GraphRepresentation.Type.PLANTUML, "writing assistant flow");
      System.out.println("\n=== Writing Assistant UML Flow ===");
      System.out.println(representation.content());
      System.out.println("==================================\n");
      ```

3. Implementation Steps

   1. Import required dependencies (DashScope and Graph modules):
   
      ```xml
      <dependencies>
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-web</artifactId>
          </dependency>
   
          <dependency>
              <groupId>com.alibaba.cloud.ai</groupId>
              <artifactId>spring-ai-alibaba-starter-dashscope</artifactId>
              <version>${spring-ai-alibaba.version}</version>
          </dependency>
   
          <dependency>
              <groupId>com.alibaba.cloud.ai</groupId>
              <artifactId>spring-ai-alibaba-graph-core</artifactId>
              <version>${spring-ai-alibaba-graph-core.version}</version>
          </dependency>
      </dependencies>
      ```

   2. Configure the API key:

      ```yaml
      spring:
        ai:
          dashscope:
            api-key: ${AI_DASHSCOPE_API_KEY}
      ```
      
   3. Create the previously mentioned nodes and conditional edges. Use `node_async()` to create asynchronous nodes and `addConditionalEdges()` to define condition-based transitions:
   
      ```java
      StateGraph graph = new StateGraph("Writing Assistant with Feedback Loop", stateFactory.create())
          .addNode("summarizer", node_async(new SummarizerNode(chatClient)))
          .addNode("feedback_classifier", node_async(new SummaryFeedbackClassifierNode(chatClient, "summary")))
          .addNode("reworder", node_async(new RewordingNode(chatClient)))
          .addNode("title_generator", node_async(new TitleGeneratorNode(chatClient)))
   
          .addEdge(START, "summarizer")
          .addEdge("summarizer", "feedback_classifier")
          .addConditionalEdges("feedback_classifier", edge_async(new FeedbackDispatcher()),
                  Map.of("positive", "reworder", "negative", "summarizer"))
          .addEdge("reworder", "title_generator")
          .addEdge("title_generator", END);
      ```

   4. Build and compile the graph:
   
      ```java
      private final CompiledGraph compiledGraph;
   
      @Autowired
      public WritingAssistantController(@Qualifier("writingAssistantGraph") StateGraph writingAssistantGraph)
          throws GraphStateException {
          this.compiledGraph = writingAssistantGraph.compile();
      }
      ```

   5. Create the controller layer:
   
      ```java
      @GetMapping
      public Map<String, Object> write(@RequestParam("text") String inputText) {
          var resultFuture = compiledGraph.invoke(Map.of("original_text", inputText));
          var result = resultFuture.get();
          return result.data();
      }
      ```

## Testing the Sample

1. Download the project:

   Run the following command to download the source code and enter the `spring-ai-alibaba-graph-example` directory:

   ```bash
   git clone --depth=1 https://github.com/springaialibaba/spring-ai-alibaba-examples.git
   cd spring-ai-alibaba-examples/spring-ai-alibaba-graph-example
   ```

2. Run the project:

   ```bash
   mvn spring-boot:run
   ```

3. Call the example interface:

   ```
   GET http://localhost:8080/write?text=今天我学习了spring-ai-alibaba-graph的相关概念，spring-ai-alibaba-graph做的特别好，感觉特别开心
   ```


### For detailed instructions, please refer to the [README.md](https://github.com/springaialibaba/spring-ai-alibaba-examples/blob/main/spring-ai-alibaba-graph-example/README.md) inside the module.
