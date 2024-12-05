---
id: "question-history-16209"
title: "在使用Spring Cloud Alibaba并且遇到了`AbstractTongYiS"
date: "2024-09-26"
category: "expertConsultation"
description: "在使用Spring Cloud Alibaba时遇到`AbstractTongYiServiceImpl`类找不到的问题，根据已有知识，这是由于该类属于原始AI demo的一部分，并非Spring Cloud Alibaba AI库的标准组成部分。因此，直接继承`AbstractTongYiServ"
tags: ["sca","spring-cloud-alibaba","AbstractTongYiServiceImpl","类找不到","解决方法","Spring","Cloud"]
keywords: ["sca","spring-cloud-alibaba","AbstractTongYiServiceImpl","类找不到","解决方法","Spring","Cloud"]
---

## 用户问题 ： 
 在使用Spring Cloud Alibaba并且遇到了`AbstractTongYiServiceImpl`类找不到的问题如何处理  

---------------
## 专家官方解答 ：

在使用Spring Cloud Alibaba时遇到`AbstractTongYiServiceImpl`类找不到的问题，根据已有知识，这是由于该类属于原始AI demo的一部分，并非Spring Cloud Alibaba AI库的标准组成部分。因此，直接继承`AbstractTongYiServiceImpl`可能是因为项目依赖或结构理解上的误会。

### 分析原因：
1. **类不属于标准库**：`AbstractTongYiServiceImpl`并非Spring Cloud Alibaba提供的标准服务类。
2. **可能的遗留代码或示例引用**：可能是从某个示例代码或旧版demo中引用而来，而这些代码未随Spring Cloud Alibaba AI的更新而调整。

### 解决步骤：
1. **避免直接继承**：根据建议，无需继承`AbstractTongYiServiceImpl`。应直接使用Spring AI提供的标准化服务对象`ChatClient`和`StreamingChatClient`来处理对话相关的功能。
2. **依赖调整**：确保你的项目依赖正确无误。对于Spring Cloud Alibaba AI，依赖配置应如下所示（请根据实际情况调整版本号）：
   ```xml
   <dependencyManagement>
       <dependencies>
           <dependency>
               <groupId>com.alibaba.cloud</groupId>
               <artifactId>spring-cloud-alibaba-dependencies</artifactId>
               <version>2023.0.1.0</version>
               <type>pom</type>
               <scope>import</scope>
           </dependency>
       </dependencies>
   </dependencyManagement>

   <dependencies>
       <dependency>
           <groupId>com.alibaba.cloud</groupId>
           <artifactId>spring-cloud-starter-alibaba-ai</artifactId>
       </dependency>
   </dependencies>
   ```
3. **代码示例**：按照官方推荐的用法，使用`ChatClient`和`StreamingChatClient`来重构你的服务实现。例如：
   ```java
   import org.springframework.ai.chat.ChatClient;
   import org.springframework.ai.chat.StreamingChatClient;
   
   @Service
   public class YourServiceImpl {
       private final ChatClient chatClient;
       private final StreamingChatClient streamingChatClient;
   
       @Autowired
       public YourServiceImpl(ChatClient chatClient, StreamingChatClient streamingChatClient) {
           this.chatClient = chatClient;
           this.streamingChatClient = streamingChatClient;
       }
   
       // 同步调用示例
       public String completion(String message) {
           Prompt prompt = new Prompt(new UserMessage(message));
           return chatClient.call(prompt).getResult().getOutput().getContent();
       }
   
       // 异步调用示例
       public Mono<Map<String, String>> streamCompletion(String message) {
           return streamingChatClient.stream(new Prompt(message))
               .flatMapIterable(chatResponse -> chatResponse.getResults())
               .map(Content::getOutput)
               .map(Output::getContent)
               .collectList()
               .map(contents -> Collections.singletonMap(message, String.join("", contents)))
               .log();
       }
   }
   ```

### 解释：
以上步骤旨在帮助你脱离对`AbstractTongYiServiceImpl`的依赖，直接采用Spring Cloud Alibaba AI提供的标准化接口进行开发，这样不仅可以解决找不到类的问题，还能享受到更灵活的服务选择和未来版本的兼容性优势。通过使用`ChatClient`和`StreamingChatClient`，你可以无缝地与不同的AI模型交互，无论是对话、文生图还是其他服务，同时保持代码的简洁与可维护性。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：关于AbstractTongYiServiceImpl的说明 
 
 * 专家经验：sca ai (spring cloud alibaba ai）介绍 
 
 * 专家经验：org springframework ai chat model ChatModel 找不到 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16217)给我们反馈。
