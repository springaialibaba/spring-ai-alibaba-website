---
title: 在 Proxyless Mesh 上的探索
keywords: [Proxyless Mesh, 微服务治理]
description: 介绍 Spring Cloud Alibaba 在 Proxyless Mesh 上的探索
author: 铖朴
date: "2023-01-20"
category: ecosystem
---

## 摘要

经过过去几年的发展，Service Mesh 已再是一个新兴的概念，其从一经推出就受到来自全世界的主流技术公司关注和追捧。Proxyless Mesh 全称是 Proxyless Service Mesh，其是近几年在 Service Mesh 基础上发展而来的一种新型软件架构。Service Mesh 理想很丰满，但现实很骨感！通过一层代理虽然做到了对应用无侵入，但增加的网络代理开销对很多性能要求很高的互联网业务落地存在不少挑战。因此 Proxyless Mesh 作为一种在传统侵入式微服务框架与 Service Mesh 之间的折中方案，通过取众家之所长，为大量的非 Service Mesh 应用在云原生时代，拥抱云原生基础设施，解决流量治理等痛点提供了一种有效的解决方案。本文将介绍 Spring Cloud Alibaba 在 Proxyless Mesh 上的探索。

<!--truncate-->

## Service Mesh

站在 2023 年的今天，Service Mesh 早已不是一个新兴的概念， 回顾过去 6 年多的发展历程，Service Mesh 从一经推出就受到来自全世界的主流技术公司关注和追捧。

