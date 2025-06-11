---
title: 什么是 Spring AI Alibaba Graph
keywords: [Spring AI,通义千问,百炼,智能体应用]
description: "Spring AI 与通义千问集成，使用 Spring AI 开发 Java AI 应用。"
---

Spring AI Alibaba Graph实现了构建Graph结构的适配，通过调用`spring-ai-alibaba-graph-core`模块中的方法即可实现自定义Graph。

## 快速体验示例

> 注意：因为 Spring AI Alibaba 基于 Spring Boot 3.x 开发，因此本地 JDK 版本要求为 17 及以上。

### 本章内容介绍如何快速上手Spring AI Alibaba Graph模块。

1. 创建样例工作流

   我们打算创建如下图所示的工作流：

   ![img.png](img.png)
   
   从上图可以看到，工作流包含四个节点，节点间通过边连接起来。对每个节点的作用进行简要介绍：

   1. **SummarizerNode**：将输入的文本进行简明的摘要，输入为文本(String)，输出为摘要(String)。
   
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
      
   2. **SummaryFeedbackClassifierNode**：根据用户输入的摘要进行分类，输入为摘要(String)，输出为分类结果(Map<String, Object>)。
   
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
      
   3. **RewordingNode**：根据用户输入的摘要进行重写，输入为摘要(String)，输出为重写后的摘要(String)。
   
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
      
   4. **TitleGeneratorNode**：根据用户输入的摘要生成标题，输入为摘要(String)，输出为标题(String)。
   
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
   
   在介绍完工作流的节点信息之后，我们继续介绍工作流的执行逻辑：
   1. start->SummarizerNode(controller调用时执行)
   2. SummarizerNode->SummaryFeedbackClassifierNode(无条件)
   3. SummaryFeedbackClassifierNode->RewordingNode(分类结果为positive时执行)
   4. SummaryFeedbackClassifierNode->SummarizerNode(分类结果为negative时执行)
   5. RewordingNode->TitleGeneratorNode(无条件)
   6. TitleGeneratorNode->stop(方法结束返回结果)

2. 实现细节讲解：

   1. 实例节点继承`NodeAction`类，将具体实现过程放在`apply`方法中。
   
   2. 实例`ConditionalEdges`继承`EdgeAction`类，将条件判断逻辑放在`apply`方法中。
   
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
      
   3. 全局状态注册和更新策略(目前更新策略原生支持替换策略和追加策略)
   
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
      
   4. 工作流打印(目前支持PlantUML语法打印和Mermaid语法打印)
   
      ```java
        // 添加 PlantUML 打印
        GraphRepresentation representation = graph.getGraph(GraphRepresentation.Type.PLANTUML, "writing assistant flow");
        System.out.println("\n=== Writing Assistant UML Flow ===");
        System.out.println(representation.content());
        System.out.println("==================================\n");
      ```
      
3. 具体实现流程：

   1. 导入如下依赖(百炼模块的依赖和graph模块的依赖)
   
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
      
   2. 配置api-key
   
      ```yaml
      spring:
        ai:
          dashscope:
            api-key: ${AI_DASHSCOPE_API_KEY}
      ```
      
   3. 按照上面提示创建上述节点和ConditionalEdges。其中node_async()方法用于创建异步节点，addConditionEdges()方法用于创建条件边。
   
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
      
   4. 构建工作流，并编译graph
   
      ```java
         private final CompiledGraph compiledGraph;
      
         @Autowired
         public WritingAssistantController(@Qualifier("writingAssistantGraph") StateGraph writingAssistantGraph)
         throws GraphStateException {
         this.compiledGraph = writingAssistantGraph.compile();
         }
      ```
      
   5. 创建controller层
   
      ```java
         @GetMapping
         public Map<String, Object> write(@RequestParam("text") String inputText) {
         var resultFuture = compiledGraph.invoke(Map.of("original_text", inputText));
         var result = resultFuture.get();
         return result.data();
         }
      ```

## 上述样例测试流程：

1. 下载项目

   运行以下命令下载源码，进入`spring-ai-alibaba-graph-example`示例目录：

   ```shell
   git clone --depth=1 https://github.com/springaialibaba/spring-ai-alibaba-examples.git
   cd spring-ai-alibaba-examples/spring-ai-alibaba-graph-example
   ```
   
2. 运行项目

   ```bash
   # 启动服务
   mvn spring-boot:run
   ```
   
3. 实例接口调用

   ```
   GET http://localhost:8080/write?text=今天我学习了spring-ai-alibaba-graph的相关概念，spring-ai-alibaba-graph做的特别好， 感觉特别开心
   ```
   

### 具体运行步骤查看模块内部的[README.md](https://github.com/springaialibaba/spring-ai-alibaba-examples/blob/main/spring-ai-alibaba-graph-example/README.md)