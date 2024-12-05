---
id: "question-history-12579"
title: "springmvc常用注解有哪些？分别是什么意思？"
date: "2024-09-26"
category: "expertConsultation"
description: "Spring MVC 在 Spring Cloud Alibaba (SCA) 环境中使用的注解与标准Spring MVC相同，这些注解对于构建RESTful服务、处理请求、数据绑定等至关重要。以下是一些常用的Spring MVC注解及其含义：### 1. `@Controller`- **含义**"
tags: ["sca","spring-cloud-alibaba","springmvc","注解","意思","常用","分别"]
keywords: ["sca","spring-cloud-alibaba","springmvc","注解","意思","常用","分别"]
---

## 用户问题 ： 
 springmvc常用注解有哪些？分别是什么意思？  

---------------
## 专家官方解答 ：

Spring MVC 在 Spring Cloud Alibaba (SCA) 环境中使用的注解与标准Spring MVC相同，这些注解对于构建RESTful服务、处理请求、数据绑定等至关重要。以下是一些常用的Spring MVC注解及其含义：

### 1. `@Controller`
- **含义**：标记在一个类上，表示该类是一个控制器，用于处理来自Web的请求。通常与`@RequestMapping`结合使用来指定请求的URL映射。

### 2. `@RestController`
- **含义**：是`@Controller`和`@ResponseBody`的组合，表示该类是一个控制器，其每个方法的返回值都会直接写入HTTP响应体中，常用于构建RESTful风格的API。

### 3. `@RequestMapping`
- **含义**：可用于类或方法级别，用于映射HTTP请求到处理方法。可以指定URL、HTTP方法(GET、POST等)。

### 4. `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`
- **含义**：分别对应HTTP的GET、POST、PUT、DELETE方法，是`@RequestMapping`的简化版，更明确地指定请求方法。

### 5. `@PathVariable`
- **含义**：用于从URL路径中提取变量值，将URL中占位符参数绑定到方法参数上。

### 6. `@RequestParam`
- **含义**：用于将请求参数绑定到方法参数上，适用于查询参数和表单提交的数据。

### 7. `@RequestBody`
- **含义**：用于读取Request请求的Body部分数据，转换为Java对象。常用于处理JSON或XML形式的请求体。

### 8. `@ModelAttribute`
- **含义**：用于绑定请求参数到一个方法参数或一个返回值上，可以用来预处理数据或构造复杂对象。

### 9. `@SessionAttributes`
- **含义**：用于存储模型中的属性到HttpSession中，在多个请求之间共享数据。

### 10. `@ControllerAdvice`
- **含义**：全局异常处理和全局数据绑定，可以定义一个全局异常处理器或全局数据初始化方法。

### 11. `@Valid` 和 `@NotBlank`, `@NotNull`, `@Size`, 等
- **含义**：用于数据校验，确保请求中的数据满足特定条件。`@Valid`用于触发验证，其他注解定义具体的验证规则。

这些注解构成了Spring MVC处理请求的基础，帮助开发者以声明式的方式处理HTTP请求、数据绑定、输入验证等任务，极大地简化了Web应用的开发。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：spring mvc 的主要工作流程是怎样的？ 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=12672)给我们反馈。
