---
id: "question-history-16906"
title: "springboot＋mybatis＋log4j2如何输出SQL日志文件？"
date: "2024-09-26"
category: "expertConsultation"
description: "根据您的问题，虽然Spring Cloud Alibaba的FAQ没有直接涵盖关于如何在Spring Boot + Mybatis + Log4j2环境下配置SQL日志输出到文件的信息，但我们可以基于通用的配置知识来指导您完成这个任务。请按照以下步骤操作：### 分析问题原因在Spring Boot"
tags: ["sca","springboot","mybatis","log4j2","输出","SQL","日志文件"]
keywords: ["sca","springboot","mybatis","log4j2","输出","SQL","日志文件"]
---

## 用户问题 ： 
 springboot＋mybatis＋log4j2如何输出SQL日志文件？  

---------------
## 专家官方解答 ：

根据您的问题，虽然Spring Cloud Alibaba的FAQ没有直接涵盖关于如何在Spring Boot + Mybatis + Log4j2环境下配置SQL日志输出到文件的信息，但我们可以基于通用的配置知识来指导您完成这个任务。请按照以下步骤操作：

### 分析问题原因

在Spring Boot应用中集成Mybatis时，通常需要配置日志系统以记录SQL语句执行的详细信息，以便于调试和性能监控。Log4j2作为一款流行的日志框架，可以通过特定的配置来捕获并输出Mybatis执行的SQL日志。

### 具体步骤

#### 1. 添加依赖

确保您的`pom.xml`文件中包含了Mybatis和Log4j2的相关依赖。对于Mybatis，如果您使用的是Spring Boot Starter方式集成，通常已经自动包含了必要的依赖。对于Log4j2，确保有如下依赖（如果使用Spring Boot 2.x）:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-log4j2</artifactId>
</dependency>
```

#### 2. 配置Log4j2

在`resources`目录下创建或修改`log4j2.xml`配置文件，以定义SQL日志的输出规则。您需要配置一个Appender专门用于SQL日志，并且设置相应的Logger来使用这个Appender。

以下是一个简单的示例配置，展示了如何配置一个日志文件用于记录Mybatis的SQL日志：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="WARN">
    <Appenders>
        <!-- 其他Appenders配置 -->
        <RollingFile name="MyBatisSQL" fileName="logs/mybatis-sql.log"
                     filePattern="logs/mybatis-sql-%d{yyyy-MM-dd}.log">
            <PatternLayout pattern="%d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
            <Policies>
                <TimeBasedTriggeringPolicy interval="1" modulate="true"/>
            </Policies>
        </RollingFile>
    </Appenders>
    <Loggers>
        <!-- 配置Mybatis SQL日志 -->
        <Logger name="com.ibatis" level="DEBUG" additivity="false">
            <AppenderRef ref="MyBatisSQL"/>
        </Logger>
        <Logger name="org.apache.ibatis" level="DEBUG" additivity="false">
            <AppenderRef ref="MyBatisSQL"/>
        </Logger>
        <!-- 根Logger配置 -->
        <Root level="info">
            <AppenderRef ref="Console"/>
            <!-- 添加其他必要的AppenderRef -->
        </Root>
    </Loggers>
</Configuration>
```

### 解释

- 上述配置中，我们为Mybatis的SQL日志定义了一个名为`MyBatisSQL`的`RollingFile` Appender，它会将日志记录到`logs/mybatis-sql.log`文件中，并按天滚动日志文件。
- 针对Mybatis的两个主要包名(`com.ibatis`和`org.apache.ibatis`)，我们设置了日志级别为`DEBUG`，这意味着SQL语句及其执行详情将以调试级别记录。同时，`additivity="false"`表示这些日志不会被再次传递给更高级别的Logger，避免重复输出。
- 通过这种方式，您可以有效地收集和分析应用程序中的SQL执行情况，帮助优化查询性能或诊断问题。

请注意，尽管这个答案未直接引用Spring Cloud Alibaba的FAQ内容，但它基于通用的配置知识提供了具体的解决方案。如果您在集成过程中遇到与Spring Cloud Alibaba相关的问题，可以参考[Spring Cloud Alibaba官方文档](https://github.com/spring-cloud-alibaba-group/spring-cloud-alibaba-group.github.io/blob/master/i18n/zh-cn/docusaurus-plugin-content-docs/current/overview/faq.md)获取更多帮助。


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
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16920)给我们反馈。
