---
id: "question-history-15863"
title: "获取Spring Cloud Alibaba AI使用的API-KEY"
date: "2024-06-25"
category: "expertConsultation"
description: "为了获取Spring Cloud Alibaba AI使用的API-KEY，你需要按照以下步骤操作：1. **确保环境要求**：首先，请确认你的开发环境中的JDK版本为JDK 17或以上，因为这是使用Spring Cloud Alibaba AI组件的基本要求。2. **申请API-KEY**：  "
---

## 用户问题 ： 
 获取Spring Cloud Alibaba AI使用的API-KEY  

---------------
## 专家官方解答 ：

为了获取Spring Cloud Alibaba AI使用的API-KEY，你需要按照以下步骤操作：

1. **确保环境要求**：首先，请确认你的开发环境中的JDK版本为JDK 17或以上，因为这是使用Spring Cloud Alibaba AI组件的基本要求。

2. **申请API-KEY**：
   - 访问[阿里云百炼页面](https://www.aliyun.com/product/bailian)，使用您的阿里云账号登录。
   - 选择开通“百炼大模型推理”服务，并等待开通成功的通知（通常会通过短信形式发送）。
   - 开通成功后，再次登录阿里云百炼页面，点击右上角的小人图标，进入API-KEY管理界面。
   - 点击【创建新的API-KEY】，系统将生成一个API-KEY。请务必记录下这个Key，因为在后续的项目配置中会用到它。

3. **添加依赖**：在你的项目的`pom.xml`文件中，加入Spring Cloud Alibaba 2023.0.1.0版本的依赖。具体代码如下：
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

4. **配置API-KEY**：在你的`application.yml`或`application.properties`文件中，添加相应的配置项以设置API-KEY和其他必要参数。例如，在`application.yml`中：
   ```yaml
   spring:
     cloud:
       ai:
         tongyi:
           chat:
             options:
               api-key: sk-a3d73b1709bf4a178c28ed7c8b3b5axx  # 替换为您实际申请的API-KEY
               model: qwen-max
   ```
   如果使用`application.properties`，则配置如下：
   ```
   spring.cloud.ai.tongyi.chat.options.api-key=sk-a3d73b1709bf4a178c28ed7c8b3b5axx
   spring.cloud.ai.tongyi.chat.options.model=qwen-max
   ```

完成以上步骤后，你就成功地为Spring Cloud Alibaba项目配置了通义千问的API-KEY，可以开始利用AI功能进行开发了。这些步骤不仅解决了如何获取API-KEY的问题，也指导了如何将其集成到项目中，确保了从申请到配置的全过程得以顺利实施。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai 调用通义大模型实现聊天交互 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15879)给我们反馈。
