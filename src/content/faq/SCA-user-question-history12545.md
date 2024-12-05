---
id: "question-history-12545"
title: "springboot jsp"
date: "2024-09-26"
category: "expertConsultation"
description: "在处理关于Sca(Spring Cloud Alibaba) SpringBoot JSP的问题时，我们首先明确Spring Boot默认并不直接支持JSP作为视图技术，因为它主要推荐使用Thymeleaf、FreeMarker等模板引擎。但若要在Spring Boot项目中集成JSP，需要进行一些"
tags: ["sca","spring-cloud-alibaba","springboot","jsp"]
keywords: ["sca","spring-cloud-alibaba","springboot","jsp"]
---

## 用户问题 ： 
 springboot jsp  

---------------
## 专家官方解答 ：

在处理关于"Sca(Spring Cloud Alibaba) SpringBoot JSP"的问题时，我们首先明确Spring Boot默认并不直接支持JSP作为视图技术，因为它主要推荐使用Thymeleaf、FreeMarker等模板引擎。但若要在Spring Boot项目中集成JSP，需要进行一些额外的配置。虽然提供的知识内容没有直接涉及这一主题，我们可以基于Spring Boot的一般做法和理解来指导如何在Sca项目中集成JSP。

### 步骤分析与建议

#### 1. 添加JSP支持依赖
由于默认的Spring Boot starter不包括JSP引擎，你需要手动添加Tomcat Embed依赖以及JSTL库以便支持JSP。

在`pom.xml`中加入以下依赖：
```xml
<dependency>
    <groupId>org.apache.tomcat.embed</groupId>
    <artifactId>tomcat-embed-jasper</artifactId>
    <scope>provided</scope>
</dependency>
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>jstl</artifactId>
</dependency>
```

#### 2. 配置视图解析器
为了让Spring Boot识别并使用JSP作为视图，你需要在配置类中设置视图解析器。这通常在`application.properties`或`application.yml`中完成，但也可以通过Java配置类实现。

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.ViewResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.view.InternalResourceViewResolver;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Bean
    public ViewResolver viewResolver() {
        InternalResourceViewResolver resolver = new InternalResourceViewResolver();
        resolver.setPrefix("/WEB-INF/jsp/");
        resolver.setSuffix(".jsp");
        return resolver;
    }
}
```

确保你的JSP文件放置在`/src/main/webapp/WEB-INF/jsp/`目录下，这是Spring Boot默认查找JSP文件的位置。

#### 3. 配置Spring Cloud Alibaba
虽然这一步不是直接与JSP集成相关，但确保你的Sca组件（如Nacos配置管理、Sentinel流量控制等）正常配置且不影响到视图层的处理也是必要的。根据之前提到的知识内容，正确配置Redis、初始化项目等步骤对于整体应用的运行是基础。

#### 4. 创建并使用JSP页面
之后，你就可以像在传统Spring MVC项目中那样创建和使用JSP页面了。例如，创建一个简单的Controller返回视图名。

```java
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "home";
    }
}
```

这里，“home”对应于`/WEB-INF/jsp/home.jsp`。

### 总结
尽管直接的知识点未覆盖JSP集成，但基于Spring Boot的基本实践，以上步骤应能指导你在Sca项目中成功集成并使用JSP。请记得，使用JSP在Spring Boot中相对非标准，可能遇到一些与现代模板引擎不同的行为或限制。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：springboot 与测试类(springboot test )的集成方案 
 
 * 专家经验：springboot sca 整合redis的具体方法 
 
 * 专家经验：springboot 快速启动 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=12638)给我们反馈。
