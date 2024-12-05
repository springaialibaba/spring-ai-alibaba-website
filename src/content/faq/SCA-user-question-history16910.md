---
id: "question-history-16910"
title: "用 springboot 与 mybatis 如何配置多数据源？"
date: "2024-09-26"
category: "expertConsultation"
description: "在回答如何在使用Spring Boot与MyBatis时配置多数据源的问题之前，我们先明确虽然直接的配置指南不在提供的Spring Cloud Alibaba版本对应信息中，但基于Spring Boot和MyBatis的基础配置是通用的，且不受特定Spring Cloud Alibaba版本直接影响"
tags: ["sca","spring-cloud-alibaba","springboot","mybatis","多数据源","配置"]
keywords: ["sca","spring-cloud-alibaba","springboot","mybatis","多数据源","配置"]
---

## 用户问题 ： 
 用 springboot 与 mybatis 如何配置多数据源？  

---------------
## 专家官方解答 ：

在回答如何在使用Spring Boot与MyBatis时配置多数据源的问题之前，我们先明确虽然直接的配置指南不在提供的Spring Cloud Alibaba版本对应信息中，但基于Spring Boot和MyBatis的基础配置是通用的，且不受特定Spring Cloud Alibaba版本直接影响。因此，我们可以基于Spring Boot和MyBatis的标准实践来指导配置多数据源的过程。下面的步骤将帮助您完成这一配置：

### 配置多数据源的步骤：

#### 1. 添加依赖

确保您的`pom.xml`文件中包含了Spring Boot Starter Data JPA（如果使用JPA）、MyBatis Starter以及两个数据库驱动的依赖。对于多数据源，还需要添加Spring Boot的`spring-boot-starter-data-jpa`（如果使用）和`mybatis-spring-boot-starter`。

```xml
<!-- Spring Boot Starter Data JPA (如果使用JPA) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- MyBatis Starter -->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>${mybatis.version}</version>
</dependency>

<!-- 数据库驱动，例如MySQL -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
</dependency>

<!-- 第二个数据库驱动，根据实际使用的数据库类型添加 -->
```

#### 2. 配置多数据源

创建一个配置类来设置两个数据源、事务管理器以及MyBatis的SqlSessionFactory。这里以两个MySQL数据源为例：

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties(prefix = "spring.datasource.first")
    public DataSource firstDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.second")
    public DataSource secondDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource firstDataSource, DataSource secondDataSource) throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        // 配置第一个数据源的SqlSessionFactory
        factoryBean.setDataSource(firstDataSource);
        // 配置MyBatis的相关属性...
        SqlSessionFactory firstSqlSessionFactory = factoryBean.getObject();

        // 对第二个数据源重复相同步骤
        factoryBean.setDataSource(secondDataSource);
        SqlSessionFactory secondSqlSessionFactory = factoryBean.getObject();

        // 根据需要选择或处理这两个SqlSessionFactory
        // 这里简化处理，实际应用中可能需要更复杂的策略来区分使用哪个SqlSessionFactory
        return firstSqlSessionFactory; // 示例中仅返回一个，实际应用需调整
    }

    // 配置事务管理器等其他bean...
}
```

#### 3. 配置MyBatis的MapperScannerConfigurer

使用`@MapperScan`注解或在配置类中定义`MapperScannerConfigurer`来扫描不同的Mapper接口，并为它们分配正确的SqlSessionFactory。

```java
// 使用@MapperScan分别指定Mapper接口的位置
@MapperScan(basePackages = "com.example.firstdb.mapper", sqlSessionFactoryRef = "sqlSessionFactory")
@MapperScan(basePackages = "com.example.seconddb.mapper", sqlSessionFactoryRef = "sqlSessionFactory")
```

或者在配置类中配置：

```java
@Bean
public MapperScannerConfigurer mapperScannerConfigurer() {
    MapperScannerConfigurer configurer = new MapperScannerConfigurer();
    configurer.setBasePackage("com.example.firstdb.mapper");
    configurer.setSqlSessionFactoryBeanName("sqlSessionFactory");
    return configurer;
}

// 同理，为第二个数据源的Mapper接口配置
```

#### 4. 在Service中使用多数据源

通过`@Qualifier`注解来指定注入哪个数据源的TransactionManager和Repository/Dao。

```java
@Service
public class SomeService {
    
    @Autowired
    @Qualifier("firstDataSource")
    private DataSource firstDataSource;

    @Autowired
    @Qualifier("secondDataSource")
    private DataSource secondDataSource;

    // 使用相应的数据源进行数据库操作...
}
```

### 解释

上述步骤首先通过Spring的自动配置功能和`@ConfigurationProperties`注解便捷地配置了两个数据源。接着，通过自定义的`SqlSessionFactory`配置来支持多数据源环境，确保每个数据源都有对应的SqlSessionFactory来处理SQL会话。最后，通过`@MapperScan`或手动配置`MapperScannerConfigurer`来扫描并绑定Mapper接口到正确的SqlSessionFactory上，使得在Service层可以通过指定的数据源执行数据库操作。

请注意，上述示例较为基础，真实场景下可能需要更细致的事务管理和数据源路由策略，特别是当事务跨越多个数据源时。希望这能为您提供一个配置多数据源的基本框架。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：spring cloud 、Spring Boot 与 Spring Cloud Alibaba (SCA)版本对应关系 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=16924)给我们反馈。
