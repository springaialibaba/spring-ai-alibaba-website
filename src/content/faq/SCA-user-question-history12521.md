---
id: "question-history-12521"
title: "springboot druid"
date: "2024-09-26"
category: "expertConsultation"
description: "在Sca（Spring Cloud Alibaba）与Spring Boot集成时，使用Druid作为数据库连接池是一个常见的需求。根据已有的知识内容，下面是如何在Spring Boot项目中集成Druid的详细步骤：1. **添加Druid依赖**   在你的`pom.xml`文件中，需要添加Dr"
tags: ["sca","spring-cloud-alibaba","springboot","druid"]
keywords: ["sca","spring-cloud-alibaba","springboot","druid"]
---

## 用户问题 ： 
 springboot druid  

---------------
## 专家官方解答 ：

在Sca（Spring Cloud Alibaba）与Spring Boot集成时，使用Druid作为数据库连接池是一个常见的需求。根据已有的知识内容，下面是如何在Spring Boot项目中集成Druid的详细步骤：

1. **添加Druid依赖**
   在你的`pom.xml`文件中，需要添加Druid数据库连接池的依赖。这将允许Spring Boot应用使用Druid作为数据源。
   ```xml
   <dependency>
       <groupId>com.alibaba</groupId>
       <artifactId>druid-spring-boot-starter</artifactId>
       <version>最新版本号</version> <!-- 请替换为最新的稳定版本 -->
   </dependency>
   ```
   注意：请替换`最新版本号`为Maven仓库中Druid Spring Boot Starter的最新稳定版本号。

2. **配置Druid数据源**
   在`application.yml`或`application.properties`中配置Druid数据源参数。以下是一个`application.yml`的配置示例：
   ```yaml
   spring:
     datasource:
       type: com.alibaba.druid.pool.DruidDataSource
       driver-class-name: com.mysql.jdbc.Driver
       url: jdbc:mysql://localhost:3306/your_database?useSSL=false&serverTimezone=UTC
       username: your_username
       password: your_password
       druid:
         initial-size: 5
         min-idle: 5
         max-active: 20
         test-on-borrow: true
         test-while-idle: true
   ```
   这里配置了Druid的基本属性，如初始化连接数、最小空闲连接数、最大活动连接数等。

3. **监控Druid**
   Druid提供了内置的监控功能，为了启用它，你还需要在`application.yml`中添加监控相关的配置：
   ```yaml
   spring:
     druid:
       stat-view-servlet:
         enabled: true
         url-pattern: /druid/*
         login-username: admin
         login-password: admin
       web-stat-filter:
         enabled: true
         url-pattern: /*
         exclusions: "*.js,*.gif,*.jpg,*.png,*.css,*.ico,/druid/*"
   ```
   这样配置后，你可以通过访问`http://localhost:你的端口/druid`来查看Druid提供的监控页面，用以监控数据库连接池的状态。

综上所述，集成Druid到Spring Boot项目中主要涉及添加依赖、配置数据源参数以及（可选地）配置监控功能。这些步骤确保了你的Spring Cloud Alibaba应用能够有效地利用Druid进行数据库访问管理。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：springboot 与测试类(springboot test )的集成方案 
 
 * 专家经验：springboot 快速启动 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=12614)给我们反馈。
