---
id: "question-history-15824"
title: "spring cloud alibaba ai使用的是什么模型"
date: "2024-06-21"
category: "expertConsultation"
description: "Spring Cloud Alibaba AI主要使用了阿里云的通义大模型系列进行AI能力的集成。这些模型涵盖了多种应用场景，例如对话、文生图、文生语音等，并且提供了OutputParser（实现从String到自动POJO映射）、Prompt Template以及让AI模型接入外部数据（Promp"
---

## 用户问题 ： 
 spring cloud alibaba ai使用的是什么模型  

---------------
## 专家官方解答 ：

Spring Cloud Alibaba AI主要使用了阿里云的通义大模型系列进行AI能力的集成。这些模型涵盖了多种应用场景，例如对话、文生图、文生语音等，并且提供了OutputParser（实现从String到自动POJO映射）、Prompt Template以及让AI模型接入外部数据（Prompt Stuff）等功能。这意味着，通过Spring Cloud Alibaba AI，开发者能够便捷地接入如通义千问这样的高级AI模型，实现诸如聊天交互、内容生成等能力。

具体到使用的模型细节，尽管核心框架支持灵活切换不同AI提供商，Spring Cloud Alibaba AI当前重点适配的是阿里云灵积模型服务中的通义系列模型。例如，配置中提到了`model: qwen-max`，这表明它直接支持了阿里云的“通义千问”模型作为默认或示例模型之一。

配置实例中展示了如何在项目中设置模型参数，比如指定模型版本为`qwen-max`，以及如何配置API密钥以连接到阿里云的服务。因此，当询问Spring Cloud Alibaba AI使用的是什么模型时，答案聚焦于它对阿里云通义模型系列，特别是如`qwen-max`这样的大模型的支持。

为了使用这些功能，你需要按照提供的步骤操作：确保JDK版本、申请阿里云API密钥、添加依赖、配置文件设置、编写服务实现类，最后启动应用。这样，你就能够基于Spring Cloud Alibaba AI框架开发具备AI能力的应用，享受其带来的标准化接口、易用性和灵活性优势。

请注意，根据具体需求，模型的选择（如`qwen-max`）或其他配置参数可能需要根据阿里云的更新或个人项目需求调整。此外，虽然Spring AI体系设计为支持多模型切换，但直接关于其他非阿里云模型（如OpenAI）的集成指导在当前引用的知识中并未详细展开，主要是围绕阿里云灵积模型服务的说明。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai (spring cloud alibaba ai）介绍 
 
 * 专家经验：spring ai alibaba 是否支持其他模型比如open ai？ 
 
 * 专家经验：sca ai 调用通义大模型实现聊天交互 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15843)给我们反馈。
