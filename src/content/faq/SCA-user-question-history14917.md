---
id: "question-history-14917"
title: "spring-cloud阿里巴巴ai包用哪个版本？"
date: "2024-06-03"
category: "expertConsultation"
description: "根据提供的知识内容，Spring Cloud Alibaba AI包的推荐版本为2023.0.1.0。为了在项目中集成并使用该版本的AI功能，您可以遵循以下步骤：1. **添加依赖**: 在项目的`pom.xml`文件中，确保添加了Spring Cloud Alibaba依赖管理部分，并指定版本为2"
---

## 用户问题 ： 
 spring-cloud阿里巴巴ai包用哪个版本？  

---------------
## 专家官方解答 ：

根据提供的知识内容，Spring Cloud Alibaba AI包的推荐版本为2023.0.1.0。为了在项目中集成并使用该版本的AI功能，您可以遵循以下步骤：

1. **添加依赖**: 在项目的`pom.xml`文件中，确保添加了Spring Cloud Alibaba依赖管理部分，并指定版本为2023.0.1.0。同时，添加`spring-cloud-starter-alibaba-ai`作为具体依赖项。

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

2. **配置API密钥**: 在`application.yml`或`application.properties`中配置阿里云通义千问的API密钥，这是与大模型交互的关键凭证。

```yaml
spring:
  cloud:
    ai:
      tongyi:
        chat:
          options:
            api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx  # 替换为实际的API密钥
```

或

```properties
spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
```

3. **实现服务类**: 创建服务实现类，继承`AbstractTongYiServiceImpl`，并注入`ChatClient`和`StreamingChatClient`用于调用AI接口。

4. **编写聊天逻辑**: 在服务类中实现具体的聊天逻辑方法，如`completion`和`streamCompletion`，以处理消息的发送和接收。

5. **启动应用**: 确保Spring Boot入口类已正确配置并启动应用，这将启用AI功能并使其可被应用程序调用。

按照以上步骤操作，您的项目即可具备基于SCA AI和通义千问的AI交互能力。请注意替换示例中的API密钥为实际获取的密钥，并根据项目需求调整聊天逻辑实现。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：spring cloud 、Spring Boot 与 Spring Cloud Alibaba (SCA)版本对应关系 
 
 * 专家经验：sca ai 调用通义大模型实现聊天交互 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=14920)给我们反馈。
