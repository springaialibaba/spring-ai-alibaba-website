---
title: Spring Cloud Alibaba 最佳实践
keywords: [Spring Cloud Alibaba,Docker,kubetnetes,helm]
description: Spring Cloud Alibaba 最佳实践
author: 牧生
date: "2024-01-27"
category: case
---

## Spring Cloud Alibaba项目简介

Spring Cloud Alibaba（下文简称为SCA） 致力于提供微服务开发的一站式解决方案。此项目包含开发分布式应用服务的必需组件，方便开发者通过 Spring Cloud 编程模型轻松使用这些组件来开发分布式应用服务。
依托 SCA，您只需要添加一些注解和少量配置，就可以将 Spring Cloud 应用接入阿里分布式应用解决方案，通过阿里中间件来迅速搭建分布式应用系统。

## 项目最佳实践案例介绍

SCA的项目的最佳实践，是整合了SCA相关组件（Nacos，Sentinel，Seata，RocketMQ）的Example示例项目。方便用户全面体验SCA提供的一站式微服务解决方案。

1. Spring Cloud Gateway： 网关
2. Nacos：服务注册和配置中心
3. Sentinel：熔断限流
4. Seata：分布式事务
5. RocketMQ：消息队列，削峰填谷
6. Docker：使用Docker进行容器化部署
7. Kubernetes：使用k8s进行容器化部署

下图为SCA最佳实践项目结构示意图：

![image.png](/img/best-practice/image0.png)

### 组件详细说明

1. 其中，用户下单购买货物的场景主要使用 Seata 来进行分布式事务的能力体现。 
2. 用户为商品进行点赞的场景，模拟大流量环境下通过 Sentinel 进行限流或是 RocketMQ 进行削峰填谷。在此场景下，SCA社区提供了两种应对大流量的处理方式： 
   - Sentinel 在网关侧绑定指定网关路由进行服务的熔断降级。 
   - RocketMQ 进行流量削峰填谷，在大流量请求下，生产者向 RocketMQ 发送消息，而消费者则通过可配置的消费速率进行拉取消费，减少大流量直接请求数据库增加点赞请求的压力。

#### Spring Cloud Gateway

**Spring Cloud GateWay 是微服务模块的网关，整合 Nacos，实现动态路由的配置。**通过监听 Nacos 配置的改变，实现服务网关路由配置动态刷新，每次路由信息变更，无需修改配置文件而后重启服务。

#### Nacos

**Nacos 是SCA微服务模块的服务注册中心和配置中心**。整合 Spring Cloud Gateway，所有的微服务模块都注册到 Nacos 中进行服务注册与发现。

#### Seata

**基于 Seata 的 AT 模式，用于库存模块，账户模块，订单模块的分布式事务处理。**当库存不足/账户余额不足时，进行事务回滚。

#### Sentinel

**用于点赞场景的服务熔断限流。**整合 Nacos 配置中心与 Spring Cloud Gateway，实现指定路由规则、熔断限流规则动态配置。

#### RocketMQ

**用于进行点赞服务流量的削峰填谷。**通过将大流量的点赞请求从生产者发送到mq，消费者模块从mq中拉取进行一定频率的消费，不是简单的直接服务熔断限流降级，实现 RocketMQ 针对大流量的削峰填谷能力。

### 应用场景说明

在本 Demo 示例中，SCA社区提供了两种业务场景：

1. 用户下单购买货物的场景，下单后： 

先请求库存模块，扣减库存； 
扣减账户余额； 
 生成订单信息返回响应。 

2. 用户为商品进行点赞(模拟MQ的生产者消费者应用场景)返回商品点赞后的详细信息（点赞数等）。 

## Docker Compose 部署

容器化部署是将应用代码和所需的所有组件(例如库、框架和其他依赖项)打包在一起, 让它们隔离在自己的"容器"中去运行。
**Note：如果以Docker Compose方式体验Demo时，需要确保内存资源 >= 24G！**

### Hosts 配置

在启动服务容器前，请先配置 Host 地址映射，确保服务能够正常启动！

```shell
# for integrated-example
127.0.0.1 integrated-mysql
127.0.0.1 nacos-server
127.0.0.1 seata-server
127.0.0.1 rocketmq
127.0.0.1 gateway-service
127.0.0.1 integrated-frontend
```

### 启动容器

#### 组件容器启动

进入`spring-cloud-alibaba-examples/integrated-example`目录下，执行 `docker-compose -f docker-compose-env.yml up -d` 即可启动所有微服务应用依赖的组件，即Nacos，MySQL，RocketMQ，Seata-Server，完成需要的数据库表配置等相关操作。

#### 添加应用配置信息

在`spring-cloud-alibaba-examples/integrated-example`目录下，在终端中执行`config-init/scripts/nacos-config-quick.sh`脚本文件。即可自动注入应用的所有配置信息。

#### 服务容器启动

