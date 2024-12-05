---
id: "question-history-14800"
title: "怎么使用 org.springframework.cache.caffeine.Caff"
date: "2024-09-26"
category: "expertConsultation"
description: "在使用Spring Cloud Alibaba时，若想集成`org.springframework.cache.caffeine.CaffeineCache`作为缓存实现，尽管Spring Cloud Alibaba主要关注于服务发现、配置管理等微服务特性，但你可以利用Spring Framewor"
tags: ["sca","spring-cloud-alibaba","orgspringframeworkcachecaffeine","CaffeineCache","使用","教程","配置"]
keywords: ["sca","spring-cloud-alibaba","orgspringframeworkcachecaffeine","CaffeineCache","使用","教程","配置"]
---

## 用户问题 ： 
 怎么使用 org.springframework.cache.caffeine.CaffeineCach  

---------------
## 专家官方解答 ：

在使用Spring Cloud Alibaba时，若想集成`org.springframework.cache.caffeine.CaffeineCache`作为缓存实现，尽管Spring Cloud Alibaba主要关注于服务发现、配置管理等微服务特性，但你可以利用Spring Framework自身的缓存抽象与Caffeine的集成来实现这一需求。以下是基于现有知识的步骤指导：

### 步骤分析与实施

#### 1. 添加依赖
首先，确保你的项目中添加了Caffeine的依赖。在Maven项目的`pom.xml`文件中加入以下依赖：

```xml
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
    <version>{{{变量:caffeine_version}}}</version> <!-- 使用最新稳定版 -->
</dependency>
```

同时，确保你的Spring Boot项目已经包含了Spring Cache的起步依赖，例如：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

#### 2. 配置Caffeine缓存
接下来，在你的Spring Boot应用的配置类中启用Caffeine作为缓存管理器。可以通过`@Configuration`注解的类进行配置：

```java
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import com.github.benmanes.caffeine.cache.Caffeine;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(100) // 设置缓存最大容量
                .expireAfterWrite(60, TimeUnit.SECONDS) // 设置缓存过期时间
        );
        return cacheManager;
    }
}
```

#### 3. 使用缓存
现在，你可以在需要缓存的方法上使用`@Cacheable`、`@CachePut`、`@CacheEvict`等注解来实现缓存功能。例如：

```java
@Service
public class UserService {

    @Cacheable(value = "userCache", key = "#id")
    public User getUserById(String id) {
        // 实际查询逻辑，这里假设从数据库获取
        return new User(id, "John Doe");
    }
}
```

### 解释
以上步骤通过直接配置CaffeineCacheManager，使得Spring的缓存抽象能够利用Caffeine作为底层实现。这样做允许你在Spring Cloud Alibaba的微服务架构中享受到Caffeine提供的高性能本地缓存能力，而无需直接依赖Spring Cloud Alibaba提供此特定功能。确保所使用的Caffeine和Spring Boot版本之间兼容，并且根据实际需求调整Caffeine的配置参数以达到最优性能。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：spring 怎么读？ 
 
 * 专家经验：Spring Cloud Alibaba和Dubbo选型建议 
 
 * 专家经验：spring cloud 、Spring Boot 与 Spring Cloud Alibaba (SCA)版本对应关系 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=14802)给我们反馈。
