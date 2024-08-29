---
id: "question-history-15327"
title: "springai 接入通义大模型的步骤"
date: "2024-06-17"
category: "expertConsultation"
description: "接入Sca(Spring Cloud Alibaba) SpringAI到通义大模型的详细步骤如下：1. **环境准备**：   - 确保Java Development Kit (JDK)版本在JDK 17或更高版本。2. **申请API密钥**：   - 访问[阿里云百炼页面](https://"
---

## 用户问题 ： 
 springai 接入通义大模型的步骤  

---------------
## 专家官方解答 ：

接入Sca(Spring Cloud Alibaba) SpringAI到通义大模型的详细步骤如下：

1. **环境准备**：
   - 确保Java Development Kit (JDK)版本在JDK 17或更高版本。

2. **申请API密钥**：
   - 访问[阿里云百炼页面](https://www.aliyun.com/product/bailian)，登录您的阿里云账号。
   - 选择开通“百炼大模型推理”服务，并等待开通成功的通知。
   - 开通成功后，进入个人中心，选择API-KEY，点击【创建新的API-KEY】以获取API密钥，请妥善保存此密钥。

3. **添加依赖**：
   - 在项目的`pom.xml`文件中，添加Spring Cloud Alibaba 2023.0.1.0版本的依赖，以及`spring-cloud-starter-alibaba-ai`依赖。具体代码如下：
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

4. **配置API密钥**：
   - 在`application.yml`或`application.properties`中配置刚才获取的API密钥。例如，在`application.yml`中配置如下：
     ```yaml
     spring:
       cloud:
         ai:
           tongyi:
             chat:
               options:
                 api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx
     ```
   或在`application.properties`中配置：
     ```
     spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
     ```

5. **编写服务实现类**：
   - 创建一个服务类，如`TongYiSimpleServiceImpl`，并实现聊天逻辑。通过Spring的自动注入功能，注入`ChatClient`和`StreamingChatClient`。示例代码如下：
     ```java
     @Service
     public class TongYiSimpleServiceImpl {
         private final ChatClient chatClient;
         private final StreamingChatClient streamingChatClient;
         
         @Autowired
         public TongYiSimpleServiceImpl(ChatClient chatClient, StreamingChatClient streamingChatClient) {
             this.chatClient = chatClient;
             this.streamingChatClient = streamingChatClient;
         }
         
         public String completion(String message) {
             Prompt prompt = new Prompt(new UserMessage(message));
             return chatClient.call(prompt).getResult().getOutput().getContent();
         }
         
         public Map<String, String> streamCompletion(String message) {
             // 异步流处理逻辑...
         }
     }
     ```

6. **启动应用**：
   - 在Spring Boot的入口类中添加`@SpringBootApplication`注解并启动应用。
     ```java
     @SpringBootApplication
     public class TongYiApplication {
         public static void main(String[] args) {
             SpringApplication.run(TongYiApplication.class, args);
         }
     }
     ```

通过以上步骤，您便完成了Sca(Spring Cloud Alibaba)项目中集成SpringAI并接入通义大模型的基本配置。这使得您的应用能够利用通义大模型实现聊天交互、文本生成等AI功能，而无需深入了解每个AI提供商的特定接口细节，提高了开发效率和代码的可维护性。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai 调用通义大模型实现聊天交互 
 
 * 专家经验：sca ai (spring cloud alibaba ai）介绍 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15602)给我们反馈。
