---
id: "question-history-14688"
title: "springcloud alibana的默认数据库连接池使用什么"
date: "2024-09-26"
category: "expertConsultation"
description: "在Spring Cloud Alibaba项目中，默认使用的数据库连接池是Apache Druid。这一信息可以从提供的配置示例看出，其中提到了诸如`spring.datasource.druid.url`、`spring.datasource.druid.username`等配置项，这些都是Dru"
tags: ["sca","spring-cloud-alibaba","springcloud","alibaba","默认","数据库","连接池"]
keywords: ["sca","spring-cloud-alibaba","springcloud","alibaba","默认","数据库","连接池"]
---

## 用户问题 ： 
 springcloud alibana的默认数据库连接池使用什么  

---------------
## 专家官方解答 ：

在Spring Cloud Alibaba项目中，默认使用的数据库连接池是Apache Druid。这一信息可以从提供的配置示例看出，其中提到了诸如`spring.datasource.druid.url`、`spring.datasource.druid.username`等配置项，这些都是Druid连接池的配置参数。这表明在集成Spring Cloud Alibaba时，若未特别指定其他连接池，Druid会被作为默认选项用于数据库连接管理。

简而言之，**默认数据库连接池为Apache Druid**。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：spring boot 与 alibaba druid的整合 
 
 * 专家经验：Nacos 融合 Spring Cloud，成为注册配置中心 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=14738)给我们反馈。
