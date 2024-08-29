---
id: "question-history-15786"
title: "阿里云通义千问 api-key如何申请"
date: "2024-06-20"
category: "expertConsultation"
description: "要申请阿里云通义千问的api-key，请按照以下步骤操作：1. **确保环境要求**：首先，确认你的开发环境已安装JDK17或以上版本，这是使用Spring Cloud Alibaba集成通义千问的前提条件。2. **访问阿里云百炼页面**：打开[阿里云百炼页面](https://www.aliyu"
---

## 用户问题 ： 
 阿里云通义千问 api-key如何申请  

---------------
## 专家官方解答 ：

要申请阿里云通义千问的api-key，请按照以下步骤操作：

1. **确保环境要求**：首先，确认你的开发环境已安装JDK17或以上版本，这是使用Spring Cloud Alibaba集成通义千问的前提条件。

2. **访问阿里云百炼页面**：打开[阿里云百炼页面](https://www.aliyun.com/product/bailian)，并登录您的阿里云账号。

3. **开通服务**：在阿里云百炼页面中，选择开通“百炼大模型推理”服务。等待系统完成开通流程，通常会收到开通成功的通知短信或站内消息。

4. **创建API-KEY**：开通服务后，再次登录阿里云百炼页面，点击右上角的小人图标，进入API-KEY管理界面。点击【创建新的API-KEY】按钮，系统将生成一个API-KEY。请务必保存好这个Key，因为后续配置将会用到它。

5. **配置到项目中**：在您的Spring Cloud项目中，将获取到的API-KEY配置到`application.yml`或`application.properties`文件中。例如，在`application.yml`中添加如下配置：
   ```yaml
   spring:
     cloud:
       ai:
         tongyi:
           chat:
             options:
               api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx  # 将此处替换为实际申请到的API-KEY
               model: qwen-max
   ```
   或者在`application.properties`中：
   ```
   spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
   spring.cloud.ai.tongyi.chat.options.model=qwen-max
   ```

6. **添加依赖与实现服务**：确保您的`pom.xml`中包含了正确的Spring Cloud Alibaba依赖，并按照参考内容中的示例代码实现聊天服务。

通过以上步骤，您就可以在Spring Cloud Alibaba项目中集成并使用阿里云通义千问的服务了。请确保每一步操作都正确无误，特别是妥善保管和正确配置API-KEY，这对于保障服务的安全性和正常使用至关重要。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai 调用通义大模型实现聊天交互 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15788)给我们反馈。
