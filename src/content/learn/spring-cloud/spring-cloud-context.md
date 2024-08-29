---
title: 应用上下文
keywords: [Spring Cloud Alibaba,Spring Cloud]
description: "Spring Cloud 中文文档"
author: Spring 教程
date: "2024-04-10"
category: spring-cloud
---

## 2\. Spring Cloud上下文：应用程序上下文服务
-----------------------------

Spring Boot对于如何使用Spring来构建应用程序有自己的看法。例如，它具有用于公共配置文件的常规位置，并具有用于公共管理和监视任务的端点。Spring Cloud以此为基础，并添加了一些功能，可能系统中的所有组件都将使用或偶尔需要这些功能。

[](#_the_bootstrap_application_context)2.1 Bootstrap应用程序上下文
-----------------------------------------------------------------------------------------------------------------

Spring Cloud应用程序通过创建“ bootstrap ”上下文来运行，该上下文是主应用程序的父上下文。它负责从外部源加载配置属性，并负责解密本地外部配置文件中的属性。这两个上下文共享一个`Environment`，它是任何Spring应用程序的外部属性的来源。默认情况下，引导程序属性（不是`bootstrap.properties`，而是引导程序阶段加载的属性）具有较高的优先级，因此它们不能被本地配置覆盖。

引导上下文使用与主应用程序上下文不同的约定来定位外部配置。可以使用`bootstrap.yml`来代替`application.yml`（或`.properties`），而将引导程序和外部环境的外部配置很好地分开。以下清单显示了一个示例：

**bootstrap.yml。**

spring:
  application:
    name: foo
  cloud:
    config:
      uri: ${SPRING\_CONFIG\_URI:http://localhost:8888}

如果您的应用程序需要来自服务器的任何特定于应用程序的配置，则最好设置`spring.application.name`（在`bootstrap.yml`或`application.yml`中）。为了将属性`spring.application.name`用作应用程序的上下文ID，必须在`bootstrap.[properties | yml]`中进行设置。

如果要检索特定的配置文件配置，还应该在`bootstrap.[properties | yml]`中设置`spring.profiles.active`。

您可以通过设置`spring.cloud.bootstrap.enabled=false`来完全禁用引导过程（例如，在系统属性中）。

[](#_application_context_hierarchies)2.2应用程序上下文层次结构
---------------------------------------------------------------------------------------------------------

如果从`SpringApplication`或`SpringApplicationBuilder`构建应用程序上下文，那么Bootstrap上下文将作为父级添加到该上下文。Spring的一个功能是子上下文从其父级继承属性源和配置文件，因此与构建没有Spring Cloud Config的相同上下文相比，“ 主 ”应用程序上下文包含其他属性源。其他属性来源是：

*   “ bootstrap ”：如果在Bootstrap上下文中找到任何`PropertySourceLocators`并且具有非空属性，则会以高优先级显示可选的`CompositePropertySource`。一个示例是Spring Cloud Config服务器中的属性。有关如何自定义此属性源内容的说明，请参见“ [第2.6节“自定义Bootstrap Property源”](#customizing-bootstrap-property-sources "2.6自定义Bootstrap属性源") ”。
*   “ applicationConfig：\[classpath：bootstrap.yml\] ”（以及相关文件，如果Spring配置文件处于活动状态）：如果您拥有`bootstrap.yml`（或`.properties`），则这些属性用于配置Bootstrap上下文。然后，当它们的父级被设置时，它们被添加到子级上下文。它们的优先级低于`application.yml`（或`.properties`）以及创建Spring Boot应用程序过程中正常添加到子级的任何其他属性源的优先级。有关如何自定义这些属性源内容的说明，请参见“ [第2.3节“更改引导程序Properties”的位置](#customizing-bootstrap-properties "2.3更改引导程序属性的位置") ”。

由于属性源的排序规则，“ bootstrap ”条目优先。但是，请注意，这些不包含来自`bootstrap.yml`的任何数据，该数据的优先级非常低，但可用于设置默认值。

您可以通过设置创建的任何`ApplicationContext`的父上下文来扩展上下文层次结构，例如，使用其自己的界面或使用`SpringApplicationBuilder`便捷方法（`parent()`，`child()`和`sibling()`）。引导上下文是您自己创建的最高级祖先的父级。层次结构中的每个上下文都有其自己的“ bootstrap ”（可能为空）属性源，以避免无意间将价值从父辈提升到子孙后代。如果有配置服务器，则层次结构中的每个上下文原则上也可以具有不同的`spring.application.name`，因此也具有不同的远程属性源。正常的Spring应用程序上下文行为规则适用于属性解析：子上下文的属性按名称以及属性源名称覆盖父级属性。（如果子项具有与父项同名的属性源，则子项中不包括来自父项的值）。

请注意，`SpringApplicationBuilder`可让您在整个层次结构中共享`Environment`，但这不是默认设置。因此，同级上下文尤其不需要具有相同的配置文件或属性源，即使它们可能与其父级共享相同的值。

[](#customizing-bootstrap-properties)2.3更改引导程序Properties的位置
-----------------------------------------------------------------------------------------------------------------

可以通过设置`spring.cloud.bootstrap.name`（默认值：`bootstrap`），`spring.cloud.bootstrap.location`（默认值：空）或`spring.cloud.bootstrap.additional-location`（默认值：空）来指定`bootstrap.yml`（或`.properties`）位置。 —例如，在系统属性中。这些属性的行为类似于具有相同名称的`spring.config.*`变体。使用`spring.cloud.bootstrap.location`将替换默认位置，并且仅使用指定的位置。要将位置添加到默认位置列表中，可以使用`spring.cloud.bootstrap.additional-location`。实际上，它们是通过在引导程序`Environment`中设置这些属性来设置引导程序`ApplicationContext`的。如果存在有效的配置文件（通过`spring.profiles.active`或通过您正在构建的上下文中的`Environment` API），该配置文件中的属性也会被加载，这与常规Spring Boot应用程序中的加载情况相同-例如，从`bootstrap-development.properties`中获取`development`个人资料。

[](#overriding-bootstrap-properties)2.4覆盖远程Properties的值
-------------------------------------------------------------------------------------------------------------

通过引导上下文添加到应用程序中的属性源通常是“ 远程的 ”（例如，来自Spring Cloud Config Server）。默认情况下，不能在本地覆盖它们。如果要让您的应用程序使用其自己的系统属性或配置文件覆盖远程属性，则远程属性源必须通过设置`spring.cloud.config.allowOverride=true`来授予其权限（在本地设置无效）。设置该标志后，将使用两个更细粒度的设置来控制远程属性相对于系统属性和应用程序本地配置的位置：

*   `spring.cloud.config.overrideNone=true`：从任何本地属性源覆盖。
*   `spring.cloud.config.overrideSystemProperties=false`：只有系统属性，命令行参数和环境变量（而不是本地配置文件）才应覆盖远程设置。

[](#_customizing_the_bootstrap_configuration)2.5自定义Bootstrap配置
--------------------------------------------------------------------------------------------------------------------

通过将项添加到名为`org.springframework.cloud.bootstrap.BootstrapConfiguration`的项下的`/META-INF/spring.factories`中，可以将引导上下文设置为执行您喜欢的任何操作。它包含用于创建上下文的Spring `@Configuration`类的逗号分隔列表。您可以在此处创建要用于主应用程序上下文进行自动装配的任何beans。`@Beans`类型为`ApplicationContextInitializer`的特殊合同。如果要控制启动顺序，则可以用`@Order`批注标记类（默认顺序为`last`）。

> 当添加自定义`BootstrapConfiguration`，小心你添加类不是`@ComponentScanned`错误地进入你的“ 主 ”应用程序上下文，这里可能并不需要它们。为引导配置类使用单独的程序包名称，并确保`@ComponentScan`或带注释的配置类`@SpringBootApplication`尚未包含该名称。

引导过程结束时，将初始化程序注入到主要的`SpringApplication`实例中（这是正常的Spring Boot启动顺序，无论它是作为独立应用程序运行还是部署在应用程序服务器中）。首先，从`spring.factories`中找到的类创建引导上下文。然后，在启动之前，将类型为`ApplicationContextInitializer`的所有`@Beans`添加到主`SpringApplication`。

[](#customizing-bootstrap-property-sources)2.6自定义引导程序Property源
--------------------------------------------------------------------------------------------------------------------

引导过程添加的外部配置的默认属性来源是Spring Cloud Config服务器，但是您可以通过将类型`PropertySourceLocator`的beans添加到引导上下文（通过`spring.factories`）来添加其他来源。例如，您可以从其他服务器或数据库插入其他属性。

例如，请考虑以下定制定位器：

_@Configuration_
public class CustomPropertySourceLocator implements PropertySourceLocator {

    _@Override_
    public PropertySource<?> locate(Environment environment) {
        return new MapPropertySource("customProperty",
                Collections.<String, Object>singletonMap("property.from.sample.custom.source", "worked as intended"));
    }

}

传入的`Environment`是即将创建的`ApplicationContext`的那个，换句话说，就是我们为其提供其他属性源的那个。它已经有其正常的Spring Boot提供的属性源，因此您可以使用这些属性来定位特定于此`Environment`的属性源（例如，通过在`spring.application.name`上键入它，这与默认设置相同）。 Spring Cloud Config服务器属性源定位符）。

如果您创建一个包含此类的jar，然后添加包含以下内容的`META-INF/spring.factories`，则`customProperty` `PropertySource`会出现在任何在其类路径中包含该jar的应用程序中：

org.springframework.cloud.bootstrap.BootstrapConfiguration=sample.custom.CustomPropertySourceLocator

[](#_logging_configuration)2.7日志配置
----------------------------------------------------------------------------------------

如果要使用Spring Boot来配置日志设置，则应将此配置放在\`bootstrap。\[yml | 属性\]（如果您希望将其应用于所有事件）。

> 为了使Spring Cloud正确初始化日志记录配置，您不能使用自定义前缀。例如，初始化记录系统时，Spring Cloud无法识别使用`custom.loggin.logpath`。

[](#_environment_changes)2.8环境变化
--------------------------------------------------------------------------------------

应用程序侦听`EnvironmentChangeEvent`并以几种标准方式对更改做出反应（用户可以通过常规方式将其他`ApplicationListeners`作为`@Beans`添加）。观察到`EnvironmentChangeEvent`时，它会列出已更改的键值，并且应用程序将这些键值用于：

*   重新绑定上下文中的任何`@ConfigurationProperties` beans
*   为`logging.level.*`中的所有属性设置记录器级别

请注意，默认情况下，Config Client不轮询`Environment`中的更改。通常，我们不建议您使用这种方法来检测更改（尽管您可以使用`@Scheduled`注释对其进行设置）。如果您具有横向扩展的客户端应用程序，则最好向所有实例广播`EnvironmentChangeEvent`，而不是让它们轮询更改（例如，使用[Spring Cloud Bus](https://github.com/spring-cloud/spring-cloud-bus)）。

只要您可以实际更改`Environment`并发布事件，`EnvironmentChangeEvent`就涵盖了一大类刷新用例。请注意，这些API是公共的，并且是核心Spring的一部分）。您可以通过访问`/configprops`端点（正常的Spring Boot Actuator功能）来验证更改是否绑定到`@ConfigurationProperties` beans。例如，`DataSource`可以在运行时更改其`maxPoolSize`（由Spring Boot创建的默认`DataSource`是`@ConfigurationProperties` bean）并动态地增加容量。重新绑定`@ConfigurationProperties`并不涵盖另一类用例，在这种情况下，您需要对刷新有更多的控制，并且需要对整个`ApplicationContext`进行原子更改。为了解决这些问题，我们有`@RefreshScope`。

[](#refresh-scope)2.9刷新范围
-------------------------------------------------------------------------------

进行配置更改时，标记为`@RefreshScope`的Spring `@Bean`将得到特殊处理。此功能解决了状态beans的问题，该状态仅在初始化时才注入配置。例如，如果通过`Environment`更改数据库URL时`DataSource`具有打开的连接，则您可能希望这些连接的持有者能够完成他们正在做的事情。然后，下次某物从池中借用一个连接时，它将获得一个具有新URL的连接。

有时，甚至可能必须将`@RefreshScope`批注应用到只能初始化一次的某些beans上。如果bean是“不可变的”，则必须用`@RefreshScope`注释bean或在属性键`spring.cloud.refresh.extra-refreshable`下指定类名。

> 如果您自己创建一个`DataSource` bean，而实现是一个`HikariDataSource`，则返回最特定的类型，在这种情况下为`HikariDataSource`。否则，您将需要设置`spring.cloud.refresh.extra-refreshable=javax.sql.DataSource`。

刷新作用域beans是惰性代理，它们在使用时（即在调用方法时）进行初始化，并且作用域充当初始化值的缓存。若要强制bean在下一个方法调用上重新初始化，必须使它的缓存条目无效。

`RefreshScope`在上下文中是bean，并具有公用的`refreshAll()`方法，可通过清除目标缓存来刷新作用域中的所有beans。`/refresh`端点公开了此功能（通过HTTP或JMX）。要按名称刷新单个bean，还有一个`refresh(String)`方法。

要公开`/refresh`端点，您需要在应用程序中添加以下配置：

management:
 endpoints:
 web:
 exposure:
 include: refresh

> `@RefreshScope`在`@Configuration`类上（在技术上）有效，但是可能会导致令人惊讶的行为。例如，这并不意味着该类中定义的所有`@Beans`本身都在`@RefreshScope`中。具体而言，除非刷新本身在`@RefreshScope`中，否则依赖那些beans的任何内容都不能依赖于刷新启动时对其进行更新。在这种情况下，将在刷新时重建它，并重新注入其依赖项。此时，它们将从刷新的`@Configuration`重新初始化。

[](#_encryption_and_decryption)2.10加密和解密
----------------------------------------------------------------------------------------------

Spring Cloud具有`Environment`预处理器，用于在本地解密属性值。它遵循与Config Server相同的规则，并且通过`encrypt.*`具有相同的外部配置。因此，您可以使用`{cipher}*`形式的加密值，并且只要存在有效密钥，就可以在主应用程序上下文获得`Environment`设置之前对它们进行解密。要在应用程序中使用加密功能，您需要在类路径中包含Spring Security RSA（Maven坐标：“ org.springframework.security:spring-security-rsa”），并且还需要JVM中的全功能JCE扩展。

如果由于“密钥大小非法”而导致异常，并且使用Sun的JDK，则需要安装Java密码术扩展（JCE）无限强度管辖权策略文件。有关更多信息，请参见以下链接：

*   [Java 6 JCE](https://www.oracle.com/technetwork/java/javase/downloads/jce-6-download-429243.html)
*   [Java 7 JCE](https://www.oracle.com/technetwork/java/javase/downloads/jce-7-download-432124.html)
*   [Java 8 JCE](https://www.oracle.com/technetwork/java/javase/downloads/jce8-download-2133166.html)

将文件解压缩到您使用的JRE / JDK x64 / x86版本的JDK / jre / lib / security文件夹中。

[](#_endpoints)2.11端点
---------------------------------------------------------------------------

对于Spring Boot Actuator应用程序，可以使用一些其他管理端点。您可以使用：

*   从`POST`到`/actuator/env`以更新`Environment`并重新绑定`@ConfigurationProperties`和日志级别。
*   `/actuator/refresh`重新加载引导上下文并刷新`@RefreshScope` beans。
*   `/actuator/restart`关闭`ApplicationContext`并重新启动（默认情况下禁用）。
*   `/actuator/pause`和`/actuator/resume`用于调用`Lifecycle`方法（`ApplicationContext`中的`stop()`和`start()`）。

> 如果禁用`/actuator/restart`端点，则`/actuator/pause`和`/actuator/resume`端点也将被禁用，因为它们只是`/actuator/restart`的特例。

> Copyright © 2002 - 2024 VMware, Inc. All Rights Reserved.

> Copies of this document may be made for your own use and for distribution to others, provided that you do not charge any fee for such copies and further provided that each copy contains this Copyright Notice, whether distributed in print or electronically.
