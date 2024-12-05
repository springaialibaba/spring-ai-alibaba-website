---
id: "question-history-16119"
title: "千问2的api文档在哪里可以看到？"
date: "2024-09-26"
category: "expertConsultation"
description: "要查看关于Sca(spring-cloud-alibaba)下千问2的API文档，你可以直接参考以下资源：1. **通义千问本身的API文档**：由于Sca可以通过spring cloud alibaba ai来调用通义千问的服务，你应当直接查阅通义千问的官方API文档。这可以在[通义千问API]("
tags: ["sca","spring-cloud-alibaba","千问2","api文档","在哪里","可以","看到"]
keywords: ["sca","spring-cloud-alibaba","千问2","api文档","在哪里","可以","看到"]
---

## 用户问题 ： 
 千问2的api文档在哪里可以看到？  

---------------
## 专家官方解答 ：

要查看关于Sca(spring-cloud-alibaba)下千问2的API文档，你可以直接参考以下资源：

1. **通义千问本身的API文档**：由于Sca可以通过spring cloud alibaba ai来调用通义千问的服务，你应当直接查阅通义千问的官方API文档。这可以在[通义千问API](https://api.aliyun.com/api-tools/sdk/bailian?spm=5176.29228872.J_3qCTT-C_2h2ygmnKNbKbb.4.8fae38b1cpU3vw&version=2023-06-01&language=java-async-tea&tab=primer-doc&scm=20140722.X_data-14ce560b9a2a78db69e3._.V_1)链接中找到。这里详细描述了如何直接与通义千问交互，包括但不限于千问2的调用方式。

请注意，尽管这些API是基于通义千问设计的，但它们为与千问2交互提供了基础。如果你打算在spring-cloud-alibaba环境中集成并调用本地部署的千问2，你可能需要根据[第3篇参考内容](#F9g2I)中提及的方法自定义spring ai starter以接入本地模型。这样，你可以利用通义千问API的结构来设计与本地千问2的交互逻辑。

综上所述，直接访问通义千问的API文档是获取千问2 API详情的最佳途径。同时，考虑到可能存在的本地部署需求，自定义spring ai starter以适应本地环境也是一个可行的方案。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：通义千问的API说明 
 
 * 专家经验：sca官网介绍 
 
 * 专家经验：spring ai如何支持本地部署的千问2 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16141)给我们反馈。
