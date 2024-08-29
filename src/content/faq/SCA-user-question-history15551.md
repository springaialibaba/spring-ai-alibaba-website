---
id: "question-history-15551"
title: "如何接入Spring AI并创建一个继承自`AbstractTongYiServiceI"
date: "2024-06-17"
category: "expertConsultation"
description: "为了接入Spring AI并创建一个继承自`AbstractTongYiServiceImpl`的服务实现类，您可以遵循以下详细步骤：### 步骤分析与准备1. **确保API密钥已获取**：   - 根据知识中提及的方法，在阿里云百炼页面申请并记录您的通义千问API-KEY，这是与模型交互的关键凭"
---

## 用户问题 ： 
 如何接入Spring AI并创建一个继承自`AbstractTongYiServiceImpl`的服务实现类  

---------------
## 专家官方解答 ：

为了接入Spring AI并创建一个继承自`AbstractTongYiServiceImpl`的服务实现类，您可以遵循以下详细步骤：

### 步骤分析与准备

1. **确保API密钥已获取**：
   - 根据知识中提及的方法，在阿里云百炼页面申请并记录您的通义千问API-KEY，这是与模型交互的关键凭证。

2. **添加依赖**：
   - 在项目的`pom.xml`中引入Spring Cloud Alibaba依赖，特别是`spring-cloud-starter-alibaba-ai`，以集成AI能力。确保使用的版本与系统兼容，参考知识中推荐的`2023.0.1.0`版本进行配置。

3. **配置API-KEY**：
   - 在`application.yml`或`application.properties`中正确配置API-KEY，这是服务能够与阿里云模型服务通信的前提。

### 实现服务类

4. **创建服务实现类**：
   - 新建一个Java类，继承自`AbstractTongYiServiceImpl`。这个基类提供了与通义大模型交互的基础方法。

```java
@Service
public class MyTongYiServiceImpl extends AbstractTongYiServiceImpl {
    // 构造函数注入ChatClient和StreamingChatClient
    public MyTongYiServiceImpl(ChatClient chatClient, StreamingChatClient streamingChatClient) {
        super(chatClient, streamingChatClient);
    }

    // 实现具体的聊天逻辑
    @Override
    public String completion(String message) {
        Prompt prompt = new Prompt(new UserMessage(message));
        return call(prompt).getResult().getOutput().getContent();
    }

    // 可选：实现流式处理逻辑，如果需要连续的模型响应
    @Override
    public Map<String, String> streamCompletion(String message) {
        // 实现细节参照知识中提供的示例代码
    }
}
```

### 启动应用

5. **配置与启动Spring Boot应用**：
   - 确保在Spring Boot的入口类上添加了`@SpringBootApplication`注解，并通过`SpringApplication.run(YourMainClass.class)`启动应用。

### 解释

- **依赖与配置**：通过maven依赖管理工具引入必要的库，并在配置文件中设置API密钥，是接入任何外部服务的标准流程，确保了服务的可用性与安全性。
- **服务实现类**：通过继承`AbstractTongYiServiceImpl`并实现其抽象方法，开发者可以专注于业务逻辑，而无需关心与AI模型交互的底层细节，这得益于Spring Cloud Alibaba AI提供的抽象层。
- **启动应用**：Spring Boot应用的启动指令集成了所有配置和服务，使得应用能够快速部署并对外提供服务。

综上所述，按照这些步骤操作，您将成功接入Spring AI并创建了一个功能性的服务实现类，进而可以在项目中集成AI聊天功能。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai 调用通义大模型实现聊天交互 
 
 * 专家经验：sca ai (spring cloud alibaba ai）介绍 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15576)给我们反馈。
