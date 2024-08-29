---
title: 应用如何平滑迁移至IPv6？
keywords: [IPv6, IP协议栈平滑迁移]
description: 介绍Spring Cloud Alibaba应用如何平滑迁移至IPv6
author: 铖朴
date: "2023-03-30"
category: article
---

## 摘要

作为下一代互联网协议，向 IPv6 迁移是未来的大势所趋。但由于当前互联网中 IPv4 协议的应用规模非常大，对于用户来说，没办法通过规定一个时间日期，从那一刻开始，所有互联网上的设备全部使用 IPv6，这是不现实的。一次性迁移不仅在基础设施层面不可行，对企业用户来说，就算基础设施都能准备完毕，让其将少则上百，多则成千上万的应用实例在一段时间内一次性停机进行协议栈迁移，无论是在风险上，还是成本上，对企业用户来说都是难以接受的！既然无法一步到位，渐进式的 IP 地址迁移成为当前的主流选择。本文将介绍一些主流渐进式的 IP 地址迁移方法。

<!--truncate-->

## 背景

IPv4 协议（后文简称 IPv4）为互联网的发展与普及做出了重要贡献，但近年来，随着应用程序、数据和 IT 服务的爆炸式增长。当初协议设计过程中用来描述 IP 地址所采用的 32 位二进制数格式的 IPv4 地址已经于 2011 年[[1]](https://www.infoq.cn/article/vpdcmupcw3mev3l2kx41)被申请耗尽，从那时起，全世界都已经处于无新地址可用的局面。

IPv6 协议（后文简称 IPv6）作为 IPv4 之后被采用的下一代互联网协议，相比 IPv4 协议中采用 32 位来表示 IP 地址，其地址表示位数扩充到了 128 位，地址数量是 IPv4 所能提供的 2 的 96 次方倍。简单看数字可能显得不太直观，换成一句描述 IPv6 地址之多更直观和经典的话：“采用 128 位表示地址的 IPv6 可以为地球上的每一粒沙子都分配一个 IP 地址”！此外，IPv6 协议其不仅可以解决 IPv4 协议中的地址短缺问题，同时也能为互联网提供更高效、更安全的网络通信。IPv6 协议在网络通信中提供了许多新的功能和优势。例如，在数据传输和路由方面，其通过新的设计提高了效率和可靠性，减少了网络拥堵和数据包丢失的情况。此外，在安全领域，其内置对 IPSec 的支持，可以更好地保护网络中的数据传输安全，防止黑客攻击和窃取数据。
作为下一代互联网协议，向 IPv6 迁移是未来的大势所趋。在我国，从 2014 年开始相关机构已经逐步停止向新用户和应用分配 IPv4 地址，开始全面商用 IPv6 协议(计算机网络（第七版）谢希仁)。根据政府指导，近年来，陆续也出台了一系列相关指导文件例如：2017 年国务院发布的《[推进互联网协议第六版（IPv6）规模部署行动计划](http://www.gov.cn/zhengce/2017-11/26/content_5242389.htm)》、2021 年工业与信息化部发布的《[IPv6 流量提升三年专项行动计划（2021-2023 年）](http://www.xinhuanet.com/info/2021-07/09/c_1310052164.htm)》、2021 年网信办发布的[《关于推动 IPv6 规模部署的指导意见》](http://www.gov.cn/zhengce/zhengceku/2021-07/23/content_5626963.htm)等不断地在引导企业从 IPv4 协议向 IPv6 协议迁移。
但由于当前互联网中 IPv4 协议的应用规模非常大，对于用户来说，没办法通过规定一个时间日期，从那一刻开始，所有互联网上的设备全部使用 IPv6，这是不现实的。一次性迁移不仅在基础设施层面不可行，对企业用户来说，就算基础设施都能准备完毕，让其将少则上百，多则成千上万的应用实例在一段时间内一次性停机进行协议栈迁移，无论是在风险上，还是成本上，对企业用户来说都是难以接受的！既然无法一步到位，渐进式的 IP 地址迁移成为当前的主流选择。接下来本文将介绍一些主流渐进式的 IP 地址迁移方法。

## 迁移方案

虽然 IPv6 协议具有许多优势，但是其推广和应用仍然面临许多挑战。IPv6 的普及需要全球范围内的配套基础措施和支持，包括网络设备的更新、人员培训和政策法规的推进等等。同时，IPv6 与 IPv4 之间的兼容性也是一个重要的问题，需要通过技术手段和过渡机制来解决。
常见的 IP 协议渐进式迁移共存方案，主要有双栈（Dual Stack）、隧道（Tunneling）等技术。其中，双栈技术是目前业界应用较为广泛的一种 IPv4/IPv6 共存的一种技术，其目的是在互联网完全过度到 IPv6 之前，通过为设备安装 IPv4 和 IPv6 双协议栈。具有双栈的设备可以实现与单 IPv4、单 IPv6 或者双栈的设备进行通信。通过让各种协议栈能共存，渐进式地进行 IP 协议栈的迁移。像 Kubernetes 很早也已经对[双栈功能](https://kubernetes.io/zh-cn/docs/concepts/services-networking/dual-stack/)进行了支持。
隧道技术是一种把 IPv6 地址封装到 IPv4 数据报中的方法，当数据从 IPv6 单协议栈发出后，在经过 IPv4 单栈网络环境的过程中，将 IPv6 地址封装到 IPv4 数据报作为 IPv4 数据报内容后，通过 IPv4 协议栈进行传输。在经过 IPv4 单栈环境后，来到 IPv6 单栈环境时，再将数据报中的 IPv6 数据段内容解析出来，构造新的 IPv6 数据报在 IPv6 协议栈环境中进行传输。

### 微服务双栈迁移方案

上文介绍的方案更多的是一般化的方法论。但具体到微服务系统中，远程调用过程如何实现多协议栈共存以便帮助企业用户平滑进行协议栈的迁移呢？
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1679207793618-9c431106-93a2-452f-be71-32185f826569.png#clientId=u0b49bd32-d731-4&from=paste&height=386&id=F7Hec&name=image.png&originHeight=772&originWidth=1464&originalType=binary&ratio=2&rotation=0&showTitle=false&size=71775&status=done&style=none&taskId=u05d69bc5-9d7e-4646-987b-e869da537ba&title=&width=732)
上图是当前业界微服务系统中服务之间普遍采用的远程调用过程架构图，本文接下来介绍如何基于双栈技术实现微服务应用的协议栈平滑迁移的常用方式。

### 双注册双订阅实现协议栈平滑迁移

在微服务系统中，相比于单栈环境下，只有一个 IP 地址，微服务的注册与发现过程都基于该地址完成服务远程调用。在多协议栈共存的环境中，其本质就是要解决服务注册和发现过程怎么使用 IP 地址的问题。
梳理清楚了问题，就不难发现基于双注册双订阅的方法可以较好地解决微服务系统中多协议栈共存的问题，以便实现微服务系统协议栈的平滑迁移。该方案的服务注册和订阅过程可以被描述为下图所示：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1679216863247-e13d938b-a2a5-4965-b417-0d323d1c11fd.png#clientId=u21221381-1afe-4&from=paste&height=534&id=R9qXH&name=image.png&originHeight=1068&originWidth=1352&originalType=binary&ratio=2&rotation=0&showTitle=false&size=115412&status=done&style=none&taskId=u4adc2aaa-4fcc-4830-aca5-beccded9a22&title=&width=676)

采用双注册双订阅实现微服务系统平滑进行 IP 协议栈迁移的过程可以被大致描述为以下步骤：

1. 在新的应用升级或者发版之前，对相关微服务应用所在宿主机进行 IP 地址协议栈升级改造，让其同时支持 IPv4 和 IPv6 双协议栈。
2. 经过步骤 1 改造的微服务应用，在微服务框架层面，通过一个双栈地址提取模块提取应用宿主机中有效的 IPv4 和 IPv6 地址，并通过服务注册模块，将双栈地址都注册到注册中心。
3. 消费者订阅注册中心中的某个服务的 IPv4 和 IPv6 双栈地址，通过应用服务框架层面的双栈地址解析模块，比对宿主机所支持的协议栈类型，如果宿主机仅支持 IPv4 协议，则使用提供者的 IPv4 地址发起服务调用；如果仅支持 IPv6 或同时支持双栈，则用提供者的 IPv6 地址发起服务调用；
4. 当系统中的所有微服务都完成支持 IPv6 协议栈的支持后，逐步对所有应用宿主机关闭 IPv4 协议栈，从而平滑完成大规模微服务系统从 IPv4 协议栈到 IPv6 协议栈的迁移。

### 基于 DNS 技术实现协议栈平滑迁移

双注册双订阅的方法虽然很自然和清晰，但是其由于服务注册过程中针对双栈环境中的应用会多注册一条 IP 地址对应的记录，会降低注册中心的服务承载量。
因此，也可以基于 DNS 技术实现多协议栈共存，解决微服务系统协议栈迁移的方法。其本质是将原来的注册服务实例地址过程变成注册服务实例域名（这里域名更多是实例标识作用），可实现在注册中心所注册服务实例记录数量不变的情况下，通过额外的 DNS 域名系统存储服务域名所对应的双栈 IP 地址，从而实现多协议栈的共存。采用该方案的服务注册和订阅过程如下图所示：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1679217073664-4fc6c45d-b58c-4ae7-b446-ba0c3ff60400.png#clientId=u21221381-1afe-4&from=paste&height=462&id=u23c7c9fd&name=image.png&originHeight=924&originWidth=1600&originalType=binary&ratio=2&rotation=0&showTitle=false&size=141458&status=done&style=none&taskId=ud6e287ba-8c6f-404a-975b-53976811967&title=&width=800)
基于 DNS 技术实现微服务系统平滑进行 IP 地址迁移的过程可以被大致描述为以下步骤：

1. 在新的应用升级或者发版之前，对相关微服务应用进行 IP 地址协议栈改造，让其同时支持 IPv4 和 IPv6 双协议栈。改造后的应用需要将本机的双栈 IP 地址信息和本应用实例特点的域名注册到系统的 DNS 服务上。
2. 完成域名注册后，应用实例将本地域名注册到注册中心。
3. 消费者订阅注册中心中的某个服务所有实例的域名，通过应用框架层面的域名解析模块，向系统中的 DNS 服务发起基于域名解析请求，在通过 DNS 获取到示例域名对应的 IP 地址后，比对宿主机所支持的协议栈类型，如果宿主机仅支持 IPv4，则使用 IPv4 地址发起服务调用；如果仅支持 IPv6 或同时支持双栈，则优先使用 IPv6 地址发起服务调用；
4. 当系统中的所有微服务都完成支持 IPv6 协议栈的支持后，逐步对所有应用宿主机关闭 IPv4 协议栈，从而平滑完成大规模微服务系统从 IPv4 协议栈到 IPv6 协议栈的迁移。

相比于双注册双订阅方式，基于 DNS 的方法可以较好地解决双注册双订阅过程中带给注册中心的多余压力，但 DNS 的高可用也是企业用户需要特别注意的点。

## 实践

Spring Cloud Alibaba 作为应用广泛的微服务框架，目前在 2021.0.5.0 版本中已经提供了微服务场景下的不同协议栈应用互通共存方案，以便帮助企业用户实现大规模微服务系统的协议栈迁移能力。社区方案基于双注册双订阅实现，应用启动后会默认将微服务的 IPv4 地址和 IPv6 地址注册到注册中心中，其中 IPv4 地址会存放在 Nacos 服务列表中的 IP 字段下，IPv6 地址在 Nacos 的 metadata 字段中，其对应的 Key 为 IPv6（可以解决普通双注册双订阅过程中的同一个服务实例有两条记录，对注册中心造成压力的问题）。当服务消费者调用服务提供者时，会根据自身的 IP 协议栈支持情况，选择合适的 IP 地址类型发起服务调用。具体规则：

1. 服务消费者本身支持 IPv4 和 IPv6 双协议栈或仅支持 IPv6 协议栈的情况下，服务消费者会使用服务提供的 IPv6 地址发起服务调用；
2. 服务消费者本身仅支持 IPv4 单协议栈的情况下，服务消费者会使用服务提供的 IPv4 地址发起服务调用。

### 应用配置

相比于一般使用 Spring Cloud Alibaba 构建微服务，要使用协议栈共存迁移功能需要对应用增加如下配置：

#### 服务注册

目前，使用支持协议栈共存迁移功能的 Spring Cloud Alibaba 版本以后，服务提供者在进行服务注册过中，不需要做任何配置，会默认检查当前应用所支持的协议栈情况，如果默认是单 IPv6 或 IPv4 协议栈，则仅注册相应的地址。如果应用支持双栈，则会自动获取应用的 IPv6 地址，然后，将 IPv6 地址作为应用实例的服务示例元数据注册到注册中心上。

#### 服务消费

如果应用是采用 Spring Cloud Alibaba 2021.0.5.0 版本，默认使用 Spring Cloud LoadBalancer 负载均衡策略，需要在消费者应用 application.properties 配置文件中增加如下配置开启协议栈共存迁移功能：

```properties
spring.cloud.loadbalancer.ribbon.enabled=false
spring.cloud.loadbalancer.nacos.enabled=true
```

## 效果演示

为了便于演示，本文直接基于[阿里云容器服务 ACK](https://www.aliyun.com/product/kubernetes)构建了一个双栈环境，来进行双栈环境的服务注册与消费演示。

## 服务注册

如下本文演示用的服务提供者实例 Pod 信息：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1679227819209-cb1b2ad6-4402-4075-aced-065f76160da4.png#clientId=uf73c13f1-991a-4&from=paste&height=156&id=u81a5cd10&name=image.png&originHeight=312&originWidth=2446&originalType=binary&ratio=2&rotation=0&showTitle=false&size=204807&status=done&style=none&taskId=uefd0add8-a6af-4436-807e-6606dc783fd&title=&width=1223)
基于 Spring Cloud Alibaba 协议栈共存迁移功能，其在注册中心上的服务实例列表信息：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1679227850292-4c9d3cae-9a3a-4464-b863-17d4390bbb17.png#clientId=uf73c13f1-991a-4&from=paste&height=126&id=u78988947&name=image.png&originHeight=252&originWidth=2554&originalType=binary&ratio=2&rotation=0&showTitle=false&size=143946&status=done&style=none&taskId=u05f1052d-335b-4533-a72e-66a703f4b3d&title=&width=1277)

## 服务消费

单栈环境服务消费者：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1679280217276-9e3cd3dc-b181-49a9-b6cf-c156e6720112.png#clientId=uf73c13f1-991a-4&from=paste&height=154&id=u326c0cf1&name=image.png&originHeight=308&originWidth=2462&originalType=binary&ratio=2&rotation=0&showTitle=false&size=181070&status=done&style=none&taskId=uddf23c9b-d437-4022-8d3b-9b3edf72c14&title=&width=1231)
服务调用成功以后，服务提供者会打印调用消费者的调用 IP 地址：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1679280312813-4cb6d6e3-8a65-4be4-8660-b8af1cbecc23.png#clientId=uf73c13f1-991a-4&from=paste&height=181&id=u77731e53&name=image.png&originHeight=362&originWidth=2248&originalType=binary&ratio=2&rotation=0&showTitle=false&size=185950&status=done&style=none&taskId=u1b6c29bc-8997-4926-affd-f4a5f252ff3&title=&width=1124)
从上述返回结果来看，IPv4 单栈环境中的消费者由于仅支持单栈，所以一直通过 IPv4 协议栈向双栈服务提供者发起请求。
双栈环境服务消费者：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1679280399202-87209390-cddf-4f48-b53c-d035f67312c9.png#clientId=uf73c13f1-991a-4&from=paste&height=153&id=u7b1bfd9e&name=image.png&originHeight=306&originWidth=2436&originalType=binary&ratio=2&rotation=0&showTitle=false&size=192353&status=done&style=none&taskId=u4f98585e-d87d-466b-b7de-0c6d25df563&title=&width=1218)
服务调用成功以后，服务提供者会打印调用消费者的调用 IP 地址，可以看到打印的是消费者的 IPv6 地址：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/21257183/1679280496522-771aa27f-3c61-4c27-b2ba-931bfa3702d0.png#clientId=uf73c13f1-991a-4&from=paste&height=155&id=u808935b7&name=image.png&originHeight=310&originWidth=2252&originalType=binary&ratio=2&rotation=0&showTitle=false&size=202478&status=done&style=none&taskId=u68cd3a36-1de8-4598-b73d-c027faf51f8&title=&width=1126)
从上述返回结果来看，IPv4/IPv6 双栈环境中的消费者由于支持 IPv6，为了实现协议栈向 IPv6 的迁移，所以默认一直通过 IPv6 协议栈向双栈服务提供者发起请求。
