---
id: "question-history-16815"
title: "Spring cloud netflix是不是被spring Cloud alibaba"
date: "2024-09-26"
category: "expertConsultation"
description: "根据我了解的知识，Spring Cloud Netflix 与 Spring Cloud Alibaba 并非简单的淘汰关系。Spring Cloud Netflix 是早期为微服务架构提供的一系列组件，如 Eureka（服务发现）、Hystrix（熔断器）、Zuul（API 网关）等，这些组件在微"
tags: ["sca","spring-cloud-alibaba","spring-cloud-netflix","淘汰","对比","使用","更新"]
keywords: ["sca","spring-cloud-alibaba","spring-cloud-netflix","淘汰","对比","使用","更新"]
---

## 用户问题 ： 
 Spring cloud netflix是不是被spring Cloud alibaba淘汰？  

---------------
## 专家官方解答 ：

根据我了解的知识，Spring Cloud Netflix 与 Spring Cloud Alibaba 并非简单的淘汰关系。Spring Cloud Netflix 是早期为微服务架构提供的一系列组件，如 Eureka（服务发现）、Hystrix（熔断器）、Zuul（API 网关）等，这些组件在微服务领域曾起到过重要作用。然而，近年来 Netflix 已宣布对其中多个组件停止了主动维护。

相比之下，Spring Cloud Alibaba 是阿里巴巴提供的一个面向微服务的开发框架，它基于 Spring Cloud 生态，提供了包括服务发现（Nacos）、配置管理（Nacos）、熔断器（Sentinel）、分布式任务调度（Seata）等一系列组件和服务治理能力，特别针对国内的使用环境和需求进行了优化，具有很好的本土化支持和服务生态。

因此，说 Spring Cloud Netflix 被 Spring Cloud Alibaba "淘汰"并不准确，更恰当的理解是随着技术的发展和需求的变化，Spring Cloud Alibaba 作为后起之秀，提供了更多现代微服务架构所需的功能和支持，成为了许多开发者尤其是中国开发者的新选择。Spring Cloud 生态本身也支持多种实现方案，开发者可以根据实际需求和技术栈偏好来选择适合的组件库。

综上所述，Spring Cloud Netflix 与 Spring Cloud Alibaba 两者各有侧重，选择哪个主要取决于项目需求、技术支持生命周期以及对未来技术趋势的考量。对于寻求更活跃维护和本土化服务的用户，Spring Cloud Alibaba 是一个强有力的选择。

参考链接：
- [Spring Cloud Alibaba GitHub](https://github.com/alibaba/spring-cloud-alibaba)
- [Spring Cloud Alibaba FAQ](https://github.com/spring-cloud-alibaba-group/spring-cloud-alibaba-group.github.io/blob/master/i18n/zh-cn/docusaurus-plugin-content-docs/current/overview/faq.md)


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca(spring-cloud-alibaba) FAQ 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16835)给我们反馈。
