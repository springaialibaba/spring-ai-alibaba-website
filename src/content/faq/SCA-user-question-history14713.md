---
id: "question-history-14713"
title: "org.springframework.ai:spring-ai-core:jar:0."
date: "2024-05-29"
category: "expertConsultation"
description: "遇到问题`org.springframework.ai:spring-ai-core:jar:0.8.1 was not found in https://maven.aliyun.com/repository/public...`主要是因为Spring官方未将`spring-ai-core`版本0"
tags: ["spring-cloud-alibaba","org.springframework.ai","spring-ai-core","0.8.1","maven.aliyun.com","repository","public","previous attempt","failure","cached","local repository","update interval","aliyunmaven","forced"]
keywords: ["spring-cloud-alibaba","org.springframework.ai","spring-ai-core","0.8.1","maven.aliyun.com","repository","public","previous attempt","failure","cached","local repository","update interval","aliyunmaven","forced"]
---

## 用户问题 ： 
 org.springframework.ai:spring-ai-core:jar:0.8.1 was not found in https: maven.aliyun.com repository public during a previous attempt. This failure was cached in the local repository and resolution is not reattempted until the update interval of aliyunmaven has elapsed or updates are forced  

---------------
## 专家官方解答 ：

遇到问题`org.springframework.ai:spring-ai-core:jar:0.8.1 was not found in https://maven.aliyun.com/repository/public...`主要是因为Spring官方未将`spring-ai-core`版本0.8.1发布到公共的Maven中央仓库中。根据提供的知识内容，可以采取以下步骤解决：

### 解决方案

#### Maven项目

1. **添加Spring Milestones和Snapshots仓库**
   在您的`pom.xml`文件中，添加以下片段以引入Spring的Milestones和Snapshots仓库，这些仓库可能包含了未正式发布到中央仓库的版本。

   ```xml
   <repositories>
       <repository>
           <id>spring-milestones</id>
           <name>Spring Milestones</name>
           <url>https://repo.spring.io/milestone</url>
           <snapshots>
               <enabled>false</enabled>
           </snapshots>
       </repository>
       <repository>
           <id>spring-snapshots</id>
           <name>Spring Snapshots</name>
           <url>https://repo.spring.io/snapshot</url>
           <releases>
               <enabled>false</enabled>
           </releases>
       </repository>
   </repositories>
   ```

2. **更新依赖**
   确保您的`pom.xml`中对于`org.springframework.ai:spring-ai-core`的依赖声明正确无误，然后执行`mvn clean install`或`mvn dependency:refresh`命令强制Maven检查并更新依赖。

#### Gradle项目

1. **修改`build.gradle`文件**
   在您的`build.gradle`文件中，添加以下代码段来包含Spring的Milestones和Snapshots仓库。

   ```groovy
   repositories {
       mavenCentral()
       maven { url 'https://repo.spring.io/milestone' }
       maven { url 'https://repo.spring.io/snapshot' }
   }
   ```

2. **刷新依赖**
   运行`gradle build --refresh-dependencies`命令来强制Gradle检查并更新所有依赖项。

### 解释

通过添加Spring的Milestones和Snapshots仓库，您能够访问到那些尚未正式发布但已可供测试和早期采用的库版本。这应该能解决因依赖项未在常规仓库中找到而导致的构建失败问题。务必注意，使用Milestones和Snapshots版本可能会引入不稳定因素，因为它们通常是为测试新功能和修复而设计的，建议仅在开发环境或测试环境中使用。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：无法从maven中央仓下载内容的说明 
 
 * 专家经验：sca ai (spring cloud alibaba ai）介绍 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>，在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。您也可以访问 : [全局专家答疑](https://answer.opensource.alibaba.com/docs/intro) 。 咨询其他产品的的问题

### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=14743)给我们反馈。
