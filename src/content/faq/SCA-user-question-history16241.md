---
id: "question-history-16241"
title: "不用dubbo 的情况下 如何基于spring cloud 进行服务之间的调用？"
date: "2024-09-26"
category: "expertConsultation"
description: "在Spring Cloud Alibaba体系中，即使不使用Dubbo，也可以通过Spring Cloud原生的组件来实现服务之间的调用。根据我了解的知识，我们可以分析如下：### 分析问题原因Spring Cloud Alibaba虽然本身不直接提供服务调用框架，但它完全融入了Spring Clo"
tags: ["sca","spring-cloud-alibaba","dubbo","spring","cloud","服务","调用"]
keywords: ["sca","spring-cloud-alibaba","dubbo","spring","cloud","服务","调用"]
---

## 用户问题 ： 
 不用dubbo 的情况下 如何基于spring cloud 进行服务之间的调用？  

---------------
## 专家官方解答 ：

在Spring Cloud Alibaba体系中，即使不使用Dubbo，也可以通过Spring Cloud原生的组件来实现服务之间的调用。根据我了解的知识，我们可以分析如下：

### 分析问题原因
Spring Cloud Alibaba虽然本身不直接提供服务调用框架，但它完全融入了Spring Cloud生态，这意味着可以利用Spring Cloud提供的服务发现和负载均衡能力来进行服务间调用。主要涉及到的两个关键组件为：

- **Ribbon**：负责客户端的负载均衡，可以在服务调用时自动根据配置的策略从服务实例列表中选择一个实例进行调用。
- **Feign**：是一个声明式的HTTP客户端，它使得编写Web服务客户端变得非常容易，可以与Ribbon结合实现负载均衡的服务调用。

### 具体步骤
#### 使用Ribbon进行服务调用
1. **添加依赖**：确保你的项目中包含了Spring Cloud Netflix Ribbon的依赖，这通常在使用Spring Cloud Starter Eureka客户端时就已经包含。

2. **服务发现**：首先，你需要在你的Spring Boot应用中配置服务发现，通常是Eureka或Nacos。这样，服务实例可以在运行时动态注册与发现。

3. **接口调用**：在需要进行服务调用的客户端服务中，你可以直接使用`RestTemplate`并利用Ribbon的负载均衡能力。Ribbon会根据服务名从服务发现组件中获取服务实例列表，并根据策略选择实例进行调用。

#### 使用Feign进行服务调用
1. **添加依赖**：引入Spring Cloud Starter OpenFeign的依赖。

2. **定义Feign Client**：创建一个接口，使用`@FeignClient`注解标记该接口，并指定要调用的服务名称。Feign会自动处理服务发现与负载均衡。

3. **使用服务**：在你的业务代码中，直接注入上面定义的Feign Client接口，然后像调用本地方法一样调用远程服务。

### 解释
采用上述步骤，Spring Cloud应用无需直接集成Dubbo，也能实现服务间的高效、负载均衡的调用。Ribbon提供了客户端侧的负载均衡，而Feign则以声明式的方式简化了HTTP API的调用过程，二者结合可以满足大多数微服务架构的服务调用需求。这种方式更加贴合Spring Cloud生态系统，对于已经熟悉Spring Cloud的团队来说，可以降低学习成本并充分利用现有生态资源。

综上所述，Spring Cloud Alibaba环境下，通过集成Ribbon与Feign，即可实现在不依赖Dubbo的情况下，基于Spring Cloud进行服务之间的调用。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：Spring Cloud Alibaba和Dubbo选型建议 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16254)给我们反馈。
