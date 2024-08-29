---
id: "question-history-15749"
title: "spring cloud  alibaba ai 怎么支持通义的配置参数？"
date: "2024-06-19"
category: "expertConsultation"
description: "要支持Spring Cloud Alibaba AI中的通义配置参数，您可以遵循以下步骤进行配置与使用：1. **确保技术栈兼容性**：   - 确保您的Java开发环境使用的是JDK 17或更高版本。2. **获取阿里云API密钥**：   - 访问[阿里云百炼页面](https://www.al"
---

## 用户问题 ： 
 spring cloud  alibaba ai 怎么支持通义的配置参数？  

---------------
## 专家官方解答 ：

要支持Spring Cloud Alibaba AI中的通义配置参数，您可以遵循以下步骤进行配置与使用：

1. **确保技术栈兼容性**：
   - 确保您的Java开发环境使用的是JDK 17或更高版本。

2. **获取阿里云API密钥**：
   - 访问[阿里云百炼页面](https://www.aliyun.com/product/bailian)，登录您的阿里云账号。
   - 选择开通“百炼大模型推理”服务，并等待开通成功的通知。
   - 开通成功后，进入页面右上角小人图标下的API-KEY管理，创建一个新的API-KEY并记录它。

3. **添加Spring Cloud Alibaba依赖**：
   - 在项目的`pom.xml`文件中，添加Spring Cloud Alibaba依赖管理以及具体的AI组件依赖，确保版本为`2023.0.1.0`或以上：
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

4. **配置通义千问参数**：
   - 在`application.yml`或`application.properties`中配置API-KEY以及其他必要的参数。例如，在`application.yml`中配置如下：
     ```yaml
     spring:
       cloud:
         ai:
           tongyi:
             chat:
               options:
                 api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx  # 替换为您的API-KEY
                 model: qwen-max
     ```
   - 若使用`application.properties`，则配置为：
     ```
     spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
     spring.cloud.ai.tongyi.chat.options.model=qwen-max
     ```

5. **实现聊天服务**：
   - 创建一个服务实现类，注入`ChatClient`和`StreamingChatClient`，并编写同步或异步调用方法来与通义大模型交互，实现具体的业务逻辑。

6. **启动应用**：
   - 确保您的Spring Boot应用入口类已正确配置并启动应用。

通过这些步骤，您的Spring Cloud Alibaba项目就能够成功集成并配置通义大模型的支持，实现所需的AI功能。这些配置和实践基于Spring Cloud Alibaba AI组件，旨在简化与阿里云通义模型的集成过程，提升开发效率和体验。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai 调用通义大模型实现聊天交互 
 
 * 专家经验：sca ai (spring cloud alibaba ai）介绍 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15750)给我们反馈。
