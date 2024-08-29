---
title: RocketMQ Graalvm 适配
keywords: [Spring Cloud Alibaba,Graalvm,RocketMQ,native]
description: RocketMQ Graalvm 适配
author: 铖朴
date: "2024-01-27"
category: article
---

GitHub issue 参见：[https://github.com/alibaba/spring-cloud-alibaba/issues/3101](https://github.com/alibaba/spring-cloud-alibaba/issues/3101)

#### 经验教训

- GraalVM Tracing Agent 收集到的信息可能不完整，所以依据这些信息编译出来的镜像运行时依然会报错，有时候需要手动补充 `reflect-config.json`中的内容。

#### 适配过程

1. fastjson 需要升级到 fastjson2 才支持 GraalVM，GraalVM 下不能用字节码做优化，走的是反射。

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>2.0.22</version>
</dependency>
```

2. pom.xml 中需要增加 `native-maven-plugin`这个插件并添加相应的配置

```xml
<plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
    <configuration>
        <classesDirectory>${project.build.outputDirectory}</classesDirectory>
        <metadataRepository>
            <enabled>true</enabled>
        </metadataRepository>
        <buildArgs>
            <arg>--initialize-at-build-time=org.apache.commons.logging.LogFactoryService</arg>
        </buildArgs>
        <quickBuild>true</quickBuild>
    </configuration>
</plugin>
```

3. 由于 RocketMQ 大量使用 fastjson ，其核心的几个类对象大量会被反射调用，因此需要在 `reflect-config.json` 配置文件中，针对这几个核心类对象增加如下配置

以下配置是给 `rocketmq-broadcast-producer-example`这个用例中需要用到的。

```json
{
  "name":"org.apache.rocketmq.remoting.protocol.RemotingCommand",
  "allDeclaredFields":true,
  "allDeclaredMethods":true,
  "allDeclaredConstructors":true
},
{
  "name":"org.apache.rocketmq.common.protocol.route.BrokerData",
  "allDeclaredFields":true,
  "allPublicMethods":true,
  "allPublicConstructors":true
},
{
  "name":"org.apache.rocketmq.common.protocol.route.TopicRouteData",
  "allDeclaredFields":true,
  "allPublicMethods":true,
  "allPublicConstructors":true
},
{
  "name":"org.apache.rocketmq.common.protocol.route.QueueData",
  "allDeclaredFields":true,
  "allPublicMethods":true,
  "allPublicConstructors":true
},
```

以下配置是给 `rocketmq-broadcast-consuemr1-example`这个用例中需要用到的。

```json
{
  "name":"org.apache.rocketmq.common.protocol.heartbeat.HeartbeatData",
  "allDeclaredFields":true,
  "allPublicMethods":true
},
{
  "name":"org.apache.rocketmq.common.protocol.heartbeat.ConsumerData",
  "allDeclaredFields":true,
  "allPublicMethods":true
},
{
  "name":"org.apache.rocketmq.common.protocol.heartbeat.ProducerData",
  "allDeclaredFields":true,
  "allPublicMethods":true
},
{
  "name":"org.apache.rocketmq.common.protocol.heartbeat.SubscriptionData",
  "allDeclaredFields":true,
  "allPublicMethods":true
},
```

解释如下

- `allDeclaredFields` 代码所声明的对象中的所有成员变量都可以被反射调用，包括 public 和 protected private 的成员变量
- `allPublicFields` 代表所声明的对象中的所有 public 成员变量都可以被反射调用
- `allPublicMethods`代码所声明的对象中所有的 public 方法都可以被反射调用
- `allPublicConstructors`代码所声明的对象中所有的 public 的构造函数都可以被反射调用

以此类推。
当然，我们也可以声明某个具体的方法可以被反射调用，但是考虑到这几个核心对象的被反射的概率较大，而且方法和成员变量也不对，因此声明成所有都可以被反射。

#### graalvm-reachability-metadata

GraalVM 在编译的时候需要 `reflect-json.config`等一系列的 hint 文件来编译 native-image，但通过 Tracing Agent 收集的方式可能会有遗漏，最好的方式是让每个中间件自己提供一份文件出来，这份文件中的 hint 信息是经过充分测试，这样也是最可靠的。最好的方式是中间件提供的 jar 里面就自带了这份 hint 文件，但这样要求所有中间件要重新发布一个新版本，针对老的版本如果提供这样的信息呢？graalvm 提供了这样一个机制，也就是 graalvm-reachability-metadata 把这些信息放在一个外部的仓库中，在编译的时候会从这个仓库中拉取所需要的编译信息。

此处演示如果通过本地仓库的方式添加这个信息，可以再插件配置中，主要是在 12 行处，加入本地仓库的地址

```xml
<plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
    <configuration>
        <buildArgs>
            <arg>--initialize-at-build-time=org.apache.commons.logging.LogFactoryService</arg>
        </buildArgs>
        <quickBuild>true</quickBuild>
        <debug>true</debug>
        <metadataRepository>
            <enabled>true</enabled>
            <localPath>/Users/wangtao/.m2/repository/org/graalvm/buildtools/graalvm-reachability-metadata/0.9.19</localPath>
        </metadataRepository>
    </configuration>
</plugin>
```

在这个仓库下创建如下目录格式

```bash
$ tree org.apache.rocketmq
org.apache.rocketmq
└── rocketmq-client
    ├── 4.9.5-SNAPSHOT
    │   ├── index.json
    │   ├── jni-config.json
    │   ├── predefined-classes-config.json
    │   ├── proxy-config.json
    │   ├── reflect-config.json
    │   ├── resource-config.json
    │   └── serialization-config.json
    └── index.json
```

其中 第12行的 `index.json` 内容如下

```json
[
  {
    "latest": true,
    "metadata-version": "4.9.5-SNAPSHOT",
    "module": "org.apache.rocketmq:rocketmq-client",
    "tested-versions": [
      "4.9.5-SNAPSHOT"
    ]
  }
]
```

`org/apache/rocketmq/rocketmq-client/4.9.5-SNAPSHOT/index.json` 内容如下:

```json

$ cat org.apache.rocketmq/rocketmq-client/4.9.5-SNAPSHOT/index.json
[
  "reflect-config.json",
  "resource-config.json"
]
```

其中比较核心的是 `reflect-config.json`内容如下

```json
[

{
  "name":"org.apache.rocketmq.client.consumer.store.OffsetSerializeWrapper",
  "allDeclaredFields":true,
  "allPublicFields":true,
  "queryAllPublicMethods":true,
  "methods":[{"name":"getOffsetTable","parameterTypes":[] }]
},
{
  "name":"org.apache.rocketmq.common.message.MessageQueue",
  "allDeclaredFields":true,
  "allPublicFields":true,
  "queryAllPublicMethods":true,
  "methods":[
    {"name":"getBrokerName","parameterTypes":[] },
    {"name":"getQueueId","parameterTypes":[] },
    {"name":"getTopic","parameterTypes":[] }
  ]
},
{
  "name":"org.apache.rocketmq.common.protocol.header.GetMaxOffsetRequestHeader",
  "allDeclaredFields":true
},
{
  "name":"org.apache.rocketmq.common.protocol.header.GetMaxOffsetResponseHeader",
  "allDeclaredFields":true,
  "methods":[{"name":"<init>","parameterTypes":[] }]
},
{
  "name":"org.apache.rocketmq.common.protocol.header.NotifyConsumerIdsChangedRequestHeader",
  "allDeclaredFields":true,
  "methods":[{"name":"<init>","parameterTypes":[] }]
},
{
  "name":"org.apache.rocketmq.common.protocol.header.PullMessageRequestHeader",
  "allDeclaredFields":true
},
{
  "name":"org.apache.rocketmq.common.protocol.header.PullMessageResponseHeader",
  "methods":[{"name":"<init>","parameterTypes":[] }]
},
{
  "name":"org.apache.rocketmq.common.protocol.header.SendMessageRequestHeaderV2",
  "allDeclaredFields":true
},
{
  "name":"org.apache.rocketmq.common.protocol.header.SendMessageResponseHeader",
  "methods":[{"name":"<init>","parameterTypes":[] }]
},
{
  "name":"org.apache.rocketmq.common.protocol.header.UnregisterClientRequestHeader",
  "allDeclaredFields":true
},
{
  "name":"org.apache.rocketmq.common.protocol.header.namesrv.GetRouteInfoRequestHeader",
  "allDeclaredFields":true
},
{
  "name":"org.apache.rocketmq.common.protocol.heartbeat.ConsumerData",
  "allDeclaredFields":true,
  "allPublicMethods":true
},
{
  "name":"org.apache.rocketmq.common.protocol.heartbeat.HeartbeatData",
  "allDeclaredFields":true,
  "allPublicMethods":true
},
{
  "name":"org.apache.rocketmq.common.protocol.heartbeat.ProducerData",
  "allDeclaredFields":true,
  "allPublicMethods":true
},
{
  "name":"org.apache.rocketmq.common.protocol.heartbeat.SubscriptionData",
  "allDeclaredFields":true,
  "allPublicMethods":true
},
{
  "name":"org.apache.rocketmq.common.protocol.route.BrokerData",
  "allDeclaredFields":true,
  "allPublicMethods":true,
  "allPublicConstructors":true
},
{
  "name":"org.apache.rocketmq.common.protocol.route.QueueData",
  "allDeclaredFields":true,
  "allPublicMethods":true,
  "allPublicConstructors":true
},
{
  "name":"org.apache.rocketmq.common.protocol.route.TopicRouteData",
  "allDeclaredFields":true,
  "allPublicMethods":true,
  "allPublicConstructors":true
},
{
  "name":"org.apache.rocketmq.remoting.netty.NettyDecoder"
},
{
  "name":"org.apache.rocketmq.remoting.netty.NettyEncoder"
},
{
  "name":"org.apache.rocketmq.remoting.netty.NettyRemotingClient$4"
},
{
  "name":"org.apache.rocketmq.remoting.netty.NettyRemotingClient$NettyClientHandler"
},
{
  "name":"org.apache.rocketmq.remoting.netty.NettyRemotingClient$NettyConnectManageHandler",
  "methods":[
    {"name":"close","parameterTypes":["io.netty.channel.ChannelHandlerContext","io.netty.channel.ChannelPromise"] },
    {"name":"connect","parameterTypes":["io.netty.channel.ChannelHandlerContext","java.net.SocketAddress","java.net.SocketAddress","io.netty.channel.ChannelPromise"] },
    {"name":"disconnect","parameterTypes":["io.netty.channel.ChannelHandlerContext","io.netty.channel.ChannelPromise"] },
    {"name":"exceptionCaught","parameterTypes":["io.netty.channel.ChannelHandlerContext","java.lang.Throwable"] },
    {"name":"userEventTriggered","parameterTypes":["io.netty.channel.ChannelHandlerContext","java.lang.Object"] }
  ]
},
{
  "name":"org.apache.rocketmq.remoting.protocol.LanguageCode",
  "fields":[
    {"name":"CPP"},
    {"name":"DELPHI"},
    {"name":"DOTNET"},
    {"name":"ERLANG"},
    {"name":"GO"},
    {"name":"HTTP"},
    {"name":"JAVA"},
    {"name":"OMS"},
    {"name":"OTHER"},
    {"name":"PHP"},
    {"name":"PYTHON"},
    {"name":"RUBY"},
    {"name":"RUST"}
  ]
},
{
  "name":"org.apache.rocketmq.remoting.protocol.RemotingCommand",
  "allDeclaredFields":true,
  "allDeclaredMethods":true,
  "allDeclaredConstructors":true
},
{
  "name":"org.apache.rocketmq.remoting.protocol.RemotingSerializable",
  "allDeclaredFields":true,
  "queryAllPublicMethods":true
},
{
  "name":"org.apache.rocketmq.remoting.protocol.SerializeType",
  "fields":[
    {"name":"JSON"},
    {"name":"ROCKETMQ"}
  ]
}
]
```

这个内容是基于 Tracing Agent 收集的信息，加上手工补充的内容，形成的一个相对完整 hint 文件。GraalVM 在编译的时候会查找这个仓库，并使用这里面的信息编译 native image。在测试完成之后，可以提交到远程仓库中，[https://github.com/oracle/graalvm-reachability-metadata](https://github.com/oracle/graalvm-reachability-metadata)

#### 常见问题

如果运行时遇到以下异常：

```bash
Caused by: com.oracle.svm.core.jdk.UnsupportedFeatureError: Runtime reflection is not supported for public org.apache.rocketmq.common.protocol.route.TopicRouteData()
    at org.graalvm.nativeimage.builder/com.oracle.svm.core.util.VMError.unsupportedFeature(VMError.java:89)
    at java.base@17.0.5/java.lang.reflect.Constructor.acquireConstructorAccessor(Constructor.java:68)
    at java.base@17.0.5/java.lang.reflect.Constructor.newInstanceWithCaller(Constructor.java:496)
    at java.base@17.0.5/java.lang.reflect.ReflectAccess.newInstance(ReflectAccess.java:128)
    at java.base@17.0.5/jdk.internal.reflect.ReflectionFactory.newInstance(ReflectionFactory.java:347)
    at java.base@17.0.5/java.lang.Class.newInstance(DynamicHub.java:645)
    at com.alibaba.fastjson2.reader.ConstructorSupplier.get(ConstructorSupplier.java:27)
    at com.alibaba.fastjson2.reader.ObjectReader4.readObject(ObjectReader4.java:309)
    at com.alibaba.fastjson.JSON.parseObject(JSON.java:496)
    ... 16 more
```

说明 fastjson 运行的时候进行了反射，调用了 `public org.apache.rocketmq.common.protocol.route.TopicRouteData()` 这个方法，但是 Tracing Agent 并没有收集到这个方法，导致编译 native image 的时候并没有把这个方法允许进行反射，所以就报错了，此时需要修改 `reflect-config.json`文件，讲该方法加入到运行反射的列表当中。
