---
id: "question-history-15756"
title: "spring ai 怎么适配 阿里大模型"
date: "2024-06-20"
category: "expertConsultation"
description: "Spring Cloud Alibaba AI 为了适配阿里大模型，主要是通过以下步骤进行的，这些步骤已经在提供的知识内容中有详细阐述：1. **确保技术栈兼容性**：首先确认你的项目技术环境，特别是JDK版本需在JDK 17及以上，以保证与Spring Cloud Alibaba AI的兼容性。2"
---

## 用户问题 ： 
 spring ai 怎么适配 阿里大模型  

---------------
## 专家官方解答 ：

Spring Cloud Alibaba AI 为了适配阿里大模型，主要是通过以下步骤进行的，这些步骤已经在提供的知识内容中有详细阐述：

1. **确保技术栈兼容性**：首先确认你的项目技术环境，特别是JDK版本需在JDK 17及以上，以保证与Spring Cloud Alibaba AI的兼容性。

2. **获取API密钥**：访问阿里云百炼页面，完成账号登录并开通“百炼大模型推理”服务。在成功开通后，创建一个新的API-KEY并妥善保存，这是后续与阿里云大模型服务交互的关键凭证。

3. **引入依赖**：在项目的`pom.xml`文件中，添加Spring Cloud Alibaba依赖，确保版本为2023.0.1.0或以上，并引入`spring-cloud-starter-alibaba-ai`依赖，以便使用阿里云AI服务的相关功能。

4. **配置应用**：在`application.yml`或`application.properties`中，正确配置你的API-KEY以及所选择的模型（例如`qwen-max`）。这一步骤确保了应用能够根据配置连接到阿里云的AI服务。

5. **编写服务实现**：利用Spring框架的依赖注入特性，自动注入`ChatClient`和`StreamingChatClient`。通过这两个客户端，你可以方便地实现同步或异步的聊天逻辑，而无需关注底层的通信细节。

6. **启动应用**：最后，通过Spring Boot的启动类启动你的应用，现在你的应用已经具备了通过Spring Cloud Alibaba AI调用阿里大模型进行交互的能力。

**解释说明**：
- **标准化接入**：Spring Cloud Alibaba AI通过标准化的API封装，简化了对接阿里云大模型的过程，使得开发者能够快速集成并调用AI服务，无需深入了解每个模型的具体调用方式。
- **灵活性与易用性**：提供了同步与异步两种调用方式，满足不同场景下的性能需求。同时，通过配置文件即可灵活调整模型选择和其他参数，提高了开发效率和应用的灵活性。
- **自动化的POJO映射**：提及的OutputParser特性能够自动将模型输出映射为Java对象（POJO），进一步简化了处理AI响应数据的复杂度。

综上所述，Spring Cloud Alibaba AI通过一系列清晰的步骤和设计，有效适配了阿里大模型，为开发者提供了一站式的AI集成解决方案。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai (spring cloud alibaba ai）介绍 
 
 * 专家经验：sca ai 调用通义大模型实现聊天交互 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15757)给我们反馈。
