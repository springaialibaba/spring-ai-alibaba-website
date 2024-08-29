---
id: "question-history-15323"
title: "怎么用spring ai 实现与通义 聊天交互？"
date: "2024-06-17"
category: "expertConsultation"
description: "要使用Spring Cloud Alibaba实现与通义的聊天交互，您可以遵循以下详细步骤：1. **确保技术栈兼容性**：   确保您的项目环境满足Java Development Kit (JDK)版本要求，即JDK17或更高版本。2. **获取通义千问的API密钥**：   - 访问[阿里云百"
---

## 用户问题 ： 
 怎么用spring ai 实现与通义 聊天交互？  

---------------
## 专家官方解答 ：

要使用Spring Cloud Alibaba实现与通义的聊天交互，您可以遵循以下详细步骤：

1. **确保技术栈兼容性**：
   确保您的项目环境满足Java Development Kit (JDK)版本要求，即JDK17或更高版本。

2. **获取通义千问的API密钥**：
   - 访问[阿里云百炼页面](https://www.aliyun.com/product/bailian)，登录您的阿里云账号。
   - 选择开通“百炼大模型推理”服务，并等待开通成功的通知。
   - 成功开通后，进入个人中心，点击右上角小人图标，选择API-KEY，创建新的API-KEY并记录它。

3. **添加依赖**：
   在项目的`pom.xml`文件中，加入Spring Cloud Alibaba 2023.0.1.0版本的依赖，以及`spring-cloud-starter-alibaba-ai`依赖。示例如下：
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
   在`application.yml`或`application.properties`中配置您的API-KEY，例如：
   ```yaml
   spring:
     cloud:
       ai:
         tongyi:
           chat:
             options:
               api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx  # 替换为您的实际API-KEY
   ```
   或者在`application.properties`：
   ```properties
   spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
   ```

5. **编写服务实现类**：
   创建一个服务类，如`TongYiSimpleServiceImpl`，并利用`ChatClient`和`StreamingChatClient`来实现同步和异步的聊天逻辑。

6. **启动应用**：
   最后，在Spring Boot的入口类中启动应用，通常这个类会有一个`main`方法并使用`SpringApplication.run()`方法。

通过这些步骤，您就能在Spring Cloud Alibaba项目中集成通义千问，实现聊天交互功能。这不仅简化了与AI模型的交互过程，还允许您利用Spring Cloud Alibaba提供的其他高级功能，如文生图、文生语音等。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai 调用通义大模型实现聊天交互 
 
 * 专家经验：sca ai (spring cloud alibaba ai）介绍 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15601)给我们反馈。