- 2016 年作为 Service Mesh 的元年，Buoyant 公司 CEO William Morgan 率先发布 Linkerd[[1]](https://linkerd.io/) ，成为业界首个 Service Mesh 项目，同年 Lyft 发布 Envoy[[2]](https://www.envoyproxy.io/) ，成为第二个 Service Mesh 项目。
- 2017 年，Google、IBM、Lyft 联手发布了 Istio[[3]](https://github.com/istio/istio)，它与 Linkerd / Envoy 等项目相比，它首次给大家增加了控制平面的概念，提供了强大的流量控制能力。经过多年的发展 Istio，已经逐步成为服务网格领域控制平面的事实标准。
- 2018 年 7 月，Istio 1.0 版本发布[[4]](https://istio.io/latest/news/releases/1.0.x/announcing-1.0/)，标志着其进入了可以生产可用的时代，逐渐也有越来越多的企业开始考虑和尝试将服务网格应用于生产中。

Istio 作为当前最流行的开源服务网格技术，它由控制平面和数据平面两部分构成。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1673166074579-f43be3c0-d868-4c14-b33d-1582c1671293.png#clientId=uadda20a3-5fed-4&from=paste&height=307&id=u304b5422&name=image.png&originHeight=675&originWidth=1080&originalType=binary&ratio=1&rotation=0&showTitle=false&size=112132&status=done&style=none&taskId=u4d5e51cc-6bcb-4c84-aa17-0286854ca95&title=&width=490.90908026892316)
在 Istio Mesh 架构中，其控制平面是一个名为 Istiod 的进程，网络代理是 Envoy 。Istiod 作为控制面的统一组件，负责对接服务注册发现、路由规则管理、证书管理等能力，Envoy 则是作为数据面通过 Sidecar 方式代理业务流量，Istio 和 Envoy 之间通过 xDS 协议接口完成服务发现、路由规则等数据的传递。Istiod 通过监听 K8s 资源例如 Service、Endpoint 等，获取服务信息，并将这些资源统一通过 xDS 协议下发给位于数据平面的网络代理。Envoy 则是独立于应用之外的一个进程，以 Sidecar 的方式（一般是以 Container 方式）伴随业务应用 Pod 运行，它与应用进程共用同一个主机网络，通过修改路由表的方式劫持业务应用的网络流量从而达到为应用无侵入地提供如服务鉴权、标签路由等能力。

## Proxyless Mesh

Proxyless Mesh 全称是 Proxyless Service Mesh，其是近几年在 Service Mesh 基础上发展而来的一种新型软件架构。Service Mesh 理想很丰满，但现实很骨感！通过一层代理虽然做到了对应用无侵入，但增加的网络代理开销对很多性能要求很高的互联网业务落地存在不少挑战。因此 Proxyless Mesh 作为一种在传统侵入式微服务框架与 Service Mesh 之间的折中方案，通过取众家之所长，为大量的非 Service Mesh 应用在云原生时代，拥抱云原生基础设施，解决流量治理等痛点提供了一种有效的解决方案。 <!--truncate-->Service Mesh 和 Proxyless Mesh 架构区别如下图所示：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1673167496757-9dc2f06a-ace3-4782-b145-adeac449ec7a.png#clientId=uadda20a3-5fed-4&from=paste&height=186&id=u496e40ee&name=image.png&originHeight=409&originWidth=1080&originalType=binary&ratio=1&rotation=0&showTitle=false&size=84637&status=done&style=none&taskId=ub601935d-93fc-4219-a593-57888c2d40b&title=&width=490.90908026892316)
过去几年，国内外的知名软件开源社区也都在相关领域进行了大量探索，例如在 2021 年 10 月，gRPC 社区为用户提供如下架构形式[[5]](https://istio.io/v1.12/blog/2021/proxyless-grpc/)，通过对接Istio控制平面，遵循 VirtualService & DestinationRule CRD 规范为 gRPC 应用提供流量治理能力。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1673167810474-02ebacab-109e-40ce-a9c0-b3b8c162176e.png#clientId=uadda20a3-5fed-4&from=paste&height=210&id=ub3a3231c&name=image.png&originHeight=461&originWidth=1040&originalType=binary&ratio=1&rotation=0&showTitle=false&size=124238&status=done&style=none&taskId=uef9fe286-41d7-4104-b2f0-046d4ca7e14&title=&width=472.7272624811853)

## Spring Cloud Alibaba Mesh 化方案

Spring Cloud Alibaba 作为一种侵入式的微服务解决方案，通过基于 Spring Cloud 微服务标准为用户提供了微服务应用构建过程中的如服务注册与发现、限流降级、分布式事务与分布式消息等在内的一站式微服务解决方案。过去几年被国内大量中小企业所采用，帮助大量企业更加方便地拥抱微服务。
但随着企业应用微服化的不断深入，微服务给应用带来系统解耦、高可扩展性等诸多优势的同时，也让应用变得更加复杂。如何管理好微服务？成为了很多企业逐渐开始关注和重视的一个新的问题。Spring Cloud Alibaba 社区也注意到很多用户有微服务治理方面的诉求，于是从 2022 年初，就开始了在该方面的探索，社区觉得相比于 Service Mesh，Proxyless Mesh 是一种对广大中小企业更合适的技术方案，其不仅不会有额外 Sidecar 代理所带来的较大性能损耗，而且更重要的是对企业来说，其落地成本很低！
要通过 Mesh 化方案解决微服务治理需求，一个能给应用动态下发规则的控制面不可或缺，社区本着不重复造轮子，拥抱业界主流解决方案的原则，通过支持 xDS 协议不仅为用户提供通过主流的 Istio 控制面来对 Spring Cloud Alibaba 应用进行服务治理以外，用户也可以使用阿里巴巴开源的 OpenSergo 微服务治理控制面所提供的差异化治理能力进行应用治理。相关提供 Mesh 技术方案社区在最近发布的 2.2.10-RC 版本[[6]](https://github.com/alibaba/spring-cloud-alibaba/releases)中进行了提供。做了提供微服治理能力的第一个版本，社区当前已经部分兼容了Istio VirtualService & DestinationRule 的标签路由和服务鉴权能力，用户可以通过 Istio 控制面给应用下发相关规则，对应用进行流量治理。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/59256332/1673253324947-3effabdf-3956-48cf-a101-5c366a91b2ab.png#clientId=u641e2097-531f-4&from=paste&height=245&id=u670014cb&name=image.png&originHeight=360&originWidth=762&originalType=binary&ratio=1&rotation=0&showTitle=false&size=155552&status=done&style=none&taskId=ud58f82c8-67cb-4fb2-988a-88eb670d8ff&title=&width=517.9971313476562)

### 准备工作

Proxyless Mesh 的方案首先需要准备好一个能给应用动态下发规则的控制面，本次 Spring Cloud Alibaba 2.2.10-RC1 版本支持了 2 种当前市面上的主流控制面来更好的满足各类用户诉求：

#### 1. Istio 控制面

为了使用 Istio 控制面下发治理规则，首先需要在 K8s 环境中安装 Istio 控制面，您可以使用 Spring Cloud Alibaba 社区提供的测试用的 Istio 环境，也可以选择自己尝试安装一套 Istio 控制面，安装 Istio 控制面的流程如下：

1. 安装 K8s 环境，请参考 K8s 的[安装工具](https://kubernetes.io/zh-cn/docs/tasks/tools/)小节
2. 在 K8s 上安装并启用 Istio，请参考 Istio 官方文档的[安装](https://istio.io/latest/zh/docs/setup/install/)小节

#### 2. OpenSergo 控制面

OpenSergo 是开放通用的，覆盖微服务及上下游关联组件的微服务治理项目。OpenSergo 从微服务的角度出发，涵盖流量治理、服务容错、服务元信息治理、安全治理等关键治理领域，提供一系列的治理能力与标准、生态适配与最佳实践，支持 Java, Go, Rust 等多语言生态。
OpenSergo 控制平面 (Control Plane) 作为 OpenSergo CRD 的统一管控组件，承载服务治理配置转换与下发的职责。

1. 安装 K8s 环境，请参考 K8s 的[安装工具](https://kubernetes.io/zh-cn/docs/tasks/tools/)小节
2. 在 K8s 上安装并启用 OpenSergo Control Plane，请参考 OpenSergo 官方提供的 [OpenSergo 控制面安装文档](https://opensergo.io/zh-cn/docs/quick-start/opensergo-control-plane/)

![img](https://user-images.githubusercontent.com/9434884/182856237-8ce85f41-1a1a-4a2a-8f58-db042bd4db42.png#height=336&id=MSEWC&originHeight=1362&originWidth=1856&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=&width=458)

### 标签路由

#### 应用背景

在现在的微服务架构中，服务的数量十分庞大，为了更好的管理这些微服务应用，可能需要给这些应用打上标签，并且将一个或多个服务的提供者划分到同一个分组，从而约束流量只在指定分组中流转，实现流量隔离的目的。标签路由可以作为蓝绿发布、灰度发布等场景的能力基础，它可以被应用在以下场景中：

- **多版本开发测试**

多个版本并行开发时，需要为每个版本准备一套开发环境。如果版本较多，开发环境成本会非常大。流量隔离方案可以在多版本开发测试时大幅度降低资源成本。使用基于标签路由的全链路流量隔离机制，可以将特定的流量路由到指定的开发环境。例如在开发环境 1 中只修改应用 B 和应用 D，则为这两个应用在开发环境 1 中的版本创建 Tag1 标签，并配置对应的路由规则。入口应用 A 调用 B 时，会判断流量是否满足路由规则。如果满足，路由到开发环境 1 中应用 B 的 V1.1 版本；如果不满足，路由到基线环境中的应用 B 的 V1 版本。应用 C 调用 D 的时候同样根据流量决定路由到 D 的 V1 版本或 V1.1 版本。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/59256332/1670813937718-d4452227-257c-46e5-9393-843b53a43368.png#clientId=ub03674c8-c3cf-4&from=paste&height=403&id=ue987ff03&name=image.png&originHeight=818&originWidth=1112&originalType=url&ratio=1&rotation=0&showTitle=false&size=197904&status=done&style=none&taskId=ua8cbb3d3-dfd1-4841-882c-9d88f8d7976&title=&width=548)

- **应用流量隔离**

如果一个应用有多个版本在线上同时运行，部署在不同环境中，如日常环境和特殊环境，则可以使用标签路由对不同环境中的不同版本进行流量隔离，将秒杀订单流量或不同渠道订单流量路由到特殊环境，将正常的流量路由到日常环境。即使特殊环境异常，本应进入特殊环境的流量也不会进入日常环境，不影响日常环境的使用。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/59256332/1670815218649-63c6da62-8ec8-461c-9d84-a2ea3c346353.png#clientId=ub03674c8-c3cf-4&from=paste&height=500&id=uc429db27&name=image.png&originHeight=668&originWidth=570&originalType=url&ratio=1&rotation=0&showTitle=false&size=104683&status=done&style=none&taskId=ub264d897-984d-400a-a09e-ee9fd6bd2ac&title=&width=427)

- **A/B Testing**

线上有多个应用版本同时运行，期望对不同版本的应用进行 A/B Testing，则可以使用标签路由的全链路流量控制将地域 A（如杭州）的客户流量路由到 V1 版本，地域 B（如上海）的客户流量路由到 V1.1 版本，对不同版本进行验证，从而降低新产品或新特性的发布风险，为产品创新提供保障。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/59256332/1670815281296-8caae5f2-278f-410b-847c-c3751cb741be.png#clientId=ub03674c8-c3cf-4&from=paste&height=527&id=u65a948c4&name=image.png&originHeight=842&originWidth=724&originalType=url&ratio=1&rotation=0&showTitle=false&size=137213&status=done&style=none&taskId=u1351cdf1-5842-4688-92fa-b688bcbf1fc&title=&width=453)
目前，Spring Cloud Alibaba Mesh 提供的标签路由能力支持根据请求路径、请求头和 HTTP 请求参数等请求元信息对请求做标签路由，让应用发出的请求根据 Istio 控制面下发的规则发送至指定版本的上游服务。

#### 使用方式

##### 1. 导入依赖并配置应用

首先，修改`pom.xml` 文件，导入 Spring Cloud Alibaba 2.2.10-RC1 版本下的标签路由以及 Istio 资源转换模块的相关依赖（推荐通过云原生应用脚手架 [start.aliyun.com](https://start.aliyun.com) 进行项目构建试用）：

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2.2.10-RC1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-governance-routing</artifactId>
    </dependency>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-xds-adapter</artifactId>
    </dependency>
</dependencies>
```

在`application.yml`配置文件给消费者配置 Istio 控制面以及 Nacos 注册中心的相关信息:

```yaml
server:
  port: 18084
spring:
  main:
    allow-bean-definition-overriding: true
  application:
    name: service-consumer
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
        fail-fast: true
        username: nacos
        password: nacos
    istio:
      config:
        # 是否开启Istio配置转换
        enabled: ${ISTIO_CONFIG_ENABLE:true}
        # Istiod IP
        host: ${ISTIOD_ADDR:127.0.0.1}
        # Istiod 端口
        port: ${ISTIOD_PORT:15010}
        # 轮询Istio线程池大小
        polling-pool-size: ${POLLING_POOL_SIZE:10}
        # 轮询Istio时间间隔
        polling-time: ${POLLING_TIME:10}
        # Istiod鉴权token(访问Istiod 15012端口时可用)
        istiod-token: ${ISTIOD_TOKEN:}
           # 是否打印xds相关日志
                    log-xds: ${LOG_XDS:true}
```

在`application.yml`配置文件给生产者应用配置元信息:

```yaml
# 第一个生产者，版本为v1
spring.cloud.nacos.discovery.metadata.version=v1
# 第二个生产者，版本为v2
spring.cloud.nacos.discovery.metadata.version=v2
```

如果是需要对接 OpenSergo 控制面的，则需要给消费者应用加上 `spring-cloud-starter-alibaba-governance-routing` 跟 `spring-cloud-starter-opensergo-adapter `相关依赖，并配置 OpenSergo 所需的配置即可。

##### 2. 运行应用程序

启动两个生产者应用和一个消费者应用，并将这些应用都注册到本地的 Nacos 注册中心里，消费者在调用生产者时，会根据控制面下发的标签路由规则来调用不同的生产者实例。启动消费者和两个生产者后，可以在 Nacos 注册中心里看到这几个已注册的服务:
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/59256332/1670829548457-b8c4c868-4eba-48df-9977-94a487cf7a16.png#clientId=ub03674c8-c3cf-4&from=paste&height=1014&id=u8f0da6dc&name=image.png&originHeight=2028&originWidth=3574&originalType=binary&ratio=1&rotation=0&showTitle=false&size=1263912&status=done&style=none&taskId=u7ec88d37-d168-486e-b571-607313aa1fa&title=&width=1787)
控制台上会打印出以下信息，说明此应用正在监听 Istio 控制面下发的配置：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/59256332/1670827540929-bacb3da6-5c5e-47ec-8ceb-e2ba9047da6b.png#clientId=ub03674c8-c3cf-4&from=paste&height=253&id=FEeSH&name=image.png&originHeight=506&originWidth=2442&originalType=binary&ratio=1&rotation=0&showTitle=false&size=755462&status=done&style=none&taskId=ue6ca5f99-8c2b-41a3-b7fb-47b02395ec5&title=&width=1221)

#### 3. 通过 Istio 控制面下发标签路由规则

通过 Istio 控制面下发标签路由规则，首先下发 DestinationRule 规则：

```yaml
kubectl apply -f - << EOF
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: my-destination-rule
spec:
  host: sca-virtual-service
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
EOF
```

此规则将后端服务拆分为两个版本，label 为 v1 的 pod 被分到 v1 版本，label 为 v2 的 pod 被分到 v2 版本
之后，下发 VirtualService 规则：

```yaml
kubectl apply -f - << EOF
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: sca-virtual-service
spec:
  hosts:
    - service-provider
  http:
  - match:
    - headers:
        tag:
          exact: gray
      uri:
        exact: /istio-label-routing

    route:
    - destination:
        host: service-provider
        subset: v2
  - route:
    - destination:
        host: service-provider
        subset: v1
EOF
```

这条 VirtualService 指定了一条最简单的标签路由规则，将请求头 tag 为 gray，请求路径为/istio-label-routing 的 HTTP 请求路由到 v2 版本，其余的流量都路由到 v1 版本
发送若干条不带请求头的 HTTP 请求至 IstioConsumerApplication

```shell
while true;
     do curl localhost:18084/istio-label-routing;
     sleep 0.1;
     echo "";
done;
```

因为请求头不为 gray，所以请求将会被路由到 v1 版本，返回如下
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/59256332/1673425287375-0d16c3eb-f984-4335-8774-011a22fa7478.png#clientId=ua63dc71d-6efb-4&from=paste&height=373&id=u8b6db133&name=image.png&originHeight=373&originWidth=630&originalType=binary&ratio=1&rotation=0&showTitle=false&size=158936&status=done&style=none&taskId=u436246ae-c6ed-446e-9ee1-d492e9d9f8f&title=&width=630)
之后发送一条请求头 tag 为 gray，且请求路径为/istio-label-routing 的 HTTP 请求

```shell
while true;
     do curl localhost:18084/istio-label-routing -H "tag: gray";
     sleep 0.1;
     echo "";
done;
```

因为满足路由规则，所以请求会被路由至 v2 版本
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/59256332/1673425317396-bcf22604-c090-44f2-81e7-a383de341f02.png#clientId=ua63dc71d-6efb-4&from=paste&height=384&id=u468f4062&name=image.png&originHeight=384&originWidth=706&originalType=binary&ratio=1&rotation=0&showTitle=false&size=184842&status=done&style=none&taskId=u53c51ea5-7663-44f1-8166-0c454ec4664&title=&width=706)

##### 4. 通过 OpenSergo 控制面下发标签路由规则

通过 OpenSergo 控制面也定义了特定的流量路由规则 TrafficRouter ，如下是一个 OpenSergo 控制面对应的流量路由规则：

```yaml
kubectl apply -f - << EOF
apiVersion: traffic.opensergo.io/v1alpha1
kind: TrafficRouter
metadata:
  name: service-provider
  namespace: default
  labels:
    app: service-provider
spec:
  hosts:
    - service-provider
  http:
    - match:
        - headers:
            tag:
              exact: v2
      route:
        - destination:
            host: service-provider
            subset: v2
            fallback:
              host: service-provider
              subset: v1
    - route:
        - destination:
            host: service-provider
            subset: v1
EOF
```

这条 TrafficRouter 指定了一条最简单的流量路由规则，将请求头 tag 为 v2 的 HTTP 请求路由到 v2 版本，其余的流量都路由到 v1 版本。如果 v2 版本没有对应的节点，则将流量 fallback 至 v1 版本。
停止 v2 版本的 ProviderApplication 后，继续发送一条请求头 tag 为 v2 的 HTTP 请求

```
curl --location --request GET '127.0.0.1:18083/router-test' --header 'tag: v2'
```

因为 v2 版本没有服务提供者，因此流量被 fallback 至 v1 版本。

```
Route in 30.221.132.228: 18081,version is v1.
```

  上述详细示例代码可以在社区 Github 上[示例代码](https://github.com/alibaba/spring-cloud-alibaba/tree/2.2.x/spring-cloud-alibaba-examples/governance-example/label-routing-example)中获取。

### 服务鉴权

正常生产场景，微服务应用都具有安全要求，不会让任意的服务都可直接调用。因此需要对调用该应用的上游应用进行服务鉴权，保证应用自身的安全。
未配置服务鉴权 Consumer 1、2、3 和 Provider 在同一个命名空间内，Consumer 1、2、3 默认可以调用 Provider 的所有 Path（Path 1、2 和 3）。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/59256332/1673254389920-9f6f971f-83e4-4c13-80b5-54828110a636.png#clientId=u3be2ec29-8f22-4&from=paste&height=336&id=udccbb0df&name=image.png&originHeight=626&originWidth=1330&originalType=binary&ratio=1&rotation=0&showTitle=false&size=236089&status=done&style=none&taskId=u2c0ff2dc-ede5-4870-ae6f-cb04eb2fc5a&title=&width=713)
配置服务鉴权规则后，应用间合法的调用关系如下图所示：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/59256332/1673254350473-804e54d7-3759-4d58-a62a-9967b7b12124.png#clientId=u3be2ec29-8f22-4&from=paste&height=458&id=uffef029a&name=image.png&originHeight=728&originWidth=1388&originalType=binary&ratio=1&rotation=0&showTitle=false&size=269716&status=done&style=none&taskId=u5cc09038-2571-4378-bf77-8851dfa7447&title=&width=874)
设置所有 Path 的鉴权可以对 Provider 的所有 Path 设置鉴权规则，例如 Provider 所有 Path 的鉴权规则设置为拒绝 Consumer 1 调用（黑名单），则允许 Consumer 2、3 调用（白名单）。
设置指定 Path 的鉴权在设置所有 Path 的鉴权基础上，还可以设置 Consumer 指定 Path 的鉴权规则，例如按所有 Path 的鉴权方式，Consumer 2、3 可以访问 Provider 的所有 Path，但 Provider 的 Path2 涉及一些核心业务或数据，不希望 Consumer 2 调用，可以将 Path 2 对 Consumer 2 的鉴权方式设置为黑名单（拒绝调用），则 Consumer 2 只能访问 Provider 的 Path 1 和 Path 3。
目前，Spring Cloud Alibaba Mesh 支持了 Istio 的大部分鉴权规则，支持了除了需要 mTLS 支持以外的鉴权规则，支持了 Istio 的所有字符串匹配模式以及规则的逻辑运算。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/59256332/1673252085838-33a554dc-84a7-4368-9184-8d67b859cca6.png#clientId=u96cc9714-768f-4&from=paste&height=290&id=u1209da2a&name=image.png&originHeight=878&originWidth=2416&originalType=binary&ratio=1&rotation=0&showTitle=false&size=580493&status=done&style=none&taskId=u9c846760-e12a-4c76-9ca3-ef0686baa12&title=&width=799)

#### 使用方式

##### 1. 导入依赖并配置应用

修改`pom.xml`文件，引入 Istio 资源转换以及 Spring Cloud Alibaba 鉴权模块（推荐通过云原生应用脚手架 [start.aliyun.com](https://start.aliyun.com) 进行项目构建试用）:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2.2.10-RC1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-governance-auth</artifactId>
    </dependency>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-xds-adapter</artifactId>
    </dependency>
</dependencies>
```

在应用的 `application.yml` 配置文件中配置 Istio 相关元数据:

```yaml
server:
  port: ${SERVER_PORT:80}
spring:
  cloud:
    governance:
      auth:
        # 是否开启鉴权
        enabled: ${ISTIO_AUTH_ENABLE:true}
    istio:
      config:
        # 是否开启Istio配置转换
        enabled: ${ISTIO_CONFIG_ENABLE:true}
        # Istiod IP
        host: ${ISTIOD_ADDR:127.0.0.1}
        # Istiod 端口
        port: ${ISTIOD_PORT:15010}
        # 轮询Istio线程池大小
        polling-pool-size: ${POLLING_POOL_SIZE:10}
        # 轮询Istio时间间隔
        polling-time: ${POLLING_TIMEOUT:10}
        # Istiod鉴权token(访问Istiod 15012端口时可用)
        istiod-token: ${ISTIOD_TOKEN:}
           # 是否打印xds相关日志
                    log-xds: ${LOG_XDS:true}
```

##### 2. 运行应用程序

在导入好以上的依赖并且在`application.yml`文件中配置了相关配置之后，可以将此应用程序运行起来，启动一个简单的 Spring Boot 应用，其中只含有一个简单的接口，此接口将会把本次请求的详细信息返回给客户端。
启动应用后，控制台上会打印出以下信息，说明此应用正在监听 Istio 控制面下发的配置:
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/59256332/1670827540929-bacb3da6-5c5e-47ec-8ceb-e2ba9047da6b.png#clientId=ub03674c8-c3cf-4&from=paste&height=253&id=u83065cbf&name=image.png&originHeight=506&originWidth=2442&originalType=binary&ratio=1&rotation=0&showTitle=false&size=755462&status=done&style=none&taskId=ue6ca5f99-8c2b-41a3-b7fb-47b02395ec5&title=&width=1221)

##### 3. 通过 Istio 控制面下发鉴权配置

在使用如下命令通过 Istio 下发一条鉴权规则至 demo 应用，这条规则的限制了访问该应用的请求 header:

```yaml
kubectl apply -f - << EOF
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: http-headers-allow
  namespace: ${namespace_name}
spec:
  selector:
    matchLabels:
      app: ${app_name}
  action: ALLOW
  rules:
  - when:
    - key: request.headers[User-Agent]
      values: ["PostmanRuntime/*"]
EOF
```

之后发送一个带 User-Agent 头部的 HTTP 请求来验证规则是否生效:

```shell
while true;
     do curl localhost/auth -H "User-Agent: PostmanRuntime/7.29.2";
     sleep 0.1;
     echo "";
done;
```

由于此请求由于携带了正确的 HTTP Header 信息，将会返回:
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/59256332/1673429632757-50615c92-6307-49db-b83f-24d3e2740c7f.png#clientId=ub4579414-6c96-4&from=paste&height=334&id=ua5e2086d&name=image.png&originHeight=334&originWidth=809&originalType=binary&ratio=1&rotation=0&showTitle=false&size=215055&status=done&style=none&taskId=ue812a526-5099-4827-aa3b-cbdb04e8de6&title=&width=809)
之后发送一个不带 User-Agent 头部的 HTTP 请求来验证规则是否生效:

```shell
while true;
     do curl localhost/auth;
     sleep 0.1;
     echo "";
done;
```

由于此请求没有携带正确的 HTTP Header 信息，将会返回:
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/59256332/1673426265876-d384df51-0a0f-41dc-bc62-c0bb96e019a3.png#clientId=ua63dc71d-6efb-4&from=paste&height=489&id=u2a04e281&name=image.png&originHeight=489&originWidth=496&originalType=binary&ratio=1&rotation=0&showTitle=false&size=155659&status=done&style=none&taskId=u1096f881-6679-48af-acf2-40382786ec1&title=&width=496)
  上述详细示例代码可以在社区 Github 上[示例代码](https://github.com/alibaba/spring-cloud-alibaba/tree/2.2.x/spring-cloud-alibaba-examples/governance-example/authentication-example)中获取。
