---
id: "question-history-16206"
title: "Spring Boot 应用程序生命周期和相关的应用程序事件"
date: "2024-09-26"
category: "expertConsultation"
description: "在Spring Cloud Alibaba环境中，Spring Boot应用程序的生命周期与一系列关键的事件紧密相关，这些事件标志着应用程序从启动到关闭的各个阶段。根据提供的知识内容，我们可以详细梳理Spring Boot应用的生命周期及相关的应用程序事件，具体如下：### 应用程序生命周期与事件序"
tags: ["sca","spring-boot","生命周期","应用程序","事件","alibaba","cloud"]
keywords: ["sca","spring-boot","生命周期","应用程序","事件","alibaba","cloud"]
---

## 用户问题 ： 
 Spring Boot 应用程序生命周期和相关的应用程序事件  

---------------
## 专家官方解答 ：

在Spring Cloud Alibaba环境中，Spring Boot应用程序的生命周期与一系列关键的事件紧密相关，这些事件标志着应用程序从启动到关闭的各个阶段。根据提供的知识内容，我们可以详细梳理Spring Boot应用的生命周期及相关的应用程序事件，具体如下：

### 应用程序生命周期与事件序列

1. **ApplicationStartingEvent**: 应用程序开始运行，此时还未进行任何实质处理（除了注册listeners和initializers）。

2. **ApplicationEnvironmentPreparedEvent**: 环境（Environment）被上下文使用前发送，发生在上下文创建之前。

3. **ApplicationContextInitializedEvent**: 上下文（ApplicationContext）初始化完成，此时bean定义尚未加载。

4. **ApplicationPreparedEvent**: 所有bean定义加载完成后，刷新上下文之前发送。

5. **ApplicationStartedEvent**: 上下文刷新之后，但在应用和命令行runner被调用之前发送。紧接着发送带有LivenessState.CORRECT的AvailabilityChangeEvent，表明应用活跃。

6. **ApplicationReadyEvent**: 应用程序及命令行runner执行完毕后发送，随后发送ReadinessState.ACCEPTING_TRAFFIC的AvailabilityChangeEvent，表示应用准备就绪，可以接受请求。

7. **WebServerInitializedEvent**: （针对Web应用）Web服务器准备就绪后发送，分为ServletWebServerInitializedEvent和ReactiveWebServerInitializedEvent。

8. **ContextRefreshedEvent**: 刷新ApplicationContext时发送。

9. **ApplicationFailedEvent**: 启动过程中发生异常时发送。

### 监听器与事件处理

- **监听器注册**: 可通过`SpringApplication.addListeners(…)`或在`META-INF/spring.factories`文件中声明`org.springframework.context.ApplicationListener`来注册监听器。
  
- **线程与任务**: 默认情况下，监听器不应执行长时间任务，以免阻塞主线程。对于长任务，推荐使用命令行runner。

- **事件传播与上下文区分**: 如果存在上下文层级结构，监听器可能会接收到多个相同类型的事件实例。为区分，监听器应注入ApplicationContext，并对比事件的上下文。

### 注意事项

- **避免长任务阻塞**: 监听器执行应迅速，以免影响启动流程。
- **上下文感知**: 实现`ApplicationContextAware`或使用@Autowired来确保监听器能正确处理不同上下文中的事件。

综上所述，Spring Boot应用的生命周期通过一系列精心设计的应用程序事件来标示，开发者可通过监听这些事件来执行特定的初始化、配置或清理任务，从而灵活地控制应用行为。在Spring Cloud Alibaba框架中，这一机制同样适用，并且能够与云原生服务的生命周期管理良好集成。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：Spring Boot 核心特性 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16214)给我们反馈。
