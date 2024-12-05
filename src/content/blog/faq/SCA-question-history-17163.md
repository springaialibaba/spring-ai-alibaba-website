---
id: "question-history-17163"
title: "spring ai alibaba具体怎么用？ 给我详细的步骤和代码"
date: "2024-09-23"
category: "expertConsultation"
description: "根据提供的[[知识]]，使用Spring Cloud Alibaba AI（sca ai）来集成阿里云通义大模型的步骤如下：### 1. 确保满足基本环境要求- JDK版本：确保你的JDK版本在17及以上。- Spring Boot版本：保证你的项目基于Spring Boot 3.3.x版本。###"
tags: ["sca","spring-cloud-alibaba","spring","ai","alibaba","使用",""]
keywords: ["sca","spring-cloud-alibaba","spring","ai","alibaba","使用",""]
---

## 用户问题 ： 
 spring ai alibaba具体怎么用？ 给我详细的步骤和代码  

---------------
## 专家官方解答 ：

根据提供的[[知识]]，使用Spring Cloud Alibaba AI（sca ai）来集成阿里云通义大模型的步骤如下：

### 1. 确保满足基本环境要求
- JDK版本：确保你的JDK版本在17及以上。
- Spring Boot版本：保证你的项目基于Spring Boot 3.3.x版本。

### 2. 在阿里云申请API Key
- 访问[阿里云百炼页面](https://www.aliyun.com/product/bailian)并登录您的账号。
- 开通“百炼大模型推理”服务。开通成功后，在控制台中生成一个新的API Key，并妥善保存此Key，因为后续配置需要使用它。

### 3. 配置环境变量
将刚才获取到的API Key设置为环境变量：
```bash
export AI_DASHSCOPE_API_KEY=your_api_key_here
```

### 4. 添加Spring仓库
由于Spring AI相关的依赖可能尚未发布到Maven中央仓库，你需要添加以下仓库配置至你的`pom.xml`文件中：
```xml
<repositories>
    <repository>
        <id>sonatype-snapshots</id>
        <url>https://oss.sonatype.org/content/repositories/snapshots</url>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
    </repository>
    <repository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
    <repository>
        <id>spring-snapshots</id>
        <name>Spring Snapshots</name>
        <url>https://repo.spring.io/snapshot</url>
        <releases>
            <enabled>false</enabled>
        </releases>
    </repository>
</repositories>
```

### 5. 添加必要的依赖
向项目的`pom.xml`添加`spring-ai-alibaba-starter`以及Spring Boot父级依赖：
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.4</version>
    <relativePath/> <!-- lookup parent from repository -->
</parent>

<dependencies>
    <dependency>
        <groupId>com.alibaba.cloud.ai</groupId>
        <artifactId>spring-ai-alibaba-starter</artifactId>
        <version>1.0.0-M2</version>
    </dependency>
    <!-- other dependencies... -->
</dependencies>
```

### 6. 配置应用属性
通过`application.properties`或`application.yaml`配置文件注入之前设定的环境变量值：
```properties
spring.ai.dashscope.api-key=${AI_DASHSCOPE_API_KEY}
```

### 7. 编写业务代码
创建一个简单的Controller来演示如何利用`ChatClient`与AI进行交互：
```java
@RestController
public class ChatController {

    private final ChatClient chatClient;

    public ChatController(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    @GetMapping("/chat")
    public String chat(String input) {
        return this.chatClient.prompt()
                .user(input)
                .call()
                .content();
    }
}
```

### 说明
以上步骤介绍了从准备环境、获取必要密钥直至编写实际应用代码以实现基础聊天功能的过程。通过这种方式，你不仅能够快速搭建起一个基于Spring框架并集成阿里云通义大模型的应用程序，还可以进一步探索更高级的功能如自定义Prompt模板等。更多详细信息和示例可以参考官方文档中的链接，例如[ChatClient 详细说明](https://sca.aliyun.com/ai/tutorials/chat-client/)。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：spring ai alibaba 使用说明 
 
 * 专家经验：sca(spring-cloud-alibaba) Spring Cloud Alibaba 是什么 
 
 * 专家经验：sca ai 的prompt用法说明 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=17164)给我们反馈。
