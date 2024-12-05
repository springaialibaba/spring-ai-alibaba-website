---
id: "question-history-13454"
title: "SCA添加seata怎么部署配置？"
date: "2024-09-26"
category: "expertConsultation"
description: "为了在SCA（Spring Cloud Alibaba）项目中添加Seata以实现分布式事务的支持，您需要遵循以下部署配置步骤：### 1. 启动 Seata Server#### 配置数据库及表结构- **创建UNDO_LOG表**：用于AT模式下存储事务回滚信息。```sqlCREATE TAB"
tags: ["sca","spring-cloud-alibaba","seata","部署","配置"]
keywords: ["sca","spring-cloud-alibaba","seata","部署","配置"]
---

## 用户问题 ： 
 SCA添加seata怎么部署配置？  

---------------
## 专家官方解答 ：

为了在SCA（Spring Cloud Alibaba）项目中添加Seata以实现分布式事务的支持，您需要遵循以下部署配置步骤：

### 1. 启动 Seata Server

#### 配置数据库及表结构
- **创建UNDO_LOG表**：用于AT模式下存储事务回滚信息。
```sql
CREATE TABLE `undo_log` (
  ...
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
```
- **导入Seata Server所需表结构**：包括global_table、branch_table、lock_table、distributed_lock，参考[SQL脚本](https://github.com/seata/seata/blob/1.5.0/script/server/db/mysql.sql)。

#### 启动Seata Server应用
- 使用[Nacos](https://github.com/seata/seata/releases)作为配置中心和注册中心，存储模式可选为`file`或`db`。
- 通过命令行启动Seata Server，例如：
```sh
$ sh seata-server.sh -p 8091 -m file
```

### 2. 配置Seata客户端

#### 修改Nacos配置
- 在Nacos中创建配置文件`seata.properties`，Group设为`SEATA_GROUP`，并添加事务群组映射配置，如：
```properties
service.vgroupMapping.*-tx-group=default
```

#### 业务数据环境配置
- 更新account-service、order-service、storage-service等服务的application.yml，确保数据库连接等配置正确。
- 创建各服务所需数据库表，包括Seata的事务日志表undo_log（AT模式下）以及其他业务表。

### 3. 引入Seata依赖
在Spring Boot项目中加入Seata的依赖：
```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
</dependency>
```

### 4. 启动示例服务
- 确保Seata Server已启动。
- 分别启动account-service、order-service、storage-service以及business-service。
- 访问示例接口验证服务是否正常工作，如：[http://127.0.0.1:18081/seata/feign](http://127.0.0.1:18081/seata/feign)

以上步骤确保了Seata在SCA项目中得以正确部署并配置，以提供分布式事务支持。通过Seata Server管理全局事务，配合Nacos进行服务注册与配置管理，实现了分布式系统中的事务一致性解决方案。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：基于springboot sca 添加 seata怎么部署配置？ 
 
 * 专家经验：Nacos 融合 Spring Cloud，成为注册配置中心 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=13956)给我们反馈。
