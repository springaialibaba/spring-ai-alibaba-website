---
id: "question-history-14755"
title: "spring boot 的Cannot determine embedded datab"
date: "2024-05-30"
category: "expertConsultation"
description: "在Spring Cloud Alibaba项目中遇到`Cannot determine embedded database driver class for database type NONE`错误，其产生原因及解决步骤如下：### 原因分析：1. **未使用DataSource却引入相关依赖**"
---

## 用户问题 ： 
 spring boot 的Cannot determine embedded database driver class for database type NONE 产生原因  

---------------
## 专家官方解答 ：

在Spring Cloud Alibaba项目中遇到`Cannot determine embedded database driver class for database type NONE`错误，其产生原因及解决步骤如下：

### 原因分析：

1. **未使用DataSource却引入相关依赖**：你的应用实际上并未配置或使用数据库连接，但却在项目的`pom.xml`中包含了`spring-boot-starter-jdbc`依赖。这导致Spring Boot在启动时尝试自动配置数据源。

2. **自动配置冲突**：由于`spring-boot-starter-jdbc`引入了`tomcat-jdbc`库，其中包含了`org.apache.tomcat.jdbc.pool.DataSource`的实现。Spring Boot的自动配置机制会在类路径下检测到这个实现类，并尝试根据配置创建数据源Bean。

3. **缺少必要配置**：因为你的应用缺少数据库URL等相关配置，Spring Boot在尝试通过JDBC URL推断数据库驱动类时失败，从而抛出该异常。

### 解决方案：

#### 方法一：移除不必要的依赖

- **步骤**：检查并从你的`pom.xml`文件中移除`spring-boot-starter-jdbc`依赖，如果确实不需要使用数据库连接功能的话。

```xml
<!-- 在pom.xml中移除如下依赖 -->
<!-- <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jdbc</artifactId>
</dependency> -->
```

#### 方法二：禁用DataSource自动配置

- **步骤1**：在启动类上添加`@SpringBootApplication`注解的`exclude`属性，以排除数据源的自动配置。

```java
@SpringBootApplication(exclude = { 
    DataSourceAutoConfiguration.class, 
    DataSourceTransactionManagerAutoConfiguration.class 
})
public class YourApplication {
    public static void main(String[] args) {
        SpringApplication.run(YourApplication.class, args);
    }
}
```

- **步骤2**（可选）：或者，在`application.properties`或`application.yml`中配置以排除数据源自动配置。

```properties
spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration
```

### 解释：

以上步骤旨在解决由不必要或不当配置引起的自动配置冲突。通过移除未使用的依赖或明确禁用特定的自动配置项，可以避免Spring Boot在启动过程中尝试创建不必要的数据源实例，从而消除该错误。选择适合你项目实际情况的方法进行调整即可。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：怎样排查 Cannot determine embedded database driver class for database type NONE 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=14756)给我们反馈。
