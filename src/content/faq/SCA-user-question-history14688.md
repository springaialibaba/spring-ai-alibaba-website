---
id: "question-history-14688"
title: "springcloud alibana的默认数据库连接池使用什么"
date: "2024-05-29"
category: "expertConsultation"
description: "在Spring Cloud Alibaba项目中，默认使用的数据库连接池是Apache Druid。这一信息可以从提供的配置示例看出，其中提到了诸如`spring.datasource.druid.url`、`spring.datasource.druid.username`等配置项，这些都是Dru"
tags: ["spring-cloud-alibaba","springcloud","alibana","默认数据库连接池"]
keywords: ["spring-cloud-alibaba","springcloud","alibana","默认数据库连接池"]
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

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=14738)给我们反馈。