在`spring-cloud-alibaba-examples/integrated-example`目录下，执行以下命令`docker-compose -f ./docker-compose/docker-compose-service.yml up -d`来快速部署example应用。

### 访问 Demo

#### 分布式事务能力

访问`http://integrated-frontend:30080/order` 来体验对应场景。
直接点击下单按钮提交表单，模拟客户端向网关发送了一个创建订单的请求。

- 用户的 userId 为 admin
- 用户下单的商品编号为1号
- 此次订单购买的商品个数为1个

![image.png](/img/best-practice/image1.png)

在本 Demo 示例中，为了便于演示，每件商品的单价都为2。
而在初始化业务数据库表的时候新建了一个用户，用户的userId为admin，余额为 3 元；同时新建了一个编号为 1 号的商品，库存为 100 件。
因此通过上述的操作，应用会创建一个订单，扣减对应商品编号为 1 号的库存个数(100-1=99)，扣减 admin 用户的余额(3-2=1)。

![image.png](/img/best-practice/image2.png)

如果再次请求相同的接口，同样是先扣减库存(99-1=98)，但是会因为 admin 用户余额不足而抛出异常，并被 Seata 捕获，执行分布式事务二阶段提交，回滚事务。

![image.png](/img/best-practice/image3.png)

可以看到数据库中库存的记录因为回滚之后仍然为 99 件。

##### 熔断限流，削峰填谷能力

1. 场景说明

  针对大流量背景下的服务熔断限流，削峰填谷，SCA社区提供了**用户为商品进行点赞的场景**。在此场景下，SCA社区提供了两种应对大流量的处理方式。

- Sentinel 在网关侧绑定指定网关路由进行服务的熔断降级。
- RocketMQ 进行流量削峰填谷，在大流量请求下，生产者向 RocketMQ 发送消息，而消费者则通过可配置的消费速率进行拉取消费，减少大流量直接请求数据库增加点赞请求的压力。

2. 访问测试 

- Sentinel 熔断降级

访问 `http://integrated-frontend:30080/sentinel` 体验对应场景。

![image.png](/img/best-practice/image4.png)

  网关路由点赞服务的限流规则为 5，而在前端通过异步处理模拟了 10 次并发请求。
  因此可以看到 Sentinel 在 Gateway 侧针对多出的流量进行了服务熔断返回 fallback 给客户端，同时数据库的点赞数进行了更新(+5)。

- RocketMQ进行流量削峰填谷

访问 `http://integrated-frontend:30080/rocketmq` 体验对应场景。 

![image.png](/img/best-practice/image5.png)

由于之前在 Nacos 中配置了`integrated-praise-consumer`消费者模块的消费速率以及间隔，在点击按钮时应用将会模拟 1000 个点赞请求，针对 1000 个点赞请求，`integrated-praise-provider` 会将 1000 次请求都向 Broker 投递消息，而在消费者模块中会根据配置的消费速率进行消费，向数据库更新点赞的商品数据，模拟大流量下 RocketMQ 削峰填谷的特性。
    可以看到数据库中点赞的个数正在动态更新。

![image.png](/img/best-practice/image6.png)

#### 服务容器停止

在 `spring-cloud-alibaba-examples/integrated-example` 目录下，执行以下命来停止正在运行的example服务容器。

```shell
docker-compose -f ./docker-compose/docker-compose-service.yml down
```

#### 组件容器停止

在 `spring-cloud-alibaba-examples/integrated-example` 目录下，执行以下命令 `docker-compose -f ./docker-compose/docker-compose-env.yml down` 来停止正在运行的example组件容器。
> 更多信息请参考：[Spring Cloud Alibaba容器化部署最佳实践 | Docker-Compose 版本](https://github.com/alibaba/spring-cloud-alibaba/blob/2022.x/spring-cloud-alibaba-examples/integrated-example/docs/zh/docker-compose-deploy-zh.md)

## Kubernetes Helm 部署

### 启动测试

进入到 `spring-cloud-alibaba-examples/integrated-example` 目录下，执行如下命令利用 Helm 部署应用程序。

```shell
helm package helm-chart

helm install integrated-example integrated-example-1.0.0.tgz
```

通过运行上述命令，根据SCA社区提供的 Helm Chart 文档通过 Helm 快速完成最佳实践示例的部署。
可以通过 Kubernetes 提供的 `kubectl` 命令查看各容器资源部署的情况，耐心等待**所有容器完成启动后**即可到对应页面体验各个组件的使用场景及能力。

### 体验Demo

同 Docker Compose Demo 体验过程

### 停止测试

如果您想停止体验，输入如下命令。

```shell
helm uninstall integrated-example
```

> 更多信息请参考：[Spring Cloud Alibaba容器化部署最佳实践 | Kubernetes Helm-Chart 版本](https://github.com/alibaba/spring-cloud-alibaba/blob/2022.x/spring-cloud-alibaba-examples/integrated-example/docs/zh/kubernetes-deployment-zh.md)
