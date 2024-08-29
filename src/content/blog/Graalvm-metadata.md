---
title: Graalvm 元数据适配
keywords: [Spring Cloud Alibaba,Graalvm,native]
description: Graalvm 元数据适配
author: 牧生
date: "2024-01-27"
category: article
---

本文章主要叙述在 Java 应用适配 Graalvm Native Image 中的步骤和遇到的一些问题！因为 Graalvm 官方文档相关概念叙述过于简单。基本靠问才能知道些许有用信息。所以写此文章。

关于 Graalvm 基础知识的相关学习，可以参照 Seata 社区 commiter 王良的 [Blog](https://easyj.icu/blog/#/native-image/)，本文章主要介绍元数据适配。不对 Graalvm 基础做过多介绍。

## Graalvm 现状介绍

GraalVM：是一种高性能运行时，可显着提高应用程序性能和效率，是微服务的理想选择。它专为使用 Java、JavaScript、基于 LLVM 的语言（例如 C 和 C++）以及其他动态语言编写的应用程序而设计。它消除了编程语言之间的隔离，并在共享运行时实现了互操作性。它可以独立运行，也可以在 OpenJDK、Node.js 或 Oracle 数据库的上下文中运行。

Graalvm 主要涉及到 VmWare，RedHat 和 Oracle Labs 三家。RedHat 主要是直接参与 Graalvm 本体，VmWare参与的是 metadata 和 nativeTest，Oracle Labs作为主导方什么都干。

Native Image：**是一种提前将 Java 代码编译为二进制文件（本机可执行文件）的技术。本机可执行文件仅包含运行时所需的代码，即应用程序类、标准库类、语言运行时和来自 JDK 的静态链接本机代码。**它是 Oracle 官方首推的 Java AoT 解决方案，通过C语言实现了一个超微缩的运行时组件 —— Substrate VM，基本实现了 JVM 的各种特性，但足够轻量、可以被轻松内嵌，这就让 Java 语言和工程摆脱 JVM 的限制，能够真正意义上实现和 C/C++ 一样的 AoT 编译。这一方案在经过长时间的优化和积累后，已经拥有非常不错的效果。

Native Image 工具依赖于在运行时对应用程序可访问代码类的静态分析。但是，分析不能总是完全预测 Java 本机接口 (JNI)、Java 反射、动态代理对象或类路径资源的所有用法。必须以[元数据](https://www.graalvm.org/latest/reference-manual/native-image/metadata/) `native-image` 的形式（在代码中预先计算或作为 JSON 配置文件）向工具提供未检测到的这些动态功能的使用情况。

在项目中打包二进制文件时，需要使用到 JSON 配置文件，关于怎么获取相关配置和保证获取到的配置正确性，以及如何存放相关的元数据配置文件是目前需要迫切解决的问题！

## 相关概念

**因为本文章主要介绍 Native Image 相关，所以只对在使用 Native Image 相关功能中用到的名词做解释！**

### 插件相关

1. [**nbt**](https://github.com/graalvm/native-build-tools)：graalvm native build tools 插件简称；
2. [**tck plugin**](https://github.com/oracle/graalvm-reachability-metadata/tree/master/tests/tck-build-logic)：Oracle 官方提供涉及元数据检测的 gradle 插件。

### 配置相关

1. agent：GraalVM 提供的一个 **Tracing Agent** 来轻松收集元数据和准备配置文件； 
2. conditional mode：条件代理模式生成带有条件的元数据； 
3. standard mode：agent 默认选项，标准代理模式无条件生成元数据； 
4. direct mode：直接代理模式允许用户直接将选项传递给代理，（涉及到 tck 的诡异单元测试）； 
5. experimental-conditional-config-filter-file：被认为包含在这个过滤器中的类将被指定为用户代码类； 
6. conditional-config-class-filter-file：要进一步过滤生成的配置； 
7. access-filter-file：访问过滤器适用于访问的目标。因此，访问过滤器可以直接从生成的配置中排除包和类（及其成员）； 
8. caller-filter-file：过滤机制通过识别执行访问的 Java 方法（也称为调用方方法）并将其声明类与一系列过滤规则相匹配来工作； 
9. [**graalvm reachability metadata**](https://github.com/oracle/graalvm-reachability-metadata)：graalvm 官方元数据中央仓库； 
10. imagecode：graalvm 本体的系统属性，相关文档中没有提及，服务于 nbt 的识别。Spring Context Framework NativeTest 靠此属性识别（涉及到 Oracle Labs 希望最小化这种属性判定影响的争议）。 
11. **特别注意的是：目前 access-filter 和 caller-filter 仅对 standard mode 起作用** 

> 关于 conditional mode 和 standard mode。，direct mode 只有以下几个仓库依稀记录，其他靠问！
>  
> - [https://graalvm.github.io/native-build-tools/latest/gradle-plugin.html](https://graalvm.github.io/native-build-tools/latest/gradle-plugin.html)
> - [https://github.com/graalvm/native-build-tools](https://github.com/graalvm/native-build-tools)
> - 核心来源：[**https://www.graalvm.org/latest/reference-manual/native-image/metadata/AutomaticMetadataCollection/**](https://www.graalvm.org/latest/reference-manual/native-image/metadata/AutomaticMetadataCollection/)
> - imagecode参考： 
>    1. [https://junit.org/junit5/docs/current/api/org.junit.jupiter.api/org/junit/jupiter/api/condition/EnabledInNativeImage.html](https://junit.org/junit5/docs/current/api/org.junit.jupiter.api/org/junit/jupiter/api/condition/EnabledInNativeImage.html)
>    2. [https://github.com/oracle/graal/blob/master/sdk/src/org.graalvm.nativeimage/src/org/graalvm/nativeimage/ImageInfo.java](https://github.com/oracle/graal/blob/master/sdk/src/org.graalvm.nativeimage/src/org/graalvm/nativeimage/ImageInfo.java)
>    3. 最近一次 pr 参考，spring framework 6.0.9 对 native build tools 做的关键改动：[https://github.com/spring-projects/spring-framework/issues/30511](https://github.com/spring-projects/spring-framework/issues/30511) ，[https://github.com/spring-projects/spring-framework/issues/30281](https://github.com/spring-projects/spring-framework/issues/30281)
> 
> 
> **以上相关概念均可在上面的链接中找到相关叙述！**

## 以 Nacos 为例生成元数据文件

### maven

**graalvm 社区并没有使用 maven 作为插件管理工具，而是使用 gradle。因为 nbt 目前还没有支持 maven 3.9.0+， 同时相比 gradle plugin 存在线程安全问题，尤其是尝试在多模块并行执行 metadatacopy goal 时必定失败！**

#### 创建项目

参考 Demo: [https://github.com/yuluo-yx/graalvm-demo](https://github.com/yuluo-yx/graalvm-demo)

#### 项目插件介绍及配置

在 pom.xml 中加入如下配置：

```xml
<profiles>
   <profile>
      <id>native</id>
      <build>
         <pluginManagement>
            <plugins>
               <plugin>
                  <groupId>org.springframework.boot</groupId>
                  <artifactId>spring-boot-maven-plugin</artifactId>
                  <configuration>
                     <jvmArguments>
                        -agentlib:native-image-agent=config-output-dir=src/main/resources/META-INF/native-image/,experimental-conditional-config-filter-file=src/main/resources/conditional-filter.json,access-filter-file=src/main/resources/user-code-filter.json
                        <!-- 被认为包含在这个过滤器中的类将被指定为用户代码类 -->
                        <!--experimental-conditional-config-filter-file=src/main/resources/user-code-filter.json,-->
                        <!-- 要进一步过滤生成的配置 -->
                        <!-- conditional-config-class-filter-file=<path> -->
                        <!-- 访问过滤器适用于访问的目标。因此，访问过滤器可以直接从生成的配置中排除包和类（及其成员）。 -->
                        <!--access-filter-file=src/main/resources/conditional-filter.json-->
                        <!-- 过滤机制通过识别执行访问的 Java 方法（也称为调用方方法）并将其声明类与一系列过滤规则相匹配来工作 -->
                        <!--caller-filter-file=src/main/resources/-->
                     </jvmArguments>
                     <image>
                        <builder>paketobuildpacks/builder:tiny</builder>
                        <env>
                           <BP_NATIVE_IMAGE>true</BP_NATIVE_IMAGE>
                        </env>
                     </image>

                  </configuration>
                  <executions>
                     <execution>
                        <id>process-aot</id>
                        <goals>
                           <goal>process-aot</goal>
                        </goals>
                     </execution>
                  </executions>
               </plugin>
               <plugin>
                  <groupId>org.graalvm.buildtools</groupId>
                  <artifactId>native-maven-plugin</artifactId>
                  <configuration>
                     <!--<agent>
                     <enabled>true</enabled>
                     <defaultMode>conditional</defaultMode>
                     <modes>
                     <conditional>
                     <userCodeFilterPath>src/main/resources/user-code-filter.json</userCodeFilterPath>
                     </conditional>
                     </modes>
                     </agent>-->
                     <classesDirectory>${project.build.outputDirectory}</classesDirectory>
                     <!-- 需要修改成为自己本地的 元数据仓库地址，不然报错  此配置是为了本地调试方便 -->
                     <metadataRepository>
                        <enabled>true</enabled>
                        <localPath>
                           E:\Java\apache_maven\apache-maven-3.9.0\repository\org\graalvm\buildtools\graalvm-reachability-metadata\0.9.19\graalvm-reachability-metadata-0.9.19-repository.zip
                        </localPath>
                     </metadataRepository>
                     <requiredVersion>22.3</requiredVersion>
                  </configuration>
                  <executions>
                     <execution>
                        <id>add-reachability-metadata</id>
                        <goals>
                           <goal>add-reachability-metadata</goal>
                        </goals>
                     </execution>
                  </executions>
               </plugin>
            </plugins>
         </pluginManagement>
      </build>
   </profile>
</profiles>
```

#### 项目元数据生成

项目配置完成之后，在 terminal 执行如下命令：

```shell
mvn clean -Pnative spring-boot:run
```

即可在 resource 目录下看到生成的相关元数据文件。

### gradle

**gradle 对 spring context framework 并不友好，可能跑不通 nativeTest，中央仓库中有带着 spring framework。带着 spring boot 目前没有跑通 agent 的 test！**

> 参考 url：
>  
> - [https://github.com/spring-projects/spring-framework/issues/30281](https://github.com/spring-projects/spring-framework/issues/30281)
> - [https://github.com/oracle/graalvm-reachability-metadata/pull/154](https://github.com/oracle/graalvm-reachability-metadata/pull/154)

#### 创建项目

参考 Demo：[https://github.com/yuluo-yx/nacos-client-metadata](https://github.com/yuluo-yx/nacos-client-metadata)

#### 项目插件介绍及配置

gradle nbt plugin：[https://graalvm.github.io/native-build-tools/latest/gradle-plugin.html#_introduction](https://graalvm.github.io/native-build-tools/latest/gradle-plugin.html#_introduction)

**NBT 插件的本质是拼接 shell 命令！**

build.gradle 配置文件示例：

```json
// 引入插件
plugins {
  id 'java'
  id 'org.graalvm.buildtools.native' version '0.9.22'
}

group 'indi.yuluo'
version '1.0-SNAPSHOT'

repositories {
    // 配置 maven 中央仓库
  maven { url 'https://maven.aliyun.com/repository/public' }
  mavenCentral()
  gradlePluginPortal()
}

dependencies {
    testImplementation 'com.alibaba.nacos:nacos-client:2.2.1'
    testImplementation 'org.assertj:assertj-core:3.22.0'
    testImplementation 'org.awaitility:awaitility:4.2.0'
    testImplementation 'org.junit.jupiter:junit-jupiter-api:5.8.1'
    testRuntimeOnly 'org.junit.jupiter:junit-jupiter-engine:5.8.1'
}

// graalvm native 相关配置
graalvmNative {
  agent {
      // 设置代理模式
    defaultMode = "conditional"
    modes {
        // 引入 conditional 的过滤文件配置
      conditional  {
        userCodeFilterPath = "metadata-user-code-filter.json"
        extraFilterPath = "metadata-extra-filter.json"
      }
      // conditional 使用不了 access-filter 和 caller-filter 具体自己可以创建 demo 
    }
        metadataCopy {
            mergeWithExisting = true
            inputTaskNames.add("test")
            outputDirectories.add("src/test/resources/META-INF/native-image/com.alibaba.nacos/nacos-jni")
        }
    }
    metadataRepository {
        enabled = true
    }
  // 指定运行参数 如果在 main 中使用 main {} test 使用 test {}
  binaries {
    test {
      buildArgs("--enable-url-protocols=http")
        }
    }
}

test {
  useJUnitPlatform()
}
```

#### 生成元数据

生成元数据

```json
./gradlew -Pagent clean test
```

使用如下命令导出元数据文件

```shell
./gradlew metadataCopy --task test
```

清理单元测试

```shell
./gradlew clean nativeTest
```

> 在生成单元测试的过程中，可能存在生成不完全的情况。当然也可以在maven中生成相关元数据，只要手动删除一些无关的json条目就可以了。最终的结果是能够通过native build tools的nativetest即可。
>  
> 如果需要一个项目的metadata，就应该为此项目编写单元测试，用单元测试生成最初版本的metadata的json文件。最后手动根据nativetest的error log或warn log对（有些缺少的json条目会表现为nativetest出现死锁）改改json文件的条目

### 配置文件中 配置项说明

#### reflect-config.json

```json
{
  "name":"com.alibaba.nacos.api.naming.ability.ClientNamingAbility",
  "allDeclaredFields":true,
  "queryAllDeclaredMethods":true,
  "queryAllDeclaredConstructors":true,
  "methods":[
    {"name":"isSupportDeltaPush","parameterTypes":[] }, 
    {"name":"isSupportRemoteMetric","parameterTypes":[] }
  ]
},
```

proxy-config.json

```json
 {
    "interfaces":["io.seata.config.Configuration"]
  },
```

## 提交元数据到中央仓库

gradle 提交元数据步骤参考：[https://github.com/oracle/graalvm-reachability-metadata/blob/master/CONTRIBUTING.md](https://github.com/oracle/graalvm-reachability-metadata/blob/master/CONTRIBUTING.md)

**以提交 nacos 元数据为例演示！**

1. clone 元数据中央仓库到本地 

```shell
git clone https://github.com/oracle/graalvm-reachability-metadata.git
```

2. 执行如下命令 

```shell
./gradlew scaffold --coordinates com.alibaba:nacos-client:2.2.1
```

3. 填充对应测试类和元数据文件

填充单元测试时，注意需要修改如下内容 

```shell
plugins {
    id 'java'
    id 'org.graalvm.buildtools.native' version '0.9.22'
}

修改为：

plugins {
    id "org.graalvm.internal.tck"
}
```

4. 填充完成之后，执行如下命令进行测试 

> **注意：去 linux 环境测试！！！相关 issue 描述：**[**https://github.com/oracle/graalvm-reachability-metadata/issues/24**](https://github.com/oracle/graalvm-reachability-metadata/issues/24)

5. 确认测试通过之后，说明针对已有的单元测试，没有缺少的metadata。提交 pr 到中央仓库 

```shell
nacos-client: https://github.com/oracle/graalvm-reachability-metadata/pull/325
```

6. 如果使用到了 docker ，需要创建额外的 `required-docker-images.txt` 文件，之后需要提交镜像配置到中央仓库的 `https://github.com/oracle/graalvm-reachability-metadata/blob/master/tests/tck-build-logic/src/main/resources/AllowedDockerImages.txt`中， 不然 github ci 不通过。 

```shell
https://github.com/oracle/graalvm-reachability-metadata/pull/321
```

7. 如果使用虚拟机测试，注意虚拟机网络连接配置 
8. 测试通过示例： 

![image-20230627112831601.png](/img/blog/image.png)

**值得一提的是，graalvm 不怎么 review 外部 pr，除非你主动催！！Oracle Labs 是经典的四天工作制，周五，周六，周日基本找不到人的！**

linux 测试环境搭建步骤：（环境搭建，特别是安装jdk，非常慢~~~~）

```shell
cd /tmp
sudo apt install unzip zip curl sed -y
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 22.3.1.r17-grl
sdk use java 22.3.1.r17-grl
gu install native-image
sudo apt-get install build-essential libz-dev zlib1g-dev -y

sdk install gradle
```

## 踩坑记录

1. 到目前为止，graalvm 提供的获取元数据方式任然存在有不包含指定类和缺少类的情况出现，需要手动补充，可参见 pr： https://github.com/oracle/graalvm-reachability-metadata/pull/167。优化此插件体验一直是 graalvm 讨论的问题之一。 

2. gradle 错误： 

```shell
 [java.net.MalformedURLException: Accessing an URL protocol that was not enabled. The URL protocol http is
 supported but not enabled by default. It must be enabled by adding the --enable-url-protocols=http option to the native-image command.]
```

需要加入相关配置：**（作用给test文件夹的就是test buildargs，作用给main文件夹的就是main buildargs，在binary不同子级下）**

```json
   graalvmNative {
     agent {
       defaultMode = "conditional"
       modes {
         conditional {
           userCodeFilterPath = "metadata-user-code-filter.json"
           extraFilterPath = "metadata-extra-filter.json"
         }
       }
     }
     binaries {
       test {
         buildArgs("--enable-url-protocols=http")
           }   
       }   
   }
```

## 相关URL参考地址

Graalvm Slack：[https://app.slack.com/client/TN37RDLPK/CNBFR78F9](https://app.slack.com/client/TN37RDLPK/CNBFR78F9)

Graalvm 元数据中央仓库：[https://github.com/oracle/graalvm-reachability-metadata](https://github.com/oracle/graalvm-reachability-metadata)

nbt 插件地址：[https://github.com/graalvm/native-build-tools](https://github.com/graalvm/native-build-tools)

graalvm blog：[https://easyj.icu/blog/#/native-image/theory-practice](https://easyj.icu/blog/#/native-image/theory-practice)

## 致谢

感谢 Apache ShardingSphere 社区 commiter [泠恒谦](https://github.com/linghengqian/)的指导

感谢 Seata 社区 commiter [王良](https://github.com/wangliang181230) 的 graalvm 相关知识介绍
