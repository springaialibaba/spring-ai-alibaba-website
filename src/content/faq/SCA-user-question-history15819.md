---
id: "question-history-15819"
title: "com.alibaba.cloud.ai.tongyi.exception.TongYi"
date: "2024-09-26"
category: "expertConsultation"
description: "根据你提供的错误信息`com.alibaba.cloud.ai.tongyi.exception.TongYiException: Can not find api-key`，问题很明显是由于系统在配置中未能找到必要的API密钥(api-key)所导致的。根据我了解的知识中的内容，我们可以按照以下步"
tags: ["sca","spring-cloud-alibaba","comalibabacloudai","tongyi-exception","TongYiException","api-key","not-found"]
keywords: ["sca","spring-cloud-alibaba","comalibabacloudai","tongyi-exception","TongYiException","api-key","not-found"]
---

## 用户问题 ： 
 com.alibaba.cloud.ai.tongyi.exception.TongYiException: Can not find api-key  

---------------
## 专家官方解答 ：

根据你提供的错误信息`com.alibaba.cloud.ai.tongyi.exception.TongYiException: Can not find api-key`，问题很明显是由于系统在配置中未能找到必要的API密钥(api-key)所导致的。根据我了解的知识中的内容，我们可以按照以下步骤解决这个问题：

1. **检查配置文件**：请确保你的`application.yml`或`application.properties`文件中正确设置了`spring.cloud.ai.tongyi.chat.options.api-key`，并且该值已经被替换为你从阿里云获取的有效API-KEY。配置示例如下：

   对于`application.yml`：
   ```yaml
   spring:
     cloud:
       ai:
         tongyi:
           chat:
             options:
               api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx  # 这里应替换为你的实际API-KEY
               model: qwen-max
   ```
   
   或对于`application.properties`：
   ```properties
   spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
   ```

2. **确认API-KEY有效性**：请再次确认你使用的API-KEY是否有效且未过期，以及它是否有调用通义千问服务的权限。可以通过阿里云控制台验证API-KEY的有效性。

3. **环境变量与配置优先级**：如果你的项目运行环境中存在环境变量或命令行参数也尝试设置`api-key`，请确保这些值没有覆盖或冲突，并且是正确的。

4. **重新启动应用**：完成上述检查和修改后，确保重启你的Spring Boot应用，因为某些配置更改仅在应用启动时加载。

**解释**：
- 步骤1至步骤3是为了直接定位并修正配置中缺失或错误的API-KEY问题，这是报错的直接原因。
- 步骤4是因为Java应用通常在启动时读取配置文件，任何在运行时对配置文件的改动不会被自动应用，因此需要重启以确保新的配置生效。

如果在完成这些步骤后问题仍然存在，可能需要检查是否有其他配置错误或者查看应用日志以获取更详细的错误信息。


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
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15838)给我们反馈。
