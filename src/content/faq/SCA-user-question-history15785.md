---
id: "question-history-15785"
title: "com.alibaba.cloud.ai.tongyi.exception.TongYi"
date: "2024-06-20"
category: "expertConsultation"
description: "根据您提供的错误信息`com.alibaba.cloud.ai.tongyi.exception.TongYiException: Can not find api-key.`，这个问题很明显是因为系统在尝试使用阿里云通义大模型服务时，未能找到必要的API密钥(api-key)配置。**分析原因：*"
---

## 用户问题 ： 
 com.alibaba.cloud.ai.tongyi.exception.TongYiException: Can not find api-key.  

---------------
## 专家官方解答 ：

根据您提供的错误信息`com.alibaba.cloud.ai.tongyi.exception.TongYiException: Can not find api-key.`，这个问题很明显是因为系统在尝试使用阿里云通义大模型服务时，未能找到必要的API密钥(api-key)配置。

**分析原因：**
- 问题出在配置缺失或者配置不正确，特别是负责与通义千问交互所需的`api-key`没有在应用的配置文件中被正确定义或被遗漏。
- 可能是配置文件路径错误、命名空间不匹配、或者是键名输入有误。

**解决步骤：**

1. **检查配置文件**：
   - 确认你的项目中是否有正确的`application.yml`或`application.properties`文件，并且这些文件是否被正确加载。
   - 根据你的环境确认是否应该修改的是`application.yml`还是`application.properties`。

2. **核对配置格式与键名**：
   - 对于`application.yml`，请确保配置如下：
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
   - 对于`application.properties`，配置应为：
     ```
     spring.cloud.ai.tongyi.chat.options.api-key=YOUR_API_KEY_HERE
     spring.cloud.ai.tongyi.chat.options.model=qwen-max
     ```
   - 请将`YOUR_API_KEY_HERE`替换为你从阿里云获取的实际API密钥。

3. **验证API密钥有效性**：
   - 确保你使用的API密钥是有效的，并且是从阿里云百炼页面正确生成的。可以通过阿里云控制台验证API密钥的有效性。

4. **重启应用**：
   - 修改配置后，需要重启你的Spring Boot应用以使新的配置生效。

**解释说明：**
- 上述步骤首先定位了问题的根源在于配置缺失，然后指导如何在配置文件中正确设置`api-key`，并强调了重启应用的重要性以确保配置变更被应用。这有助于确保系统能够找到并使用正确的API密钥与阿里云通义服务进行通信。

如果问题依然存在，可能需要进一步检查日志文件，查看是否有其他配置相关错误，或者联系阿里云客服确认API密钥的状态和权限设置。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai 调用通义大模型实现聊天交互 
 
 * 专家经验：sca ai (spring cloud alibaba ai）介绍 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15787)给我们反馈。
