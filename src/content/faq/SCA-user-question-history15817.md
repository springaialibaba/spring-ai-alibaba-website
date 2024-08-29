---
id: "question-history-15817"
title: "申请开发key"
date: "2024-06-21"
category: "expertConsultation"
description: "要申请Sca (Spring Cloud Alibaba)项目中使用的通义千问开发key，您可以按照以下步骤操作：1. **确保环境要求**：首先，请确认您的开发环境已满足要求，即JDK版本需在JDK 17或以上。2. **访问阿里云百炼页面**：打开[阿里云百炼页面](https://www.al"
---

## 用户问题 ： 
 申请开发key  

---------------
## 专家官方解答 ：

要申请Sca (Spring Cloud Alibaba)项目中使用的通义千问开发key，您可以按照以下步骤操作：

1. **确保环境要求**：首先，请确认您的开发环境已满足要求，即JDK版本需在JDK 17或以上。

2. **访问阿里云百炼页面**：打开[阿里云百炼页面](https://www.aliyun.com/product/bailian)，并登录您的阿里云账号。

3. **开通服务**：在阿里云百炼页面中，选择开通“百炼大模型推理”服务。完成开通流程后，您会收到开通成功的通知，这可能通过短信或站内信形式。

4. **创建API-KEY**：登录阿里云百炼页面，点击右上角小人图标，进入API-KEY管理界面，点击【创建新的API-KEY】生成一个API-KEY。请务必保存好这个密钥，因为后续配置需要用到它。

5. **配置到项目中**：获得API-KEY后，您需要将其配置到Spring Cloud Alibaba项目的`application.yml`或`application.properties`文件中。例如，在`application.yml`中加入如下配置：
   ```yaml
   spring:
     cloud:
       ai:
         tongyi:
           chat:
             options:
               api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx  # 将此处替换为您实际的API-KEY
               model: qwen-max
   ```
   或者在`application.properties`中这样配置：
   ```
   spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
   spring.cloud.ai.tongyi.chat.options.model=qwen-max
   ```

6. **添加依赖和编写代码**：确保您的项目中已正确添加了Spring Cloud Alibaba的依赖，版本推荐为2023.0.1.0，并根据需求实现相应的聊天服务逻辑。

按照这些步骤，您就能成功为您的Spring Cloud Alibaba项目集成通义千问并获取所需的开发key。如果您在操作过程中遇到任何疑问或困难，可以根据阿里云提供的官方文档或帮助中心寻求进一步的帮助。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai 调用通义大模型实现聊天交互 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15836)给我们反馈。
