---
id: "question-history-16852"
title: "Spring是怎么解决Bean之间的循环依赖的？"
date: "2024-09-26"
category: "expertConsultation"
description: "Spring框架解决Bean之间的循环依赖问题主要依赖于其容器的即时（懒）初始化、依赖注入的实现机制以及三级缓存策略。虽然Spring Cloud Alibaba主要关注微服务架构层面的解决方案，如服务发现、配置管理、流量控制等，但理解Spring如何处理循环依赖对于使用Spring Cloud A"
tags: ["spring-cloud-alibaba","spring","循环依赖","解决方法","Bean","互相注入","Spring框架"]
keywords: ["spring-cloud-alibaba","spring","循环依赖","解决方法","Bean","互相注入","Spring框架"]
---

## 用户问题 ： 
 Spring是怎么解决Bean之间的循环依赖的？  

---------------
## 专家官方解答 ：

Spring框架解决Bean之间的循环依赖问题主要依赖于其容器的即时（懒）初始化、依赖注入的实现机制以及三级缓存策略。虽然Spring Cloud Alibaba主要关注微服务架构层面的解决方案，如服务发现、配置管理、流量控制等，但理解Spring如何处理循环依赖对于使用Spring Cloud Alibaba构建微服务应用的基础仍然重要。以下是对Spring解决Bean循环依赖原理的分析：

### 1. 原因分析

在Spring框架中，Bean之间的循环依赖通常发生在以下两种情况：
- **构造器注入**：直接在构造器中注入另一个Bean，如果这两个Bean相互依赖，会导致初始化失败。
- **setter或字段注入**：通过setter方法或字段注入方式进行依赖注入时，Spring有机会在Bean完全初始化之前解决循环依赖问题。

### 2. 解决方案概述

Spring通过以下机制解决非构造器注入的循环依赖问题：
- **Bean的即时初始化**：Spring容器在遇到依赖时才去创建相应的Bean，而不是一次性创建所有Bean。
- **三级缓存策略**：
  - **一级缓存（singletonObjects）**：存放完全初始化的单例Bean。
  - **二级缓存（earlySingletonObjects）**：存放提前曝光的Bean对象，即尚未完成初始化但已可被其他Bean依赖的实例。
  - **三级缓存（singletonFactories）**：存放用于创建Bean的工厂对象，比二级缓存更早，但在Bean初始化完成前移至二级缓存。

### 具体步骤与解释

1. **当Spring容器创建Bean A时**，首先尝试从一级缓存中获取，如果不存在则开始创建。
2. **创建过程中，如果A依赖于未完成初始化的Bean B**，此时Spring不会立即报错，而是继续创建B。
3. **创建Bean B时**，如果B也依赖于A（形成循环依赖），Spring会检查A是否已经在二级或三级缓存中。如果是，直接使用该不完全初始化的实例注入到B中，避免了直接构造器注入导致的死锁。
4. **对于A，Spring将其放入三级缓存（singletonFactories）**，并继续A的初始化过程。
5. **一旦A的初始化完成**，其实例会被移动到二级缓存（earlySingletonObjects），随后再移至一级缓存（singletonObjects），同时从三级缓存中移除对应的工厂对象。
6. **最终，所有循环依赖的Bean都能通过这种方式完成初始化**，尽管在某些阶段它们是以不完全初始化的形式存在。

请注意，这个过程仅适用于通过setter方法或字段注入的循环依赖，构造器注入的循环依赖依然会导致初始化失败。

### 注意

虽然上述讨论基于Spring核心框架的功能，但它为使用Spring Cloud Alibaba构建的应用提供了坚实的底层支撑。在实际应用Spring Cloud Alibaba时，了解这些基础机制有助于更好地设计和调试微服务架构中的服务。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca(spring-cloud-alibaba) Spring Cloud Alibaba 是什么 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16871)给我们反馈。
