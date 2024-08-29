---
id: "question-history-14690"
title: "Spring Ai 是什么"
date: "2024-05-29"
category: "expertConsultation"
description: "Spring AI 是一个面向AI工程的应用框架，它旨在将Spring生态系统的核心设计原则，例如可移植性和模块化，扩展至人工智能领域。该框架通过推广使用POJOs（Plain Old Java Objects）作为构建AI应用的基础单元，简化了AI解决方案的开发过程。其核心优势在于标准化不同AI服"
tags: ["spring-cloud-alibaba","Spring Ai"]
keywords: ["spring-cloud-alibaba","Spring Ai"]
---

## 用户问题 ： 
 Spring Ai 是什么  

---------------
## 专家官方解答 ：

Spring AI 是一个面向AI工程的应用框架，它旨在将Spring生态系统的核心设计原则，例如可移植性和模块化，扩展至人工智能领域。该框架通过推广使用POJOs（Plain Old Java Objects）作为构建AI应用的基础单元，简化了AI解决方案的开发过程。其核心优势在于标准化不同AI服务提供商（如OpenAI、Azure、阿里云等）的接口，允许开发者通过更改配置快速切换不同的AI服务实现，无需重写大量代码。这显著降低了跨平台迁移的成本并提高了开发效率。

Spring Cloud Alibaba AI 则是Spring AI框架针对阿里云服务的一个具体实现。它基于Spring AI 0.8.1版本API，集成了阿里云的灵积模型服务，特别是“通义”系列大模型。通过Spring Cloud Alibaba AI，开发者能够便捷地接入阿里云的聊天、图像生成、语音合成等AI能力，利用诸如OutputParser（自动将模型输出映射为POJO）、Prompt Template、以及Prompt Stuffing等功能，进一步丰富和定制AI应用场景。具体实现时，需要配置阿里云提供的API密钥，并通过Spring Boot应用进行集成，编写相应的服务实现类来完成特定的AI任务交互。

综上所述，Spring Cloud Alibaba AI 不仅提供了对接阿里云AI服务的技术桥梁，还封装了复杂的底层交互逻辑，使开发者能够以熟悉的Spring方式快速构建和部署AI增强的应用程序。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai (spring cloud alibaba ai）介绍 
 
 * 专家经验：sca ai 调用通义大模型实现聊天交互 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=14740)给我们反馈。
