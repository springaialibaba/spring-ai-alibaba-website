---
id: "question-history-14622"
title: "怎么用spring ai 接入通义千问？"
date: "2024-09-26"
category: "expertConsultation"
description: "要使用Spring Cloud Alibaba接入通义千问，您可以按照以下详细步骤操作：1. **环境准备**：   - 确保您的开发环境已安装JDK 17或更高版本。2. **申请API-Key**：   - 访问[阿里云百炼页面](https://www.aliyun.com/product/b"
tags: ["sca","spring-cloud-alibaba","spring","ai","通义千问","接入","使用"]
keywords: ["sca","spring-cloud-alibaba","spring","ai","通义千问","接入","使用"]
---

## 用户问题 ： 
 怎么用spring ai 接入通义千问？  

---------------
## 专家官方解答 ：

要使用Spring Cloud Alibaba接入通义千问，您可以按照以下详细步骤操作：

1. **环境准备**：
   - 确保您的开发环境已安装JDK 17或更高版本。

2. **申请API-Key**：
   - 访问[阿里云百炼页面](https://www.aliyun.com/product/bailian)，登录您的阿里云账号。
   - 选择开通“百炼大模型推理”服务，等待开通成功的通知。
   - 开通成功后，进入账户设置，选择API-KEY，创建一个新的API-KEY并记录下来。

3. **添加依赖**：
   - 在项目的`pom.xml`文件中，加入Spring Cloud Alibaba 2023.0.1.0版本的依赖。代码如下：
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

4. **配置API-Key**：
   - 在`application.yml`或`application.properties`中配置通义千问的API-Key。例如，在`application.yml`中配置如下：
     ```yaml
     spring:
       cloud:
         ai:
           tongyi:
             chat:
               options:
                 api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx  # 替换为您的API-KEY
     ```
   或在`application.properties`中配置：
     ```properties
     spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
     ```

5. **编写服务实现类**：
   - 创建一个服务类，如`TongYiSimpleServiceImpl`，并注入`ChatClient`和`StreamingChatClient`以实现聊天逻辑。示例代码如下：
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
   - 在Spring Boot的入口类中使用`@SpringBootApplication`注解启动应用：
     ```java
     @SpringBootApplication
     public class TongYiApplication {
         public static void main(String[] args) {
             SpringApplication.run(TongYiApplication.class, args);
         }
     }
     ```

通过以上步骤，您就已经成功地使用Spring Cloud Alibaba整合了通义千问，可以开始在您的项目中实现AI聊天功能。这套流程简化了与不同AI服务提供商的对接工作，让您能够快速切换服务而无需大幅修改代码，体现了Spring AI框架的灵活性和易用性。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：spring ai alibaba 使用说明 
 
 * 专家经验：sca ai (spring cloud alibaba ai）介绍 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15599)给我们反馈。
