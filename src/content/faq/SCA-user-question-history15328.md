---
id: "question-history-15328"
title: "springai 使用通义千问的具体步骤和方法"
date: "2024-09-26"
category: "expertConsultation"
description: "根据您的问题，您想了解如何在Spring Cloud Alibaba项目中使用通义千问。以下是详细步骤和方法，依托于提供的知识内容：### 步骤分析与实施：1. **确保Java环境**：   首先，请确认您的开发环境中的JDK版本是否在JDK 17或以上。这是运行Spring Cloud Alib"
tags: ["sca","spring-cloud-alibaba","springai","通义千问","","方法"]
keywords: ["sca","spring-cloud-alibaba","springai","通义千问","","方法"]
---

## 用户问题 ： 
 springai 使用通义千问的具体步骤和方法  

---------------
## 专家官方解答 ：

根据您的问题，您想了解如何在Spring Cloud Alibaba项目中使用通义千问。以下是详细步骤和方法，依托于提供的知识内容：

### 步骤分析与实施：

1. **确保Java环境**：
   首先，请确认您的开发环境中的JDK版本是否在JDK 17或以上。这是运行Spring Cloud Alibaba与通义千问集成所必需的。

2. **申请API-Key**：
   - 访问[阿里云百炼页面](https://www.aliyun.com/product/bailian)。
   - 登录您的阿里云账号。
   - 选择开通“百炼大模型推理”服务，等待开通短信通知。
   - 开通成功后，登录页面，点击右上角小人图标，进入API-KEY管理界面，创建一个新的API-KEY。请妥善保存此Key，后续配置将用到。

3. **添加依赖**：
   在项目的`pom.xml`文件中，加入Spring Cloud Alibaba依赖，确保版本为2023.0.1.0或以上（根据实际最新版本调整），并引入AI相关组件：
   ```xml
   <!-- 添加依赖管理 -->
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

   <!-- 添加具体依赖 -->
   <dependencies>
       <dependency>
           <groupId>com.alibaba.cloud</groupId>
           <artifactId>spring-cloud-starter-alibaba-ai</artifactId>
       </dependency>
   </dependencies>
   ```

4. **配置API-Key**：
   在`application.yml`或`application.properties`中配置刚才获取的API-KEY：
   ```yaml
   # application.yml 示例
   spring:
     cloud:
       ai:
         tongyi:
           chat:
             options:
               api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx
   
   # 或者在application.properties
   spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
   ```

5. **编写服务实现类**：
   创建一个服务类，如`TongYiSimpleServiceImpl`，使用`@Service`注解标记，并通过构造器注入`ChatClient`和`StreamingChatClient`。编写同步和异步调用通义千问的方法，如`completion`和`streamCompletion`。

6. **启动应用**：
   确保您的Spring Boot应用入口类（如`TongYiApplication`）上有`@SpringBootApplication`注解，并从该类启动应用。

### 解释说明：
以上步骤详细介绍了如何在Spring Cloud Alibaba项目中集成通义千问，从环境准备、依赖管理、配置设定到服务实现，每一步都是为了确保您能够顺利地将AI能力集成到您的业务中。通过这些步骤，您可以开始利用通义千问的智能对话功能，为用户提供更加丰富和个性化的交互体验。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：spring ai alibaba 使用说明 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15603)给我们反馈。
