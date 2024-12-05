---
id: "question-history-16424"
title: "TongYiException: Can not find api-key"
date: "2024-09-26"
category: "expertConsultation"
description: "当遇到错误信息 `TongYiException: Can not find api-key` 时，根据我了解的知识中的分析，这个问题通常是由于在配置Spring Cloud Alibaba AI时，没有正确设置或遗漏了访问通义大模型所需的API密钥所致。以下是解决该问题的详细步骤：1. **检查配"
tags: ["sca","spring-cloud-alibaba","TongYiException","api-key","find","Can","not"]
keywords: ["sca","spring-cloud-alibaba","TongYiException","api-key","find","Can","not"]
---

## 用户问题 ： 
 TongYiException: Can not find api-key  

---------------
## 专家官方解答 ：

当遇到错误信息 `TongYiException: Can not find api-key` 时，根据我了解的知识中的分析，这个问题通常是由于在配置Spring Cloud Alibaba AI时，没有正确设置或遗漏了访问通义大模型所需的API密钥所致。以下是解决该问题的详细步骤：

1. **检查配置文件**：首先，请确保在你的`application.yml`或`application.properties`文件中正确设置了`api-key`。根据我了解的知识提供的指导，正确的配置方式应该是：
   - 对于`application.yml`:
     ```yaml
     spring:
       cloud:
         ai:
           tongyi:
             chat:
               options:
                 api-key: YOUR_API_KEY_HERE
                 model: qwen-max
     ```
   - 对于`application.properties`:
     ```
     spring.cloud.ai.tongyi.chat.options.api-key=YOUR_API_KEY_HERE
     spring.cloud.ai.tongyi.chat.options.model=qwen-max
     ```
   请将`YOUR_API_KEY_HERE`替换为你从阿里云获取的实际API密钥。

2. **确认API密钥有效性**：请确认你使用的API密钥是有效的，并且确实属于阿里云百炼页面中为“百炼大模型推理”服务所创建的。如果你还没有API密钥，需要按照我了解的知识中提供的步骤申请一个：
   - 访问[阿里云百炼页面](https://www.aliyun.com/product/bailian)，登录并开通服务，然后创建API密钥。

3. **清理并重启应用**：修改配置后，确保清理（如删除target目录下的旧文件）并重新启动你的Spring Boot应用，以便新配置生效。

4. **验证配置加载**：应用启动后，可以通过日志或者调试模式来验证是否成功加载了`api-key`配置。如果配置加载无误，但问题依旧存在，请检查是否有环境变量或其它配置覆盖了你的设置。

5. **查看依赖版本**：虽然根据我了解的知识，推荐的Spring Cloud Alibaba版本为`2023.0.1.0`，但请确认你的项目依赖中没有因版本不匹配导致的配置读取问题。通常，更新的版本可能已经解决了此类问题，如果仍然遇到困难，可以查阅Spring Cloud Alibaba的最新文档或发行说明。

如果以上步骤均无法解决问题，可能需要进一步检查是否有网络问题阻止了与阿里云服务的通信，或是检查你的阿里云账户权限是否足够调用该服务。

综上所述，此错误主要由于配置不当引起，遵循上述步骤应该能够解决`Can not find api-key`的问题。如果问题依然存在，建议回顾整个配置流程，或寻求阿里云官方的技术支持。


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
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16430)给我们反馈。
