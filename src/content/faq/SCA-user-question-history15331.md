---
id: "question-history-15331"
title: "配置 Spring Cloud Gateway 使用 Nacos，但不使用Higress"
date: "2024-06-14"
category: "expertConsultation"
description: "要配置Spring Cloud Gateway使用Nacos作为配置中心和服务发现，但不使用Higress网关，您可以按照以下步骤操作：### 步骤分析与依据根据提供的知识内容，我们可以看到Nacos与Spring Cloud的融合主要涉及两个方面：**配置管理**和**服务注册与发现**。虽然示例"
---

## 用户问题 ： 
 配置 Spring Cloud Gateway 使用 Nacos，但不使用Higress  

---------------
## 专家官方解答 ：

要配置Spring Cloud Gateway使用Nacos作为配置中心和服务发现，但不使用Higress网关，您可以按照以下步骤操作：

### 步骤分析与依据

根据提供的知识内容，我们可以看到Nacos与Spring Cloud的融合主要涉及两个方面：**配置管理**和**服务注册与发现**。虽然示例中提到了Higress网关的集成，但我们可以根据Nacos的基本集成方式来配置Spring Cloud Gateway，忽略Higress相关部分。

#### 配置管理

- **参考资料**: [Nacos Config](https://github.com/spring-cloud-incubator/spring-cloud-alibaba/wiki/Nacos-config)

#### 服务注册与发现

- **参考资料**: [Nacos Discovery](https://github.com/spring-cloud-incubator/spring-cloud-alibaba/wiki/Nacos-discovery)

### 具体步骤

#### 1. 添加依赖

确保您的`pom.xml`文件中添加了Spring Cloud Alibaba的Nacos相关依赖，包括配置管理和服务发现模块：

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

#### 2. 配置Nacos服务器地址

在`application.properties`或`application.yml`中配置Nacos服务器地址：

```properties
spring.cloud.nacos.discovery.server-addr=127.0.0.1:8848
```

#### 3. 配置服务名和服务分组（如有需要）

如果需要指定服务分组或其他高级配置，可以继续在`application.properties`中设置，例如：

```properties
spring.application.name=my-gateway-service
spring.cloud.nacos.discovery.group=DEFAULT_GROUP
```

#### 4. 在Spring Cloud Gateway中启用服务发现

为了让Spring Cloud Gateway能够从Nacos发现服务，您需要在配置文件中启用它并定义路由规则。尽管直接配置示例未提供，但通常做法是在Spring Cloud Gateway的配置中利用服务ID来自动态路由：

```yaml
spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true # 启用服务发现
      routes:
      - id: my-route
        uri: lb://my-service # 这里my-service是服务名，lb://前缀表示负载均衡
        predicates:
        - Path=/api/**
```

### 解释

- **配置管理**: 通过添加Nacos Config的依赖和配置Nacos服务器地址，Spring Cloud应用能够从Nacos获取配置信息，实现配置的动态更新。
- **服务发现**: 通过Nacos Discovery的依赖和配置，应用实例能够向Nacos注册，并且可以通过Spring Cloud Gateway的动态路由功能，根据服务名自动发现并路由到相应的微服务，而无需手动配置每个服务的地址。

以上步骤忽略了Higress相关配置，专注于如何在不使用Higress的情况下，让Spring Cloud Gateway与Nacos集成，实现服务发现和基本的路由配置。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：Nacos 融合 Spring Cloud，成为注册配置中心 
 
 * 专家经验：基于网关实现 Spring Cloud 服务发现与路由 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15341)给我们反馈。
