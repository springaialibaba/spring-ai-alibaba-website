---
id: "question-history-17159"
title: "Access to model denied. Please make sure you"
date: "2024-09-26"
category: "expertConsultation"
description: "根据提供的知识，您遇到的问题“Access to model denied. Please make sure you are eligible for using the model.”表明您的应用程序在尝试访问某个AI模型时被拒绝了。这通常是由于API密钥配置不正确或未开通相关服务所引起的。##"
tags: ["sca","spring-cloud-alibaba","access","denied","model","eligibility","using"]
keywords: ["sca","spring-cloud-alibaba","access","denied","model","eligibility","using"]
---

## 用户问题 ： 
 Access to model denied. Please make sure you are eligible for using the model.  

---------------
## 专家官方解答 ：

根据提供的知识，您遇到的问题“Access to model denied. Please make sure you are eligible for using the model.”表明您的应用程序在尝试访问某个AI模型时被拒绝了。这通常是由于API密钥配置不正确或未开通相关服务所引起的。

### 分析问题原因
- 您可能没有正确设置通义（阿里云的一个AI服务）的API Key。
- 可能是您尚未开通通义千问服务。
- API Key可能存在错误或者权限不足。

### 解决方案

#### 1. 申请百炼 API-KEY
首先，请确保已经开通了阿里云上的“百炼大模型推理”服务，并且获得了有效的API Key。具体操作如下：
- 打开[阿里云百炼页面](https://www.aliyun.com/product/bailian)。
- 使用您的阿里云账号登录。
- 选择并开通“百炼大模型推理”服务。等待收到开通成功的通知。
- 开通成功后，再次访问该页面，点击右上角用户图标进入个人中心。
- 在个人中心里找到API-KEY选项，创建一个新的API-KEY，并妥善保存此Key。

#### 2. 配置百炼 API KEY
接下来，在您的项目中配置刚才获得的API Key。这里有两种方式可以实现：

**方法一：通过环境变量设置**
- 设置环境变量`AI_DASHSCOPE_API_KEY`为您的API Key值。
  ```shell
  export AI_DASHSCOPE_API_KEY=your_api_key_here
  ```
- 在Spring Boot项目的`application.properties`文件中添加以下行以引用上述环境变量：
  ```properties
  spring.ai.dashscope.api-key: ${AI_DASHSCOPE_API_KEY}
  ```

**方法二：直接指定api-key**
- 直接在`application.properties`文件中写入您的API Key：
  ```properties
  spring.ai.dashscope.api-key: your_api_key_here
  ```

### 解释
以上步骤旨在确保您的应用程序能够成功地与阿里云提供的AI服务进行交互。第一步要求您先获取正确的API Key，这是使用任何第三方服务的基本前提；第二步则指导如何将这个Key集成到您的项目配置中，以便让应用能够识别和使用它来调用相关的API接口。通过这些步骤，应该可以解决您遇到的“访问模型被拒”的问题。

请注意检查是否已按照上述指南准确无误地完成了所有操作。如果仍然存在问题，建议检查阿里云账户的状态以及API Key的有效性。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：org springframework ai chat model ChatModel 找不到 
 
 * 专家经验：sca(spring-cloud-alibaba) Spring Cloud Alibaba 是什么 
 
 * 专家经验：sca(spring-cloud-alibaba) 最佳实践示例 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=17161)给我们反馈。
