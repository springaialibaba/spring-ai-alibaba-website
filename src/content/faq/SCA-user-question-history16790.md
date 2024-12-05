---
id: "question-history-16790"
title: "使用通义千问时怎么配置指定使用某个模型"
date: "2024-09-26"
category: "expertConsultation"
description: "当使用Spring Cloud Alibaba集成通义千问时，若需配置指定使用某个模型，您可以遵循以下步骤操作：1. **确认模型可用性**：   在决定配置前，首先确保您想要使用的模型是通义千问支持的，并且已经在阿里云的服务列表中启用。这一步虽然不在直接操作流程内，但对选择合适的模型至关重要。2."
tags: ["sca","spring-cloud-alibaba","通义千问","配置","指定","模型","使用"]
keywords: ["sca","spring-cloud-alibaba","通义千问","配置","指定","模型","使用"]
---

## 用户问题 ： 
 使用通义千问时怎么配置指定使用某个模型  

---------------
## 专家官方解答 ：

当使用Spring Cloud Alibaba集成通义千问时，若需配置指定使用某个模型，您可以遵循以下步骤操作：

1. **确认模型可用性**：
   在决定配置前，首先确保您想要使用的模型是通义千问支持的，并且已经在阿里云的服务列表中启用。这一步虽然不在直接操作流程内，但对选择合适的模型至关重要。

2. **获取API-Key**：
   根据知识中提供的指南，首先需要在阿里云平台上申请API-Key。访问[阿里云百炼页面](https://www.aliyun.com/product/bailian)，完成账号登录、服务开通及API-Key的创建。请务必保存好此Key，后续配置将用到。

3. **添加依赖**：
   在项目的`pom.xml`文件中，确保已经加入了Spring Cloud Alibaba相关依赖，特别是`spring-cloud-starter-alibaba-ai`，并设置为推荐的版本，例如2023.0.1.0。

4. **配置模型参数**：
   在`application.yml`或`application.properties`文件中，添加相应的配置项以指定模型。例如，若想使用`qwen-max`模型，配置应如下所示：
   ```yaml
   # application.yml 示例
   spring:
     cloud:
       ai:
         tongyi:
           chat:
             options:
               api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx # 替换为实际的API-Key
               model: qwen-max # 指定模型名称
   ```
   或者，如果是`application.properties`格式：
   ```properties
   # application.properties 示例
   spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
   spring.cloud.ai.tongyi.chat.options.model=qwen-max
   ```
   这里，`model`属性用于设定所使用的模型名称。

5. **服务实现**：
   实现聊天服务时，无需直接配置模型选择代码中，因为模型已经在配置文件中指定。通过自动注入的`ChatClient`或`StreamingChatClient`，您就可以根据需求调用相应的聊天方法了。比如上面示例代码中的`completion`和`streamCompletion`方法，它们会依据配置文件中指定的模型进行交互。

**解释**：
以上步骤确保了您能够灵活地在Spring Cloud Alibaba项目中配置和使用特定的通义千问模型。通过环境配置而非硬编码方式指定模型，使得模型的选择更加灵活且易于管理，同时也便于未来可能的模型切换或扩展。这样不仅遵循了Spring框架的配置优先原则，也保证了代码的整洁和可维护性。


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
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16794)给我们反馈。
