---
id: "question-history-15751"
title: "spring ai支持哪些通义千问的参数？"
date: "2024-09-26"
category: "expertConsultation"
description: "根据提供的知识内容，Sca(spring-cloud-alibaba) Spring AI支持的通义千问参数包括以下多个方面：1. **model**: 指定用于对话的通义千问模型名，如`qwen-turbo`、`qwen-plus`等，决定了模型的特性和能力。2. **messages**: 定义"
tags: ["sca","spring-cloud-alibaba","spring","ai","通义千问","参数","支持"]
keywords: ["sca","spring-cloud-alibaba","spring","ai","通义千问","参数","支持"]
---

## 用户问题 ： 
 spring ai支持哪些通义千问的参数？  

---------------
## 专家官方解答 ：

根据提供的知识内容，Sca(spring-cloud-alibaba) Spring AI支持的通义千问参数包括以下多个方面：

1. **model**: 指定用于对话的通义千问模型名，如`qwen-turbo`、`qwen-plus`等，决定了模型的特性和能力。

2. **messages**: 定义了用户与模型的对话历史，通过包含role和content的字典来模拟实际对话流程，支持system、user、assistant和tool角色。

3. **prompt**: 用户输入的指令，用于指导模型生成回复，与messages不可同时为空。

4. **history**: 即将废弃的字段，以前用于记录对话历史，现在推荐使用messages。

5. **seed**: 生成时使用的随机数种子，控制生成内容的随机性。

6. **max_tokens**: 模型可生成的最大token数量，不同模型有不同的默认和最大值。

7. **top_p**: 核采样方法的概率阈值，影响生成内容的随机性与多样性。

8. **top_k**: 生成时考虑的候选集大小，同样影响生成内容的随机性。

9. **repetition_penalty**: 控制生成内容的重复度，值大于1可以减少重复。

10. **temperature**: 调节生成文本的随机性和多样性，值较低时生成更确定的结果。

11. **stop**: 实现生成内容的精确控制，允许在特定条件满足时停止生成。

12. **stream**: 控制是否使用流式输出，适用于实时交互需求。

13. **enable_search**: 是否让模型在生成文本时使用互联网搜索结果作为参考。

14. **result_format**: 返回结果的格式，可选"text"或"message"。

15. **incremental_output**: 在流式输出模式下控制是否增量输出内容。

16. **tools**: 定义可供模型调用的工具库，支持function类型的工具，并需提供函数名、描述和参数定义。

以上参数详细说明和使用方式，您可以参考[这里](https://help.aliyun.com/document_detail/2712573.html?spm=a2c4g.2712576.0.i1#7cde05535euty)获得更多信息和示例代码。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca ai 支持的通义千问参数 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=15752)给我们反馈。
