---
id: "question-history-16875"
title: "SpringBoot 要使用 @Transactional 怎么用？maven依赖 代码"
date: "2024-09-26"
category: "expertConsultation"
description: "为了在 Spring Boot 应用中使用 `@Transactional` 注解来管理事务，你需要确保已经正确设置了 Maven 依赖并合理地在代码中应用该注解。虽然 Spring Cloud Alibaba 主要关注微服务架构中的服务发现、配置管理、限流降级等组件，但 `@Transaction"
tags: ["sca","spring-cloud-alibaba","SpringBoot","@Transactional","maven","依赖","代码样例"]
keywords: ["sca","spring-cloud-alibaba","SpringBoot","@Transactional","maven","依赖","代码样例"]
---

## 用户问题 ： 
 SpringBoot 要使用 @Transactional 怎么用？maven依赖 代码样例  

---------------
## 专家官方解答 ：

为了在 Spring Boot 应用中使用 `@Transactional` 注解来管理事务，你需要确保已经正确设置了 Maven 依赖并合理地在代码中应用该注解。虽然 Spring Cloud Alibaba 主要关注微服务架构中的服务发现、配置管理、限流降级等组件，但 `@Transactional` 的使用属于 Spring Framework 核心功能的一部分，与 Spring Cloud Alibaba 的直接关联不大。不过，它在任何基于 Spring 的应用中都是支持的，包括使用 Spring Cloud Alibaba 构建的微服务。以下是启用 `@Transactional` 的步骤：

### 添加 Maven 依赖

确保你的 `pom.xml` 文件中包含了 Spring Data JPA（或你选择的数据访问技术）以及 Spring Transaction 的依赖。这里以 Spring Data JPA 为例：

```xml
<dependencies>
    <!-- Spring Data JPA 依赖 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- 数据库驱动依赖，例如 MySQL -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

### 配置数据源

在 `application.properties` 或 `application.yml` 中配置数据源信息，例如：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/yourdb
    username: yourusername
    password: yourpassword
    driver-class-name: com.mysql.jdbc.Driver
```

### 在服务类或方法上使用 @Transactional

要在服务层方法上启用事务管理，只需在相应的方法或类上添加 `@Transactional` 注解。例如：

```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 当这个方法被调用时，会在其内部操作上开启一个事务
    @Transactional
    public void createUserAndProcess(User user) {
        userRepository.save(user);
        // 假设还有其他需要事务管理的操作
    }
}
```

### 解释

- **Maven 依赖**：添加 Spring Data JPA 和数据库驱动是为了让 Spring Boot 能够与数据库交互，并且 Spring Data JPA 自带了对事务管理的支持。
- **配置数据源**：这是为了让 Spring 自动配置的数据源能够连接到正确的数据库。
- **@Transactional 使用**：此注解可以放在类级别或方法级别。类级别表示该类中的所有公共非静态方法都将开启事务；方法级别则仅对该方法生效。事务默认在遇到运行时异常（继承自 `RuntimeException` 的异常）时回滚，对于检查型异常（继承自 `Exception` 但不是 `RuntimeException` 的异常）不会自动回滚，除非你通过 `rollbackFor` 属性指定了异常类型。

请注意，尽管这里未直接涉及 Spring Cloud Alibaba 组件，但 Spring Cloud Alibaba 可以与这些基础的 Spring 功能无缝集成，共同服务于微服务架构的构建。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：sca(spring-cloud-alibaba) Spring Cloud Alibaba 是什么 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16885)给我们反馈。
