---
id: "question-history-16892"
title: "在 springboot 中如何使用 nacos 做配置中心？"
date: "2024-09-26"
category: "expertConsultation"
description: "为了在Spring Boot应用中使用Nacos作为配置中心，结合Spring Cloud Alibaba (SCA)，你可以遵循以下步骤操作：### 1. 环境准备与依赖引入首先，确保你的开发环境已准备好Java开发工具包(JDK)以及Maven或Gradle等构建工具。接着，在你的Spring "
tags: ["sca","spring-cloud-alibaba","springboot","nacos","配置中心","使用","整合"]
keywords: ["sca","spring-cloud-alibaba","springboot","nacos","配置中心","使用","整合"]
---

## 用户问题 ： 
 在 springboot 中如何使用 nacos 做配置中心？  

---------------
## 专家官方解答 ：

为了在Spring Boot应用中使用Nacos作为配置中心，结合Spring Cloud Alibaba (SCA)，你可以遵循以下步骤操作：

### 1. 环境准备与依赖引入

首先，确保你的开发环境已准备好Java开发工具包(JDK)以及Maven或Gradle等构建工具。接着，在你的Spring Boot项目的`pom.xml`文件中添加Spring Cloud Alibaba对Nacos配置中心和服务发现的支持依赖：

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

确保你的Spring Cloud Alibaba版本与Spring Boot版本兼容，可以通过查阅[Spring Cloud Alibaba官方文档](https://github.com/alibaba/spring-cloud-alibaba/wiki)获取最新版本信息。

### 2. 配置Nacos Server地址

在你的Spring Boot应用的`application.properties`或`application.yml`中配置Nacos Server的地址：

```properties
# application.properties 示例
spring.cloud.nacos.config.server-addr=云上 Nacos Server 地址 # 或者本地地址如：127.0.0.1:8848
spring.cloud.nacos.discovery.server-addr=${spring.cloud.nacos.config.server-addr}
```

或者在`application.yml`中配置：

```yaml
spring:
  cloud:
    nacos:
      config:
        server-addr: 云上 Nacos Server 地址 # 或者本地地址如：127.0.0.1:8848
      discovery:
        server-addr: ${spring.cloud.nacos.config.server-addr}
```

### 3. 配置数据源

在Nacos控制台创建相应的配置文件，比如`${spring.application.name}-${spring.profiles.active}.yaml`，这允许根据不同的环境（如dev、prod）加载不同的配置。

### 4. 启用服务发现与配置管理

在你的Spring Boot主类上通过注解启用Nacos的服务发现与配置管理功能：

```java
@SpringBootApplication
@EnableDiscoveryClient
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### 5. 应用启动与验证

完成以上配置后，启动你的Spring Boot应用。应用会自动从Nacos配置中心拉取配置，并注册到Nacos服务发现中。你可以在Nacos控制台查看到已注册的服务实例，并且可以在应用日志中看到配置加载成功的提示。

### 解释

- **环境准备与依赖引入**：这是基础，确保项目具备集成Nacos所需的软件环境和库依赖。
- **配置Nacos Server地址**：让Spring Boot应用知道去哪里寻找Nacos服务器，无论是使用云上托管还是本地部署的Nacos。
- **配置数据源**：在Nacos控制台上配置具体的配置项，实现配置的集中管理和动态更新。
- **启用服务发现与配置管理**：通过Spring Cloud Alibaba提供的注解，使应用具备服务发现和配置自动注入的能力。
- **应用启动与验证**：实际运行应用以检验配置是否生效，同时监控Nacos控制台以观察服务状态。

通过上述步骤，你就能够在Spring Boot应用中成功集成Nacos作为配置中心，利用Spring Cloud Alibaba提供的便捷特性实现配置的集中管理和服务发现功能。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：Nacos 融合 Spring Cloud，成为注册配置中心 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16903)给我们反馈。
