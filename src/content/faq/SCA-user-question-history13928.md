---
id: "question-history-13928"
title: "怎么用spring cloud alibaba ai 实现基于大模型的聊天？"
date: "2024-09-26"
category: "expertConsultation"
description: "要使用Spring Cloud Alibaba AI实现基于大模型的聊天功能，您可以遵循以下详细步骤：### 1. 确认技术前提确保您的开发环境满足以下条件：- **JDK版本**：确保使用的JDK版本在JDK 17或以上。### 2. 申请阿里云通义千问API-Key- 访问[阿里云百炼页面](h"
tags: ["sca","spring-cloud-alibaba","spring","cloud","alibaba","ai","大模型"]
keywords: ["sca","spring-cloud-alibaba","spring","cloud","alibaba","ai","大模型"]
---

## 用户问题 ： 
 怎么用spring cloud alibaba ai 实现基于大模型的聊天？  

---------------
## 专家官方解答 ：

要使用Spring Cloud Alibaba AI实现基于大模型的聊天功能，您可以遵循以下详细步骤：

### 1. 确认技术前提
确保您的开发环境满足以下条件：
- **JDK版本**：确保使用的JDK版本在JDK 17或以上。

### 2. 申请阿里云通义千问API-Key
- 访问[阿里云百炼页面](https://www.aliyun.com/product/bailian)，并登录您的阿里云账号。
- 选择开通“百炼大模型推理”服务，等待开通成功的通知。
- 成功开通后，进入页面，点击右上角小人图标，选择API-KEY，创建一个新的API-KEY并记录下来，后续配置需要用到。

### 3. 添加依赖
在项目的`pom.xml`中添加Spring Cloud Alibaba相关依赖，使用版本2023.0.1.0：
```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2023.0.1.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-ai</artifactId>
    </dependency>
</dependencies>
```

### 4. 配置API-Key
在`application.yml`或`application.properties`中配置您的API-Key：
```yaml
spring:
  cloud:
    ai:
      tongyi:
        chat:
          options:
            api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx  # 替换为实际的API-KEY
```
或
```properties
spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
```

### 5. 实现聊天服务
- 创建一个服务实现类，例如`TongYiSimpleServiceImpl`，并注入`ChatClient`和`StreamingChatClient`。
- 实现同步和异步聊天方法，分别调用`chatClient.call(prompt)`进行同步调用，以及使用`streamingChatClient.stream(prompt)`进行异步流式调用。

### 6. 启动应用
- 确保您的Spring Boot应用入口类（如`TongYiApplication`）已配置，然后运行该应用。

通过上述步骤，您就可以基于Spring Cloud Alibaba AI框架和阿里云通义大模型实现聊天交互功能。这不仅简化了与不同AI提供商的对接过程，还利用了Spring的便利性，使得AI集成更加高效和灵活。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai (spring cloud alibaba ai）介绍 
 
 * 专家经验：spring ai alibaba 使用说明 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15597)给我们反馈。
