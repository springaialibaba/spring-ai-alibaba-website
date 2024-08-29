---
id: "question-history-14761"
title: "spring boot expected single matching bean bu"
date: "2024-05-30"
category: "expertConsultation"
description: "在`sca(spring-cloud-alibaba)`环境中遇到`spring boot expected single matching bean but found 2`的异常，通常是因为Spring Boot在尝试自动配置时找到了多个相同类型的Bean（本例中为`DataSource`）。结"
---

## 用户问题 ： 
 spring boot expected single matching bean but found 2  

---------------
## 专家官方解答 ：

在`sca(spring-cloud-alibaba)`环境中遇到`spring boot expected single matching bean but found 2`的异常，通常是因为Spring Boot在尝试自动配置时找到了多个相同类型的Bean（本例中为`DataSource`）。结合你的场景，这可能发生在集成Nacos或其他数据源配置时。根据提供的知识内容，我们可以分步解析和解决此问题：

### 原因分析：
1. **应用需要注入DataSource Bean**：在使用Spring Cloud Alibaba时，通常涉及到数据库操作的服务需要注入一个`DataSource`来连接数据库。
2. **存在多个DataSource定义**：异常指出找到两个`DataSource`——`h2DataSource1`和`h2DataSource2`，这可能是由于配置失误或不明确的Bean定义导致。

### 解决策略：
#### 方法一：使用@Primary指定首选Bean
- **步骤**：
  1. **标注优先Bean**：在其中一个DataSource的配置类或Bean定义处，使用`@Primary`注解标记该Bean为首选。
  2. **检查依赖注入点**：确保在需要使用DataSource的地方，没有硬编码引用到具体Bean名称，让Spring自动选择`@Primary`标注的Bean。

#### 方法二：禁用Spring Boot的自动数据源配置
- **步骤**：
  1. **在主类添加排除配置**：修改启动类，使用`@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class, DataSourceTransactionManagerAutoConfiguration.class})`来禁用默认的数据源自动配置。
  2. **手动配置数据源**：在禁用自动配置后，需要手动配置并注册你需要的数据源Bean到Spring容器中。
  3. **配置Nacos相关数据源**：如果使用Nacos进行配置管理，确保在Nacos配置中心正确配置数据源信息，并在应用中通过`@NacosValue`或`@Value`注解读取这些配置来初始化数据源。

### 额外提示：
- 确保理解Nacos Config和Nacos Discovery的使用方法，参考[Nacos Config](https://github.com/spring-cloud-incubator/spring-cloud-alibaba/wiki/Nacos-config) 和 [Nacos Discovery](https://github.com/spring-cloud-incubator/spring-cloud-alibaba/wiki/Nacos-discovery)，特别是如何在Spring Cloud Alibaba项目中正确配置和使用数据源。

以上步骤应能帮助你解决在`sca(spring-cloud-alibaba)`项目中遇到的多数据源冲突问题，确保应用能够正常启动并正确使用预期的数据源。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：spring boot expected single matching bean but found 2的异常 
 
 * 专家经验：Nacos 融合 Spring Cloud，成为注册配置中心 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=14765)给我们反馈。
