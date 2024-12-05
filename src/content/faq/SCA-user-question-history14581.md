---
id: "question-history-14581"
title: "如何使用higress 替代spring cloud gateway 实现服务发现与路由"
date: "2024-09-26"
category: "expertConsultation"
description: "要使用 Higress 替代 Spring Cloud Gateway 实现服务发现与路由转发，针对 Spring Cloud Alibaba 环境，可以遵循以下步骤：1. **配置 Nacos 作为注册中心**:   - 参考 [Nacos-Spring-Cloud 快速开始](https://s"
tags: ["sca","spring-cloud-alibaba","higress","spring","cloud","gateway","服务发现"]
keywords: ["sca","spring-cloud-alibaba","higress","spring","cloud","gateway","服务发现"]
---

## 用户问题 ： 
 如何使用higress 替代spring cloud gateway 实现服务发现与路由转发？  

---------------
## 专家官方解答 ：

要使用 Higress 替代 Spring Cloud Gateway 实现服务发现与路由转发，针对 Spring Cloud Alibaba 环境，可以遵循以下步骤：

1. **配置 Nacos 作为注册中心**:
   - 参考 [Nacos-Spring-Cloud 快速开始](https://sca.aliyun.com/zh-cn/docs/next/user-guide/nacos/quick-start)，确保您的微服务应用已正确配置以接入 Nacos 作为服务注册与发现中心。

2. **部署并配置 Higress**:
   - 在 Kubernetes 集群中部署 Higress 控制器。
   - 创建 `McpBridge` 资源以连接到 Nacos 注册中心。根据您的需求，定义命名空间、服务分组等信息。例如，若不指定命名空间和自定义分组，配置如下 YAML 示例所示的 `McpBridge` 资源：
     ```yaml
     apiVersion: networking.higress.io/v1
     kind: McpBridge
     metadata:
       name: default
       namespace: higress-system
     spec:
       registries:
         - name: my-nacos
           type: nacos2
           domain: 127.0.0.1
           port: 8848
           nacosGroups:
             - DEFAULT_GROUP
     ```
     如果有特定命名空间和服务分组，请相应地调整配置。

3. **配置路由规则**:
   - 创建或更新 Kubernetes 的 `Ingress` 资源，以定义路由规则，将流量转发到 Nacos 注册的服务上。确保在 `Ingress` 的注解中指定正确的服务目标格式，如 `my-service.DEFAULT-GROUP.public.nacos` 或根据实际情况调整。
     ```yaml
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

4. **验证服务发现与路由**:
   - 应用以上配置后，检查 Higress 是否成功识别了 Nacos 注册的服务，并且路由规则是否按预期工作。可以通过访问 Ingress 规定的路径来测试服务是否能够被正确路由。

综上所述，通过配置 Nacos 服务注册、创建合适的 Higress `McpBridge` 资源以及设置正确的 `Ingress` 路由规则，即可实现使用 Higress 替代 Spring Cloud Gateway 来进行服务发现与路由转发。


<font color="#949494">---------------</font> 


## 参考链接 ：

* 专家经验：基于网关实现 Spring Cloud 服务发现与路由 
 
 * 专家经验：spring cloud alibaba(SCA)与 下层集成实现的各个组件的版本对应关系 


 <font color="#949494">---------------</font> 
 


## <font color="#FF0000">答疑服务说明：</font> 

本内容经由技术专家审阅的用户问答的镜像生成，我们提供了<font color="#FF0000">专家智能答疑服务</font>,使用方法：
用法1： 在<font color="#FF0000">页面的右下的浮窗”专家答疑“</font>。
用法2： 点击[专家答疑页](https://answer.opensource.alibaba.com/docs/intro)（针对部分网站不支持插件嵌入的情况）
### 另：


有其他开源产品的使用问题？[点击访问阿里AI专家答疑服务](https://answer.opensource.alibaba.com/docs/intro)。
### 反馈
如问答有错漏，欢迎点：[差评](https://ai.nacos.io/user/feedbackByEnhancerGradePOJOID?enhancerGradePOJOId=14582)给我们反馈。
