---
id: "question-history-12576"
title: "springboot undertow"
date: "2024-04-28"
category: "expertConsultation"
description: "在Spring Cloud Alibaba (SCA)与Spring Boot集成的场景下，若想使用Undertow作为默认的Web服务器替代Tomcat，您可以按照以下步骤操作：1. **修改Spring Boot依赖**: 默认情况下，Spring Boot项目使用Tomcat作为Web容器。要"
tags: ["spring-cloud-alibaba","springboot","undertow"]
keywords: ["spring-cloud-alibaba","springboot","undertow"]
---

## 用户问题 ： 
 springboot undertow  

---------------
## 专家官方解答 ：

在Spring Cloud Alibaba (SCA)与Spring Boot集成的场景下，若想使用Undertow作为默认的Web服务器替代Tomcat，您可以按照以下步骤操作：

1. **修改Spring Boot依赖**: 默认情况下，Spring Boot项目使用Tomcat作为Web容器。要改为使用Undertow，您需要在`pom.xml`文件中排除Spring Boot Starter Web对Tomcat的依赖，并添加Undertow的Starter依赖。操作如下：

```xml
<!-- 排除Tomcat依赖 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- 添加Undertow依赖 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>
```

2. **配置Undertow**: 如果有特定的配置需求，如端口更改或性能调优，您可以在`application.properties`或`application.yml`中添加Undertow相关的配置项。例如，更改端口为8081：

```properties
server.port=8081
```

或在`application.yml`中：

```yaml
server:
  port: 8081
```

3. **重启应用**: 保存更改后，重新启动您的Spring Boot应用。现在，应用将使用Undertow作为其Web服务器。

根据提供的知识内容，虽然没有直接提及Undertow的配置，但基于Spring Boot的一般配置原则和实践，以上步骤是将Undertow与Spring Boot（包括集成Spring Cloud Alibaba）结合的标准做法。Spring Boot Test相关内容虽然与直接配置Undertow不直接相关，但确保了在做出配置更改后，能够有效地进行集成测试以验证应用是否按预期工作。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca 与 springboot 快速启动 
 
 * 专家经验：springboot 与测试类(springboot test )的集成方案 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=12669)给我们反馈。
