---
title: 基于网关实现 Spring Cloud 服务发现与路由
keywords: [网关, 路由, 服务发现, Higress]
description: 演示如何基于 Higress 网关实现 Spring Cloud 服务发现与路由
author: 赵炳堃（秉钧）
date: "2023-08-31"
category: ecosystem
---

## 基于 Higress 网关实现 Spring Cloud 服务发现与路由

## 使用 Nacos 做注册中心

应用配置具体参考 [Nacos-Spring-Cloud-快速开始](https://sca.aliyun.com/zh-cn/docs/next/user-guide/nacos/quick-start) 进行应用配置

### 不指定命名空间

如果 `application.properties` 中没有指定 Nacos 命名空间，例如：

```properties
server.port=8080
spring.application.name=my-service

spring.cloud.nacos.discovery.server-addr=127.0.0.1:8848
```

则 Higress 的 McpBridge 中亦无需指定命名空间：

```yaml
apiVersion: networking.higress.io/v1
kind: McpBridge
metadata:
  name: default
  namespace: higress-system
spec:
  registries:
    # 定义一个名为 my-nacos  的服务来源
    - name: my-nacos
      # 注册中心类型是 Nacos 2.x，支持 gRPC 协议
      type: nacos2
      # 注册中心的访问地址，可以是域名或者IP
      domain: 127.0.0.1
      # 注册中心的访问端口，Nacos 默认都是 8848
      port: 8848
      # Nacos 服务分组
      nacosGroups:
        - DEFAULT_GROUP
```

配置 Ingress 转发到这个服务（假设 /api 前缀的路由都转发给这个服务）需要做如下配置：

```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    higress.io/destination: my-service.DEFAULT-GROUP.public.nacos
  name: demo
  namespace: default
spec:
  rules:
  - http:
      paths:
      - backend:
          resource:
            apiGroup: networking.higress.io
            kind: McpBridge
            name: default
        path: /api
        pathType: Prefix
```

注意这里通过注解 `higress.io/destination` 指定路由最终要转发到的目标服务。

对于 Nacos 来源的服务，这里的目标服务格式为：“服务名称.服务分组.命名空间 ID.nacos”，注意这里需要遵循 DNS 域名格式，因此服务分组中的下划线 '\_' 被转换成了横杠 '-'。命名空间未指定时，这里默认值为 "public"。

### 指定命名空间、服务分组等信息

如果 `application.properties` 中指定了 Nacos 命名空间，服务分组等信息，例如：

```propertise
server.port=8080
spring.application.name=my-service

spring.cloud.nacos.discovery.server-addr=127.0.0.1:8848
spring.cloud.nacos.discovery.namespace=d8ac64f3-xxxx-xxxx-xxxx-47a814ecf358
spring.cloud.nacos.discovery.group=custom-group
```

则 Higress 的 McpBridge 做相应配置即可

```yaml
apiVersion: networking.higress.io/v1
kind: McpBridge
metadata:
  name: default
  namespace: higress-system
spec:
  registries:
    # 定义一个名为 my-nacos  的服务来源
    - name: my-nacos
      # 注册中心类型是 Nacos 2.x，支持 gRPC 协议
      type: nacos2
      # 注册中心的访问地址，可以是域名或者IP
      domain: 127.0.0.1
      # 注册中心的访问端口，Nacos 默认都是 8848
      port: 8848
      # Nacos 命名空间 ID
      nacosNamespaceId: d8ac64f3-xxxx-xxxx-xxxx-47a814ecf358
      # Nacos 服务分组
      nacosGroups:
        - custom-group
```

配置 Ingress 转发到这个服务(假设 /api 前缀的路由都转发给这个服务)需要做如下配置：

```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    higress.io/destination: my-service.custom-group.d8ac64f3-xxxx-xxxx-xxxx-47a814ecf358.nacos
  name: demo
  namespace: default
spec:
  rules:
  - http:
      paths:
      - backend:
          resource:
            apiGroup: networking.higress.io
            kind: McpBridge
            name: default
        path: /api
        pathType: Prefix
```

## 使用 ZooKeeper 做注册中心

使用 Zookeeper 做注册中心时，注意必须配置 `spring.cloud.zookeeper.discovery.preferIpAddress=true`，否则注册到注册中心中的地址为主机名称，而不是 IP。

### 不指定注册根路径

如果 `application.properties` 中未指定注册根路径信息，例如：

```text
spring.application.name=my-service
spring.cloud.zookeeper.connect-string=127.0.0.1:2181
spring.cloud.zookeeper.discovery.preferIpAddress=true
spring.cloud.zookeeper.discovery.enabled=true
spring.cloud.zookeeper.discovery.register=true
```

则 Higress 的 McpBridge 中亦无需指定 zkServicePath ：

```yaml
apiVersion: networking.higress.io/v1
kind: McpBridge
metadata:
  name: default
  namespace: higress-system
spec:
  registries:
    # 定义一个名为 my-zk  的服务来源
    - name: my-zk
      # 注册中心类型是 ZooKeeper
      type: zookeeper
      # 注册中心的访问地址，可以是域名或者IP
      domain: 127.0.0.1
      # 注册中心的访问端口
      port: 2181
```

配置 Ingress 转发到这个服务(假设 /api 前缀的路由都转发给这个服务)需要做如下配置：

```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    higress.io/destination: my-service.services.zookeeper
  name: demo
  namespace: default
spec:
  rules:
  - http:
      paths:
      - backend:
          resource:
            apiGroup: networking.higress.io
            kind: McpBridge
            name: default
        path: /api
        pathType: Prefix
```

注意对于 ZooKeeper 来源的服务，这里的目标服务格式为："服务名称.服务注册根路径.zookeeper"，Spring Cloud 在未指定服务注册根路径的情况下，根路径默认是"services"

### 指定注册根路径

如果 `application.properties` 中指定了注册根路径信息，例如：

```properties
spring.application.name=my-service
spring.cloud.zookeeper.connect-string=127.0.0.1:2181
spring.cloud.zookeeper.discovery.preferIpAddress=true
spring.cloud.zookeeper.discovery.enabled=true
spring.cloud.zookeeper.discovery.register=true
spring.cloud.zookeeper.discovery.root=my-services-root
```

则 Higress 的 McpBridge 中亦需指定 zkServicePath ：

```yaml
apiVersion: networking.higress.io/v1
kind: McpBridge
metadata:
  name: default
  namespace: higress-system
spec:
  registries:
    # 定义一个名为 my-zk  的服务来源
    - name: my-zk
      # 注册中心类型是 ZooKeeper
      type: zookeeper
      # 注册中心的访问地址，可以是域名或者IP
      domain: 127.0.0.1
      # 注册中心的访问端口
      port: 2181
      # 对应 spring.cloud.zookeeper.discovery.root 配置字段
      zkServicePath:
        - my-services-root
```

配置 Ingress 转发到这个服务(假设 /api 前缀的路由都转发给这个服务)需要做如下配置：

```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    higress.io/destination: my-service.my-services-root.zookeeper
  name: demo
  namespace: default
spec:
  rules:
  - http:
      paths:
      - backend:
          resource:
            apiGroup: networking.higress.io
            kind: McpBridge
            name: default
        path: /api
        pathType: Prefix
```

注意如果 `spring.cloud.zookeeper.discovery.root` 中包含了下划线，需要被替换为横杠，因为目标服务整体格式需要满足 DNS 域名规范。
