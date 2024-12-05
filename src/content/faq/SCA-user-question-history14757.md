---
id: "question-history-14757"
title: "spring boot 应用启动流程原理"
date: "2024-09-26"
category: "expertConsultation"
description: "Spring Cloud Alibaba下的Spring Boot应用启动流程原理主要遵循标准Spring Boot应用的启动机制，但会集成Alibaba提供的微服务组件，增强服务发现、配置管理、分布式事务处理等功能。基于已有的知识，我们可以概述其启动流程如下：### 1. **打包为Fat Jar"
tags: ["sca","spring-cloud-alibaba","spring-boot","应用","启动","流程","原理"]
keywords: ["sca","spring-cloud-alibaba","spring-boot","应用","启动","流程","原理"]
---

## 用户问题 ： 
 spring boot 应用启动流程原理  

---------------
## 专家官方解答 ：

Spring Cloud Alibaba下的Spring Boot应用启动流程原理主要遵循标准Spring Boot应用的启动机制，但会集成Alibaba提供的微服务组件，增强服务发现、配置管理、分布式事务处理等功能。基于已有的知识，我们可以概述其启动流程如下：

### 1. **打包为Fat Jar**
- Spring Boot应用通过Maven或Gradle等构建工具被打包成一个包含所有依赖和应用程序代码的可执行jar文件（Fat Jar）。
- 在Spring Cloud Alibaba场景下，除了Spring Boot核心库外，还会包含如Nacos客户端、Dubbo/Sentinel等微服务治理相关依赖。

### 2. **启动入口**
- **`Main-Class`**: `org.springframework.boot.loader.JarLauncher` 是Spring Boot应用的启动入口点。
- **`Start-Class`** 在`MANIFEST.MF`中定义，指向用户自定义的Application类，如`com.example.SpringCloudAlibabaApplication`，该类中通常包含`SpringApplication.run(...)`方法来启动应用。

### 3. **JarLauncher工作流程**
- **创建Archive**: `JarLauncher`首先识别自身所在的jar文件并创建`Archive`实例。
- **加载依赖**: 通过`getNestedArchives`方法识别出所有嵌套的jar（即`lib/`目录下的依赖），创建`LaunchedURLClassLoader`来加载这些依赖。
- **启动应用**: 根据`MANIFEST.MF`中的`Start-Class`属性，以新线程启动用户的主应用程序类。

### 4. **LaunchedURLClassLoader的特殊性**
- 它能够从Archive内部加载.class文件，这是通过利用Archive的`getEntries`方法获取资源实现的。

### 5. **Spring Cloud Alibaba集成**
- 在Spring Boot应用启动后，Spring Cloud Alibaba的自动配置会开始工作，注册服务到Nacos、初始化配置中心客户端、设置断路器、负载均衡等。
- 组件如Nacos Discovery Client会在应用上下文中初始化，自动发现其他服务，而配置中心则会动态地更新应用配置。

### 总结
Spring Cloud Alibaba环境下Spring Boot应用的启动，在遵循标准Spring Boot启动流程基础上，额外集成了Alibaba微服务生态的功能模块。这一过程涉及Fat Jar的创建、特定ClassLoader的使用及Spring Cloud Alibaba组件的自动配置与初始化，最终实现了一个具备微服务特性的应用启动过程。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：Spring boot 应用启动的原理介绍 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=14759)给我们反馈。
