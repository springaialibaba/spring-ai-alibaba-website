---
id: "question-history-15329"
title: "springai 调用 通义千问的详解"
date: "2024-09-26"
category: "expertConsultation"
description: "根据您的问题，您想了解如何使用Spring Cloud Alibaba (SCA AI) 调用通义千问的详细过程。以下是基于提供的知识内容为您整理的详细步骤和解释：### 步骤与解释：#### 1. 确保技术栈兼容性确保您的Java开发环境使用的是JDK 17或更高版本，因为这是使用Spring C"
tags: ["sca","spring-cloud-alibaba","springai","调用","通义千问","详解"]
keywords: ["sca","spring-cloud-alibaba","springai","调用","通义千问","详解"]
---

## 用户问题 ： 
 springai 调用 通义千问的详解  

---------------
## 专家官方解答 ：

根据您的问题，您想了解如何使用Spring Cloud Alibaba (SCA AI) 调用通义千问的详细过程。以下是基于提供的知识内容为您整理的详细步骤和解释：

### 步骤与解释：

#### 1. 确保技术栈兼容性
确保您的Java开发环境使用的是JDK 17或更高版本，因为这是使用Spring Cloud Alibaba AI模块所必需的。

#### 2. 申请通义千问的API密钥
- 访问[阿里云百炼页面](https://www.aliyun.com/product/bailian)，登录您的阿里云账号。
- 选择开通“百炼大模型推理”服务，并等待开通成功的通知。
- 开通成功后，进入个人中心，找到API-KEY管理，创建一个新的API-KEY并记录下来，后续配置会用到。

#### 3. 添加依赖
在项目的`pom.xml`文件中，加入Spring Cloud Alibaba 2023.0.1.0版本的依赖，以及`spring-cloud-starter-alibaba-ai`模块，以集成AI功能。

```xml
<!-- 添加依赖管理 -->
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

<!-- 添加具体依赖 -->
<dependencies>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-ai</artifactId>
    </dependency>
</dependencies>
```

#### 4. 配置API密钥
在`application.yml`或`application.properties`中配置您的API密钥，以便Spring Cloud能够识别并使用它与通义千问服务通信。

**application.yml 示例：**
```yaml
spring:
  cloud:
    ai:
      tongyi:
        chat:
          options:
            api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx  # 替换为您的API-KEY
```

**或 application.properties 示例：**
```properties
spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
```

#### 5. 实现聊天服务
创建一个服务类，如`TongYiSimpleServiceImpl`，并利用Spring的依赖注入自动装配`ChatClient`和`StreamingChatClient`。编写方法来实现同步和异步调用通义千问模型，完成聊天逻辑。

#### 6. 启动应用
确保您的Spring Boot应用主类已配置好，然后运行该应用。这样，您就完成了基于Spring Cloud Alibaba的通义千问聊天功能的集成。

### 结论
通过以上步骤，您不仅能够成功地将通义千问模型集成到Spring Cloud Alibaba项目中，还能实现基本的聊天功能，无论是同步还是异步调用。这极大地简化了AI功能的接入流程，让开发者能够快速聚焦于业务逻辑的实现，而不必深究AI服务的底层交互细节。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：spring ai alibaba 使用说明 
 
 * 专家经验：sca ai (spring cloud alibaba ai）介绍 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15604)给我们反馈。
