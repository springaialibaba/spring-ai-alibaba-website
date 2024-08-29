---
title: Spring Boot 核心特性
keywords: [Spring Cloud Alibaba,Spring Boot]
description: "Spring Boot 中文文档"
author: Spring 教程
date: "2024-04-10"
category: spring-boot
---

本部分将介绍 Spring Boot 相关的细节内容. 在这里,您可以学习到可能需要使用和自定义的主要功能. 您如果还没有做好充分准备,可能需要阅读 "[入门](getting-started.html#getting-started)" 和 "[使用 Spring Boot 进行开发](using.html#using)" ,以便打下前期基础.

[](#features.spring-application)1\. SpringApplication
----------------------------------------------------------------------------------------------------------------------------

`SpringApplication` 类提供了一种可通过运行 `main()` 方法来启动 Spring 应用的简单方式. 大多数情况下,您只需要委托给静态的 `SpringApplication.run` 方法:

Java

Kotlin

    @SpringBootApplication
    public class MyApplication {
    
        public static void main(String[] args) {
            SpringApplication.run(MyApplication.class, args);
        }
    
    }
    

当应用启动时,您应该会看到类似以下的内容输出:

  .   \_\_\_\_          \_            \_\_ \_ \_
 /\\\\ / \_\_\_'\_ \_\_ \_ \_(\_)\_ \_\_  \_\_ \_ \\ \\ \\ \\
( ( )\\\_\_\_ | '\_ | '\_| | '\_ \\/ \_\` | \\ \\ \\ \\
 \\\\/  \_\_\_)| |\_)| | | | | || (\_| |  ) ) ) )
  '  |\_\_\_\_| .\_\_|\_| |\_|\_| |\_\\\_\_, | / / / /
 =========|\_|==============|\_\_\_/=/\_/\_/\_/
 :: Spring Boot ::                (v3.0.0)

2022-11-24T17:03:48.214Z  INFO 20764 --- \[           main\] o.s.b.d.f.s.MyApplication                : Starting MyApplication using Java 17.0.5 with PID 20764 (/opt/apps/myapp.jar started by myuser in /opt/apps/)
2022-11-24T17:03:48.219Z  INFO 20764 --- \[           main\] o.s.b.d.f.s.MyApplication                : No active profile set, falling back to 1 default profile: "default"
2022-11-24T17:03:50.511Z  INFO 20764 --- \[           main\] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2022-11-24T17:03:50.524Z  INFO 20764 --- \[           main\] o.apache.catalina.core.StandardService   : Starting service \[Tomcat\]
2022-11-24T17:03:50.524Z  INFO 20764 --- \[           main\] o.apache.catalina.core.StandardEngine    : Starting Servlet engine: \[Apache Tomcat/10.1.1\]
2022-11-24T17:03:50.623Z  INFO 20764 --- \[           main\] o.a.c.c.C.\[Tomcat\].\[localhost\].\[/\]       : Initializing Spring embedded WebApplicationContext
2022-11-24T17:03:50.625Z  INFO 20764 --- \[           main\] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 2269 ms
2022-11-24T17:03:51.380Z  INFO 20764 --- \[           main\] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2022-11-24T17:03:51.418Z  INFO 20764 --- \[           main\] o.s.b.d.f.s.MyApplication                : Started MyApplication in 3.872 seconds (process running for 5.008)
2022-11-24T17:03:51.506Z  INFO 20764 --- \[ionShutdownHook\] o.apache.catalina.core.StandardService   : Stopping service \[Tomcat\]

默认情况下,将显示 `INFO` 级别的日志信息,包括一些应用启动相关信息. 如果您需要修改 `INFO` 日志级别,请参考 [日志等级](#features.logging.log-levels).

使用主应用程序类包中的实现版本来确定应用程序版本. 可以通过将 `spring.main.log-startup-info` 设置为 `false` 来关闭启动信息记录. 这还将关闭对应用程序 active 配置文件的日志记录.

要在启动期间添加其他日志记录,可以在 `SpringApplication` 的子类中重写 `logStartupInfo(boolean)`.

### [](#features.spring-application.startup-failure)1.1. 启动失败

如果您的应用无法启动,注册的 `FailureAnalyzers` 可能会提供有相关的错误信息和解决问题的具体方法. 例如,如果您在已经被占用的 `8080` 端口上启动了一个 web 应用,会看到类似以下的错误信息:

\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*
APPLICATION FAILED TO START
\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*

Description:

Embedded servlet container failed to start. Port 8080 was already in use.

Action:

Identify and stop the process that is listening on port 8080 or configure this application to listen on another port.

Spring Boot 提供了许多的 `FailureAnalyzer` 实现,您也可以 [添加自己的实现](howto.html#howto.application.failure-analyzer).

如果没有失败分析器能够处理的异常, 您仍然可以显示完整的条件报告以便更好地了解出现的问题. 为此,您需要针对 `org.springframework.boot.autoconfigure.logging.ConditionEvaluationReportLoggingListener` [启用 `debug` 属性](#features.external-config) 或者 [开启 `DEBUG` 日志](#features.logging.log-levels).

例如,如果您使用 `java -jar` 运行应用,可以按以下方式启用 `debug` 属性:

    $ java -jar myproject-0.0.1-SNAPSHOT.jar --debug

### [](#features.spring-application.lazy-initialization)1.2. 延迟初始化

`SpringApplication` 允许延迟地初始化应用程序. 启用延迟初始化后,将根据需要创建 bean,而不是在应用程序启动期间创建 bean. 因此,启用延迟初始化可以减少应用程序启动所需的时间. 在 Web 应用程序中,启用延迟初始化将导致许多与 Web 相关的 Bean 在收到 HTTP 请求后才被初始化.

延迟初始化的缺点是,它可能会延迟发现应用程序问题的时间. 如果配置错误的 Bean 延迟初始化,则在启动期间不会发生问题,并且只有在初始化 Bean 时问题才会变得明显. 还必须注意确保 JVM 有足够的内存来容纳所有应用程序的 bean,而不仅仅是启动期间初始化的 bean. 由于这些原因,默认情况下不会启用延迟初始化,因此建议在启用延迟初始化之前先对 JVM 的堆大小进行微调.

可以使用 `SpringApplicationBuilder` 上的 `lazyInitialization` 方法或 `SpringApplication` 上的 `setLazyInitialization` 方法以编程方式启用延迟初始化. 另外,可以使用 `spring.main.lazy-initialization` 属性启用它,如以下示例所示:

    spring:
      main:
        lazy-initialization: true

如果您禁用了延迟初始化，但对应用程序其余部分使用延迟初始化时, 则可以使用 `@Lazy(false)` 注解将它们的延迟属性显式设置为 `false`.

### [](#features.spring-application.banner)1.3. 自定义 banner

可以通过在 classpath 下添加一个 `banner.txt` 文件,或者将 `spring.banner.location` 属性指向该文件的位置来更改启动时打印的 banner. 如果文件采用了非 UTF-8 编码, 您可以设置 `spring.banner.charset` 来解决.

您可以在 `banner.txt` 文件中使用 `Environment` 环境变量以及以下占位符:

Table 1. Banner 变量

变量

描述

`${application.version}`

您的应用版本号,声明在 `MANIFEST.MF` 中. 例如,`Implementation-Version: 1.0` 将被打印为 `1.0`.

`${application.formatted-version}`

您的应用版本号,声明在 `MANIFEST.MF` 中,格式化之后打印 (用括号括起来,以 `v` 为前缀) ,例如 `(v1.0)`.

`${spring-boot.version}`

您使用的 Spring Boot 版本. 例如 `3.0.0`.

`${spring-boot.formatted-version}`

您使用的 Spring Boot 版本格式化之后显示 (用括号括起来,以 `v` 为前缀) . 例如 `(v3.0.0)`.

`${Ansi.NAME}` (or `${AnsiColor.NAME}`, `${AnsiBackground.NAME}`, `${AnsiStyle.NAME}`)

其中 `NAME` 是 ANSI 转义码的名称. 有关详细信息,请参阅 [`AnsiPropertySource`](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot/src/main/java/org/springframework/boot/ansi/AnsiPropertySource.java).

`${application.title}`

您的应用标题,声明在 `MANIFEST.MF` 中,例如 `Implementation-Title: MyApp` 打印为 `MyApp`.

如果您想以编程的方式生成 banner,可以使用 `SpringApplication.setBanner(…​)` 方法. 使用 `org.springframework.boot.Banner` 接口并实现自己的 `printBanner()` 方法.

您还可以使用 `spring.main.banner-mode` 属性来确定是否必须在 `System.out` (`console`) 上打印 banner, 还是使用日志记录器 (`log`) 或者都不打印 (`off`).

打印的 banner 的单例 bean 为： `springBootBanner` .

只有在使用 Spring Boot 启动时， `$ {application.version}` 和 `${application.formatted-version}` 属性才可用. 如果您运行的是未打包的 jar 并以 `java -cp <classpath> <mainclass>` 开头， 则无法解析这些值.

这就是为什么我们建议您始终使用通过 `java org.springframework.boot.loader.JarLauncher` 来启动未打包的 jar 的原因. 这将在构建类路径并启动您的应用程序之前初始化 `application.*` 变量.

### [](#features.spring-application.customizing-spring-application)1.4. 自定义 SpringApplication

如果 `SpringApplication` 的默认设置不符合您的想法,您可以创建本地实例进行定制化. 例如,要关闭 banner,您可以这样:

Java

Kotlin

    @SpringBootApplication
    public class MyApplication {
    
        public static void main(String[] args) {
            SpringApplication application = new SpringApplication(MyApplication.class);
            application.setBannerMode(Banner.Mode.OFF);
            application.run(args);
        }
    
    }
    

传入 `SpringApplication` 的构造参数是 Spring beans 的配置源. 大多情况下是引用 `@Configuration` 类,但您也可以引用 XML 配置或者被扫描的包.

也可以使用 `application.properties` 文件配置 `SpringApplication`. 有关详细信息,请参见 _[外部化配置](#features.external-config)_.

关于配置选项的完整列表,请参阅 [`SpringApplication` Javadoc](https://docs.spring.io/spring-boot/docs/3.0.0/api/org/springframework/boot/SpringApplication.html).

### [](#features.spring-application.fluent-builder-api)1.5. Fluent Builder API(流式构建 API)

如果您需要构建一个有层级关系的 `ApplicationContext` (具有父/子关系的多上下文) ,或者偏向使用 fluent (流式) 构建器 API,可以使用 `SpringApplicationBuilder`.

`SpringApplicationBuilder` 允许您链式调用多个方法,包括能创建出具有层次结构的 `parent` 和 `child` 方法.

例如:

Java

Kotlin

    new SpringApplicationBuilder()
            .sources(Parent.class)
            .child(Application.class)
            .bannerMode(Banner.Mode.OFF)
            .run(args);
    

创建层级的 `ApplicationContext` 时有部分限制,比如 Web 组件必须包含在子上下文中,并且相同的 `Environment` 将作用于父子上下文. 有关详细信息,请参阅 [`SpringApplicationBuilder` Javadoc](https://docs.spring.io/spring-boot/docs/3.0.0/api/org/springframework/boot/builder/SpringApplicationBuilder.html) .

### [](#features.spring-application.application-availability)1.6. 应用程序的可用性

在平台上部署后,应用程序可以使用诸如 [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) 之类的基础结构向平台提供有关其可用性的信息. Spring Boot 对常用的 “liveness” 和 “readiness” 可用性状态提供了开箱即用的支持. 如果您使用了 Spring Boot 的 “actuator” 支持,则这些状态将显示为运行状况端点组.

另外,您还可以通过将 `ApplicationAvailability` 接口注入到您自己的bean中来获取可用性状态.

#### [](#features.spring-application.application-availability.liveness)1.6.1. Liveness State

应用程序的 “Liveness” 状态表明其内部是否正常运行,或者在当前出现故障时自行恢复. 一个 broken （损坏）的 “Liveness” 状态意味着应用程序处于无法恢复的状态,并且应重新启动应用程序.

通常,"Liveness" 状态不应基于外部检查 (例如 [Health checks](actuator.html#actuator.endpoints.health)) . 如果确实如此,则发生故障的外部系统 (数据库,Web API,外部缓存) 将触发整个平台的大量重启和级联故障.

Spring Boot 应用程序的内部状态主要由 Spring `ApplicationContext` 表示. 如果应用程序上下文已成功启动,则 Spring Boot 会假定该应用程序处于有效状态. 刷新上下文后,应用程序即被视为活动应用程序,请参阅 [Spring Boot 应用程序生命周期和相关的应用程序事件](#features.spring-application.application-events-and-listeners).

#### [](#features.spring-application.application-availability.readiness)1.6.2. Readiness State

应用程序的 “Readiness” 状态告诉应用程序是否已准备好处理流量. failing（失败的） “Readiness” 状态告诉平台当前不应将流量路由到应用程序. 这通常发生在启动过程中,正在处理 `CommandLineRunner` 和 `ApplicationRunner` 组件时,或者在应用程序认为它太忙而无法获得额外流量的情况下.

一旦调用了应用程序和命令行运行程序,就认为该应用程序已准备就绪,请参阅 [Spring Boot 应用程序生命周期和相关的应用程序事件](#features.spring-application.application-events-and-listeners).

预期在启动期间运行的任务应由 `CommandLineRunner` 和 `ApplicationRunner` 组件执行,而不是使用 Spring 组件生命周期回调 (如 `@PostConstruct`) 执行.

#### [](#features.spring-application.application-availability.managing)1.6.3. 管理应用程序可用性状态

通过注入 `ApplicationAvailability` 接口并调用其方法,应用程序组件可以随时检索当前的可用性状态. 应用程序通常会希望监听状态更新或更新应用程序的状态.

例如,我们可以将应用程序的 "Readiness" 状态导出到文件中,以便 Kubernetes 的 "exec Probe" 可以查看此文件:

Java

Kotlin

    @Component
    public class MyReadinessStateExporter {
    
        @EventListener
        public void onStateChange(AvailabilityChangeEvent<ReadinessState> event) {
            switch (event.getState()) {
                case ACCEPTING_TRAFFIC:
                    // create file /tmp/healthy
                    break;
                case REFUSING_TRAFFIC:
                    // remove file /tmp/healthy
                    break;
            }
        }
    
    }
    

当应用程序崩溃且无法恢复时,我们还可以更新应用程序的状态:

Java

Kotlin

    @Component
    public class MyLocalCacheVerifier {
    
        private final ApplicationEventPublisher eventPublisher;
    
        public MyLocalCacheVerifier(ApplicationEventPublisher eventPublisher) {
            this.eventPublisher = eventPublisher;
        }
    
        public void checkLocalCache() {
            try {
                // ...
            }
            catch (CacheCompletelyBrokenException ex) {
                AvailabilityChangeEvent.publish(this.eventPublisher, ex, LivenessState.BROKEN);
            }
        }
    
    }
    

Spring Boot 通过 [Kubernetes HTTP probes for "Liveness" and "Readiness" with Actuator Health Endpoints](actuator.html#actuator.endpoints.kubernetes-probes).您可以在专用部分中获得 [有关在 Kubernetes 上部署 Spring Boot 应用程序的更多指南](deployment.html#deployment.cloud.kubernetes).

### [](#features.spring-application.application-events-and-listeners)1.7. 应用程序事件与监听器

除了常见的 Spring Framework 事件,比如 [`ContextRefreshedEvent`](https://docs.spring.io/spring-framework/docs/6.0.2/javadoc-api/org/springframework/context/event/ContextRefreshedEvent.html), `SpringApplication` 还会发送其他应用程序事件.

在 `ApplicationContext` 创建之前,实际上触发了一些事件,因此您不能像 `@Bean` 一样注册监听器. 您可以通过 `SpringApplication.addListeners(…​)` 或者 `SpringApplicationBuilder.listeners(…​)` 方法注册它们.

如果您希望无论应用使用何种创建方式都能自动注册这些监听器,您都可以将 `META-INF/spring.factories` 文件添加到项目中,并使用 `org.springframework.context.ApplicationListener` 属性键指向您的监听器. 比如:

org.springframework.context.ApplicationListener=com.example.project.MyListener

当您运行应用时,应用程序事件将按照以下顺序发送:

1.  在开始应用开始运行但还没有进行任何处理时 (除了注册 listeners 和 initializers ) ,将发送 `ApplicationStartingEvent`.
    
2.  当 `Environment` 被上下文使用,但是在上下文创建之前,将发送 `ApplicationEnvironmentPreparedEvent`.
    
3.  准备 `ApplicationContext` 并调用 `ApplicationContextInitializers` 之后但在加载任何 bean 定义之前,将发送 `ApplicationContextInitializedEvent`.
    
4.  开始刷新之前,bean 定义被加载之后发送 `ApplicationPreparedEvent`.
    
5.  在上下文刷新之后且所有的应用和命令行运行器 (command-line runner) 被调用之前发送 `ApplicationStartedEvent`.
    
6.  紧随其后发送带有 `LivenessState.CORRECT` 的 `AvailabilityChangeEvent`,以指示该应用程序处于活动状态.
    
7.  在 [应用程序和命令行运行器 (command-line runner)](#features.spring-application.command-line-runner) 被调用之后,将发出,将发送 `ApplicationReadyEvent`.
    
8.  随即在 `ReadinessState.ACCEPTING_TRAFFIC` 之后发送 `AvailabilityChangeEvent`,以指示该应用程序已准备就绪,可以处理请求.
    
9.  如果启动时发生异常,则发送 `ApplicationFailedEvent`.
    

上面的列表仅包含绑定到 `SpringApplication` 的 `SpringApplicationEvent`s. 除这些以外,以下事件也在 `ApplicationPreparedEvent` 之后和 `ApplicationStartedEvent` 之前发布:

1.  `WebServer` 准备就绪后,将发送 `WebServerInitializedEvent`. `ServletWebServerInitializedEvent` 和 `ReactiveWebServerInitializedEvent` 分别是 servlet 和 reactive 变量.
    
2.  刷新 `ApplicationContext` 时,将发送 `ContextRefreshedEvent` 事件.
    

您可能不会经常使用应用程序事件,但了解他们的存在还是很有必要的. 在框架内部,Spring Boot 使用这些事件来处理各种任务.

默认情况下,事件监听器不应该运行可能很长的任务,因为它们在同一个线程中执行.考虑改用 [application and command-line runners](#features.spring-application.command-line-runner).

应用程序事件发送使用了 Spring Framework 的事件发布机制. 该部分机制确保在子上下文中发布给监听器的事件也会发布给所有祖先上下文中的监听器. 因此,如果您的应用程序使用有层级结构的 `SpringApplication` 实例,则监听器可能会收到同种类型应用程序事件的多个实例.

为了让监听器能够区分其上下文事件和后代上下文事件,您应该注入其应用程序上下文,然后将注入的上下文与事件的上下文进行比较. 可以通过实现 `ApplicationContextAware` 来注入上下文,如果监听器是 bean,则使用 `@Autowired` 注入上下文.

### [](#features.spring-application.web-environment)1.8. Web 环境

`SpringApplication` 试图为您创建正确类型的 `ApplicationContext`. 确定 `WebApplicationType` 的算法非常简单:

*   如果存在 Spring MVC,则使用 `AnnotationConfigServletWebServerApplicationContext`
    
*   如果 Spring MVC 不存在且存在 Spring WebFlux,则使用 `AnnotationConfigReactiveWebServerApplicationContext`
    
*   否则,使用 `AnnotationConfigApplicationContext`
    

这意味着如果您在同一个应用程序中使用了 Spring MVC 和 Spring WebFlux 中的新 `WebClient`, 默认情况下将使用 Spring MVC. 您可以通过调用 `setWebApplicationType(WebApplicationType)` 修改默认行为.

也可以调用 `setApplicationContextClass(…​)` 来完全控制 `ApplicationContext` 类型.

在 JUnit 测试中使用 `SpringApplication` 时,通常需要调用 `setWebApplicationType(WebApplicationType.NONE)`.

### [](#features.spring-application.application-arguments)1.9. 访问应用程序参数

如果您需要访问从 `SpringApplication.run(…​)` 传入的应用程序参数,可以注入一个 `org.springframework.boot.ApplicationArguments` bean. `ApplicationArguments` 接口提供了访问原始 `String[]` 参数以及解析后的 `option` 和 `non-option` 参数的方法:

Java

Kotlin

    @Component
    public class MyBean {
    
        public MyBean(ApplicationArguments args) {
            boolean debug = args.containsOption("debug");
            List<String> files = args.getNonOptionArgs();
            if (debug) {
                System.out.println(files);
            }
            // if run with "--debug logfile.txt" prints ["logfile.txt"]
        }
    
    }
    

Spring Boot 还向 Spring `Environment` 注册了一个 `CommandLinePropertySource`. 这允许您可以使用 `@Value` 注解注入单个应用参数.

### [](#features.spring-application.command-line-runner)1.10. 使用 ApplicationRunner 或 CommandLineRunner

如果您需要在 `SpringApplication` 启动时运行一些代码,可以实现 `ApplicationRunner` 或者 `CommandLineRunner` 接口. 这两个接口的工作方式是一样的,都提供了一个单独的 `run` 方法,它将在 `SpringApplication.run(…​)` 完成之前调用.

这个契约非常适合那些应该在应用程序启动后但在它开始接受流量之前运行的任务.

`CommandLineRunner` 接口提供了访问应用程序字符串数组形式参数的方法,而 `ApplicationRunner` 则使用了上述的 `ApplicationArguments` 接口. 以下示例展示 `CommandLineRunner` 和 `run` 方法的使用:

Java

Kotlin

    @Component
    public class MyCommandLineRunner implements CommandLineRunner {
    
        @Override
        public void run(String... args) {
            // Do something...
        }
    
    }
    

如果您定义了多个 `CommandLineRunner` 或者 `ApplicationRunner` bean,则必须指定调用顺序,您可以实现 `org.springframework.core.Ordered` 接口,也可以使用 `org.springframework.core.annotation.Order` 注解解决顺序问题.

### [](#features.spring-application.application-exit)1.11. 应用程序退出

每个 `SpringApplication` 注册了一个 JVM 关闭钩子,以确保 `ApplicationContext` 在退出时可以优雅关闭. 所有标准的 Spring 生命周期回调 (比如 `DisposableBean` 接口,或者 `@PreDestroy` 注解) 都可以使用.

此外,如果希望在调用 `SpringApplication.exit()` 时返回特定的退出码,则 bean 可以实现 `org.springframework.boot.ExitCodeGenerator` 接口. 之后退出码将传递给 `System.exit()` 以将其作为状态码返回,如示例所示:

Java

Kotlin

    @SpringBootApplication
    public class MyApplication {
    
        @Bean
        public ExitCodeGenerator exitCodeGenerator() {
            return () -> 42;
        }
    
        public static void main(String[] args) {
            System.exit(SpringApplication.exit(SpringApplication.run(MyApplication.class, args)));
        }
    
    }
    

此外,`ExitCodeGenerator` 接口可以通过异常实现. 遇到这类异常时,Spring Boot 将返回实现的 `getExitCode()` 方法提供的退出码.

如果有多个 `ExitCodeGenerator`，则使用生成的第一个非零退出代码。 要控制调用生成器的顺序，请另外实现 `org.springframework.core.Ordered` 接口或使用 `org.springframework.core.annotation.Order` 注解。

### [](#features.spring-application.admin)1.12. Admin Features（管理功能）

可以通过指定 `spring.application.admin.enabled` 属性来为应用程序启用管理相关的功能. 其将在 `MBeanServer` 平台上暴露 [`SpringApplicationAdminMXBean`](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot/src/main/java/org/springframework/boot/admin/SpringApplicationAdminMXBean.java). 您可以使用此功能来远程管理 Spring Boot 应用. 该功能对服务包装器的实现也是非常有用的.

如果您想知道应用程序在哪一个 HTTP 端口上运行,请使用 `local.server.port` 键获取该属性.

### [](#features.spring-application.startup-tracking)1.13. Application Startup tracking（应用程序启动跟踪）

在应用程序启动期间，`SpringApplication` 和 `ApplicationContext` 执行许多与应用程序生命周期、bean 生命周期甚至处理应用程序事件相关的任务. 使用 [`ApplicationStartup`](https://docs.spring.io/spring-framework/docs/6.0.2/javadoc-api/org/springframework/core/metrics/ApplicationStartup.html), Spring 框架允许你使用 [`StartupStep` 对象跟踪应用程序的启动顺序](/blog/learning/spring/core/ioc#context-functionality-startup). 收集这些数据可以用于分析目的，或者只是为了更好地理解应用程序启动过程.

您可以在设置 `SpringApplication` 实例时选择 `ApplicationStartup` 实现. 例如，要使用 `BufferingApplicationStartup`，您可以编写:

Java

Kotlin

    @SpringBootApplication
    public class MyApplication {
    
        public static void main(String[] args) {
            SpringApplication application = new SpringApplication(MyApplication.class);
            application.setApplicationStartup(new BufferingApplicationStartup(2048));
            application.run(args);
        }
    
    }
    

第一个可用的实现是由 Spring 框架提供的 `FlightRecorderApplicationStartup`. 它将特定于 Spring 的启动事件添加到 Java Flight Recorder 会话中，用于分析应用程序，并将其 Spring 上下文生命周期与 JVM 事件(如 allocations、gc、类加载……)关联起来. 一旦配置好，你就可以通过启用 Flight Recorder 运行应用程序来记录数据:

    $ java -XX:StartFlightRecording:filename=recording.jfr,duration=10s -jar demo.jar

Spring Boot 附带 `BufferingApplicationStartup` ,这个实现的目的是缓冲启动步骤，并将它们抽取到外部指标系统中. 应用程序可以在任何组件中请求 `BufferingApplicationStartup` 类型的bean. 此外，Spring Boot Actuator 将 [将暴露一个 `startup` 端点以将此信息公开为 JSON 文档](https://docs.spring.io/spring-boot/docs/3.0.0/actuator-api/htmlsingle/#startup).

[](#features.external-config)2\. 外部化配置
-------------------------------------------------------------------------------------------------------------

Spring Boot 可以让您的配置外部化,以便可以在不同环境中使用相同的应用程序代码. 您可以使用各种外部配置源, 包括 Java properties 文件、YAML 文件、环境变量或者命令行参数.

可以使用 `@Value` 注解将属性值直接注入到 bean 中,可通过 Spring 的 `Environment` 访问, 或者通过 `@ConfigurationProperties` [绑定到结构化对象](#features.external-config.typesafe-configuration-properties).

Spring Boot 使用了一个非常特别的 `PropertySource` 指令,用于覆盖默认值. 属性将按照以下顺序处理(后面的值覆盖前面的值):

1.  默认属性 (通过设置 `SpringApplication.setDefaultProperties` 指定).
    
2.  `@Configuration` 类上的 [`@PropertySource`](https://docs.spring.io/spring-framework/docs/6.0.2/javadoc-api/org/springframework/context/annotation/PropertySource.html) 注解. 请注意，在刷新应用程序上下文之前，不会将此类属性添加到 `Environment` 中. 这时配置某些属性(如 `logging.*` and `spring.main.*`) 已经太晚了. 这些属性在刷新开始之前就已读取.
    
3.  配置数据 (例如 `application.properties` 文件)
    
4.  只有 `random.*` 属性的 `RandomValuePropertySource`.
    
5.  操作系统环境变量.
    
6.  Java System 属性 (`System.getProperties()`).
    
7.  来自 `java:comp/env` 的 JNDI 属性 .
    
8.  `ServletContext` 初始化参数.
    
9.  `ServletConfig` 初始化参数.
    
10.  来自 `SPRING_APPLICATION_JSON` 的属性 (嵌入在环境变量或者系统属性中的内联 JSON) .
    
11.  命令行参数.
    
12.  测试中的 `properties`.
    
13.  在测试中使用到的 `properties` 属性,可以是 [`@SpringBootTest`](https://docs.spring.io/spring-boot/docs/3.0.0/api/org/springframework/boot/test/context/SpringBootTest.html) 和 [用于测试应用程序某部分的测试注解](#features.testing.spring-boot-applications.autoconfigured-tests).
    
14.  在测试中使用到的 [`@TestPropertySource`](https://docs.spring.io/spring-framework/docs/6.0.2/javadoc-api/org/springframework/test/context/TestPropertySource.html) 注解.
    
15.  当 devtools 被激活, `$HOME/.config/spring-boot` 目录中的 [Devtools 全局设置属性](using.html#using.devtools.globalsettings).
    

配置数据文件按以下顺序进行：

1.  在已打包的 jar 内部的 [Application properties](#features.external-config.files) 文件 (`application.properties` 和 YAML 变量).
    
2.  在已打包的 jar 内部的 [指定 profile 的应用属性文件](#features.external-config.files.profile-specific) (`application-{profile}.properties` 和 YAML 变量).
    
3.  在已打包的 jar 外部的 [Application properties](#features.external-config.files) 文件 (`application.properties` 和 YAML 变量).
    
4.  在已打包的 jar 外部的 [指定 profile 的应用属性文件](#features.external-config.files.profile-specific) (`application-{profile}.properties` 和 YAML 变量).
    

建议您在整个应用程序中坚持使用一种格式. 如果在相同的位置有 `.properties` 和 `.yml` 格式的配置文件，则 `.properties` 优先.

举个例子,假设开发的 `@Component` 使用了 `name` 属性,可以这样:

Java

Kotlin

    @Component
    public class MyBean {
    
        @Value("${name}")
        private String name;
    
        // ...
    
    }
    

在您的应用程序的 classpath 中 (比如在 jar 中) ,您可以有一个 `application.properties`,它为 name 提供了一个合适的默认属性值. 当在新环境中运行时,您可以在 jar 外面提供一个 `application.properties` 来覆盖 `name`. 对于一次性测试,您可以使用命令行指定形式启动 (比如 `java -jar app.jar --name="Spring"`) .

`env` 和 `configprops` 端点在确定属性的特定值时很有用. 您可以使用这两个端点来诊断意外的属性值. 有关详细信息， 请参见 "[生产就绪](actuator.html#actuator.endpoints)" 部分.

### [](#features.external-config.command-line-args)2.1. 访问命令行属性

默认情况下，`SpringApplication` 将任何命令行选项参数(即以 `--` 开头的参数，例如 `--server.port=9000` )转换为属性，并将它们添加到 Spring `Environment` 中. 如前所述，命令行属性总是优先于基于文件的属性.

如果不希望将命令行属性添加到 `Environment` 中，可以使用 `SpringApplication.setAddCommandLineProperties(false)` 禁用它们.

### [](#features.external-config.application-json)2.2. JSON 应用程序属性

环境变量和系统属性通常有限制，这意味着某些属性名不能使用. 为了帮助实现这一点，Spring Boot 允许您将属性块编码到单个 JSON 结构中.

当应用程序启动时，任何 `spring.application.json` 或 `SPRING_APPLICATION_JSON` 属性都将被解析并添加到 `Environment` 中.

例如，`SPRING_APPLICATION_JSON` 属性可以在命令行中提供一个环境变量. 比如在 UN\*X shell 中:

    $ SPRING_APPLICATION_JSON='{"my":{"name":"test"}}' java -jar myapp.jar

在此示例中,您可以在 Spring `Environment` 中使用 `my.name=test`。

同样的 JSON 也可以作为系统属性提供:

    $ java -Dspring.application.json='{"my":{"name":"test"}}' -jar myapp.jar

或者您可以使用命令行参数提供 JSON:

    $ java -jar myapp.jar --spring.application.json='{"my":{"name":"test"}}'

如果您正在部署到一个经典的应用程序服务器，您还可以使用名为 `java:comp/env/spring.application.json` 的 JNDI 变量.

尽管 JSON 中的 `null` 被添加到结果属性集中,但 `PropertySourcesPropertyResolver` 将 `null` 属性视为缺失值. 这意味着 JSON 无法使用 `null` 覆盖在属性集中具有低优先级的属性.

### [](#features.external-config.files)2.3. 外部应用程序属性

应用程序启动时，Spring Boot 将自动从以下位置查找并加载 `application.properties` 和 `application.yaml` 文件:

1.  从 classpath
    
    1.  classpath 根目录
        
    2.  classpath 上的 `/config` 包
        
    
2.  从当前目录
    
    1.  当前目录
        
    2.  当前目录下的 `config/` 子目录
        
    3.  `config/` 子目录的直接子目录
        
    

该列表按优先级排序(较低项的值覆盖较早项的值). 加载文件中的文档作为 `PropertySources` 添加到 Spring `Environment` 中.

如果您不喜欢 `application.properties` 作为配置文件名,则可以通过指定 `spring.config.name` 环境属性来切换到另一个文件名.

例如，要查找 `myproject.properties` 和 `myproject.yaml` 文件，您可以按如下方式运行应用程序：

    $ java -jar myproject.jar --spring.config.name=myproject

您还可以使用 `spring.config.location` 环境属性来显式引用一个位置 (以逗号分隔的目录位置或文件路径列表) .

以下示例展示了如何指定两个位置:

    $ java -jar myproject.jar --spring.config.location=\
        optional:classpath:/default.properties,\
        optional:classpath:/override.properties

如果 [locations are optional](#features.external-config.files.optional-prefix)，可以使用前缀 `optional:` ，并且您不介意它们是否存在.

`spring.config.name` `spring.config.location` 和 `spring.config.additional-location` 在程序启动早期就用来确定哪些文件必须加载. 它们必须定义为一个环境属性(通常是一个 OS 环境变量、一个系统属性或一个命令行参数).

如果 `spring.config.location` 包含目录 (而不是文件) ,则它们应该以 `/` 结尾。在运行时，在加载之前追加从 `spring.config.name` 生成的名称. `spring.config.location` 中指定的文件直接导入.

目录和文件的位置值也被扩展为检查 [profile-specific files](#features.external-config.files.profile-specific). 例如，如果您有一个 `classpath:myconfig.properties` 的 `spring.config.location`，您还会发现加载了相应的 `classpath:myconfig-<profile>.properties` 文件。

在大多数情况下，您添加的每个 `spring.config.location` 项都将引用单个文件或目录。 位置按照定义的顺序进行处理，后面的 locations 可以覆盖前面的 locations.

如果您有一个复杂的位置设置，并且您使用特定于配置文件的配置文件，您可能需要提供进一步的提示，以便 Spring Boot 知道应该如何对它们进行分组.

location 组是所有被视为同一级别的 location 的集合。 例如，您可能希望对所有类路径位置进行分组，然后对所有外部位置进行分组。location 组中的应使用 `;` 分隔。

有关详细信息，请参阅 “[特定 Profile 的属性文件](#features.external-config.files.profile-specific)” 部分中的示例.

当使用了 `spring.config.location` 配置自定义配置位置时,默认位置配置将被替代. 例如，如果 `spring.config.location` 配置为 `optional:classpath:/custom-config/,optional:file:./custom-config/` 时，完整位置集是:

1.  `optional:classpath:custom-config/`
    
2.  `optional:file:./custom-config/`
    

或者,当使用 `spring.config.additional-location` 配置自定义配置位置时,除了使用默认位置外,还会使用它们. 例如，如果 `spring.config.additional-location` 配置为 `optional:classpath:/custom-config/,optional:file:./custom-config/`，完整位置集是:

1.  `optional:classpath:/;optional:classpath:/config/`
    
2.  `optional:file:./;optional:file:./config/;optional:file:./config/*/`
    
3.  `optional:classpath:custom-config/`
    
4.  `optional:file:./custom-config/`
    

该搜索顺序允许您在一个配置文件中指定默认值,然后有选择地覆盖另一个配置文件中的值. 您可以在 `application.properties` (或您使用 `spring.config.name` 指定的其他文件) 中的某个默认位置为应用程序提供默认值. 之后,在运行时,这些默认值将被自定义位置中的某个文件所覆盖.

如果您使用的是环境变量而不是系统属性,大部分操作系统都不允许使用 . 分隔的键名,但您可以使用下划线来代替 (例如,使用 `SPRING_CONFIG_NAME` 而不是 `spring.config.name`) .查看 [从环境变量绑定](#features.external-config.typesafe-configuration-properties.relaxed-binding.environment-variables) 获取更多细节信息.

如果您的应用程序运行在 servlet 容器或应用服务器中,则可以使用 JNDI 属性 (`java:comp/env`) 或 servlet 上下文初始化参数来代替环境变量或系统属性.

#### [](#features.external-config.files.optional-prefix)2.3.1. Optional Locations（可选位置）

默认情况下，当指定的配置数据位置不存在时，Spring Boot 将抛出 `ConfigDataLocationNotFoundException` 并且您的应用程序将不会启动.

如果您想指定一个位置，但他有可能不存在，这时，您可以在 `spring.config.location` 和 `spring.config.additional-location` 属性中使用 `optional:` 前缀，以及 [`spring.config.import`](#features.external-config.files.importing) 声明.

例如，当 `spring.config.import` 的值为 `optional:file:./myconfig.properties` 时. 允许您的应用程序启动，即使 `myconfig.properties` 文件丢失.

如果你想忽略所有的 `ConfigDataLocationNotFoundExceptions` 而总是继续启动你的应用程序，你可以使用 `spring.config.on-not-found` 属性. 使用 `SpringApplication.setDefaultProperties(…​)` 或使用系统/环境变量将该值设置为 `ignore`.

#### [](#features.external-config.files.wildcard-locations)2.3.2. Wildcard Locations（通配符位置）

如果配置文件的位置包含最后一个路径段的 `*` ，则将其视为通配符位置. 加载配置时，通配符会扩展，以便检查子目录. 当存在多个配置属性源时,通配符位置在诸如 Kubernetes 之类的环境中特别有用.

例如,如果您有一些 Redis 配置和某些 MySQL 配置,则可能希望将这两个配置分开,同时要求这两个配置都存在于该应用程序可以绑定到的 `application.properties` 中. 这可能会导致两个单独的 `application.properties` 文件安装在不同的位置,例如 `/config/redis/application.properties` 和 `/config/mysql/application.properties`. 在这种情况下,当通配符位置为 `config/*/` 将导致两个文件都被处理.

默认情况下，Spring Boot 搜索的位置中包含 `config/*/`. 这意味着将搜索 jar 之外 `/config` 目录的所有子目录.

您可以使用 `spring.config.location` 和 `spring.config.additional-location` 属性指定通配符位置.

通配符位置必须仅包含一个 `*` 并以 `*/` 结尾 (对于目录的搜索位置) 或 `*/<filename>` (对于文件的搜索位置) .带通配符的位置根据文件名的绝对路径按字母顺序排序.

通配符位置仅适用于外部目录. 您不能在 `classpath:` 位置中使用通配符.

#### [](#features.external-config.files.profile-specific)2.3.3. 特定 Profile 的属性文件

除 `application.properties` 文件外,还可以使用以下命名约定定义特定 profile 的属性文件: `application-{profile}`. 例如，如果您的应用程序激活了一个名为 `prod` 的 profile 文件并使用 YAML 文件，那么这两个 `application.yml` 和 `application-prod.yml` 将被加载.

特定 profile 的属性文件从与标准 `application.properties` 相同的位置加载, 特定 profile 的属性文件始终覆盖非特定文件. 如果指定了多个配置文件，则应用 last-wins 策略 (优先采取最后一个) .例如，如果 由 `spring.profiles.active` 指定 `prod,live` profiles , `application-prod.properties` 中的属性值将被 `application-live.properties` 中的值覆盖

最后获胜策略适用于 [location group](#features.external-config.files.location-groups) 级别。 `spring.config.location` 为 `classpath:/cfg/,classpath:/ext/` 不会具有与 `classpath:/cfg/;classpath:/ext/` 相同的覆盖规则

例如，继续上面的 `prod,live` 示例，我们可能有以下文件:

/cfg
  application-live.properties
/ext
  application-live.properties
  application-prod.properties

当 `spring.config.location` 为 `classpath:/cfg/,classpath:/ext/` 时，我们会在所有 `/ext` 文件之前处理所有 `/cfg` 文件：:

1.  `/cfg/application-live.properties`
    
2.  `/ext/application-prod.properties`
    
3.  `/ext/application-live.properties`
    

当我们使用 `classpath:/cfg/;classpath:/ext/` 代替（使用 `;` 分隔符）时，我们在同一级别处理 `/cfg` 和 `/ext`：

1.  `/ext/application-prod.properties`
    
2.  `/cfg/application-live.properties`
    
3.  `/ext/application-live.properties`
    

Environment 有一组默认配置文件 (默认情况下为 `[default]`) ,如果未设置激活的 (active) profile,则使用这些配置文件. 换句话说,如果没有显式激活 profile,则会加载 `application-default` 中的属性.

NOTE: 属性文件只加载一次. 如果您已经直接 [imported](#features.external-config.files.importing) 了特定于配置文件的属性文件，那么它将不会被再次导入.

#### [](#features.external-config.files.importing)2.3.4. 导入其他数据

应用程序属性可以使用 `Spring.config.import` 属性导入来自其他位置的其他配置数据. 导入是在发现它们时进行处理的，并且被视为直接插入在声明导入的文档下面的附加文档.

例如，您的 ClassPath `application.properties` 文件中可能具有以下内容:

    spring:
      application:
        name: "myapp"
      config:
        import: "optional:file:./dev.properties"

这将触发当前目录中 `dev.properties` 文件的导入(如果存在这样的文件). 导入的 `dev.properties` 中的值将优先于触发导入的文件. 在上面的例子中，`dev.properties` 可以将 `spring.application.name` 重定义为不同的值.

无论声明了多少次，导入都只会被导入一次. 在 properties/yaml 文件中的单个文档中定义导入的顺序并不重要. 例如，下面两个例子产生相同的结果:

    spring:
      config:
        import: "my.properties"
    my:
      property: "value"

    my:
      property: "value"
    spring:
      config:
        import: "my.properties"

在上述两个示例中，来自 `my.properties` 文件的值将优先于触发其导入的文件.

可以在单个 `spring.config.import` key 指定多个位置. 位置将按照它们定义的顺序进行处理，稍后的导入优先.

适当时，还会考虑导入 [Profile-specific variants](#features.external-config.files.profile-specific) 。 上面的示例将导入 `my.properties` 以及任何 `my-<profile>.properties` 变体.

Spring Boot 包括可插拔 API，允许支持各种不同的位置地址. 默认情况下，您可以导入 Java 属性，yaml 和 “[使用配置树](#features.external-config.files.configtree)”.

第三方 JAR 可以提供对附加技术的支持(不需要文件是本地的). 例如，您可以想象配置数据来自外部存储，例如 Consul，Apache Zookeeper 或 Netflix Archaius.

如果要支持自己的位置，请参阅 `org.springframework.boot.context.config` 包中的 `ConfigDataLocationResolver` 和 `ConfigDataLoader` 类.

#### [](#features.external-config.files.importing-extensionless)2.3.5. 导入无扩展名文件

一些云平台不能为挂载的文件添加文件扩展名. 要导入这些无扩展文件，您需要给 Spring Boot 一个提示，以便它知道如何加载它们. 您可以通过将扩展提示放在方括号中来实现这一点.

例如，假设您有一个 `/etc/config/myconfig` 文件，希望导入为 yaml. 您可以使用以下的 `application.properties` 导入:

    spring:
      config:
        import: "file:/etc/config/myconfig[.yaml]"

#### [](#features.external-config.files.configtree)2.3.6. 使用配置树

在云平台上运行应用程序（例如 Kubernetes），您通常需要阅读平台提供的配置值. 使用环境变量来实现这类目的并不少见，但是这样做可能会有缺点，特别是在值应该保密的情况下.

作为环境变量的替代方案，许多云平台现在允许您将配置映射到安装的数据卷中. 例如，Kubernetes 可以同时卷载 [`ConfigMaps`](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#populate-a-volume-with-data-stored-in-a-configmap) 和 [`Secrets`](https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-files-from-a-pod).

有两种常见的卷挂载模式可以使用:

1.  单个文件包含一组完整的属性(通常以 YAML 的形式编写).
    
2.  多个文件被写入一个目录树，文件名成为 ‘key’，内容成为 ‘value’.
    

对于第一种情况，您可以像 [上面描述](#features.external-config.files.importing) 的那样直接使用 `spring.config.import` 导入 YAML 或 Properties 文件. 对于第二种情况，您需要使用 `configtree:` 前缀，以便 Spring Boot 知道它需要将所有文件作为属性公开.

举个例子，假设 Kubernetes 已经挂载了下面的卷:

etc/
  config/
    myapp/
      username
      password

`username` 文件的内容将是一个配置值，`password` 的内容将是一个 secret.

要导入这些属性，可以将以下内容添加到 `application.properties` 或 `application.yaml` 文件:

    spring:
      config:
        import: "optional:configtree:/etc/config/"

然后，您可以向往常一样从 `Environment` 中访问或注入 `myapp.username` 和 `myapp.password` .

配置树下的文件夹构成属性名称。在上面的示例中，要以 `username` 和 `password` 访问属性，可以将 `spring.config.import` 设置为 `optional:configtree:/etc/config/myapp`。

带有 . 符号的文件名也被正确映射。 例如，在上面的示例中，`/etc/config` 中名为 `myapp.username` 的文件将导致 `Environment` 中的 `myapp.username` 属性。

根据所期望的内容，配置树值可以绑定到字符串 `String` 和 `byte[]` 类型.

如果有多个配置树要从同一个父文件夹导入，可以使用通配符快捷方式. 任何以 `/*/` 结尾的 `configtree:` location 将导入所有直接子树作为配置树.

例如，给定以下卷:

etc/
  config/
    dbconfig/
      db/
        username
        password
    mqconfig/
      mq/
        username
        password

你可以使用 `configtree:/etc/config/*/` 作为导入位置:

    spring:
      config:
        import: "optional:configtree:/etc/config/*/"

这将会添加 `db.username`, `db.password`, `mq.username` 和 `mq.password` 属性.

使用通配符加载的目录按字母顺序排序. 如果您需要不同的顺序，那么您应该将每个位置作为单独的导入列出

配置树也可以用于 Docker secrets. 当一个 Docker 集群服务被授权访问一个 secrets 时，这个 secrets 就会被安装到容器中. 例如，如果一个 secrets 命名为 `db.password` 被挂载在 `/run/secrets/` 位置，则可以使用以下内容使 `db.password` 可用于 Spring 环境:

    spring:
      config:
        import: "optional:configtree:/run/secrets/"

#### [](#features.external-config.files.property-placeholders)2.3.7. 属性中的占位符

`application.properties` 和 `application.yml` 中的值在使用时通过现有的 `Environment` 进行过滤,因此您可以返回之前定义的值 (例如,从系统属性或环境变量) . 标准的 `${name}` 属性占位符语法可以在值的任何地方使用. 属性占位符还可以使用 `:` 指定默认值，以将默认值与属性名称分开，例如 `${name:default}`。

以下示例显示了使用带和不带默认值的占位符:

    app:
      name: "MyApp"
      description: "${app.name} is a Spring Boot application written by ${username:Unknown}"

假设 `username` 属性没有在其他地方设置，`app.description` 将为 `MyApp is a Spring Boot application written by Unknown`.

您应该始终使用规范形式（kebab-case 仅使用小写字母）引用占位符中的属性名称。 这将允许 Spring Boot 使用与 [relaxed binding](#features.external-config.typesafe-configuration-properties.relaxed-binding) `@ConfigurationProperties` 相同的逻辑。

例如，`${demo.item-price}` 将从 `application.properties` 文件中提取 `demo.item-price` 和 `demo.itemPrice` 属性，以及从系统环境中提取 `DEMO_ITEMPRICE`。 如果您改用 `${demo.itemPrice}`，则不会考虑 `demo.item-price` 和 `DEMO_ITEMPRICE`。

您还可以使用此技术创建现有 Spring Boot 属性的简短形式. 有关详细信息,请参见 _[howto.html](howto.html#howto.properties-and-configuration.short-command-line-arguments)_ .

#### [](#features.external-config.files.multi-document)2.3.8. 处理多文档文件

Spring Boot 允许您将单个物理文件拆分为多个逻辑文档，每个逻辑文件都是独立添加的. 文档按顺序处理，从上到下处理. 后面的文档可以覆盖早期定义的属性.

对于 `application.yml` 文件，使用标准 yaml 多文档语法. `---` 字符代表一个文档的结尾，并开始下一个文档.

例如，以下文件具有两个逻辑文件:

    spring:
      application:
        name: "MyApp"
    ---
    spring:
      application:
        name: "MyCloudApp"
      config:
        activate:
          on-cloud-platform: "kubernetes"

对于 `application.properties` 文件，特殊 `#---` 或 `!---` 注释用于标记文档拆分:

    spring.application.name=MyApp
    #---
    spring.application.name=MyCloudApp
    spring.config.activate.on-cloud-platform=kubernetes

属性文件分隔符必须没有任何前导空格，并且必须恰好有三个连字符. 分隔符前后的行不能是相同的注释前缀.

多文档属性文件通常与激活属性一起使用，例如 `spring.config.activate.on-profile` 。有关详细信息，[请参阅下一节](#features.external-config.files.activation-properties).

无法使用 `@PropertySource` 或 `@TestPropertySource` 注解加载多文档属性文件.

#### [](#features.external-config.files.activation-properties)2.3.9. Activation Properties（激活属性）

有时，只在满足某些条件时才激活给定的属性是有用的. 例如，您可能拥有仅在特定概要文件激活时才相关的属性.

您可以使用 `spring.config.activate.*` 有条件地激活属性文档.

以下激活属性可用:

Table 2. activation properties

Property

Note

`on-profile`

要使文档处于活动状态，必须匹配的配置文件表达式。

`on-cloud-platform`

要使文档处于活动状态，必须检测到 `CloudPlatform`.

例如，下面的命令指定第二个文档只有在 Kubernetes 上运行时是激活的，并且只有在 “prod” 或 “staging” 配置文件是激活的时候:

    myprop:
      "always-set"
    ---
    spring:
      config:
        activate:
          on-cloud-platform: "kubernetes"
          on-profile: "prod | staging"
    myotherprop: "sometimes-set"

### [](#features.external-config.encrypting)2.4. Encrypting Properties

Spring Boot 没有为加密属性值提供任何内置支持,然而,它提供了修改 Spring `Environment` 包含的值所必需的钩子. `EnvironmentPostProcessor` 接口允许您在应用程序启动之前操作 `Environment`. 有关详细信息,请参见 [howto.html](howto.html#howto.application.customize-the-environment-or-application-context).

如果您正在寻找一种可用于存储凭据和密码的安全方法, [Spring Cloud Vault](https://cloud.spring.io/spring-cloud-vault/) 项目支持在 [HashiCorp Vault](https://www.vaultproject.io/) 中存储外部化配置.

### [](#features.external-config.yaml)2.5. 使用 YAML

[YAML](https://yaml.org/) 是 JSON 的超集,是一个可用于指定层级配置数据的便捷格式. 只要在 classpath 上有 [SnakeYAML](https://github.com/snakeyaml/snakeyaml) 库,`SpringApplication` 类就会自动支持 YAML 作为属性文件 (properties) 的替代.

如果使用 `starter`,则 `spring-boot-starter` 会自动提供 SnakeYAML.

#### [](#features.external-config.yaml.mapping-to-properties)2.5.1. 使用 YAML 代替属性文件

YAML 文档需要从其分层格式转换为可与 Spring `Environment` 一起使用的平面结构. 例如，考虑以下 YAML 文档:

    environments:
      dev:
        url: "https://dev.example.com"
        name: "Developer Setup"
      prod:
        url: "https://another.example.com"
        name: "My Cool App"

为了从 `Environment` 访问这些属性，它们将被扁平化如下:

    environments.dev.url=https://dev.example.com
    environments.dev.name=Developer Setup
    environments.prod.url=https://another.example.com
    environments.prod.name=My Cool App

同样，YAML 列表也需要被展平，YAML 列表表示带有 `[index]` 下标引用的属性键. 例如以下 YAM:

    my:
     servers:
     - "dev.example.com"
     - "another.example.com"

以上示例将转成以下属性:

    my.servers[0]=dev.example.com
    my.servers[1]=another.example.com

使用 `[index]` 表示的属性可以通过 Spring Boot 的 `Binder` 类绑定到 Java `List` 或 `Set` 对象. 有关更多细节，请参阅下面的 “[类型安全的配置属性](#features.external-config.typesafe-configuration-properties)” 一节.

YAML 文件不能通过使用 `@PropertySource` 或 `@TestPropertySource` 注解加载. 因此，在你需要以这种方式加载值的情况下，你需要使用一个属性文件.

#### [](#features.external-config.yaml.directly-loading)2.5.2. 直接加载 YAML

Spring Framework 提供了两个方便的类，可用于加载 YAML 文档. `YamlPropertiesFactoryBean` 以 `Properties` 的形式加载 YAML，而 `YamlMapFactoryBean` 以 `Map` 的形式加载 YAML.

你也可以使用 `YamlPropertySourceLoader` 类，如果你想加载 YAML 作为一个 Spring `PropertySource`.

### [](#features.external-config.random-values)2.6. 配置随机值

`RandomValuePropertySource` 对于注入随机值(例如，注入 secrets 或测试用例)很有用. 它可以产生 integers, longs, uuids, 或 strings，如下例所示:

    my:
      secret: "${random.value}"
      number: "${random.int}"
      bignumber: "${random.long}"
      uuid: "${random.uuid}"
      number-less-than-ten: "${random.int(10)}"
      number-in-range: "${random.int[1024,65536]}"

`random.int*` 语法是 `OPEN value (,max) CLOSE`，其中 `OPEN,CLOSE` 为任意字符，`value,max` 为整数. 如果提供了 `max`，那么 `value` 是最小值，`max` 是最大值(不包括).

### [](#features.external-config.system-environment)2.7. 配置系统环境属性

Spring Boot 可以为环境属性设置前缀。 如果系统环境由具有不同配置要求的多个 Spring Boot 应用程序共享，这将很有用。 系统环境属性的前缀可以直接在 `SpringApplication` 上设置。

例如，如果您将前缀设置为 `input`，那么在系统环境中，`remote.timeout` 等属性也会被解析为 `input.remote.timeout`.

### [](#features.external-config.typesafe-configuration-properties)2.8. 类型安全的配置属性

使用 `@Value("${property}")` 注解来注入配置属性有时会很麻烦,特别是如果您使用了多个属性或者您的数据本质上是分层结构. Spring Boot 提供了另一种使用属性的方法,该方法使用强类型的 bean 来管理和验证应用程序的配置,如下所示:

另请参见 [`@Value` 和类型安全的配置属性之间的区别](#features.external-config.typesafe-configuration-properties.vs-value-annotation).

#### [](#features.external-config.typesafe-configuration-properties.java-bean-binding)2.8.1. JavaBean 属性绑定

可以绑定一个声明标准 JavaBean 属性的 bean,如以下示例所示:

Java

Kotlin

    @ConfigurationProperties("my.service")
    public class MyProperties {
    
        private boolean enabled;
    
        private InetAddress remoteAddress;
    
        private final Security security = new Security();
    
        // getters / setters...
    
        public static class Security {
    
            private String username;
    
            private String password;
    
            private List<String> roles = new ArrayList<>(Collections.singleton("USER"));
    
            // getters / setters...
    
        }
    
    }
    

前面的 POJO 定义了以下属性:

*   `my.service.enabled`, 默认值为 `false`.
    
*   `my.service.remote-address`, 可以从 `String` 强制转换的类型.
    
*   `my.service.security.username`, 内嵌一个 `security` 对象,其名称由属性名称决定. 特别是,返回类型根本没有使用,可能是 `SecurityProperties`.
    
*   `my.service.security.password`.
    
*   `my.service.security.roles`, `String` 集合. 默认为 `USER`.
    

Spring Boot 自动配置大量使用 `@ConfigurationProperties` 来轻松配置自动配置的 bean. 与自动配置类相似,Spring Boot 中可用的 `@ConfigurationProperties` 类仅供内部使用. 通过属性文件,YAML 文件,环境变量等配置的映射到该类的属性是 public API, 但类本身的访问器（getter/setter）并不意味着可以直接使用。.

依赖于默认的空构造函，getter 和 setter 通常是必需的,因为绑定是通过标准的 Java Bean 属性描述符来完成,就像在 Spring MVC 中一样. 以下情况可以省略 setter:

*   Map,只需要初始化,就需要一个 getter 但不一定需要 setter,因为它们可以被 binder 修改.
    
*   集合和数组可以通过一个索引 (通常使用 YAML) 或使用单个逗号分隔值 (属性) 进行访问. 最后一种情况必须使用 setter. 我们建议始终为此类型添加 setter. 如果初始化集合,请确保它是可变的 (如上例所示) .
    
*   如果初始化嵌套的 POJO 属性 (如前面示例中的 `Security` 字段) ,则不需要 setter. 如果您希望 binder 使用其默认构造函数动态创建实例,则需要一个 setter.
    

有些人可能会使用 Project Lombok 来自动生成 getter 和 setter. 请确保 Lombok 不为此类型生成任何特定构造函数,因为容器会自动使用它来实例化对象.

最后,考虑到标准 Java Bean 属性,不支持对静态属性的绑定.

#### [](#features.external-config.typesafe-configuration-properties.constructor-binding)2.8.2. 构造函数绑定

上一节中的示例可以以不变的方式重写,如下例所示:

Java

Kotlin

    @ConfigurationProperties("my.service")
    public class MyProperties {
    
        // fields...
    
        public MyProperties(boolean enabled, InetAddress remoteAddress, Security security) {
            this.enabled = enabled;
            this.remoteAddress = remoteAddress;
            this.security = security;
        }
    
        // getters...
    
        public static class Security {
    
            // fields...
    
            public Security(String username, String password, @DefaultValue("USER") List<String> roles) {
                this.username = username;
                this.password = password;
                this.roles = roles;
            }
    
            // getters...
    
        }
    
    }
    

在此设置中，只有一个参数构造函数，这意味着应使用构造函数绑定。 这意味着绑定器将期望找到带有您希望绑定的参数的构造函数。 如果您的类有多个构造函数，则可以使用 `@ConstructorBinding` 注解来指定用于构造函数绑定的构造函数。 若要选择退出具有一个参数化构造函数的类的构造函数绑定，必须使用 `@Autowired` 注解构造函数。 如果您使用的是 Java 16 或更高版本，则可以将构造函数绑定与 records 一起使用。在这种情况下，除非你的 record 有多个构造函数，否则没有必要使用 `@ConstructorBinding`。

构造函数绑定类的嵌套成员 (例如上例中的 `Security` ) 也将通过其构造函数进行绑定.

可以在构造函数参数和 record 组件上使用 `@DefaultValue` 指定默认值，转换服务将 `String` 值强制为缺少属性的目标类型.

默认情况下,如果没有属性绑定到 `Security`,则 `MyProperties` 实例的 `security` 为 `null`. 如果您希望即使没有绑定任何属性都返回 `Security` 的非空实例,则可以使用空的 `@DefaultValue` 注解来这样做（使用 Kotlin 时，需要将 `Security` 的 `username` 和 `password` 参数声明为可为空，因为它们没有默认值）:

Java

Kotlin

    public MyProperties(boolean enabled, InetAddress remoteAddress, @DefaultValue Security security) {
        this.enabled = enabled;
        this.remoteAddress = remoteAddress;
        this.security = security;
    }
    

要使用构造函数绑定,必须使用 `@EnableConfigurationProperties` 或配置属性扫描来启用该类. 您不能对通过常规 Spring 机制创建的 bean 使用构造函数绑定 (例如 `@Component` bean,通过 `@Bean` 方法创建的 bean 或使用 `@Import` 加载的 bean)

要在原生镜像中使用构造函数绑定，必须使用 `-parameters` 编译该类。 如果您使用 Spring Boot 的 Gradle 插件，或者如果您使用 Maven 和 `spring-boot-starter-parent`，这将自动发生。

不建议将 `java.util.Optional` 与 `@ConfigurationProperties` 一起使用,因为它主要是用作返回类型. 因此,它不太适合配置属性注入. 为了与其他类型的属性保持一致,如果确实声明了 `Optional` 属性并且没有任何值,则将绑定 `null` 而不是空的 `Optional`.

#### [](#features.external-config.typesafe-configuration-properties.enabling-annotated-types)2.8.3. 启用 `@ConfigurationProperties` 注解的类型

Spring Boot 提供了绑定 `@ConfigurationProperties` 类型并将其注册为 Bean 的基础架构. 您可以逐类启用配置属性,也可以启用与组件扫描类似的方式进行配置属性扫描.

有时,用 `@ConfigurationProperties` 注解的类可能不适用于扫描,例如,如果您正在开发自己的自动配置,或者想要有条件地启用它们. 在这些情况下,请使用 `@EnableConfigurationProperties` 注解 指定要处理的类型列表. 可以在任何 `@Configuration` 类上完成此操作,如以下示例所示:

Java

Kotlin

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(SomeProperties.class)
    public class MyConfiguration {
    
    }
    

要使用配置属性扫描,请将 `@ConfigurationPropertiesScan` 注解 添加到您的应用程序. 通常,它被添加到使用 `@SpringBootApplication` 注解的主应用程序类中,但可以将其添加到任何 `@Configuration` 类中. 默认情况下,将从声明注解的类的包中进行扫描. 如果要定义要扫描的特定程序包,可以按照以下示例所示进行操作:

Java

Kotlin

    @SpringBootApplication
    @ConfigurationPropertiesScan({ "com.example.app", "com.example.another" })
    public class MyApplication {
    
    }
    

当以配置属性或者通过 `@EnableConfigurationProperties` 注册 `@ConfigurationProperties` bean 时,bean 具有一个固定格式的名称: `<prefix>-<fqn>`,其中 `<prefix>` 是 `@ConfigurationProperties` 注解中指定的环境 key 前缀,`<fqn>` 是 bean 的完全限定类名. 如果注解未提供任何前缀,则仅使用 bean 的完全限定类名.

上面示例中的 bean 名称为 `com.example.app-com.example.app.SomeProperties`.

我们也建议 `@ConfigurationProperties` 只处理环境 (environment) ,特别是不要从上下文中注入其他 bean. 对于极端情况,可以使用 setter 注入或框架提供的任何 `*Aware` 接口 (例如,需要访问 `Environment` 的 `EnvironmentAware`) . 如果仍然想使用构造函数注入其他 bean,则必须使用 `@Component` 注解配置属性 bean,并使用基于 JavaBean 的属性绑定.

#### [](#features.external-config.typesafe-configuration-properties.using-annotated-types)2.8.4. 使用 @ConfigurationProperties 注解类型

这种配置样式与 `SpringApplication` 外部 YAML 配置特别有效,如以下示例所示:

    my:
      service:
        remote-address: 192.168.1.1
        security:
          username: "admin"
          roles:
          - "USER"
          - "ADMIN"

要使用 `@ConfigurationProperties` bean,您可以使用与其他 bean 相同的方式注入它们,如下所示:

Java

Kotlin

    @Service
    public class MyService {
    
        private final MyProperties properties;
    
        public MyService(MyProperties properties) {
            this.properties = properties;
        }
    
        public void openConnection() {
            Server server = new Server(this.properties.getRemoteAddress());
            server.start();
            // ...
        }
    
        // ...
    
    }
    

使用 `@ConfigurationProperties` 还可以生成元数据文件,IDE 可以通过这些文件来为您自己的 key 提供自动完成功能. 有关详细信息,请参阅 [附录 B: 配置元数据](configuration-metadata.html#appendix.configuration-metadata) .

#### [](#features.external-config.typesafe-configuration-properties.third-party-configuration)2.8.5. 第三方配置

`@ConfigurationProperties` 除了可以使用来注解类之外,您还可以在公共的 `@Bean` 方法上使用. 当您想要将属性绑定到您掌控之外的第三方组件时,这样做特别有用.

要使用 `Environment` 属性配置 bean,请将 `@ConfigurationProperties` 添加到 bean 注册上,如下所示:

Java

Kotlin

    @Configuration(proxyBeanMethods = false)
    public class ThirdPartyConfiguration {
    
        @Bean
        @ConfigurationProperties(prefix = "another")
        public AnotherComponent anotherComponent() {
            return new AnotherComponent();
        }
    
    }
    

使用 `another` 前缀定义的所有属性都使用与前面的 `SomeProperties` 示例类似的方式映射到 `AnotherComponent` bean.

#### [](#features.external-config.typesafe-configuration-properties.relaxed-binding)2.8.6. 宽松绑定

Spring Boot 使用一些宽松的规则将 `Environment` 属性绑定到 `@ConfigurationProperties` bean,因此 `Environment` 属性名不需要和 bean 属性名精确匹配. 常见的示例包括使用了 `-` 符号分割的环境属性 (例如,`context-path` 绑定到 `contextPath`) 和大写环境属性 (例如,`PORT` 绑定到 `port`) .

如下 `@ConfigurationProperties` 类:

Java

Kotlin

    @ConfigurationProperties(prefix = "my.main-project.person")
    public class MyPersonProperties {
    
        private String firstName;
    
        public String getFirstName() {
            return this.firstName;
        }
    
        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }
    
    }
    

在上述示例中,同样可以使用以下属性名称:

Table 3. 宽松绑定

属性

描述

`my.main-project.person.first-name`

Kebab 风格 (短横线命名) ,建议在 `.properties` 和 `.yml` 文件中使用.

`my.main-project.person.firstName`

标准驼峰式风格.

`my.main-project.person.first_name`

下划线表示法,`.properties` 和 `.yaml` 文件中的另外一种格式..

`MY_MAINPROJECT_PERSON_FIRSTNAME`

大写风格,当使用系统环境变量时推荐使用该风格.

注解的 `prefix` 值必须是 kebab (短横线命名)风格 (小写并用 `-` 分隔,例如 `my.main-project.person`) .

Table 4. 每种属性源 (property source) 的宽松绑定规则

属性源

简单类型

列表集合类型

Properties 文件

驼峰式、短横线式或下划线式

标准列表语法使用 `[ ]` 或逗号分隔值

YAML 文件

驼峰式、短横线式或者下划线式

标准 YAML 列表语法或者逗号分隔值

环境变量

大写并且以下划线作为定界符,(查看 [从环境变量绑定](#features.external-config.typesafe-configuration-properties.relaxed-binding.environment-variables)).

数字值两边使用下划线连接 (查看 [从环境变量绑定](#features.external-config.typesafe-configuration-properties.relaxed-binding.environment-variables))

系统属性

驼峰式、短横线式或者下划线式

标准列表语法使用 `[ ]` 或逗号分隔值

我们建议,属性尽可能以小写的短横线格式存储,比如 `my.person.first-name=Rod`.

##### [](#features.external-config.typesafe-configuration-properties.relaxed-binding.maps)绑定 Maps

当绑定到 `Map` 属性时,如果 `key` 包含除小写字母数字字符或 `-` 以外的任何内容,则需要使用括号表示法来保留原始值. 如果 key 没有使用 `[]` 包裹,则里面的任何非字母数字字符或 `-` 或 `.` 的字符都将被删除.

例如,将以下属性绑定到一个 `Map<String,String>`:

Properties

Yaml

    my.map.[/key1]=value1
    my.map.[/key2]=value2
    my.map./key3=value3

对于 YAML 文件,方括号需要用引号引起来,以便正确解析 keys.

上面的属性将绑定到一个 `Map` 上,其中 `/key1`,`/key2` 和 `key3` 作为 map 的 key. `key3` 中的斜杠会被删除， 因为它没有被方括号包围.

当绑定标量值时，其中带有 `.` 的 key 不需要被 `[]` 包围。标量值都包含枚举类型，`java.lang` 包中除 `Object` 类型之外的所有类型。 将 `a.b=c` 绑定到 `Map<String, String>` 中时，将在 key 中保留 `.` 并返回带有 `{"a.b"="c"}` 的 Map。 对于任何其他类型，如果您的 `key` 包含 `.`，则需要使用括号表示法。 例如，将 `a.b=c` 绑定到 `Map<String, Object>` 将返回一个带有 `{"a"={"b"="c"}}` entry 的 Map，而 `[a.b]=c` 将返回一个带有 `{"a.b"="c"}` entry 的 Map。

##### [](#features.external-config.typesafe-configuration-properties.relaxed-binding.environment-variables)从环境变量绑定

大多数操作系统在对于环境变量有严格规范. 例如,Linux shell 变量只能包含字母(`a` to `z` 或 `A` to `Z`),数字(`0` to `9`) 或下划线字符(`_`). 按照约定,Unix shell 变量也可以用大写字母命名.

Spring Boot 的宽松绑定规则尽可能设计成与这些命名限制兼容.

要将规范形式的属性名称转换为环境变量名称,可以遵循以下规则:

*   使用下划线 (`_`) 替代 (`.`).
    
*   删除所有 (`-`).
    
*   转换为大写.
    

例如,配置属性 `spring.main.log-startup-info` 是一个名为 `SPRING_MAIN_LOGSTARTUPINFO` 的环境变量.

当绑定到对象列表时,也可以使用环境变量. 要绑定到 `List`,元素编号应在变量名称中用下划线括起来.

例如,配置属性 `my.service[0].other` 使用名为 `MY_SERVICE_0_OTHER` 的环境变量.

#### [](#features.external-config.typesafe-configuration-properties.merging-complex-types)2.8.7. 合并复杂类型

当列表集合 (list) 在多个地方配置时,整个列表集合将被替换.

例如,假设 `MyPojo` 对象带有 `name` 和 `description` 属性并且默认为 `null`. 以下示例中,`MyProperties` 暴露了一个 `MyPojo` 对象列表集合:

Java

Kotlin

    @ConfigurationProperties("my")
    public class MyProperties {
    
        private final List<MyPojo> list = new ArrayList<>();
    
        public List<MyPojo> getList() {
            return this.list;
        }
    
    }
    

配置可以如下:

    my:
      list:
      - name: "my name"
        description: "my description"
    ---
    spring:
      config:
        activate:
          on-profile: "dev"
    my:
      list:
      - name: "my another name"

如果 `dev` 配置文件未激活,则 `MyProperties.list` 只包含一个 `MyPojo` ,如之前所述. 但是,如果激活了 `dev` 配置文件,列表集合仍然只包含一个条目 (name 属性值为 `my another name`,description 为 `null`) . 此配置不会向列表集合中添加第二个 `MyPojo` 实例,也不会合并条目.

在多个配置文件中指定一个 `List` 时,最高优先级 (并且只有一个) 的列表集合将被使用. 可做如下配置:

    my:
      list:
      - name: "my name"
        description: "my description"
      - name: "another name"
        description: "another description"
    ---
    spring:
      config:
        activate:
          on-profile: "dev"
    my:
      list:
      - name: "my another name"

在前面示例中,如果 `dev` 配置文件处于 active 状态,则 `MyProperties.list` 包含一个 `MyPojo` 条目 (name 为 `my another name`,description 为 `null`) . 对于 YAML 而言,逗号分隔的列表和 YAML 列表同样会完全覆盖列表集合的内容.

对于 `Map` 属性,您可以绑定来自多个源中提取的属性值. 但是,对于多个源中的相同属性,则使用高优先级最高的属性. 以下示例从 `MyProperties` 暴露了一个 `Map<String, MyPojo>`:

Java

Kotlin

    @ConfigurationProperties("my")
    public class MyProperties {
    
        private final Map<String, MyPojo> map = new LinkedHashMap<>();
    
        public Map<String, MyPojo> getMap() {
            return this.map;
        }
    
    }
    

考虑以下配置:

    my:
      map:
        key1:
          name: "my name 1"
          description: "my description 1"
    ---
    spring:
      config:
        activate:
          on-profile: "dev"
    my:
      map:
        key1:
          name: "dev name 1"
        key2:
          name: "dev name 2"
          description: "dev description 2"

如果 `dev` 配置文件未激活,则 `MyProperties.map` 只包含一个带 `key1` 的 entry (name 为 `my name 1`,description 为 `my description 1`) . 如果激活了 `dev` 配置文件,则 map 将包含两个 entry, key 分别为 `key1` (name 为 `dev name 1` 和 description 为 `my description 1`) 和 `key2` (name 为 `dev name 2` 和 description 为 `dev description 2`) .

前面的合并规则适用于所有不同属性源的属性,而不仅仅是文件.

#### [](#features.external-config.typesafe-configuration-properties.conversion)2.8.8. 属性转换

当外部应用程序属性 (application properties) 绑定到 `@ConfigurationProperties` bean 时,Spring Boot 会尝试将其属性强制转换为正确的类型. 如果需要自定义类型转换,可以提供 `ConversionService` bean (名为 `conversionService` 的 bean) 或自定义属性编辑器 (通过 `CustomEditorConfigurer` bean) 或自定义 `Converters` (带有注解为 `@ConfigurationPropertiesBinding` 的 bean 定义) .

由于该 bean 在应用程序生命周期早期就会使用 ,因此请限制 `ConversionService` 您使用的依赖. 因为有可能在创建时可能无法完全初始化所需的依赖. 如果配置 key 为非强制需要,您可能希望重命名自定义的 `ConversionService`,并仅依赖于使用 `@ConfigurationPropertiesBinding` 限定的自定义转换器.

##### [](#features.external-config.typesafe-configuration-properties.conversion.durations)转换 Durations

Spring Boot 支持持续时间 (duration) 表达. 如果您暴露一个 `java.time.Duration` 属性,则可以在应用程序属性中使用以下格式:

*   常规 `long` 表示 (除非指定 `@DurationUnit`,否则使用毫秒作为默认单位)
    
*   [used by `java.time.Duration`](https://docs.oracle.com/javase/17/docs/api/java/time/Duration.html#parse-java.lang.CharSequence-) 使用的标准 ISO-8601 格式
    
*   一种更易读的格式,值和单位在一起 (例如 `10s` 表示 10 秒)
    

思考以下示例:

Java

Kotlin

    @ConfigurationProperties("my")
    public class MyProperties {
    
        @DurationUnit(ChronoUnit.SECONDS)
        private Duration sessionTimeout = Duration.ofSeconds(30);
    
        private Duration readTimeout = Duration.ofMillis(1000);
    
        // getters / setters...
    
    }
    

指定一个会话超时时间为 `30` 秒,使用 `30`、`PT30S` 和 `30s` 等形式都是可以的. 读取超时时间设置为 `500ms`,可以采用以下任何一种形式: `500`、`PT0.5S` 和 `500ms`.

您也可以使用任何支持的单位来标识:

*   `ns` 纳秒
    
*   `us` 微秒
    
*   `ms` 毫秒
    
*   `s` 秒
    
*   `m` 分
    
*   `h` 小时
    
*   `d` 天
    

默认单位是毫秒,可以使用 `@DurationUnit` 配合上面的单位示例重写. 请注意,只有使用 getter 和 setter 的 JavaBean 样式的属性绑定才支持 `@DurationUnit`.构造函数绑定不支持.

如果您更喜欢使用构造函数绑定，则可以公开相同的属性，如以下示例所示:

Java

Kotlin

    @ConfigurationProperties("my")
    public class MyProperties {
    
        // fields...
    
        public MyProperties(@DurationUnit(ChronoUnit.SECONDS) @DefaultValue("30s") Duration sessionTimeout,
                @DefaultValue("1000ms") Duration readTimeout) {
            this.sessionTimeout = sessionTimeout;
            this.readTimeout = readTimeout;
        }
    
        // getters...
    
    }
    

如果您要升级 `Long` 属性，如果它不是毫秒，请确保使用 `@DurationUnit` 定义单位。 这样做提供了一个透明的升级路径，同时支持更丰富的格式.

##### [](#features.external-config.typesafe-configuration-properties.conversion.periods)转换 periods

除了持续时间,Spring Boot 还可以使用 `java.time.Period` 类型. 可以在应用程序属性中使用以下格式:

*   常规的 `int` 表示形式 (使用天作为默认单位,除非已指定 `@PeriodUnit`)
    
*   [`java.time.Period`](https://docs.oracle.com/javase/17/docs/api/java/time/Period.html#parse-java.lang.CharSequence-) 使用的标准 ISO-8601 格式。
    
*   将值和单位对耦合在一起 (e.g. `1y3d` 表示 1 年零 3 天)
    

简单格式支持以下单位:

*   `y` 年
    
*   `m` 月
    
*   `w` 周
    
*   `d` 天
    

`java.time.Period` 类型实际上从不存储星期数,这是一个快捷方式,表示 “7 days”.

##### [](#features.external-config.typesafe-configuration-properties.conversion.data-sizes)转换 Data Sizes

Spring Framework 有一个 `DataSize` 值类型,允许以字节表示大小. 如果暴露一个 `DataSize` 属性,则可以在应用程序属性中使用以下格式:

*   常规的 `long` 表示 (使用字节作为默认单位,除非指定了 `@DataSizeUnit`)
    
*   更具有可读性的格式,值和单位在一起 (例如 `10MB` 表示 10 兆字节)
    

请思考以下示例:

Java

Kotlin

    @ConfigurationProperties("my")
    public class MyProperties {
    
        @DataSizeUnit(DataUnit.MEGABYTES)
        private DataSize bufferSize = DataSize.ofMegabytes(2);
    
        private DataSize sizeThreshold = DataSize.ofBytes(512);
    
        // getters/setters...
    
    }
    

要指定 `10` 兆字节的缓冲大小,使用 `10` 和 `10MB` 是等效的. `256` 字节的大小可以指定为 `256` 或 `256B`.

您也可以使用任何支持的单位:

*   `B` 字节
    
*   `KB` 千字节
    
*   `MB` 兆字节
    
*   `GB` 千兆字节
    
*   `TB` 兆兆字节
    

默认单位是字节,可以使用 `@DataSizeUnit` 配合上面的单位重写.

如果您更喜欢使用构造函数绑定，则可以公开相同的属性，如以下示例所示:

Java

Kotlin

    @ConfigurationProperties("my")
    public class MyProperties {
    
        // fields...
    
        public MyProperties(@DataSizeUnit(DataUnit.MEGABYTES) @DefaultValue("2MB") DataSize bufferSize,
                @DefaultValue("512B") DataSize sizeThreshold) {
            this.bufferSize = bufferSize;
            this.sizeThreshold = sizeThreshold;
        }
    
        // getters...
    
    }
    

如果您要升级 `Long` 属性，如果它不是字节，请确保定义单位（使用 `@DataSizeUnit`）。 这样做提供了一个透明的升级路径，同时支持更丰富的格式。

#### [](#features.external-config.typesafe-configuration-properties.validation)2.8.9. @ConfigurationProperties 验证

只要使用了 Spring 的 `@Validated` 注解,Spring Boot 就会尝试验证 `@ConfigurationProperties` 类. 您可以直接在配置类上使用 JSR-303 `javax.validation` 约束注解. 为此,请确保 JSR-303 实现在 classpath 上,然后将约束注解添加到字段上,如下所示:

Java

Kotlin

    @ConfigurationProperties("my.service")
    @Validated
    public class MyProperties {
    
        @NotNull
        private InetAddress remoteAddress;
    
        // getters/setters...
    
    }
    

您还可以通过使用 `@Validated` 注解创建配置属性的 `@Bean` 方法来触发验证.

虽然绑定时也会验证嵌套属性,但最好的做法还是将关联字段注解上 `@Valid`. 这可确保即使未找到嵌套属性也会触发验证. 以下示例基于前面的 `MyProperties` 示例:

Java

Kotlin

    @ConfigurationProperties("my.service")
    @Validated
    public class MyProperties {
    
        @NotNull
        private InetAddress remoteAddress;
    
        @Valid
        private final Security security = new Security();
    
        // getters/setters...
    
        public static class Security {
    
            @NotEmpty
            private String username;
    
            // getters/setters...
    
        }
    
    }
    

您还可以通过创建一个名为 `configurationPropertiesValidator` 的 bean 定义来添加自定义 Spring `Validator`. 应该将 `@Bean` 方法声明为 `static`. 配置属性验证器在应用程序生命周期的早期创建,将 `@Bean` 方法声明为 `static` 可以无需实例化 `@Configuration` 类来创建 bean. 这样做可以避免早期实例化可能导致的意外问题. 这里有一个属性验证示例,讲解了如何设置.

`spring-boot-actuator` 模块包括一个暴露所有 `@ConfigurationProperties` bean 的端点. 可将 Web 浏览器指向 `/actuator/configprops` 或使用等效的 JMX 端点. 有关详细信息,请参阅 "[生产就绪功能](actuator.html#actuator.endpoints)" 部分.

#### [](#features.external-config.typesafe-configuration-properties.vs-value-annotation)2.8.10. @ConfigurationProperties vs. @Value

`@Value` 注解是核心容器功能,它不提供与类型安全配置属性相同的功能. 下表总结了 `@ConfigurationProperties` 和 `@Value` 支持的功能:

功能

`@ConfigurationProperties`

`@Value`

[宽松绑定](#features.external-config.typesafe-configuration-properties.relaxed-binding)

Yes

有限制 (查看 [note below](#features.external-config.typesafe-configuration-properties.vs-value-annotation.note))

[元数据支持](configuration-metadata.html#appendix.configuration-metadata)

Yes

No

`SpEL` 表达式

No

Yes

如果您确实想使用 `@Value`,我们建议您以规范形式引用属性名称( kebab-case 仅使用小写字母),这与 Spring Boot `@ConfigurationProperties` [宽松绑定](#features.external-config.typesafe-configuration-properties.relaxed-binding)使用相同的逻辑.

例如, `@Value("${demo.item-price}")` 将从 `application.properties` 文件以及 `DEMO_ITEMPRICE` 环境变量中获取 `demo.item-price` 和 `demo.itemPrice` 形式. 如果您使用的是 `@Value("${demo.itemPrice}")` ,则不会考虑 `demo.item-price` 和 `DEMO_ITEMPRICE` 环境变量.

如果您要为自己的组件定义一组配置 key,我们建议您将它们分组到使用 `@ConfigurationProperties` 注解的 POJO 中.这样做将为您提供结构化,类型安全的对象,您可以将其注入到自己的 bean 中.

解析这些文件并填充环境时,不会处理来自 [应用程序属性文件](#features.external-config.files) 的 SpEL 表达式. 但是,可以在 `@Value` 中编写 SpEL 表达式. 如果 [应用程序属性文件](#features.external-config.files) 中的属性值是 SpEL 表达式,则在通过 `@Value` 进行使用时将对其进行评估.

[](#features.profiles)3\. Profiles
---------------------------------------------------------------------------------------------------------

Spring Profile 提供了一种能够将应用程序的部分配置隔离，并使其仅在特定环境中可用的方法. 可以使用 `@Profile` 来注解任何 `@Component` 或 `@Configuration` 或 `@ConfigurationProperties` 以指定何时加载它,如下所示:

Java

Kotlin

    @Configuration(proxyBeanMethods = false)
    @Profile("production")
    public class ProductionConfiguration {
    
        // ...
    
    }
    

如果 `@ConfigurationProperties` Bean 是通过 `@EnableConfigurationProperties` 而非自动扫描注册的,则需要在 `@EnableConfigurationProperties` 注解的 `@Configuration` 类上指定 `@Profile` 注解. 在扫描 `@ConfigurationProperties` 的情况下,可以在 `@ConfigurationProperties` 类本身上指定 `@Profile`.

您可以使用 `spring.profiles.active` `Environment` 属性指定哪些配置文件处于激活状态. 您可以使用本章前面介绍的任何方法指定属性. 例如,您可以将其包含在 `application.properties` 中,如下所示:

    spring:
      profiles:
        active: "dev,hsqldb"

您还可以在命令行上使用以下开关指定它: `--spring.profiles.active=dev,hsqldb`.

如果没有配置文件处于活动状态，则启用默认配置文件。 默认配置文件的名称是 `default`，可以使用 `spring.profiles.default` `Environment` 属性对其进行调整，如下例所示:

    spring:
      profiles:
        default: "none"

`spring.profiles.active` 和 `spring.profiles.default` 只能在非配置文件特定的文档中使用。 这意味着它们不能在 [profile specific files](#features.external-config.files.profile-specific) 或 [documents activated](#features.external-config.files.activation-properties) 中包含 `spring.config.activate.on-profile`。

例如,第二个文档配置无效:

    # this document is valid
    spring:
      profiles:
        active: "prod"
    ---
    # this document is invalid
    spring:
      config:
        activate:
          on-profile: "prod"
      profiles:
        active: "metrics"

### [](#features.profiles.adding-active-profiles)3.1. 添加激活 Profile

`spring.profiles.active` 属性遵循与其他属性相同的排序规则: 应用优先级最高的 `PropertySource`. 这意味着您可以在 `application.properties` 中指定激活配置文件,然后使用命令行切换替换它们.

有时,将特定 profile 的属性添加到激活配置文件而不是替换它们,这种方式也是很有用的.`spring.profiles.include` 属性可用于在 `spring.profiles.active` 属性激活的配置文件之上添加激活的配置文件。

`SpringApplication` 入口还有一个 Java API,用于设置其他 profile，请参阅 [SpringApplication](https://docs.spring.io/spring-boot/docs/3.0.0/api/org/springframework/boot/SpringApplication.html) 的 `setAdditionalProfiles()` 方法.

例如，当运行具有以下属性的应用程序时，即使使用 --spring.profiles.active 运行，也会激活 common 和 local 配置文件：

    spring:
      profiles:
        include:
          - "common"
          - "local"

与 `spring.profiles.active` 一样, `spring.profiles.include` 只能在非配置文件特定的文档中使用. 这意味着它们不能在 [profile specific files](#features.external-config.files.profile-specific) 或 [documents activated](#features.external-config.files.activation-properties) 包含 `spring.config.activate.on-profile`.

如果给定的 Profile 是激活的，还可以使用 Profile 组(将在 [下一节中](#features.profiles.groups) 进行描述)添加激活的配置文件:

### [](#features.profiles.groups)3.2. Profile 组

有时，您在应用程序中定义和使用的 Profile 粒度太细，使用起来很麻烦. 例如，您可以使用 `proddb` 和 `prodmq` Profile 独立地启用数据库和消息传递特性.

为了帮助实现这一点，Spring Boot 允许您定义 Profile 组. Profile 组允许您为相关的 Profile 组定义逻辑名称.

例如，我们可以创建一个由 `proddb` 和 `prodmq` 配置文件组成的 `production` 组.

    spring:
      profiles:
        group:
          production:
          - "proddb"
          - "prodmq"

我们的应用程序现在可以使用 `--spring.profiles.active=production` 启动. 一次性激活 `production`, `proddb` 和 `prodmq` 配置文件.

### [](#features.profiles.programmatically-setting-profiles)3.3. 以编程方式设置 Profiles

您可以在应用程序运行之前通过调用 `SpringApplication.setAdditionalProfiles(…)` 以编程方式设置 active 配置文件. 也可以使用 Spring 的 `ConfigurableEnvironment` 接口激活 profile.

### [](#features.profiles.profile-specific-configuration-files)3.4. 特定 Profile 的配置文件

特定 profile 的 `application.properties` (或 `application.yml`) 和通过 `@ConfigurationProperties` 引用的文件被当做文件并加载. 有关详细信息,请参见 "[特定 Profile 的属性文件](#features.external-config.files.profile-specific)".

[](#features.logging)4\. 日志记录
----------------------------------------------------------------------------------------------------

Spring Boot 使用 [Commons Logging](https://commons.apache.org/logging) 记录所有内部日志,但保留底层日志实现. 其为 [Java Util Logging](https://docs.oracle.com/javase/17/docs/api/java/util/logging/package-summary.html), [Log4J2](https://logging.apache.org/log4j/2.x/) 和 [Logback](https://logback.qos.ch/) 提供了默认配置. 每种日志记录器都预先配置为使用控制台输出,并且还提供可选的文件输出.

默认情况下,如果您使用了 `Starter`,则使用 Logback 进行日志记录.还包括合适的 Logback 路由,以确保在使用 Java Util Logging、Commons Logging、Log4J 或 SLF4J 的依赖库都能正常工作.

Java 有很多日志框架可供使用. 如果以上列表让您感到困惑,请不要担心. 通常,您不需要更改日志依赖,并且 Spring Boot 提供的默认配置可以保证日志正常工作.

将应用程序部署到 Servlet 容器或应用程序服务器时,通过 Java Util Logging API 执行的日志记录不会路由到应用程序的日志中. 这样可以防止容器或其他已部署到容器中的应用程序执行的日志记录出现在应用程序的日志中.

### [](#features.logging.log-format)4.1. 日志格式

Spring Boot 默认日志输出类似于以下示例:

2019-03-05 10:57:51.112  INFO 45469 --- \[           main\] org.apache.catalina.core.StandardEngine  : Starting Servlet Engine: Apache Tomcat/7.0.52
2019-03-05 10:57:51.253  INFO 45469 --- \[ost-startStop-1\] o.a.c.c.C.\[Tomcat\].\[localhost\].\[/\]       : Initializing Spring embedded WebApplicationContext
2019-03-05 10:57:51.253  INFO 45469 --- \[ost-startStop-1\] o.s.web.context.ContextLoader            : Root WebApplicationContext: initialization completed in 1358 ms
2019-03-05 10:57:51.698  INFO 45469 --- \[ost-startStop-1\] o.s.b.c.e.ServletRegistrationBean        : Mapping servlet: 'dispatcherServlet' to \[/\]
2019-03-05 10:57:51.702  INFO 45469 --- \[ost-startStop-1\] o.s.b.c.embedded.FilterRegistrationBean  : Mapping filter: 'hiddenHttpMethodFilter' to: \[/\*\]

输出以下项:

*   日期和时间: 毫秒精度,易于排序.
    
*   日志级别: `ERROR`、`WARN`、`INFO`、`DEBUG` 或 `TRACE`.
    
*   进程 ID.
    
*   一个 `---` 分隔符,用于区分实际日志内容的开始.
    
*   线程名称: 在方括号中 (可能会截断控制台输出) .
    
*   日志记录器名称: 这通常是源类名称 (通常为缩写) .
    
*   日志内容.
    

Logback 没有 `FATAL` 级别. 该级别映射到 `ERROR`.

### [](#features.logging.console-output)4.2. 控制台输出

默认日志配置会在写入时将消息回显到控制台. 默认情况下,会记录 `ERROR`、`WARN` 和 `INFO` 级别的日志. 您还可以通过使用 `--debug` 标志启动应用程序来启用调试模式.

    $ java -jar myapp.jar --debug

您还可以在 `application.properties` 中指定 `debug=true`.

启用调试模式后,核心日志记录器 (内嵌容器、Hibernate 和 Spring Boot) 将被配置为输出更多日志信息. 启用调试模式不会将应用程序配置为使用 `DEBUG` 级别记录所有日志内容.

或者,您可以通过使用 `--trace` 标志 (或在 `application.properties` 中的设置 `trace=true`) 启动应用程序来启用跟踪模式. 这样做可以为选择的核心日志记录器 (内嵌容器、Hibernate 模式生成和整个 Spring 组合) 启用日志追踪.

#### [](#features.logging.console-output.color-coded)4.2.1. 着色输出

如果您的终端支持 ANSI,则可以使用颜色输出来提高可读性. 您可以将 `spring.output.ansi.enabled` 设置为 [受支持的值](https://docs.spring.io/spring-boot/docs/3.0.0/api/org/springframework/boot/ansi/AnsiOutput.Enabled.html) 以覆盖自动检测:

    %clr(%5p)

下表描述日志级别与颜色的映射关系:

Level

Color

`FATAL`

Red

`ERROR`

Red

`WARN`

Yellow

`INFO`

Green

`DEBUG`

Green

`TRACE`

Green

或者,您可以通过将其作为转换选项指定应使用的颜色或样式. 例如,要将文本变为黄色,请使用以下设置:

    %clr(%d{yyyy-MM-dd'T'HH:mm:ss.SSSXXX}){yellow}

支持以下颜色和样式:

*   `blue`
    
*   `cyan`
    
*   `faint`
    
*   `green`
    
*   `magenta`
    
*   `red`
    
*   `yellow`
    

### [](#features.logging.file-output)4.3. 文件输出

默认情况下,Spring Boot 仅记录到控制台,不会写入日志文件. 想除了控制台输出之外还要写入日志文件,则需要设置 `logging.file.name` 或 `logging.file.path` 属性 (例如,在 `application.properties` 中) .

下表展示了如何与 `logging.*` 属性一起使用:

Table 5. Logging 属性

configprop:logging.file.name\[\]

configprop:logging.file.path\[\]

Example

Description

_(none)_

_(none)_

仅在控制台输出

指定文件

_(none)_

`my.log`

写入指定的日志文件. 名称可以是绝对位置或相对于当前目录.

_(none)_

指定目录

`/var/log`

将 `spring.log` 写入指定的目录. 名称可以是绝对位置或相对于当前目录.

日志文件在达到 `10MB` 时会轮转,并且与控制台输出一样,默认情况下会记录 `ERROR`、`WARN` 和 `INFO` 级别的内容.

日日志属性独立于实际的日志底层. 因此,spring Boot 不管理特定的配置 key (例如 Logback 的 `logback.configurationFile`) .

### [](#features.logging.file-rotation)4.4. File Rotation

如果您正在使用 Logback，则可以使用 `application.properties` 或 `application.yaml` 设置 log rotation. 对于所有其他日志系统，您需要自己直接配置 rotation 设置(例如，如果您使用 Log4J2，那么您可以添加一个 `log4j.xml` 或 `log4j2-spring.xml` 文件).

支持以下 rotation 策略属性:

Name

Description

configprop:logging.logback.rollingpolicy.file-name-pattern\[\]

The filename pattern used to create log archives.

configprop:logging.logback.rollingpolicy.clean-history-on-start\[\]

If log archive cleanup should occur when the application starts.

configprop:logging.logback.rollingpolicy.max-file-size\[\]

The maximum size of log file before it is archived.

configprop:logging.logback.rollingpolicy.total-size-cap\[\]

The maximum amount of size log archives can take before being deleted.

configprop:logging.logback.rollingpolicy.max-history\[\]

The maximum number of archive log files to keep (defaults to 7).

### [](#features.logging.log-levels)4.5. 日志等级

所有受支持的日志记录系统都可以使用 `logging.level.<logger-name>=<level>` 来设置 Spring `Environment` 中的记录器等级 (例如,在 `application.properties` 中) . 其中 level 是 `TRACE`、`DEBUG`、`INFO`、`WARN`、`ERROR`、`FATAL` 和 `OFF` 其中之一. 可以使用 `logging.level.root` 配置 `root` 记录器.

以下示例展示了 `application.properties` 中默认的日志记录设置:

Properties

Yaml

    logging.level.root=warn
    logging.level.org.springframework.web=debug
    logging.level.org.hibernate=error

也可以使用环境变量设置日志记录级别. 例如, `LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_WEB=DEBUG` 会将 `org.springframework.web` 设置为 `DEBUG`.

以上方法仅适用于程序包级别的日志记录. 由于宽松的绑定总是将环境变量转换为小写,因此无法以这种方式为单个类配置日志记录. 如果需要为类配置日志记录,则可以使用 [`SPRING_APPLICATION_JSON`](#features.external-config.application-json) 变量.

### [](#features.logging.log-groups)4.6. 日志组

将相关记录器组合在一起以便可以同时配置,这通常很有用. 例如,您可以更改所有 Tomcat 相关记录器的日志记录级别,但您无法轻松记住顶层的包名.

为了解决这个问题,Spring Boot 允许您在 Spring `Environment` 中定义日志记录组. 例如,以下通过将 “tomcat” 组添加到 `application.properties` 来定义 tomcat 组:

    logging:
      group:
        tomcat: "org.apache.catalina,org.apache.coyote,org.apache.tomcat"

定义后,您可以使用一行配置来更改组中所有记录器的级别:

    logging:
      level:
        tomcat: "trace"

Spring Boot 包含以下预定义的日志记录组,可以直接使用:

名称

日志记录器

web

`org.springframework.core.codec`, `org.springframework.http`, `org.springframework.web`, `org.springframework.boot.actuate.endpoint.web`, `org.springframework.boot.web.servlet.ServletContextInitializerBeans`

sql

`org.springframework.jdbc.core`, `org.hibernate.SQL`, `org.jooq.tools.LoggerListener`

### [](#features.logging.shutdown-hook)4.7. 使用日志 Shutdown 钩子

为了在您的应用程序终止时释放日志记录资源，提供了一个 shutdown hook（勾子），该勾子将在 JVM 退出时触发日志系统清理。 除非您的应用程序部署为 war 文件，否则此 shutdown 勾子会自动注册。 如果您的应用程序具有复杂的上下文层次结构，则 shutdown 勾子可能无法满足您的需求。 如果没有，请禁用 shutdown 勾子 并调查底层日志记录系统直接提供的选项。 例如，Logback 提供 [context selectors](https://logback.qos.ch/manual/loggingSeparation.html)，它允许在自己的上下文中创建每个 Logger。

您可以使用 `logging.register-shutdown-hook` 属性来禁用 shutdown 勾子。将其设置为 `false` 将禁用注册。 您可以在 `application.properties` 或 `application.yaml` 文件中设置属性：

对于在自己的 JVM 中部署的简单 “jar” 应用程序， 可以使用 `logging.register-shutdown-hook` 属性. 将 `logging.register-shutdown-hook` 设置为 `true` 将注册一个关闭钩子， 当 JVM 退出时， 该钩子将触发日志系统清理.

您可以在 `application.properties` 或 `application.yaml` 文件中设置属性:

    logging:
      register-shutdown-hook: false

### [](#features.logging.custom-log-configuration)4.8. 自定义日志配置

可以通过在 classpath 中引入适合的库来激活各种日志记录系统,并且可以通过在 classpath 的根目录中或在以下 Spring Environment 属性指定的位置提供合适的配置文件来进一步自定义: `logging.config`.

您可以使用 `org.springframework.boot.logging.LoggingSystem` 系统属性强制 Spring Boot 使用特定的日志记录系统. 该值应该是一个实现了 `LoggingSystem` 的类的完全限定类名. 您还可以使用 `none` 值完全禁用 Spring Boot 的日志记录配置.

由于日志记录在创建 `ApplicationContext` 之前初始化,因此无法在 Spring `@Configuration` 文件中控制来自 `@PropertySources` 的日志记录. 更改日志记录系统或完全禁用它的唯一方法是通过系统属性设置.

根据您的日志记录系统,将加载以下文件:

日志记录系统

文件

Logback

`logback-spring.xml`, `logback-spring.groovy`, `logback.xml`, 或者 `logback.groovy`

Log4j2

`log4j2-spring.xml` 或者 `log4j2.xml`

JDK (Java Util Logging)

`logging.properties`

如果可能,我们建议您使用 `-spring` 的形式来配置日志记录 (比如 `logback-spring.xml` 而不是 `logback.xml`) . 如果使用标准的配置位置,Spring 无法完全控制日志初始化.

Java Util Logging 存在已知的类加载问题,这些问题在以 'executable jar' 运行时会触发. 如果可能的话,我们建议您在使用可执行 jar 方式运行时避免使用它. .

为了进行自定义,部分其他属性会从 Spring `Environment` 传输到 `System` 属性,如下表所述:

Spring Environment

系统属性

说明

`logging.exception-conversion-word`

`LOG_EXCEPTION_CONVERSION_WORD`

记录异常时使用的转换字.

`logging.file.name`

`LOG_FILE`

如果已定义,则在默认日志配置中使用它.

`logging.file.path`

`LOG_PATH`

如果已定义,则在默认日志配置中使用它.

`logging.pattern.console`

`CONSOLE_LOG_PATTERN`

要在控制台上使用的日志模式 (stdout) .

`logging.pattern.dateformat`

`LOG_DATEFORMAT_PATTERN`

日志日期格式的 Appender 模式. (仅支持默认的 Logback 设置. )

configprop:logging.charset.console\[\]

`CONSOLE_LOG_CHARSET`

The charset to use for console logging.

`logging.pattern.file`

`FILE_LOG_PATTERN`

要在文件中使用的日志模式 (如果启用了 `LOG_FILE`) .

configprop:logging.charset.file\[\]

`FILE_LOG_CHARSET`

The charset to use for file logging (if `LOG_FILE` is enabled).

`logging.pattern.level`

`LOG_LEVEL_PATTERN`

渲染日志级别时使用的格式 (默认值为 `%5p`) .

`PID`

`PID`

当前进程 ID (如果可能,则在未定义为 OS 环境变量时发现) .

如果您使用的是 Logback，以下属性也会被转移:

Spring Environment

System Property

Comments

configprop:logging.logback.rollingpolicy.file-name-pattern\[\]

`LOGBACK_ROLLINGPOLICY_FILE_NAME_PATTERN`

Pattern for rolled-over log file names (default `${LOG_FILE}.%d{yyyy-MM-dd}.%i.gz`).

configprop:logging.logback.rollingpolicy.clean-history-on-start\[\]

`LOGBACK_ROLLINGPOLICY_CLEAN_HISTORY_ON_START`

Whether to clean the archive log files on startup.

configprop:logging.logback.rollingpolicy.max-file-size\[\]

`LOGBACK_ROLLINGPOLICY_MAX_FILE_SIZE`

Maximum log file size.

configprop:logging.logback.rollingpolicy.total-size-cap\[\]

`LOGBACK_ROLLINGPOLICY_TOTAL_SIZE_CAP`

Total size of log backups to be kept.

configprop:logging.logback.rollingpolicy.max-history\[\]

`LOGBACK_ROLLINGPOLICY_MAX_HISTORY`

Maximum number of archive log files to keep.

所有受支持的日志记录系统在解析其配置文件时都可以参考系统属性. 有关示例,请参阅 `spring-boot.jar` 中的默认配置:

*   [Logback](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot/src/main/resources/org/springframework/boot/logging/logback/defaults.xml)
    
*   [Log4j 2](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot/src/main/resources/org/springframework/boot/logging/log4j2/log4j2.xml)
    
*   [Java Util logging](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot/src/main/resources/org/springframework/boot/logging/java/logging-file.properties)
    

如果要在日志记录属性中使用占位符,则应使用 [Spring Boot 的语法](#features.external-config.files.property-placeholders),而不是使用底层框架的语法. 值得注意的是,如果使用 Logback,则应使用 `:` 作为属性名称与其默认值之间的分隔符,而不是使用 `:-`.

您可以通过仅覆盖 `LOG_LEVEL_PATTERN` (或带 Logback 的 `logging.pattern.level`) 将 MDC 和其他特别的内容添加到日志行. 例如,如果使用 `logging.pattern.level=user:%X{user} %5p`,则默认日志格式包含 user MDC 项 (如果存在) ,如下所示:

2019-08-30 12:30:04.031 user:someone INFO 22174 --- \[  nio-8080-exec-0\] demo.Controller
Handling authenticated request

### [](#features.logging.logback-extensions)4.9. Logback 扩展

Spring Boot 包含许多 Logback 扩展,可用于进行高级配置. 您可以在 `logback-spring.xml` 配置文件中使用这些扩展.

由于标准的 `logback.xml` 配置文件加载过早,因此无法在其中使用扩展. 您需要使用 `logback-spring.xml` 或定义 `logging.config` 属性.

扩展不能与 Logback 的 [配置扫描](https://logback.qos.ch/manual/configuration.html#autoScan) 一起使用. 如果尝试这样做,更改配置文件会导致发生类似以下错误日志: .

ERROR in ch.qos.logback.core.joran.spi.Interpreter@4:71 - no applicable action for \[springProperty\], current ElementPath is \[\[configuration\]\[springProperty\]\]
ERROR in ch.qos.logback.core.joran.spi.Interpreter@4:71 - no applicable action for \[springProfile\], current ElementPath is \[\[configuration\]\[springProfile\]\]

#### [](#features.logging.logback-extensions.profile-specific)4.9.1. 特定 Profile 配置

`<springProfile>` 标签允许您根据激活的 Spring profile 选择性地包含或排除配置部分. 在 `<configuration>` 元素中的任何位置都支持配置 profile. 使用 `name` 属性指定哪个 profile 接受配置. `<springProfile>` 标记可以包含简单的 proifle 名称 (例如 `staging`) 或 profile 表达式. profile 表达式允许表达更复杂的 profile 逻辑, 例如 `production & (eu-central | eu-west)`. 有关详细信息,请查阅 [Spring Framework 参考指南](/blog/learning/spring/core/ioc#beans-definition-profiles-java) . 以下清单展示了三个示例 profile:

    <springProfile name="staging">
        <!-- configuration to be enabled when the "staging" profile is active -->
    </springProfile>
    
    <springProfile name="dev | staging">
        <!-- configuration to be enabled when the "dev" or "staging" profiles are active -->
    </springProfile>
    
    <springProfile name="!production">
        <!-- configuration to be enabled when the "production" profile is not active -->
    </springProfile>

#### [](#features.logging.logback-extensions.environment-properties)4.9.2. 环境属性

使用 `<springProperty>` 标签可以让您暴露 Spring 环境 (`Environment`) 中的属性,以便在 Logback 中使用. 如果在 Logback 配置中访问来自 `application.properties` 文件的值,这样做很有用. 标签的工作方式与 Logback 的标准 `<property>` 标签类似. 但是,您可以指定属性 (来自 `Environment`) 的 `source`,而不是指定直接的 `value`. 如果需要将属性存储在 `local` 作用域以外的其他位置,则可以使用 `scope` 属性. 如果需要回退值 (如果未在 `Environment` 中设置该属性) ,则可以使用 `defaultValue` 属性. 以下示例展示了如何暴露属性以便在 Logback 中使用:

    <springProperty scope="context" name="fluentHost" source="myapp.fluentd.host"
            defaultValue="localhost"/>
    <appender name="FLUENT" class="ch.qos.logback.more.appenders.DataFluentAppender">
        <remoteHost>${fluentHost}</remoteHost>
        ...
    </appender>

必须以 kebab 风格 (短横线小写风格) 指定 `source` (例如 `my.property-name`) . 但可以使用宽松规则将属性添加到 `Environment` 中.

### [](#features.logging.log4j2-extensions)4.10. Log4j2 扩展

Spring Boot 包括许多对 Log4j2 的扩展，可以进行高级配置。您可以在任何 `log4j2-spring.xml` 配置文件中使用这些扩展。

由于标准 `log4j2.xml` 配置文件加载得太早，因此不能在其中使用扩展。您需要使用 `log4j2-spring.xml` 或定义 `logging.config` 属性。

这些扩展取代了 [Spring Boot 提供的对](https://logging.apache.org/log4j/2.x/log4j-spring-boot/index.html) Log4J 的支持。你应该确保在你的构建中不包含 `org.apache.logging.log4j:log4j-spring-boot` 模块。

#### [](#features.logging.log4j2-extensions.profile-specific)4.10.1. Profile-specific Configuration

`<SpringProfile>` 标签允许您根据激活的 Spring profile 选择性地包含或排除部分配置。Profile 部分在 `<Configuration>` 元素中的任何位置都受支持。 使用 `name` 属性指定哪个配置文件接受配置。 `<SpringProfile>` 标签可以包含配置文件名称（例如 `staging`）或配置文件表达式。 配置文件表达式允许表达更复杂的配置文件逻辑，例如 `production & (eu-central | eu-west)`。 查看 [Spring Framework 参考指南](/blog/learning/spring/core/ioc#beans-definition-profiles-java) 以获取更多详细信息。 以下清单显示了三个示例配置文件：

    <SpringProfile name="staging">
        <!-- configuration to be enabled when the "staging" profile is active -->
    </SpringProfile>
    
    <SpringProfile name="dev | staging">
        <!-- configuration to be enabled when the "dev" or "staging" profiles are active -->
    </SpringProfile>
    
    <SpringProfile name="!production">
        <!-- configuration to be enabled when the "production" profile is not active -->
    </SpringProfile>

#### [](#features.logging.log4j2-extensions.environment-properties-lookup)4.10.2. Environment Properties Lookup

如果你想在 Log4j2 配置中引用 Spring ``Environment`中的属性，你可以使用前缀 `spring:`` [lookups](https://logging.apache.org/log4j/2.x/manual/lookups.html)。 如果要访问 Log4j2 配置中的 `application.properties` 文件中的值，这样做会很有用。

下面的示例演示如何设置一个名为 `applicationName` 的 Log4j2 属性，该属性从 Spring `Environment` 中读取 `spring.application.name`：

    <Properties>
        <Property name="applicationName">${spring:spring.application.name}</property>
    </Properties>

查找的 key 应该以 kebab case 命名 (such as `my.property-name`).

#### [](#features.logging.log4j2-extensions.environment-property-source)4.10.3. Log4j2 系统属性

Log4j2 支持许多可用于配置各种项目的 [System Properties](https://logging.apache.org/log4j/2.x/manual/configuration.html#SystemProperties) 。 例如， `log4j2.skipJansi` 系统属性可用于配置 `ConsoleAppender` 是否将尝试在 Windows 上使用 [Jansi](https://github.com/fusesource/jansi) 输出流。

在 Log4j2 初始化后加载的所有系统属性都可以从 Spring 的 `Environment` 中获得。 例如，您可以将 `log4j2.skipJansi=false` 添加到 `application.properties` 文件中，以使 `ConsoleAppender` 在 Windows 上使用 Jansi。

仅当系统属性和操作系统环境变量不包含正在加载的值时，才会考虑 Spring `Environment`

在早期 Log4j2 初始化期间加载的系统属性不能引用 Spring 的 `Environment`。 例如，在 Spring 环境可用之前，将使用 Log4j2 用于允许选择默认 Log4j2 实现的属性。

[](#features.internationalization)5\. 国际化
----------------------------------------------------------------------------------------------------------------

Spring Boot 支持本地化消息,因此您的应用程序可以迎合不同语言首选项的用户. 默认情况下,Spring Boot 在类路径的根目录下查找 `messages` 资源包的存在.

当已配置资源束的默认属性文件可用时 (即默认情况下为 `messages.properties`) ,将应用自动配置. 如果您的资源包仅包含特定于语言的属性文件,则需要添加默认文件. 如果找不到与任何配置的基本名称匹配的属性文件,将没有自动配置的 `MessageSource`.

可以使用 `spring.messages` 命名空间配置资源包的基本名称以及其他几个属性,如以下示例所示:

    spring:
      messages:
        basename: "messages,config.i18n.messages"
        fallback-to-system-locale: false

`spring.messages.basename` 支持以逗号分隔的位置列表,可以是包限定符,也可以是从类路径根目录解析的资源.

有关更多支持的选项,请参见 [`MessageSourceProperties`](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/context/MessageSourceProperties.java)

[](#features.json)6\. JSON
-------------------------------------------------------------------------------------------------

Spring Boot 为三个 JSON 映射库提供了内置集成:

*   Gson
    
*   Jackson
    
*   JSON-B
    

Jackson 是首选和默认的库.

### [](#features.json.jackson)6.1. Jackson

Spring Boot 提供了 Jackson 的自动配置,Jackson 是 `spring-boot-starter-json` 的一部分. 当 Jackson 在 classpath 上时,会自动配置 `ObjectMapper` bean. Spring Boot 提供了几个配置属性来 [自定义 `ObjectMapper` 的配置](howto.html#howto.spring-mvc.customize-jackson-objectmapper).

#### [](#features.json.jackson.custom-serializers-and-deserializers)6.1.1. 自定义序列化和反序列化器

如果使用 Jackson 序列化和反序列化 JSON 数据，则可能需要编写自己的 `JsonSerializer` 和 `JsonDeserializer` 类。 自定义序列化器通常是 [通过模块向 Jackson 注册](https://github.com/FasterXML/jackson-docs/wiki/JacksonHowToCustomSerializers)，但 Spring Boot 提供了一个替代的 `@JsonComponent` 注解， 使得直接注册 Spring Beans 变得更加容易。

您可以直接在 `JsonSerializer`, `JsonDeserializer` 或 `KeyDeserializer` 实现上使用 `@JsonComponent` 注解。 还可以在包含序列化器/反序列化器作为内部类的类上使用它，如以下示例所示：

Java

Kotlin

    @JsonComponent
    public class MyJsonComponent {
    
        public static class Serializer extends JsonSerializer<MyObject> {
    
            @Override
            public void serialize(MyObject value, JsonGenerator jgen, SerializerProvider serializers) throws IOException {
                jgen.writeStartObject();
                jgen.writeStringField("name", value.getName());
                jgen.writeNumberField("age", value.getAge());
                jgen.writeEndObject();
            }
    
        }
    
        public static class Deserializer extends JsonDeserializer<MyObject> {
    
            @Override
            public MyObject deserialize(JsonParser jsonParser, DeserializationContext ctxt) throws IOException {
                ObjectCodec codec = jsonParser.getCodec();
                JsonNode tree = codec.readTree(jsonParser);
                String name = tree.get("name").textValue();
                int age = tree.get("age").intValue();
                return new MyObject(name, age);
            }
    
        }
    
    }
    

`ApplicationContext` 中的所有 `@JsonComponent` bean 都会自动向 Jackson 注册。 由于 `@JsonComponent` 是用 `@Component` 进行元注解的，因此通常的组件扫描规则适用。

Spring Boot 还提供了 [`JsonObjectSerializer`](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot/src/main/java/org/springframework/boot/jackson/JsonObjectSerializer.java) 和 [`JsonObjectDeserializer`](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot/src/main/java/org/springframework/boot/jackson/JsonObjectDeserializer.java) 基类， 它们在序列化对象时提供了标准 Jackson 版本的有用替代方案。 有关详细信息，请参阅 Javadoc 中的https://docs.spring.io/spring-boot/docs/3.0.0/api/org/springframework/boot/jackson/JsonObjectSerializer.html\[`JsonObjectSerializer`\] 和 [`JsonObjectDeserializer`](https://docs.spring.io/spring-boot/docs/3.0.0/api/org/springframework/boot/jackson/JsonObjectDeserializer.html)。

上面的示例可以重写为使用 `JsonObjectSerializer`/`JsonObjectDeserializer` ，如下所示：

Java

Kotlin

    @JsonComponent
    public class MyJsonComponent {
    
        public static class Serializer extends JsonObjectSerializer<MyObject> {
    
            @Override
            protected void serializeObject(MyObject value, JsonGenerator jgen, SerializerProvider provider)
                    throws IOException {
                jgen.writeStringField("name", value.getName());
                jgen.writeNumberField("age", value.getAge());
            }
    
        }
    
        public static class Deserializer extends JsonObjectDeserializer<MyObject> {
    
            @Override
            protected MyObject deserializeObject(JsonParser jsonParser, DeserializationContext context, ObjectCodec codec,
                    JsonNode tree) throws IOException {
                String name = nullSafeValue(tree.get("name"), String.class);
                int age = nullSafeValue(tree.get("age"), Integer.class);
                return new MyObject(name, age);
            }
    
        }
    
    }
    

#### [](#features.json.jackson.mixins)6.1.2. Mixins

Jackson 支持混合，可用于将其他注解混合到已在目标类上声明的注解中。 Spring Boot 的 Jackson 自动配置将扫描应用程序的包以查找带有 `@JsonMixin` 注解的类，并将它们注册到自动配置的 `ObjectMapper`。 注册由 Spring Boot 的 `JsonMixinModule` 执行。

### [](#features.json.gson)6.2. Gson

Spring Boot 提供 Gson 的自动配置. 当 `Gson` 在 classpath 上时,会自动配置 Gson bean. Spring Boot 提供了几个 `spring.gson.*` 配置属性来自定义配置. 为了获得更多控制,可以使用一个或多个 `GsonBuilderCustomizer` bean.

### [](#features.json.json-b)6.3. JSON-B

Spring Boot 提供了 JSON-B 的自动配置. 当 JSON-B API 和实现在 classpath 上时,将自动配置 `Jsonb` bean. 首选的 JSON-B 实现是 Apache Johnzon,它提供了依赖管理.

[](#features.task-execution-and-scheduling)7\. 任务执行与调度
-----------------------------------------------------------------------------------------------------------------------------

在上下文中没有 `Executor` bean 的情况下,Spring Boot 会自动配置一个有合理默认值的 `ThreadPoolTaskExecutor`,它可以自动与异步任务执行 (`@EnableAsync`) 和 Spring MVC 异步请求处理相关联.

如果您在上下文中定义了自定义 `Executor`,则常规任务执行 (即 `@EnableAsync`) 将透明地使用它,但不会配置 Spring MVC 支持,因为它需要 `AsyncTaskExecutor` 实现 (名为 `applicationTaskExecutor`) . 根据您的目标安排,您可以将 `Executor` 更改为 `ThreadPoolTaskExecutor`,或者定义 `Executor` 的 `ThreadPoolTaskExecutor` 和 `AsyncConfigurer` 来包装自定义的 `Executor`.

您可以使用自动配置的 `TaskExecutorBuilder` 来轻松创建实例,以复制默认的自动配置.

线程池使用 8 个核心线程,可根据负载情况增加和减少. 可以使用 `spring.task.execution` 命名空间对这些默认设置进行微调,如下所示:

    spring:
      task:
        execution:
          pool:
            max-size: 16
            queue-capacity: 100
            keep-alive: "10s"

这会将线程池更改为使用有界队列,在队列满 (100 个任务) 时,线程池将增加到最多 16 个线程. 当线程在闲置10 秒 (而不是默认的 60 秒) 时回收线程,池的收缩更为明显.

如果需要与调度任务执行 (`@EnableScheduling`) 相关联,可以自动配置一个 `ThreadPoolTaskScheduler`. 默认情况下,线程池使用一个线程,可以使用 `spring.task.scheduling` 命名空间对这些设置进行微调.

    spring:
      task:
        scheduling:
          thread-name-prefix: "scheduling-"
          pool:
            size: 2

如果需要创建自定义 executor 或 scheduler ,则在上下文中可以使用 `TaskExecutorBuilder` bean 和 `TaskSchedulerBuilder` bean.

[](#features.testing)8\. 测试
--------------------------------------------------------------------------------------------------

Spring Boot 提供了许多工具类和注解,可以在测试应用程序时提供帮助. 主要由两个模块提供: `spring-boot-test` 包含核心项,`spring-boot-test-autoconfigure` 支持测试的自动配置.

大多数开发人员都使用 `spring-boot-starter-test` “Starter”,它会导入 Spring Boot 测试模块以及 JUnit Jupiter, AssertJ, Hamcrest 和许多其他有用的库.

如果您有使用 JUnit 4 的测试，可以使用 JUnit 5 的 vintage engine 来运行它们。要使用 vintage engine，添加一个依赖 `junit-vintage-engine`，如下所示:

    <dependency>
        <groupId>org.junit.vintage</groupId>
        <artifactId>junit-vintage-engine</artifactId>
        <scope>test</scope>
        <exclusions>
            <exclusion>
                <groupId>org.hamcrest</groupId>
                <artifactId>hamcrest-core</artifactId>
            </exclusion>
        </exclusions>
    </dependency>

`hamcrest-core` 被排除在外，因为 `spring-boot-starter-test` 默认支持 `org.hamcrest:hamcrest` 。

### [](#features.testing.test-scope-dependencies)8.1. 测试依赖

`spring-boot-starter-test` “Starter” (在 `test` `scope`) 包含以下的库:

*   [JUnit 5](https://junit.org/junit5/): Java 应用程序单元测试的标准。
    
*   [Spring 测试](/blog/learning/spring/core/testing#integration-testing) & Spring Boot 测试: 对 Spring Boot 应用程序的实用程序和集成测试支持.
    
*   [AssertJ](https://assertj.github.io/doc/): 流式的断言库.
    
*   [Hamcrest](https://github.com/hamcrest/JavaHamcrest): 匹配对象库 (也称为约束或断言) .
    
*   [Mockito](https://site.mockito.org/): 一个 Java 模拟框架.
    
*   [JSONassert](https://github.com/skyscreamer/JSONassert): JSON 的断言库.
    
*   [JsonPath](https://github.com/jayway/JsonPath): JSON 的 XPath.
    

通常,我们发现这些通用库在编写测试时很有用. 如果这些库不满足您的需求,则可以添加自己的其他测试依赖.

### [](#features.testing.spring-applications)8.2. 测试 Spring 应用程序

依赖注入的主要优点之一是,它应该使您的代码更易于进行单元测试. 您可以不使用 Spring， 使用 `new` 运算符实例化对象. 您还可以使用 _mock objects_ 而不是实际的依赖.

通常,您可能不仅仅需要单元测试，也需要集成测试 (使用 Spring `ApplicationContext`) . 能够进行集成测试而无需部署应用程序或连接到其他基础结构是很有用的.

Spring 框架包括用于此类集成测试的专用测试模块. 您可以直接声明 `org.springframework:spring-test` 依赖,也可以使用 `spring-boot-starter-test` “Starter” 将其传递.

如果您以前没有使用过 `spring-test` 模块,则应先阅读 [Spring Framework 参考文档的相关部分](/blog/learning/spring/core/testing#testing) .

### [](#features.testing.spring-boot-applications)8.3. 测试 Spring Boot 应用程序

Spring Boot 应用程序是 Spring `ApplicationContext`, 因此除了对普通 Spring 上下文进行常规测试以外,无需执行任何其他特殊操作即可对其进行测试.

默认情况下,仅当您使用 `SpringApplication` 创建 Spring Boot 的外部属性,日志记录和其他功能时,才将它们安装在上下文中.

Spring Boot 提供了 `@SpringBootTest` 注解,当您需要 Spring Boot 功能时,可以将其用作标准 `spring-test` `@ContextConfiguration` 注解的替代方法. [注解通过 `SpringApplication` 在测试中创建 `ApplicationContext` 来使用](#features.testing.spring-boot-applications.detecting-configuration). 除了 `@SpringBootTest` 之外,还提供了许多其他注解来测试应用程序的 [特定的部分](#features.testing.spring-boot-applications.autoconfigured-tests).

如果您使用的是 JUnit 4,请不要忘记也将 `@RunWith(SpringRunner.class)` 添加到测试中,否则注解将被忽略. 如果您使用的是 JUnit 5,则无需将等效的 `@ExtendWith(SpringExtension.class)` 添加为 `@SpringBootTest`,而其他 `@…​Test` 注解已经在其中进行了注解.

默认情况下,`@SpringBootTest` 将不会启动服务器. 您可以使用 `@SpringBootTest` 的 `webEnvironment` 属性来进一步完善测试的运行方式:

*   `MOCK`(默认) : 加载 Web ApplicationContext 并提供模拟 Web 环境. 使用此注解时,不会启动嵌入式服务器. 如果您的类路径上没有 Web 环境,则此模式将透明地退回到创建常规的非 Web `ApplicationContext`. 它可以与 [`@AutoConfigureMockMvc` 或 `@AutoConfigureWebTestClient`](#features.testing.spring-boot-applications.with-mock-environment) 结合使用,以对 Web 应用程序进行基于 Mock 的测试.
    
*   `RANDOM_PORT`: 加载 `WebServerApplicationContext` 并提供真实的 Web 环境. 在随机的端口启动并监听嵌入式服务器.
    
*   `DEFINED_PORT`: 加载 `WebServerApplicationContext` 并提供真实的 Web 环境. 在定义的端口(来自 `application.properties`) 或 `8080` 端口启动并监听嵌入式服务器
    
*   `NONE`: 使用 `SpringApplication` 加载 `ApplicationContext`,但不提供任何 Web 环境 (模拟或其他方式) .
    

如果您测试的是 `@Transactional`,则默认情况下它将在每个测试方法的末尾回滚事务. 但是,由于将这种安排与 `RANDOM_PORT` 或 `DEFINED_PORT` 一起使用隐式提供了一个真实的 Servlet 环境,因此 HTTP 客户端和服务器在单独的线程中运行,因此在单独的事务中运行. 在这种情况下,服务器上启动的任何事务都不会回滚.

如果您的应用程序将不同的端口用于管理服务器,则 `@SpringBootTest` 的 `webEnvironment=WebEnvironment.RANDOM_PORT` 也将在单独的随机端口上启动管理服务器.

#### [](#features.testing.spring-boot-applications.detecting-web-app-type)8.3.1. 检测 Web 应用程序类型

如果 Spring MVC 可用,则配置基于常规 MVC 的应用程序上下文. 如果您只有 Spring WebFlux,我们将检测到该情况并配置基于 WebFlux 的应用程序上下文.

如果两者都存在,则 Spring MVC 优先. 如果要在这种情况下测试响应式 Web 应用程序,则必须设置 `spring.main.web-application-type` 属性:

Java

Kotlin

    @SpringBootTest(properties = "spring.main.web-application-type=reactive")
    class MyWebFluxTests {
    
        // ...
    
    }
    

#### [](#features.testing.spring-boot-applications.detecting-configuration)8.3.2. 检测测试配置

如果您熟悉 Spring Test Framework,则可能习惯于使用 `@ContextConfiguration(classes=…​)` 以指定要加载哪个Spring `@Configuration`. 另外,您可能经常在测试中使用嵌套的 `@Configuration` 类.

在测试 Spring Boot 应用程序时,通常不需要这样做. 只要您没有明确定义,Spring Boot 的 `@*Test` 注解就会自动搜索您的主要配置.

搜索算法从包含测试的程序包开始工作,直到找到带有 `@SpringBootApplication` 或 `@SpringBootConfiguration` 注解的类. 只要您以合理的方式对 [代码进行结构化](using.html#using.structuring-your-code),通常就可以找到您的主要配置.

如果您使用 [测试注解来测试应用程序的特定部分](#features.testing.spring-boot-applications.autoconfigured-tests) , 则应避免在 [应用程序的 main 方法](#features.testing.spring-boot-applications.user-configuration-and-slicing) 中添加特定于特定区域的配置设置.

`@SpringBootApplication` 的基础组件扫描配置定义了排除过滤器,这些过滤器用于确保切片按预期工作. 如果在 `@SpringBootApplication` 注解的类上使用显式的 `@ComponentScan` 指令,请注意这些过滤器将被禁用. 如果使用切片,则应再次定义它们.

如果要自定义主要配置类,则可以使用嵌套的 `@TestConfiguration` 类. 与嵌套的 `@Configuration` 类不同，它将用于代替应用程序的主要配置 , 嵌套的 `@TestConfiguration` 类用于应用程序的主要配置之外。

Spring 的测试框架在测试之间缓存应用程序上下文. 因此,只要您的测试共享相同的配置 (无论如何发现) ,加载上下文的潜在耗时过程就只会发生一次.

#### [](#features.testing.spring-boot-applications.using-main)8.3.3. 使用测试配置主方法

通常， `@SpringBootTest` 发现的测试配置将是您的主要 `@SpringBootApplication`。 在大多数的应用程序中，此配置类还将包括用于启动应用程序的 `main` 方法。

例如，以下是一个典型的 Spring Boot 应用程序非常常见的代码模式：

Java

Kotlin

    @SpringBootApplication
    public class MyApplication {
    
        public static void main(String[] args) {
            SpringApplication.run(MyApplication.class, args);
        }
    
    }
    

在上面的示例中，`main` 方法除了委托给 `SpringApplication.run` 之外没有做任何事情。 但是，可以有一个更复杂的 `main` 方法，在调用 `SpringApplication.run` 之前应用定制。

例如，这是一个更改 banner 模式并设置其他配置文件的应用程序：

Java

Kotlin

    @SpringBootApplication
    public class MyApplication {
    
        public static void main(String[] args) {
            SpringApplication application = new SpringApplication(MyApplication.class);
            application.setBannerMode(Banner.Mode.OFF);
            application.setAdditionalProfiles("myprofile");
            application.run(args);
        }
    
    }
    

由于 `main` 方法中的自定义会影响生成的 `ApplicationContext`，因此您可能还想使用 `main` 方法来创建用于测试的 `ApplicationContext`。 默认情况下， `@SpringBootTest` 不会调用您的 `main` 方法，而是直接使用类本身来创建 `ApplicationContext`

如果要更改此行为，可以将 `@SpringBootTest` 的 `useMainMethod` 属性更改为 `UseMainMethod.ALWAYS` 或 `UseMainMethod.WHEN_AVAILABLE`。 当设置为 `ALWAYS` 时，如果找不到 `main` 方法，测试将失败。 当设置为 `WHEN_AVAILABLE` 时，如果可用，将使用 `main` 方法，否则将使用标准加载机制。

例如，以下测试将调用 `MyApplication` 的 `main` 方法来创建 `ApplicationContext`。 如果 main 方法设置了额外的配置文件，那么这些配置文件将在 `ApplicationContext` 启动时处于活动状态。

Java

Kotlin

    @SpringBootTest(useMainMethod = UseMainMethod.ALWAYS)
    public class MyApplicationTests {
    
        @Test
        void exampleTest() {
            // ...
        }
    
    }
    

#### [](#features.testing.spring-boot-applications.excluding-configuration)8.3.4. 排除测试配置

如果您的应用程序使用了组件扫描 (例如,如果使用 `@SpringBootApplication` 或 `@ComponentScan` ) ,则可能会发现偶然为各地创建的仅为特定测试创建的顶级配置类.

[如前所述](#features.testing.spring-boot-applications.detecting-configuration),`@TestConfiguration` 可以用于测试的内部类以自定义主要配置. 当放置在顶级类上时, `@TestConfiguration` 指示不应通过扫描选择 `src/test/java` 中的类. 然后,可以在需要的位置显式导入该类,如以下示例所示:

Java

Kotlin

    @SpringBootTest
    @Import(MyTestsConfiguration.class)
    class MyTests {
    
        @Test
        void exampleTest() {
            // ...
        }
    
    }
    

如果直接使用 `@ComponentScan` (即不是通过 `@SpringBootApplication`) ,则需要向其中注册 `TypeExcludeFilter`. 有关详细信息,请参见 [Javadoc](https://docs.spring.io/spring-boot/docs/3.0.0/api/org/springframework/boot/context/TypeExcludeFilter.html).

#### [](#features.testing.spring-boot-applications.using-application-arguments)8.3.5. 使用应用程序参数

如果您的应用程序需要 [参数](#features.spring-application.application-arguments),则可以使用 `args` 属性让 `@SpringBootTest` 注入参数.

Java

Kotlin

    @SpringBootTest(args = "--app.test=one")
    class MyApplicationArgumentTests {
    
        @Test
        void applicationArgumentsPopulated(@Autowired ApplicationArguments args) {
            assertThat(args.getOptionNames()).containsOnly("app.test");
            assertThat(args.getOptionValues("app.test")).containsOnly("one");
        }
    
    }
    

#### [](#features.testing.spring-boot-applications.with-mock-environment)8.3.6. 在模拟环境中进行测试

默认情况下, `@SpringBootTest` 不会启动服务器. 而是设置一个模拟环境来测试 Web 端点.

使用 Spring MVC，我们可以使用 [`MockMvc`](/blog/learning/spring/core/testing#spring-mvc-test-framework) 或 `WebTestClient` 查询我们的 Web 端点，如下例所示:

Java

Kotlin

    @SpringBootTest
    @AutoConfigureMockMvc
    class MyMockMvcTests {
    
        @Test
        void testWithMockMvc(@Autowired MockMvc mvc) throws Exception {
            mvc.perform(get("/")).andExpect(status().isOk()).andExpect(content().string("Hello World"));
        }
    
        // If Spring WebFlux is on the classpath, you can drive MVC tests with a WebTestClient
        @Test
        void testWithWebTestClient(@Autowired WebTestClient webClient) {
            webClient
                    .get().uri("/")
                    .exchange()
                    .expectStatus().isOk()
                    .expectBody(String.class).isEqualTo("Hello World");
        }
    
    }
    

如果只想关注 Web 层而不希望启动完整的 `ApplicationContext`,请考虑使用 [`@WebMvcTest`](#features.testing.spring-boot-applications.spring-mvc-tests).

使用 Spring WebFlux 端点, 您可以配置 [`WebTestClient`](/blog/learning/spring/core/testing#webtestclient-tests) ,如以下示例所示:

Java

Kotlin

    @SpringBootTest
    @AutoConfigureWebTestClient
    class MyMockWebTestClientTests {
    
        @Test
        void exampleTest(@Autowired WebTestClient webClient) {
            webClient
                .get().uri("/")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class).isEqualTo("Hello World");
        }
    
    }
    

在模拟环境中进行测试通常比在完整的 Servlet 容器中运行更快.但是, 由于模拟发生在 Spring MVC 层,因此无法使用 MockMvc 直接测试依赖于较低级别 Servlet 容器行为的代码.

例如,Spring Boot 的错误处理基于 Servlet 容器提供的 “error page” 支持. 这意味着, 尽管您可以按预期测试 MVC 层引发并处理异常,但是您无法直接测试是否呈现了特定的 [自定义错误页面](web.html#web.servlet.spring-mvc.error-handling.error-pages). 如果需要测试这些较低级别的问题,则可以按照下一节中的描述启动一个完全运行的服务器.

#### [](#features.testing.spring-boot-applications.with-running-server)8.3.7. 使用正在运行的服务器进行测试

如果需要启动完全运行的服务器, 建议您使用随机端口. 如果使用 `@SpringBootTest(webEnvironment=WebEnvironment.RANDOM_PORT)`, 则每次运行测试时都会随机选择一个可用端口.

`@LocalServerPort` 注解可用于将 [将实际使用的端口注入](howto.html#howto.webserver.discover-port) 测试中. 为了方便起见,需要对已启动的服务器进行 REST 调用的测试可以 `@Autowire` 附加地使用 `WebTestClient`, 该 [`WebTestClient`](/blog/learning/spring/core/testing#webtestclient-tests) 解析到正在运行的服务器的相对链接,并带有用于验证响应的专用 API,如以下示例所示:

Java

Kotlin

    @SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
    class MyRandomPortWebTestClientTests {
    
        @Test
        void exampleTest(@Autowired WebTestClient webClient) {
            webClient
                .get().uri("/")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class).isEqualTo("Hello World");
        }
    
    }
    

`WebTestClient` 可用于实时服务器和 [mock 环境](#features.testing.spring-boot-applications.with-mock-environment).

这种设置需要在类路径上使用 `spring-webflux`. 如果您不能 webflux,则 Spring Boot 还提供了 `TestRestTemplate` 工具:

Java

Kotlin

    @SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
    class MyRandomPortTestRestTemplateTests {
    
        @Test
        void exampleTest(@Autowired TestRestTemplate restTemplate) {
            String body = restTemplate.getForObject("/", String.class);
            assertThat(body).isEqualTo("Hello World");
        }
    
    }
    

#### [](#features.testing.spring-boot-applications.customizing-web-test-client)8.3.8. 自定义 WebTestClient

要定制 `WebTestClient` bean,请配置 `WebTestClientBuilderCustomizer` bean. 将使用用于创建 `WebTestClient` 的 `WebTestClient.Builder` 调用任何此类 bean.

#### [](#features.testing.spring-boot-applications.jmx)8.3.9. 使用 JMX

由于测试上下文框架缓存上下文,因此默认情况下禁用 JMX 以防止相同组件在同一 domain 上注册. 如果此类测试需要访问 `MBeanServer`,请考虑将其标记为 dirty:

Java

Kotlin

    @SpringBootTest(properties = "spring.jmx.enabled=true")
    @DirtiesContext
    class MyJmxTests {
    
        @Autowired
        private MBeanServer mBeanServer;
    
        @Test
        void exampleTest() {
            assertThat(this.mBeanServer.getDomains()).contains("java.lang");
            // ...
        }
    
    }
    

#### [](#features.testing.spring-boot-applications.metrics)8.3.10. 使用 Metrics

无论您的类路径是什么，在使用 `@SpringBootTest` 时，meter 注册表(内存中支持的除外)都不会自动配置。

如果您需要将指标作为集成测试的一部分导出到不同的后端，请使用 `@AutoConfigureMetrics` 注解它。

#### [](#features.testing.spring-boot-applications.tracing)8.3.11. Using Tracing

无论您的类路径如何，使用 `@SpringBootTest` 时都不会自动配置追踪。

如果您需要将跟踪作为集成测试的一部分，请使用 `@AutoConfigureObservability` 对其进行注解。

#### [](#features.testing.spring-boot-applications.mocking-beans)8.3.12. Mocking（模拟） 和 Spying（检测） Beans

运行测试时,有时有必要在应用程序上下文中模拟某些组件. 例如, 您可能在开发过程中无法使用某些远程服务的 facade. 当您要模拟在实际环境中可能难以触发的故障时,模拟也很有用.

Spring Boot 包含一个 `@MockBean` 注解,可用于为 `ApplicationContext` 中的 bean 定义 `Mockito` 模拟. 您可以使用注解添加新 bean 或替换单个现有 bean 定义. 注解可以直接用于测试类,测试中的字段或 `@Configuration` 类和字段. 在字段上使用时,还将注入创建的模拟的实例. 每种测试方法后,模拟 Bean 都会自动重置.

如果您的测试使用 Spring Boot 的测试注解之一 (例如 `@SpringBootTest`) ,则会自动启用此功能. 要以其他方式使用此功能,必须显式添加监听器,如以下示例所示:

Java

Kotlin

    @ContextConfiguration(classes = MyConfig.class)
    @TestExecutionListeners({ MockitoTestExecutionListener.class, ResetMocksTestExecutionListener.class })
    class MyTests {
    
        // ...
    
    }
    

下面的示例用模拟实现替换现有的 `RemoteService` bean:

Java

Kotlin

    @SpringBootTest
    class MyTests {
    
        @Autowired
        private Reverser reverser;
    
        @MockBean
        private RemoteService remoteService;
    
        @Test
        void exampleTest() {
            given(this.remoteService.getValue()).willReturn("spring");
            String reverse = this.reverser.getReverseValue(); // Calls injected RemoteService
            assertThat(reverse).isEqualTo("gnirps");
        }
    
    }
    

`@MockBean` 不能用于模拟应用程序上下文刷新期间执行的 bean 的行为. 到执行测试时,应用程序上下文刷新已完成,并且配置模拟行为为时已晚. 我们建议在这种情况下使用 `@Bean` 方法创建和配置模拟.

此外,您可以使用 `@SpyBean` 用 Mockito `spy` 包装任何现有的 bean. 有关完整的详细信息,请参见 [Javadoc](https://docs.spring.io/spring-boot/docs/3.0.0/api/org/springframework/boot/test/mock/mockito/SpyBean.html).

CGLib代理 (例如为作用域内的 Bean 创建的代理) 将代理方法声明为 `final`. 这将阻止 Mockito 正常运行,因为它无法在其默认配置中模拟或监视最终方法. 如果要模拟或监视这样的 bean,请通过将 `org.mockito:mockito-inline` 添加到应用程序的测试依赖中,将 Mockito 配置为使用其嵌入式模拟生成器. 这允许 Mockito 模拟和监视 `final` 方法.

Spring 的测试框架在测试之间缓存应用程序上下文,并为共享相同配置的测试重用上下文,而 `@MockBean` 或 `@SpyBean` 的使用会影响缓存键,这很可能会增加上下文数量.

如果您使用 `@SpyBean` 通过 `@Cacheable` 方法监视通过名称引用参数的 bean,则必须使用 `-parameters` 编译应用程序. 这样可以确保一旦侦察到 bean,参数名称就可用于缓存基础结构.

当您使用 `@SpyBean` 监视由 Spring 代理的 bean 时,在某些情况下,例如使用 `given` 或 `when` 设置期望值时,您可能需要删除 Spring 的代理. 使用 `AopTestUtils.getTargetObject(yourProxiedSpy)`

#### [](#features.testing.spring-boot-applications.autoconfigured-tests)8.3.13. 自动配置测试

Spring Boot 的自动配置适用于应用程序,但有时对测试来说可能有点过多. 它通常仅有助于加载测试应用程序 "切片" 所需的配置部分. 例如,您可能想要在测试运行时测试 Spring MVC 控制器是否正确映射了 URL,并且您不想在这些测试中涉及数据库调用,或者您想要测试 JPA 实体.

`spring-boot-test-autoconfigure` 模块包括许多注解,可用于自动配置此类 "切片". 它们中的每一个都以相似的方式工作,提供了一个 `@…​Test` 注解 (该注解加载了 `ApplicationContext`) 以及一个或多个 `@AutoConfigure…​` (可用于自定义自动配置设置的注解) .

每个 “slicing” 将组件扫描限制为适当的组件,并加载一组非常受限制的自动配置类. 如果您需要排除其中之一,大多数 `@…​Test` 注解提供了 `excludeAutoConfiguration` 属性. 或者,您可以使用 `@ImportAutoConfiguration#exclude`.

不支持在一个测试中使用多个 `@…​Test` 注解来包含多个 "片段". 如果您需要多个 “slices”,请选择 `@…​Test` 注解之一,并手动添加其他 “slices” 的 `@AutoConfigure…​` 注解.

也可以将 `@AutoConfigure…​` 注解与标准的 `@SpringBootTest` 注解一起使用. 如果您对 “slicing” 应用程序不感兴趣,但需要一些自动配置的测试 bean,则可以使用此组合.

#### [](#features.testing.spring-boot-applications.json-tests)8.3.14. 自动配置的 JSON 测试

要测试对象 JSON 序列化和反序列化是否按预期工作,可以使用 `@JsonTest` 注解. `@JsonTest` 自动配置可用的受支持的 JSON 映射器,该映射器可以是以下库之一:

*   Jackson `ObjectMapper`, 任何使用 `@JsonComponent` 的 beans 和 任何 Jackson `Module`
    
*   `Gson`
    
*   `Jsonb`
    

可以在 [附录](test-auto-configuration.html#appendix.test-auto-configuration)中找到由 `@JsonTest` 启用的自动配置列表.

如果需要配置自动配置的元素,则可以使用 `@AutoConfigureJsonTesters` 注解.

Spring Boot 包含基于 AssertJ 的帮助程序,这些帮助程序可与 JSONAssert 和 JsonPath 库一起使用,以检查 JSON 是否按预期方式显示. `JacksonTester`, `GsonTester`, `JsonbTester` 和 `BasicJsonTester` 类可以分别用于 Jackson, Gson, Jsonb 和 Strings. 使用 `@JsonTest` 时,可以使用 `@Autowired` 测试类上的任何帮助程序字段. 以下示例显示了 Jackson 的测试类:

Java

Kotlin

    @JsonTest
    class MyJsonTests {
    
        @Autowired
        private JacksonTester<VehicleDetails> json;
    
        @Test
        void serialize() throws Exception {
            VehicleDetails details = new VehicleDetails("Honda", "Civic");
            // Assert against a `.json` file in the same package as the test
            assertThat(this.json.write(details)).isEqualToJson("expected.json");
            // Or use JSON path based assertions
            assertThat(this.json.write(details)).hasJsonPathStringValue("@.make");
            assertThat(this.json.write(details)).extractingJsonPathStringValue("@.make").isEqualTo("Honda");
        }
    
        @Test
        void deserialize() throws Exception {
            String content = "{\"make\":\"Ford\",\"model\":\"Focus\"}";
            assertThat(this.json.parse(content)).isEqualTo(new VehicleDetails("Ford", "Focus"));
            assertThat(this.json.parseObject(content).getMake()).isEqualTo("Ford");
        }
    
    }
    

JSON 帮助程序类也可以直接在标准单元测试中使用. 为此,如果不使用 `@JsonTest`,请在 `@Before` 方法中调用帮助程序的 `initFields` 方法.

如果您使用的是 Spring Boot 基于 AssertJ 的帮助器,以给定的 JSON 路径对数字值进行断言,则取决于类型,您可能无法使用 `isEqualTo`. 相反,您可以使用 AssertJ 的满足条件来断言该值符合给定条件. 例如,以下示例断言实际数是一个偏移量为 `0.01` 且接近 `0.15` 的浮点值.

Java

Kotlin

    @Test
    void someTest() throws Exception {
        SomeObject value = new SomeObject(0.152f);
        assertThat(this.json.write(value)).extractingJsonPathNumberValue("@.test.numberValue")
                .satisfies((number) -> assertThat(number.floatValue()).isCloseTo(0.15f, within(0.01f)));
    }
    

#### [](#features.testing.spring-boot-applications.spring-mvc-tests)8.3.15. 自动配置的 Spring MVC 测试

要测试 Spring MVC 控制器是否按预期工作,请使用 `@WebMvcTest` 注解. `@WebMvcTest` 自动配置 Spring MVC 基础结构,并将扫描的 bean 限制为 `@Controller`, `@ControllerAdvice`, `@JsonComponent`, `Converter`, `GenericConverter`, `Filter`, `HandlerInterceptor`, `WebMvcConfigurer`, `WebMvcRegistrations` 和 `HandlerMethodArgumentResolver`. 使用此注解时,不扫描常规 `@Component` ,`@ConfigurationProperties` bean. `@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration)找到 `@WebMvcTest` 启用的自动配置设置的列表.

如果需要注册其他组件,例如 Jackson `Module`,则可以在测试中使用 `@Import` 导入其他配置类.

`@WebMvcTest` 通常仅限于单个控制器,并与 `@MockBean` 结合使用,以为所需的协作者提供模拟实现.

`@WebMvcTest` 还可以自动配置 `MockMvc`. Mock MVC 提供了一种强大的方法来快速测试 MVC 控制器,而无需启动完整的 HTTP 服务器.

您还可以通过在非 `@WebMvcTest` (例如 `@SpringBootTest`) 中使用 `@AutoConfigureMockMvc` 对其进行注解来自动配置 `MockMvc`. 以下示例使用 `MockMvc`:

Java

Kotlin

    @WebMvcTest(UserVehicleController.class)
    class MyControllerTests {
    
        @Autowired
        private MockMvc mvc;
    
        @MockBean
        private UserVehicleService userVehicleService;
    
        @Test
        void testExample() throws Exception {
            given(this.userVehicleService.getVehicleDetails("sboot"))
                .willReturn(new VehicleDetails("Honda", "Civic"));
            this.mvc.perform(get("/sboot/vehicle").accept(MediaType.TEXT_PLAIN))
                .andExpect(status().isOk())
                .andExpect(content().string("Honda Civic"));
        }
    
    }
    

如果您需要配置自动配置的元素 (例如,当应该应用 servlet 过滤器时) ,则可以使用 `@AutoConfigureMockMvc` 注解中的属性.

如果使用 HtmlUnit 或 Selenium,则自动配置还会提供 HtmlUnit `WebClient` bean 和/或 Selenium `WebDriver` bean. 以下示例使用 HtmlUnit:

Java

Kotlin

    @WebMvcTest(UserVehicleController.class)
    class MyHtmlUnitTests {
    
        @Autowired
        private WebClient webClient;
    
        @MockBean
        private UserVehicleService userVehicleService;
    
        @Test
        void testExample() throws Exception {
            given(this.userVehicleService.getVehicleDetails("sboot")).willReturn(new VehicleDetails("Honda", "Civic"));
            HtmlPage page = this.webClient.getPage("/sboot/vehicle.html");
            assertThat(page.getBody().getTextContent()).isEqualTo("Honda Civic");
        }
    
    }
    

默认情况下,Spring Boot 将 `WebDriver` bean 放在特殊的 “scope” 中,以确保驱动程序在每次测试后退出并注入新实例. 如果您不希望出现这种情况,则可以将 `@Scope("singleton")` 添加到 `WebDriver` `@Bean` 定义中.

Spring Boot 创建的 `webDriver` 作用域将替换任何用户定义的同名作用域. 如果定义自己的 `webDriver` 作用域,则使用 `@WebMvcTest` 时可能会发现它停止工作.

如果您在类路径上具有 Spring Security,则 `@WebMvcTest` 还将扫描 `WebSecurityConfigurer` Bean. 您可以使用 Spring Security 的测试支持来代替完全禁用此类测试的安全性. 有关如何使用 Spring Security 的 `MockMvc` 支持的更多详细信息,请参见 _[howto.html](howto.html#howto.testing.with-spring-security)_ 操作方法部分.

有时编写 Spring MVC 测试是不够的. Spring Boot 可以帮助您在 [实际服务器上运行完整的端到端测试](#features.testing.spring-boot-applications.with-running-server).

#### [](#features.testing.spring-boot-applications.spring-webflux-tests)8.3.16. 自动配置的 Spring WebFlux 测试

要测试 Spring WebFlux 控制器是否按预期工作,可以使用 `@WebFluxTest` 注解. `@WebFluxTest` 自动配置 Spring WebFlux 基础结构, 并将扫描的 bean 限制为 `@Controller`, `@ControllerAdvice`, `@JsonComponent`, `Converter`, `GenericConverter`, `WebFilter` 和 `WebFluxConfigurer`. 使用 `@WebFluxTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration)找到 `@WebFluxTest` 启用的自动配置的列表. .

如果需要注册其他组件,例如 Jackson `Module`,则可以在测试中使用 `@Import` 导入其他配置类.

通常,`@WebFluxTest` 仅限于单个控制器,并与 `@MockBean` 注解结合使用,以为所需的协作者提供模拟实现.

`@WebFluxTest` 还可以自动配置 [`WebTestClient`](/blog/learning/spring/core/testing#webtestclient),它提供了一种强大的方法来快速测试 WebFlux 控制器,而无需启动完整的 HTTP 服务器.

您还可以通过在非 `@WebFluxTest` (例如 `@SpringBootTest`) 中自动配置 `WebTestClient`,方法是使用 `@AutoConfigureWebTestClient` 对其进行注解. 下面的示例显示一个同时使用 `@WebFluxTest` 和 `WebTestClient` 的类:

Java

Kotlin

    @WebFluxTest(UserVehicleController.class)
    class MyControllerTests {
    
        @Autowired
        private WebTestClient webClient;
    
        @MockBean
        private UserVehicleService userVehicleService;
    
        @Test
        void testExample() {
            given(this.userVehicleService.getVehicleDetails("sboot"))
                .willReturn(new VehicleDetails("Honda", "Civic"));
            this.webClient.get().uri("/sboot/vehicle").accept(MediaType.TEXT_PLAIN).exchange()
                .expectStatus().isOk()
                .expectBody(String.class).isEqualTo("Honda Civic");
        }
    
    }
    

WebFlux 应用程序仅支持此设置,因为在模拟的 Web 应用程序中使用 `WebTestClient` 目前仅与 WebFlux 一起使用.

`@WebFluxTest` 无法检测通过功能 Web 框架注册的路由. 为了在上下文中测试 `RouterFunction` bean,请考虑自己通过 `@Import` 或使用 `@SpringBootTest` 导入 `RouterFunction`.

`@WebFluxTest` 无法检测通过 `SecurityWebFilterChain` 类型的 `@Bean` 注册的自定义安全配置. 要将其包括在测试中,您将需要通过 `@Import` 导入或使用 `@SpringBootTest` 导入用于注册 bean 的配置.

有时编写 Spring WebFlux 测试是不够的. Spring Boot可以帮助您在 [实际服务器上运行完整的端到端测试](#features.testing.spring-boot-applications.with-running-server).

#### [](#features.testing.spring-boot-applications.spring-graphql-tests)8.3.17. Spring GraphQL 测试自动配置

Spring GraphQL 提供了专门的测试支持模块； 你需要将它添加到你的项目中：

Maven

    <dependencies>
      <dependency>
        <groupId>org.springframework.graphql</groupId>
        <artifactId>spring-graphql-test</artifactId>
        <scope>test</scope>
      </dependency>
      <!-- Unless already present in the compile scope -->
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
        <scope>test</scope>
      </dependency>
    </dependencies>

Gradle

    dependencies {
      testImplementation("org.springframework.graphql:spring-graphql-test")
      // Unless already present in the implementation configuration
      testImplementation("org.springframework.boot:spring-boot-starter-webflux")
    }

这个测试模块附带了 GraphQlTester. spring-boot-project/spring-boot-docs/src/docs/asciidoc/features/testing.adoc

#### [](#features.testing.spring-boot-applications.autoconfigured-spring-data-cassandra)8.3.18. 自动配置 Cassandra 测试

您可以使用 `@DataCassandraTest` 注解来测试 Cassandra 应用程序. 默认情况下,它将配置一个 `CassandraTemplate` 来扫描 `@Table` 类并配置 Spring Data Cassandra 存储库. 使用 `@DataCassandraTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean（有关在 Spring Boot 中使用 Cassandra 的更多信息，请参阅本章前面的 "[data.html](data.html#data.nosql.cassandra)"）

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration) 找到由 `@DataCassandraTest` 启用的自动配置设置的列表.

以下示例显示了在 Spring Boot 中使用 Cassandra 测试的典型设置:

Java

Kotlin

    @DataCassandraTest
    class MyDataCassandraTests {
    
        @Autowired
        private SomeRepository repository;
    
    }
    

#### [](#features.testing.spring-boot-applications.autoconfigured-spring-data-couchbase)8.3.19. 自动配置 Data Couchbase 测试

您可以使用 `@DataCouchbaseTest` 注解来测试 Couchbase 应用程序. 默认情况下,它将配置一个 `CouchbaseTemplate` 或 `ReactiveCouchbaseTemplate`, 来扫描 `@Document` 类并配置 Spring Data Couchbase 存储库. 使用 `@DataCouchbaseTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean（有关在 Spring Boot 中使用 Cassandra 的更多信息，请参阅本章前面的 "[data.html](data.html#data.nosql.couchbase)"）

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration) 找到由 `@DataCouchbaseTest` 启用的自动配置设置的列表.

以下示例显示了在 Spring Boot 中使用 Couchbase 测试的典型设置:

Java

Kotlin

    @DataCouchbaseTest
    class MyDataCouchbaseTests {
    
        @Autowired
        private SomeRepository repository;
    
        // ...
    
    }
    

#### [](#features.testing.spring-boot-applications.autoconfigured-spring-data-elasticsearch)8.3.20. 自动配置 Data Elasticsearch 测试

您可以使用 `@DataElasticsearchTest` 注解来测试 Elasticsearch 应用程序. 默认情况下,它将配置一个 `ElasticsearchRestTemplate`, 来扫描 `@Document` 类并配置 Spring Data Elasticsearch 存储库. 使用 `@DataElasticsearchTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean（有关在 Spring Boot 中使用 Elasticsearch 的更多信息，请参阅本章前面的 "[data.html](data.html#data.nosql.elasticsearch)"）

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration) 找到由 `@DataElasticsearchTest` 启用的自动配置设置的列表.

以下示例显示了在 Spring Boot 中使用 Elasticsearch 测试的典型设置:

Java

Kotlin

    @DataElasticsearchTest
    class MyDataElasticsearchTests {
    
        @Autowired
        private SomeRepository repository;
    
        // ...
    
    }
    

#### [](#features.testing.spring-boot-applications.autoconfigured-spring-data-jpa)8.3.21. 自动配置的 Data JPA 测试

您可以使用 `@DataJpaTest` 注解来测试 JPA 应用程序. 默认情况下,它将扫描 `@Entity` 类并配置 Spring Data JPA 存储库. 如果在类路径上有嵌入式数据库,也会配置. 默认情况下， 通过将 `spring.jpa.show-sql` 属性设置为 `true` 来记录 SQL 查询. 可以使用注解的 `showSql()` 属性禁用此功能.

使用 `@DataJpaTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration)找到由 `@DataJpaTest` 启用的自动配置设置的列表.

默认情况下,数据 JPA 测试是事务性的,并在每次测试结束时回滚. 有关更多详细信息,请参见《Spring Framework 参考文档》中的 [相关部分](/blog/learning/spring/core/testing#testcontext-tx-enabling-transactions) . 如果这不是您想要的,则可以按以下方式禁用测试或整个类的事务管理:

Java

Kotlin

    @DataJpaTest
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    class MyNonTransactionalTests {
    
        // ...
    
    }
    

JPA 测试也可以注入 [`TestEntityManager`](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot-test-autoconfigure/src/main/java/org/springframework/boot/test/autoconfigure/orm/jpa/TestEntityManager.java) bean,它为专门为测试设计的标准 JPA `EntityManager` 提供了替代方法.

`TestEntityManager` 也可以通过添加 `@AutoConfigureTestEntityManager` 自动配置到任何基于 Spring 的测试类。 这样做时，请确保您的测试在事务中运行，例如通过在测试类或方法上添加 `@Transactional`。

如果需要,还可以使用 `JdbcTemplate`. 以下示例显示了正在使用的 `@DataJpaTest` 注解:

Java

Kotlin

    @DataJpaTest
    class MyRepositoryTests {
    
        @Autowired
        private TestEntityManager entityManager;
    
        @Autowired
        private UserRepository repository;
    
        @Test
        void testExample() {
            this.entityManager.persist(new User("sboot", "1234"));
            User user = this.repository.findByUsername("sboot");
            assertThat(user.getUsername()).isEqualTo("sboot");
            assertThat(user.getEmployeeNumber()).isEqualTo("1234");
        }
    
    }
    

内存嵌入式数据库通常运行良好,不需要任何安装,因此通常可以很好地进行测试. 但是,如果您希望对真实数据库运行测试,则可以使用 `@AutoConfigureTestDatabase` 注解,如以下示例所示:

Java

Kotlin

    @DataJpaTest
    @AutoConfigureTestDatabase(replace = Replace.NONE)
    class MyRepositoryTests {
    
        // ...
    
    }
    

#### [](#features.testing.spring-boot-applications.autoconfigured-jdbc)8.3.22. 自动配置的 JDBC 测试

`@JdbcTest` 与 `@DataJpaTest` 相似,但适用于仅需要 `DataSource` 并且不使用 Spring Data JDBC 的测试. 默认情况下,它配置一个内存嵌入式数据库和一个 `JdbcTemplate`. 使用 `@JdbcTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration) 找到 `@JdbcTest` 启用的自动配置的列表.

默认情况下,JDBC 测试是事务性的,并在每个测试结束时回滚. 有关更多详细信息,请参见《 Spring Framework 参考文档》中的 [相关部分](/blog/learning/spring/core/testing#testcontext-tx-enabling-transactions). 如果这不是您想要的,则可以为测试或整个类禁用事务管理,如下所示:

Java

Kotlin

    @JdbcTest
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    class MyTransactionalTests {
    
    }
    

如果您希望测试针对真实数据库运行,则可以使用 `@AutoConfigureTestDatabase` 注解,其方式与 `DataJpaTest` 相同. (请参阅 "[自动配置的 Data JPA 测试](#features.testing.spring-boot-applications.autoconfigured-spring-data-jpa)". )。

#### [](#features.testing.spring-boot-applications.autoconfigured-spring-data-jdbc)8.3.23. 自动配置的 Data JDBC 测试

`@DataJdbcTest` 与 `@JdbcTest` 相似,但适用于使用 Spring Data JDBC 存储库的测试. 默认情况下,它配置一个内存嵌入式数据库,一个 `JdbcTemplate` 和 Spring Data JDBC 存储库. 使用 `@DataJdbcTest` 注释时仅扫描 `AbstractJdbcConfiguration` 子类，不扫描常规 `@Component` 和 `@ConfigurationProperties` bean。 `@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration)找到由 `@DataJdbcTest` 启用的自动配置的列表.

默认情况下,Data JDBC 测试是事务性的,并在每个测试结束时回滚. 有关更多详细信息,请参见《Spring Framework 参考文档》中的 [相关部分](/blog/learning/spring/core/testing#testcontext-tx-enabling-transactions). 如果这不是您想要的,则可以禁用测试或整个测试类的事务管理,[如 JDBC 示例所示](#features.testing.spring-boot-applications.autoconfigured-jdbc).

如果您希望测试针对真实数据库运行,则可以使用 `@AutoConfigureTestDatabase` 注解,其方式与 `DataJpaTest` 相同. (请参阅 "[自动配置的 Data JPA 测试](#features.testing.spring-boot-applications.autoconfigured-spring-data-jpa)". )。

#### [](#features.testing.spring-boot-applications.autoconfigured-jooq)8.3.24. 自动配置的 jOOQ Tests

您可以以与 `@JdbcTest` 类似的方式使用 `@JooqTest`,但可以用于与 jOOQ 相关的测试. 由于 jOOQ 严重依赖与数据库模式相对应的基于 Java 的模式,因此将使用现有的 `DataSource`. 如果要将其替换为内存数据库,则可以使用 `@AutoConfigureTestDatabase` 覆盖这些设置. (有关在 Spring Boot 中使用 jOOQ 的更多信息,请参阅 "[data.html](data.html#data.sql.jooq)". ) 使用 `@JooqTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration) 找到 `@JooqTest` 启用的自动配置的列表.

`@JooqTest` 配置 `DSLContext`. . 以下示例显示了正在使用的 `@JooqTest` 注解:

Java

Kotlin

    @JooqTest
    class MyJooqTests {
    
        @Autowired
        private DSLContext dslContext;
    
        // ...
    
    }
    

JOOQ 测试是事务性的,默认情况下会在每个测试结束时回滚. 如果这不是您想要的,则可以禁用测试或整个测试类的事务管理, [如 JDBC 示例所示](#features.testing.spring-boot-applications.autoconfigured-jdbc).

#### [](#features.testing.spring-boot-applications.autoconfigured-spring-data-mongodb)8.3.25. 自动配置的 Data MongoDB 测试

您可以使用 `@DataMongoTest` 测试 MongoDB 应用程序. 默认情况下,它配置内存嵌入式 MongoDB (如果可用) ,配置 `MongoTemplate`,扫描 `@Document` 类,并配置 Spring Data MongoDB 存储库. 使用 `@DataMongoTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean (有关将 MongoDB 与 Spring Boot 结合使用的更多信息,请参阅 "[data.html](data.html#data.nosql.mongodb)")

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration)找到由 `@DataMongoTest` 启用的自动配置设置的列表.

此类显示正在使用的 `@DataMongoTest` 注解:

Java

Kotlin

    @DataMongoTest
    class MyDataMongoDbTests {
    
        @Autowired
        private MongoTemplate mongoTemplate;
    
        // ...
    
    }
    

#### [](#features.testing.spring-boot-applications.autoconfigured-spring-data-neo4j)8.3.26. Auto-configured Data Neo4j Tests

您可以使用 `@DataNeo4jTest` 来测试 Neo4j 应用程序. 默认情况下, 他会扫描 `@Node` 类,并配置 Spring Data Neo4j 存储库. 使用 `@DataNeo4jTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean. (有关将 Neo4J 与 Spring Boot 结合使用的更多信息,请参阅 "[data.html](data.html#data.nosql.neo4j)". )

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration)找到由 `@DataNeo4jTest` 启用的自动配置设置的列表.

以下示例显示了在 Spring Boot 中使用 Neo4J 测试的典型设置:

Java

Kotlin

    @DataNeo4jTest
    class MyDataNeo4jTests {
    
        @Autowired
        private SomeRepository repository;
    
        // ...
    
    }
    

默认情况下,Data Neo4j 测试是事务性的,并在每次测试结束时回滚. 有关更多详细信息,请参见《Spring Framework 参考文档》中的 [相关部分](/blog/learning/spring/core/testing#testcontext-tx-enabling-transactions) . 如果这不是您想要的,则可以为测试或整个类禁用事务管理,如下所示:

Java

Kotlin

    @DataNeo4jTest
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    class MyDataNeo4jTests {
    
    }
    

响应式访问不支持事务性测试。如果您正在使用这种样式，您必须如上所述配置 `@DataNeo4jTest` 测试.

#### [](#features.testing.spring-boot-applications.autoconfigured-spring-data-redis)8.3.27. 自动配置的 Data Redis 测试

您可以使用 `@DataRedisTest` 测试 Redis 应用程序. 默认情况下,它会扫描 `@RedisHash` 类并配置 Spring Data Redis 存储库. 使用 `@DataRedisTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean. (有关将 Redis 与 Spring Boot 结合使用的更多信息,请参阅 "[data.html](data.html#data.nosql.redis)". )

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration)找到由 `@DataRedisTest` 启用的自动配置设置的列表.

下面的例子展示了使用中的 `@DataRedisTest` 注解:

Java

Kotlin

    @DataRedisTest
    class MyDataRedisTests {
    
        @Autowired
        private SomeRepository repository;
    
        // ...
    
    }
    

#### [](#features.testing.spring-boot-applications.autoconfigured-spring-data-ldap)8.3.28. 自动配置的 Data LDAP 测试

您可以使用 `@DataLdapTest` 来测试 LDAP 应用程序. 默认情况下,它配置内存嵌入式 LDAP (如果可用) ,配置 `LdapTemplate`,扫描 `@Entry` 类,并配置 Spring Data LDAP 存储库. 使用 `@DataLdapTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean. (有关将 LDAP 与 Spring Boot 结合使用的更多信息,请参阅 "[data.html](data.html#data.nosql.ldap)". )

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration)找到由 `@DataLdapTest` 启用的自动配置设置的列表.

以下示例显示了正在使用的 `@DataLdapTest` 注解:

Java

Kotlin

    @DataLdapTest
    class MyDataLdapTests {
    
        @Autowired
        private LdapTemplate ldapTemplate;
    
        // ...
    
    }
    

内存嵌入式 LDAP 通常非常适合测试,因为它速度快并且不需要安装任何开发人员. 但是,如果您希望针对真实的 LDAP 服务器运行测试,则应排除嵌入式 LDAP 自动配置,如以下示例所示:

Java

Kotlin

    @DataLdapTest(excludeAutoConfiguration = EmbeddedLdapAutoConfiguration.class)
    class MyDataLdapTests {
    
        // ...
    
    }
    

#### [](#features.testing.spring-boot-applications.autoconfigured-rest-client)8.3.29. 自动配置 REST Clients

您可以使用 `@RestClientTest` 注解来测试 REST 客户端. 默认情况下,它会自动配置 Jackson,GSON 和 Jsonb 支持,配置 `RestTemplateBuilder`,并添加对 `MockRestServiceServer` 的支持. 使用 `@RestClientTest` 注解时,不扫描常规 `@Component` 和 `@ConfigurationProperties` bean.`@EnableConfigurationProperties` 可用于包含 `@ConfigurationProperties` 的 bean.

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration)找到由 `@RestClientTest` 启用的自动配置设置的列表.

应该使用 `@RestClientTest` 的 `value` 或 `components` 属性来指定要测试的特定 bean,如以下示例所示:

Java

Kotlin

    @RestClientTest(RemoteVehicleDetailsService.class)
    class MyRestClientTests {
    
        @Autowired
        private RemoteVehicleDetailsService service;
    
        @Autowired
        private MockRestServiceServer server;
    
        @Test
        void getVehicleDetailsWhenResultIsSuccessShouldReturnDetails() {
            this.server.expect(requestTo("/greet/details")).andRespond(withSuccess("hello", MediaType.TEXT_PLAIN));
            String greeting = this.service.callRestService();
            assertThat(greeting).isEqualTo("hello");
        }
    
    }
    

#### [](#features.testing.spring-boot-applications.autoconfigured-spring-restdocs)8.3.30. 自动配置的 Spring REST Docs 测试

您可以使用 `@AutoConfigureRestDocs` 注解在 Mock MVC,REST Assured 或 `WebTestClient` 的测试中使用 [Spring REST Docs](https://spring.io/projects/spring-restdocs). 它消除了 Spring REST Docs 中对 JUnit 扩展的需求.

`@AutoConfigureRestDocs` 可用于覆盖默认输出目录 (如果使用 Maven,则为 `target/generated-snippets` 如果使用 Gradle,则为 `build/generated-snippets` ) . 它也可以用于配置出现在任何记录的 URI 中的 host, scheme, 和 port.

##### [](#features.testing.spring-boot-applications.autoconfigured-spring-restdocs.with-mock-mvc)使用 Mock MVC 自动配置的 Spring REST Docs 测试

`@AutoConfigureRestDocs` 自定义 `MockMvc` bean 以使用 Spring REST Docs. 您可以使用 `@Autowired` 注入它,并像通常使用 Mock MVC 和 Spring REST Docs 一样,在测试中使用它,如以下示例所示:

Java

Kotlin

    @WebMvcTest(UserController.class)
    @AutoConfigureRestDocs
    class MyUserDocumentationTests {
    
        @Autowired
        private MockMvc mvc;
    
        @Test
        void listUsers() throws Exception {
            this.mvc.perform(get("/users").accept(MediaType.TEXT_PLAIN))
                .andExpect(status().isOk())
                .andDo(document("list-users"));
        }
    
    }
    

如果需要对 Spring REST Docs 配置进行更多控制,而不是 `@AutoConfigureRestDocs` 属性提供的控制,则可以使用 `RestDocsMockMvcConfigurationCustomizer` bean,如以下示例所示:

Java

Kotlin

    @TestConfiguration(proxyBeanMethods = false)
    public class MyRestDocsConfiguration implements RestDocsMockMvcConfigurationCustomizer {
    
        @Override
        public void customize(MockMvcRestDocumentationConfigurer configurer) {
            configurer.snippets().withTemplateFormat(TemplateFormats.markdown());
        }
    
    }
    

如果要使用 Spring REST Docs 对参数化输出目录的支持,可以创建 `RestDocumentationResultHandler` bean. 自动配置使用此结果处理程序调用 `alwaysDo`,从而使每个 `MockMvc` 调用自动生成默认片段. 以下示例显示了定义的 `RestDocumentationResultHandler`:

Java

Kotlin

    @TestConfiguration(proxyBeanMethods = false)
    public class MyResultHandlerConfiguration {
    
        @Bean
        public RestDocumentationResultHandler restDocumentation() {
            return MockMvcRestDocumentation.document("{method-name}");
        }
    
    }
    

##### [](#features.testing.spring-boot-applications.autoconfigured-spring-restdocs.with-web-test-client)使用 WebTestClient 自动配置的 Spring REST Docs 测试

`@AutoConfigureRestDocs` 也可以与 `WebTestClient` 一起使用. 您可以使用 `@Autowired` 注入它,并像通常使用 `@WebFluxTest` 和 Spring REST Docs 一样在测试中使用它,如以下示例所示:

Java

Kotlin

    @WebFluxTest
    @AutoConfigureRestDocs
    class MyUsersDocumentationTests {
    
        @Autowired
        private WebTestClient webTestClient;
    
        @Test
        void listUsers() {
            this.webTestClient
                .get().uri("/")
            .exchange()
            .expectStatus()
                .isOk()
            .expectBody()
                .consumeWith(document("list-users"));
        }
    
    }
    

如果需要对 Spring REST Docs 配置进行更多控制,而不是 `@AutoConfigureRestDocs` 属性提供的控制,则可以使用 `RestDocsWebTestClientConfigurationCustomizer` bean,如以下示例所示:

Java

Kotlin

    @TestConfiguration(proxyBeanMethods = false)
    public class MyRestDocsConfiguration implements RestDocsWebTestClientConfigurationCustomizer {
    
        @Override
        public void customize(WebTestClientRestDocumentationConfigurer configurer) {
            configurer.snippets().withEncoding("UTF-8");
        }
    
    }
    

如果您想利用 Spring REST Docs 对参数化输出目录的支持，您可以使用 `WebTestClientBuilderCustomizer` 为每个实体 exchange 结果配置消费者。 下面的例子展示了一个被定义的 `WebTestClientBuilderCustomizer`:

Java

Kotlin

    @TestConfiguration(proxyBeanMethods = false)
    public class MyWebTestClientBuilderCustomizerConfiguration {
    
        @Bean
        public WebTestClientBuilderCustomizer restDocumentation() {
            return (builder) -> builder.entityExchangeResultConsumer(document("{method-name}"));
        }
    
    }
    

##### [](#features.testing.spring-boot-applications.autoconfigured-spring-restdocs.with-rest-assured)使用 RES TAssured 自动配置的 Spring REST Docs 测试

`@AutoConfigureRestDocs` 使一个 `RequestSpecification` Bean (可预配置为使用 Spring REST Docs) 可用于您的测试. 您可以使用 `@Autowired` 注入它,并像在使用 REST Assured 和 Spring REST Docs 时一样,在测试中使用它,如以下示例所示:

Java

Kotlin

    @SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
    @AutoConfigureRestDocs
    class MyUserDocumentationTests {
    
        @Test
        void listUsers(@Autowired RequestSpecification documentationSpec, @LocalServerPort int port) {
            given(documentationSpec)
                .filter(document("list-users"))
            .when()
                .port(port)
                .get("/")
            .then().assertThat()
                .statusCode(is(200));
        }
    
    }
    

如果您需要对 Spring REST Docs 配置进行更多控制,而不是 `@AutoConfigureRestDocs` 属性所提供的控制,则可以使用 `RestDocsRestAssuredConfigurationCustomizer` bean,如以下示例所示:

Java

Kotlin

    @TestConfiguration(proxyBeanMethods = false)
    public class MyRestDocsConfiguration implements RestDocsRestAssuredConfigurationCustomizer {
    
        @Override
        public void customize(RestAssuredRestDocumentationConfigurer configurer) {
            configurer.snippets().withTemplateFormat(TemplateFormats.markdown());
        }
    
    }
    

#### [](#features.testing.spring-boot-applications.autoconfigured-webservices)8.3.31. Auto-configured Spring Web Services Tests

##### [](#features.testing.spring-boot-applications.autoconfigured-webservices.client)自动配置的 Spring Web Services Client 测试

您可以使用 `@WebServiceClientTest` 来通过 Spring Web Services 项目测试使用呼叫 Web 服务的应用程序. 默认情况下,它配置模拟 `WebServiceServer` bean 并自动自定义 `WebServiceTemplateBuilder`. (有关在 Spring Boot 中结合使用 Web 服务的更多信息,请参阅 "[io.html](io.html#io.webservices)".)

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration) 找到由 `@WebServiceClientTest` 启用的自动配置设置的列表.

以下示例显示了正在使用的 `@WebServiceClientTest` 注解:

Java

Kotlin

    @WebServiceClientTest(SomeWebService.class)
    class MyWebServiceClientTests {
    
        @Autowired
        private MockWebServiceServer server;
    
        @Autowired
        private SomeWebService someWebService;
    
        @Test
        void mockServerCall() {
            this.server
                .expect(payload(new StringSource("<request/>")))
                .andRespond(withPayload(new StringSource("<response><status>200</status></response>")));
            assertThat(this.someWebService.test())
                .extracting(Response::getStatus)
                .isEqualTo(200);
        }
    
    }
    

##### [](#features.testing.spring-boot-applications.autoconfigured-webservices.server)自动配置的 Spring Web Services Server 测试

您可以使用 `@WebServiceServerTest` 来测试使用 Spring Web Services 项目实现 Web 服务的应用程序。 默认情况下，它配置了一个 `MockWebServiceClient` bean，可用于调用您的 Web 服务端点。 （有关在 Spring Boot 中使用 Web 服务的更多信息，请参阅 "[io.html](io.html#io.webservices)"。）

可以在 [附录中](test-auto-configuration.html#appendix.test-auto-configuration) 找到由 `@WebServiceServerTest` 启用的自动配置设置的列表.

以下示例显示了正在使用的 `@WebServiceServerTest` 注解:

Java

Kotlin

    @WebServiceServerTest(ExampleEndpoint.class)
    class MyWebServiceServerTests {
    
        @Autowired
        private MockWebServiceClient client;
    
        @Test
        void mockServerCall() {
            this.client
                .sendRequest(RequestCreators.withPayload(new StringSource("<ExampleRequest/>")))
                .andExpect(ResponseMatchers.payload(new StringSource("<ExampleResponse>42</ExampleResponse>")));
        }
    
    }
    

#### [](#features.testing.spring-boot-applications.additional-autoconfiguration-and-slicing)8.3.32. 其他的自动配置和切片

每个切片提供一个或多个 `@AutoConfigure…​` 注解,即定义应包含在切片中的自动配置. 可以通过创建自定义 `@AutoConfigure…​` 注解来添加其他自动配置,也可以简单地通过将 `@ImportAutoConfiguration` 添加到测试中来添加其他自动配置,如以下示例所示:

Java

Kotlin

    @JdbcTest
    @ImportAutoConfiguration(IntegrationAutoConfiguration.class)
    class MyJdbcTests {
    
    }
    

确保不要使用常规的 `@Import` 注解导入自动配置,因为它们是由 Spring Boot 以特定方式处理的.

或者,可以通过在 `META-INF/spring.factories` 中注册切片注解的任何使用来添加其他自动配置,如以下示例所示:

META-INF/spring/org.springframework.boot.test.autoconfigure.jdbc.JdbcTest.imports

com.example.IntegrationAutoConfiguration

在此示例中，在每个用 `@JdbcTest` 注解的测试上启用了 `com.example.IntegrationAutoConfiguration`。

您可以在此文件中通过 `#` 使用注释。

切片或 `@AutoConfigure…​` 注解可以通过这种方式自定义,只要使用 `@ImportAutoConfiguration` 对其进行元注解即可.

#### [](#features.testing.spring-boot-applications.user-configuration-and-slicing)8.3.33. 用户配置和切片

如果您以合理的方式 [组织代码](using.html#using.structuring-your-code) ,则 [默认情况下](#features.testing.spring-boot-applications.detecting-configuration) 将 `@SpringBootApplication` 类用作测试的配置.

因此,变得重要的是,不要使用特定于其功能特定区域的配置设置来乱扔应用程序的主类.

假设您正在使用 Spring Batch,并且依赖于它的自动配置. 您可以如下定义 `@SpringBootApplication`:

Java

Kotlin

    @SpringBootApplication
    @EnableBatchProcessing
    public class MyApplication {
    
        // ...
    
    }
    

因为此类是测试的源配置,所以任何切片测试实际上都尝试启动 Spring Batch,这绝对不是您想要执行的操作. 建议的方法是将特定于区域的配置移动到与您的应用程序处于同一级别的单独的 `@Configuration` 类,如以下示例所示:

Java

Kotlin

    @Configuration(proxyBeanMethods = false)
    @EnableBatchProcessing
    public class MyBatchConfiguration {
    
        // ...
    
    }
    

根据您应用程序的复杂性,您可以为您的自定义设置一个 `@Configuration` 类,或者每个域区域一个类. 后一种方法使您可以在其中一个测试中使用 `@Import` 注解启用它.请参阅 [this how-to section](howto.html#howto.testing.slice-tests) 了解有关何时可能需要为切片测试启用特定 `@Configuration` 类的更多详细信息。

测试片将 `@Configuration` 类从扫描中排除. 例如,对于 `@WebMvcTest`,以下配置将在测试切片加载的应用程序上下文中不包括给定的 `WebMvcConfigurer` Bean:

Java

Kotlin

    @Configuration(proxyBeanMethods = false)
    public class MyWebConfiguration {
    
        @Bean
        public WebMvcConfigurer testConfigurer() {
            return new WebMvcConfigurer() {
                // ...
            };
        }
    
    }
    

但是,以下配置将导致自定义 `WebMvcConfigurer` 由测试片加载.

Java

Kotlin

    @Component
    public class MyWebMvcConfigurer implements WebMvcConfigurer {
    
        // ...
    
    }
    

混乱的另一个来源是类路径扫描. 假定在以合理的方式组织代码的同时,您需要扫描其他程序包. 您的应用程序可能类似于以下代码:

Java

Kotlin

    @SpringBootApplication
    @ComponentScan({ "com.example.app", "com.example.another" })
    public class MyApplication {
    
        // ...
    
    }
    

这样做有效地覆盖了默认的组件扫描指令,并且具有扫描这两个软件包的副作用,而与您选择的切片无关. 例如,`@DataJpaTest` 似乎突然扫描了应用程序的组件和用户配置. 同样,将自定义指令移至单独的类是解决此问题的好方法.

如果这不是您的选择,则可以在测试层次结构中的某个位置创建 `@SpringBootConfiguration`,以便代替使用它. 或者,您可以为测试指定一个源,从而禁用查找默认源的行为.

#### [](#features.testing.spring-boot-applications.spock)8.3.34. 使用 Spock 测试 Spring Boot 应用程序

如果您希望使用 Spock 2.x 来测试 Spring Boot 应用程序,则应在应用程序的构建中添加对 Spock 的 `spock-spring` 模块的 `-groovy-4.0` 版本依赖. `spock-spring` 将 Spring 的测试框架集成到了 Spock 中. 有关更多详细信息,请参见 [Spock 的 Spring 模块的文档](https://spockframework.org/spock/docs/2.2-M1/modules.html#_spring_module)..

### [](#features.testing.utilities)8.4. 测试实用工具

一些测试实用工具类通常在测试您的应用程序时有用,它们被打包为 `spring-boot` 的一部分.

#### [](#features.testing.utilities.config-data-application-context-initializer)8.4.1. ConfigDataApplicationContextInitializer

`ConfigFileApplicationContextInitializer` 是一个 `ApplicationContextInitializer`,您可以将其应用于测试以加载 Spring Boot `application.properties` 文件. 当不需要 `@SpringBootTest` 提供的全部功能时,可以使用它,如以下示例所示:

Java

Kotlin

    @ContextConfiguration(classes = Config.class, initializers = ConfigDataApplicationContextInitializer.class)
    class MyConfigFileTests {
    
        // ...
    
    }
    

单独使用 `ConfigFileApplicationContextInitializer` 不能提供对 `@Value("${…​}")` 注入的支持. 唯一的工作就是确保将 `application.properties` 文件加载到 Spring 的环境中. 为了获得 `@Value` 支持,您需要另外配置 `PropertySourcesPlaceholderConfigurer` 或使用 `@SpringBootTest`,后者会为您自动配置一个.

#### [](#features.testing.utilities.test-property-values)8.4.2. TestPropertyValues

使用 `TestPropertyValues`,可以快速将属性添加到 `ConfigurableEnvironment` 或 `ConfigurableApplicationContext`. 您可以使用 `key=value` 字符串来调用它,如下所示:

Java

Kotlin

    class MyEnvironmentTests {
    
        @Test
        void testPropertySources() {
            MockEnvironment environment = new MockEnvironment();
            TestPropertyValues.of("org=Spring", "name=Boot").applyTo(environment);
            assertThat(environment.getProperty("name")).isEqualTo("Boot");
        }
    
    }
    

#### [](#features.testing.utilities.output-capture)8.4.3. OutputCapture

`OutputCapture` 是一个 JUnit 扩展,可用于捕获 `System.out` 和 `System.err` 输出. 要使用 add `@ExtendWith(OutputCaptureExtension.class)` 并将 `CapturedOutput` 作为参数注入测试类构造函数或测试方法,如下所示:

Java

Kotlin

    @ExtendWith(OutputCaptureExtension.class)
    class MyOutputCaptureTests {
    
        @Test
        void testName(CapturedOutput output) {
            System.out.println("Hello World!");
            assertThat(output).contains("World");
        }
    
    }
    

#### [](#features.testing.utilities.test-rest-template)8.4.4. TestRestTemplate

`TestRestTemplate` 是Spring `RestTemplate` 的一种便捷替代方案,在集成测试中非常有用. 您可以使用普通模板或发送基本 HTTP 身份验证 (带有用户名和密码) 的模板. 在任何一种情况下, 模版都具有容错性，这意味着它以一种测试友好的方式运行，不会在 4xx 和 5xx 错误上抛出异常。相反，可以通过返回的 `ResponseEntity` 及其状态码检测此类错误。

Spring Framework 5.0 提供了一个新的 `WebTestClient`,可用于 [WebFlux 集成测试](#features.testing.spring-boot-applications.spring-webflux-tests) 和 [WebFlux 和 MVC 端到端测试](#features.testing.spring-boot-applications.with-running-server). 与 `TestRestTemplate` 不同,它为声明提供了流式的 API.

建议 (但不是强制性的) 使用 Apache HTTP Client (版本 4.3.2 或更高版本) . 如果您在类路径中具有该名称,则 `TestRestTemplate` 会通过适当配置客户端进行响应. 如果您确实使用 Apache 的 HTTP 客户端,则会启用一些其他易于测试的功能:

*   不支持重定向(因此可以断言响应位置).
    
*   忽略 cookie(因此模板是无状态的).
    

`TestRestTemplate` 可以在你的集成测试中直接实例化,如下面的例子所示:

Java

Kotlin

    class MyTests {
    
        private final TestRestTemplate template = new TestRestTemplate();
    
        @Test
        void testRequest() {
            ResponseEntity<String> headers = this.template.getForEntity("https://myhost.example.com/example", String.class);
            assertThat(headers.getHeaders().getLocation()).hasHost("other.example.com");
        }
    
    }
    

或者,如果将 `@SpringBootTest` 注解与 `WebEnvironment.RANDOM_PORT` 或 `WebEnvironment.DEFINED_PORT` 一起使用,则可以注入完全配置的 `TestRestTemplate` 并开始使用它. 如有必要,可以通过 `RestTemplateBuilder` bean 应用其他定制. 未指定主机和端口的所有 URL 都会自动连接到嵌入式服务器,如以下示例所示:

Java

Kotlin

    @SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
    class MySpringBootTests {
    
        @Autowired
        private TestRestTemplate template;
    
        @Test
        void testRequest() {
            HttpHeaders headers = this.template.getForEntity("/example", String.class).getHeaders();
            assertThat(headers.getLocation()).hasHost("other.example.com");
        }
    
        @TestConfiguration(proxyBeanMethods = false)
        static class RestTemplateBuilderConfiguration {
    
            @Bean
            RestTemplateBuilder restTemplateBuilder() {
                return new RestTemplateBuilder().setConnectTimeout(Duration.ofSeconds(1))
                        .setReadTimeout(Duration.ofSeconds(1));
            }
    
        }
    
    }
    

[](#features.developing-auto-configuration)9\. 创建自己的自动配置
-------------------------------------------------------------------------------------------------------------------------------

如果您在公司负责开发公共类库,或者如果您在开发一个开源或商业库,您可能希望开发自己的自动配置. 自动配置类可以捆绑在外部 jar 中,他仍然可以被 Spring Boot 获取.

自动配置可以与提供自动配置代码的 starter 以及您将使用的类库库相关联. 我们首先介绍构建自己的自动配置需要了解的内容,然后我们将继续介绍创建 [自定义 starter 所需的步骤](#features.developing-auto-configuration.custom-starter).

### [](#features.developing-auto-configuration.understanding-auto-configured-beans)9.1. 理解自动配置的 Beans

实现自动配置的类用 `@AutoConfiguration` 注解。 此注解本身使用 `@Configuration` 进行元注解，使自动配置成为标准的 `@Configuration` 类。 `@Conditional` 注解用于约束何时应用自动配置。 通常，自动配置类使用 `@ConditionalOnClass` 和 `@ConditionalOnMissingBean` 注解。 这可确保仅在找到相关类时以及未声明您自己的 `@Configuration` 时才应用自动配置.

您可以浏览 [`spring-boot-autoconfigure`](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure) 的源代码,以查看 Spring 提供的 `@AutoConfiguration` 类 (请参阅 [`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot-autoconfigure/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports) 文件).

### [](#features.developing-auto-configuration.locating-auto-configuration-candidates)9.2. 找到候选的自动配置

Spring Boot 会检查已发布 jar 中是否存在 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 文件. 该文件列出您的配置类，每行一个类名，如以下示例所示：,如下所示:

com.mycorp.libx.autoconfigure.LibXAutoConfiguration
com.mycorp.libx.autoconfigure.LibXWebAutoConfiguration

TIP

您可以使用 `#` 号添加注释.

必须以这种方式加载自动配置. 确保它们在特定的包空间中定义,并且它们不能是组件扫描的目标. 此外,自动配置类不应启用组件扫描以查找其他组件. 应该使用特定的 `@Imports` 来代替.

如果需要按特定顺序应用配置,则可以使用 [`@AutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/AutoConfiguration.java) 的 `before`, `beforeName`, `after` 和 `afterName` 属性。 或使用 [`@AutoConfigureAfter`](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/AutoConfigureAfter.java) 或 [`@AutoConfigureBefore`](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/AutoConfigureBefore.java) 注解. 例如,如果您提供特定于 Web 的配置,则可能需要在 `WebMvcAutoConfiguration` 之后应用您的类.

如果您想排序某些不应该彼此直接了解的自动配置,您也可以使用 `@AutoConfigureOrder`. 该注解与常规 `@Order` 注解有相同的语义,但它为自动配置类提供了专用顺序.

与标准的 `@Configuration` 类一样,自动配置类的应用顺序仅会影响其 bean 的定义顺序.随后创建这些 bean 的顺序不受影响,并由每个 bean 的依赖关系和任何 `@DependsOn` 关系确定.

### [](#features.developing-auto-configuration.condition-annotations)9.3. 条件注解

您几乎总希望在自动配置类中包含一个或多个 `@Conditional` 注解. `@ConditionalOnMissingBean` 是一个常用的注解,其允许开发人员在对您的默认值不满意用于覆盖自动配置.

Spring Boot 包含许多 `@Conditional` 注解,您可以通过注解 `@Configuration` 类或单独的 `@Bean` 方法在您自己的代码中复用它们. 这些注解包括:

*   [类条件](#features.developing-auto-configuration.condition-annotations.class-conditions)
    
*   [Bean 条件](#features.developing-auto-configuration.condition-annotations.bean-conditions)
    
*   [属性条件](#features.developing-auto-configuration.condition-annotations.property-conditions)
    
*   [资源条件](#features.developing-auto-configuration.condition-annotations.resource-conditions)
    
*   [Web 应用程序条件](#features.developing-auto-configuration.condition-annotations.web-application-conditions)
    
*   [SpEL 表达式条件](#features.developing-auto-configuration.condition-annotations.spel-conditions)
    

#### [](#features.developing-auto-configuration.condition-annotations.class-conditions)9.3.1. 类条件

`@ConditionalOnClass` 和 `@ConditionalOnMissingClass` 注解允许根据特定类的是否存在来包含 `@Configuration` 类. 由于使用 [ASM](https://asm.ow2.io/) 解析注解元数据,您可以使用 `value` 属性来引用真实类,即使该类实际上可能不会出现在正在运行的应用程序的 `classpath` 中. 如果您希望使用 `String` 值来指定类名,也可以使用 `name` 属性.

此机制不会以相同的方式应用于返回类型是条件的目标的 `@Bean` 方法: 在方法上的条件应用之前,JVM 将加载类和可能处理的方法引用,如果找不到类,将发生失败.

要处理这种情况,可以使用单独的 `@Configuration` 类来隔离条件,如下所示:

Java

Kotlin

    @AutoConfiguration
    // Some conditions ...
    public class MyAutoConfiguration {
    
        // Auto-configured beans ...
    
        @Configuration(proxyBeanMethods = false)
        @ConditionalOnClass(SomeService.class)
        public static class SomeServiceConfiguration {
    
            @Bean
            @ConditionalOnMissingBean
            public SomeService someService() {
                return new SomeService();
            }
    
        }
    
    }
    

如果使用 `@ConditionalOnClass` 或 `@ConditionalOnMissingClass` 作为元注解的一部分来组成自己的组合注解,则必须使用 `name` 来引用类,在这种情况将不作处理.

#### [](#features.developing-auto-configuration.condition-annotations.bean-conditions)9.3.2. Bean 条件

`@ConditionalOnBean` 和 `@ConditionalOnMissingBean` 注解允许根据特定 bean 是否存在来包含 bean. 您可以使用 `value` 属性按类型或使用 `name` 来指定 bean. `search` 属性允许您限制在搜索 bean 时应考虑的 `ApplicationContext` 层次结构.

放置在 `@Bean` 方法上时,目标类型默认为方法的返回类型,如下所示:

Java

Kotlin

    @AutoConfiguration
    public class MyAutoConfiguration {
    
        @Bean
        @ConditionalOnMissingBean
        public SomeService someService() {
            return new SomeService();
        }
    
    }
    

在前面的示例中,如果 `ApplicationContext` 中不包含 `SomeService` 类型的 bean,则将创建 `someService` bean.

您需要非常小心地添加 bean 定义的顺序,因为这些条件是根据到目前为止已处理的内容进行计算的. 因此,我们建议在自动配置类上仅使用 `@ConditionalOnBean` 和 `@ConditionalOnMissingBean` 注解 (因为这些注解保证在添加所有用户定义的 bean 定义后加载) .

`@ConditionalOnBean` 和 `@ConditionalOnMissingBean` 不会阻止创建 `@Configuration` 类. 在类级别使用这些条件并使用注解标记每个包含 `@Bean` 方法的唯一区别是,如果条件不匹配,前者会阻止将 `@Configuration` 类注册为 bean.

声明 `@Bean` 方法时,请在该方法的返回类型中提供尽可能多的类型信息.例如,如果您的 bean 的具体类实现一个接口,则 bean 方法的返回类型应该是具体的类而不是接口. 使用 bean 条件时,在 `@Bean` 方法中提供尽可能多的类型信息尤为重要,因为它们的评估只能依靠方法签名中可用的类型信息.

#### [](#features.developing-auto-configuration.condition-annotations.property-conditions)9.3.3. 属性条件

`@ConditionalOnProperty` 注解允许基于 Spring Environment 属性包含配置. 使用 `prefix` 和 `name` 属性指定需要检查的属性. 默认情况下,匹配存在且不等于 `false` 的所有属性. 您还可以使用 `havingValue` 和 `matchIfMissing` 属性创建更高级的检查.

#### [](#features.developing-auto-configuration.condition-annotations.resource-conditions)9.3.4. 资源条件

`@ConditionalOnResource` 注解仅允许在存在特定资源时包含配置. 可以使用常用的 Spring 约定来指定资源,如下所示: `file:/home/user/test.dat`.

#### [](#features.developing-auto-configuration.condition-annotations.web-application-conditions)9.3.5. Web 应用程序条件

`@ConditionalOnWebApplication` 和 `@ConditionalOnNotWebApplication` 注解在应用程序为 Web 应用程序的情况下是否包含配置. 基于 servlet 的 Web 应用程序是使用 Spring `WebApplicationContext` 定义 `session` 作用域或具有 `ConfigurableWebEnvironment` 的任何应用程序。 响应式 Web 应用程序是使用 `ReactiveWebApplicationContext` 或具有 `ConfigurableReactiveWebEnvironment`

通过 `@ConditionalOnWarDeployment` 注解,可以根据应用程序是否是已部署到容器的传统 WAR 应用程序进行配置.对于嵌入式服务器运行的应用程序,此条件将不匹配.

#### [](#features.developing-auto-configuration.condition-annotations.spel-conditions)9.3.6. SpEL 表达式条件

`@ConditionalOnExpression` 注解允许根据 [SpEL 表达式](/blog/learning/spring/core/ioc#expressions) 的结果包含配置.

在表达式中引用 bean 将导致该 bean 在上下文刷新处理中很早就被初始化。 这样做的结果是，bean 将不适合进行后处理（例如配置属性绑定），并且其状态可能不完整。

### [](#features.developing-auto-configuration.testing)9.4. 测试自动配置

自动配置可能受许多因素的影响: 用户配置 (`@Bean` 定义和 `Environment` 自定义) 、条件评估 (存在特定的类库) 等. 具体而言,每个测试都应该创建一个定义良好的 `ApplicationContext`,它表示这些自定义的组合. `ApplicationContextRunner` 提供了一个好的实现方法.

`ApplicationContextRunner` 通常被定义为测试类的一个字段,用于收集基本的通用配置. 以下示例确保始终调用 `MyServiceAutoConfiguration`:

Java

Kotlin

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(MyServiceAutoConfiguration.class));
    

如果必须定义多个自动配置,则无需按照与运行应用程序时完全相同的顺序调用它们的声明.

每个测试都可以使用 runner 来表示特定的用例. 例如,下面的示例调用用户配置 (`UserConfiguration`) 并检查自动配置是否正确退回. 调用 `run` 提供了一个可以与 `AssertJ` 一起使用的回调上下文.

Java

Kotlin

    @Test
    void defaultServiceBacksOff() {
        this.contextRunner.withUserConfiguration(UserConfiguration.class).run((context) -> {
            assertThat(context).hasSingleBean(MyService.class);
            assertThat(context).getBean("myCustomService").isSameAs(context.getBean(MyService.class));
        });
    }
    
    @Configuration(proxyBeanMethods = false)
    static class UserConfiguration {
    
        @Bean
        MyService myCustomService() {
            return new MyService("mine");
        }
    
    }
    

也可以轻松自定义 `Environment`,如下所示:

Java

Kotlin

    @Test
    void serviceNameCanBeConfigured() {
        this.contextRunner.withPropertyValues("user.name=test123").run((context) -> {
            assertThat(context).hasSingleBean(MyService.class);
            assertThat(context.getBean(MyService.class).getName()).isEqualTo("test123");
        });
    }
    

runner 还可用于展示 `ConditionEvaluationReport`. 报告可以在 `INFO` 或 `DEBUG` 级别下打印. 以下示例展示如何使用 `ConditionEvaluationReportLoggingListener` 在自动配置测试中打印报表.

Java

Kotlin

    class MyConditionEvaluationReportingTests {
    
        @Test
        void autoConfigTest() {
            new ApplicationContextRunner()
                .withInitializer(ConditionEvaluationReportLoggingListener.forLogLevel(LogLevel.INFO))
                .run((context) -> {
                        // Test something...
                });
        }
    
    }
    

#### [](#features.developing-auto-configuration.testing.simulating-a-web-context)9.4.1. 模拟一个 Web 上下文

如果需要测试一个仅在 Servlet 或响应式 Web 应用程序上下文中运行的自动配置,请分别使用 `WebApplicationContextRunner` 或 `ReactiveWebApplicationContextRunner`.

#### [](#features.developing-auto-configuration.testing.overriding-classpath)9.4.2. 覆盖 Classpath

还可以测试在运行时不存在特定类和/或包时发生的情况. Spring Boot 附带了一个可以由跑步者轻松使用的 `FilteredClassLoader`. 在以下示例中,我们声明如果 `MyService` 不存在,则会正确禁用自动配置:

Java

Kotlin

    @Test
    void serviceIsIgnoredIfLibraryIsNotPresent() {
        this.contextRunner.withClassLoader(new FilteredClassLoader(MyService.class))
                .run((context) -> assertThat(context).doesNotHaveBean("myService"));
    }
    

### [](#features.developing-auto-configuration.custom-starter)9.5. 创建自己的 Starter

一个典型的 Spring Boot 启动器包含用于自动配置和使用的基础技术结构的代码,我们称其为 "acme". 为了使其易于扩展,可以将命名空间中的许多配置项暴露给环境.最后,提供了一个 "starter" 依赖,以帮助用户尽可能轻松地入门.

具体而言,自定义启动器可以包含以下内容:

*   `autoconfigure` 模块,为 "acme" 包含自动配置代码.
    
*   `starter` 模块,它为 "acme" 提供对 `autoconfigure` 模块依赖以及类库和常用的其他依赖. 简而言之,添加 starter 应该提供该库开始使用所需的一切依赖.
    

完全没有必要将这两个模块分开.如果 "acme" 具有多种功能,选项或可选功能,则最好将自动配置分开,这样您可以清楚地表示某些功能是可选的.此外,您还可以制作一个启动器,以提供有关可选的依赖. 同时,其他人只能依靠 `autoconfigure` 模块来制作自己的具有不同选项的启动器.

如果自动配置相对简单并且不具有可选功能,则将两个模块合并在启动器中绝对是一种选择.

#### [](#features.developing-auto-configuration.custom-starter.naming)9.5.1. 命名

您应该确保为您的 starter 提供一个合适的命名空间. 即使您使用其他 Maven groupId,也不要使用 `spring-boot` 作为模块名称的开头. 我们可能会为您以后自动配置的内容提供官方支持.

根据经验,您应该在 starter 后命名一个组合模块. 例如,假设您正在为 acme 创建一个 starter,并且您将自动配置模块命名为 `acme-spring-boot`,将 starter 命名为 `acme-spring-boot-starter`. 如果您只有一个组合这两者的模块,请将其命名为 `acme-spring-boot-starter`.

#### [](#features.developing-auto-configuration.custom-starter.configuration-keys)9.5.2. 配置 keys

此外,如果您的 starter 提供配置 key,请为它们使用唯一的命名空间. 尤其是,不要将您的 key 包含在 Spring Boot 使用的命名空间中 (例如 `server`、`management`、`spring` 等) . 如果您使用了相同的命名空间,我们将来可能会以破坏您的模块的方式来修改这些命名空间. 根据经验,所有 key 都必须拥有自己的命名空间 (例如 `acme`) .

通过为每个属性添加字段 javadoc 来确保记录了配置 keys,如以下示例所示:

Java

Kotlin

    @ConfigurationProperties("acme")
    public class AcmeProperties {
    
        /**
         * Whether to check the location of acme resources.
         */
        private boolean checkLocation = true;
    
        /**
         * Timeout for establishing a connection to the acme server.
         */
        private Duration loginTimeout = Duration.ofSeconds(3);
    
        // getters/setters ...
    
    }
    

您仅应将简单文本与 `@ConfigurationProperties` 字段 Javadoc 一起使用,因为在将它们添加到 JSON 之前不会对其进行处理.

这是我们内部遵循的一些规则,以确保描述一致:

*   请勿以 "The" 或 "A" 头描述.
    
*   对于布尔类型,请从 "Whether" 或 "Enable" 开始描述.
    
*   对于基于集合的类型,请以 "以逗号分隔的列表" 开始描述
    
*   使用 `java.time.Duration` 而不是 `long`,如果它不等于毫秒,请说明默认单位,例如 "如果未指定持续时间后缀,则将使用秒".
    
*   除非必须在运行时确定默认值,否则请不要在描述中提供默认值.
    

确保 [触发元数据生成](configuration-metadata.html#appendix.configuration-metadata.annotation-processor) ,以便为您的 key 提供 IDE 帮助. . 您可能需要查看生成的元数据 (`META-INF/spring-configuration-metadata.json`) ,以确保您的 key 记录是否正确. 在兼容的 IDE 中使用自己的 starter 也是验证元数据质量的好主意.

#### [](#features.developing-auto-configuration.custom-starter.autoconfigure-module)9.5.3. `autoconfigure` 模块

`autoconfigure` 模块包含类库开始使用所需的所有内容. 它还可以包含配置 key 定义 (例如 `@ConfigurationProperties`) 和任何可用于进一步自定义组件初始化方式的回调接口.

您应该将类库的依赖标记为可选,以便您可以更轻松地在项目中包含 `autoconfigure` 模块. 如果以这种方式执行,则不提供类库,默认情况下,Spring Boot 将会退出.

Spring Boot 使用注解处理器来收集元数据文件 (`META-INF/spring-autoconfigure-metadata.properties`) 中自动配置的条件.如果该文件存在,则用于快速过滤不匹配的自动配置,缩短启动时间.

当使用 Maven 构件，建议在包含自动配置的模块中添加以下依赖:

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-autoconfigure-processor</artifactId>
        <optional>true</optional>
    </dependency>

如果您直接在应用程序中定义了自动配置,请确保配置 `spring-boot-maven-plugin`,以防止 `repackage` 目标将依赖添加到 fat jar 中:

    <project>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <configuration>
                        <excludes>
                            <exclude>
                                <groupId>org.springframework.boot</groupId>
                                <artifactId>spring-boot-autoconfigure-processor</artifactId>
                            </exclude>
                        </excludes>
                    </configuration>
                </plugin>
            </plugins>
        </build>
    </project>

使用 Gradle ,应在 `annotationProcessor` 配置中声明依赖,如下所示:

    dependencies {
        annotationProcessor "org.springframework.boot:spring-boot-autoconfigure-processor"
    }

#### [](#features.developing-auto-configuration.custom-starter.starter-module)9.5.4. Starter 模块

starter 真的是一个空 jar. 它的唯一目的是为使用类库提供必要的依赖. 您可以将其视为使用类库的一切基础.

不要对添加 starter 的项目抱有假设想法. 如果您自动配置的库经常需要其他 starter,请一并声明它们. 如果可选依赖的数量很多,则提供一组适当的默认依赖可能很难,因为您本应该避免包含对常用库的使用不必要的依赖. 换而言之,您不应该包含可选的依赖.

无论哪种方式,您的 starter 必须直接或间接引用 Spring Boot 的 core starter (`spring-boot-starter`) (如果您的 starter 依赖于另一个 starter ,则无需添加它) . 如果只使用自定义 starter 创建项目,则 Spring Boot 的核心功能将通过 core starter 来实现.

[](#features.kotlin)10\. Kotlin 支持
---------------------------------------------------------------------------------------------------------

[Kotlin](https://kotlinlang.org/) 是一种针对 JVM (和其他平台) 的静态类型语言,它可编写出简洁而优雅的代码,同时提供与使用 Java 编写的现有库的 [互通性](https://kotlinlang.org/docs/reference/java-interop.html).

开始学习 Spring Boot 和 Kotlin 最简单方法是遵循这个 [全面教程](https://spring.io/guides/tutorials/spring-boot-kotlin/). 您可以通过 [start.spring.io](https://start.spring.io/#!language=kotlin) 创建新的 Kotlin 项目. 如果您需要支持,请免费加入 [Kotlin Slack](https://slack.kotlinlang.org/) 的 #spring 频道或使用 [Stack Overflow](https://stackoverflow.com/questions/tagged/spring+kotlin) 上的 `spring` 和 `kotlin` 标签提问.

### [](#features.kotlin.requirements)10.1. 要求

Spring Boot 支持 Kotlin 1.7.x. 要使用 Kotlin,classpath 下必须存在 `org.jetbrains.kotlin:kotlin-stdlib` 和 `org.jetbrains.kotlin:kotlin-reflect`. 也可以使用 `kotlin-stdlib` 的变体 `kotlin-stdlib-jdk7` 和 `kotlin-stdlib-jdk8`.

由于 [Kotlin 类默认为 final](https://discuss.kotlinlang.org/t/classes-final-by-default/166),因此您可能需要配置 [kotlin-spring](https://kotlinlang.org/docs/reference/compiler-plugins.html#spring-support) 插件以自动打开 `Spring-annotated` 类,以便可以代理它们.

在 Kotlin 中序列化/反序列化 JSON 数据需要使用 [Jackson 的 Kotlin 模块](https://github.com/FasterXML/jackson-module-kotlin). 在 classpath 中找到它时会自动注册. 如果 Jackson 和 Kotlin 存在但 Jackson Kotlin 模块不存在,则会记录警告消息.

如果在 [start.spring.io](https://start.spring.io/#!language=kotlin) 上创建 Kotlin 项目,则默认提供这些依赖和插件.

### [](#features.kotlin.null-safety)10.2. Null 安全

Kotlin 的一个关键特性是 [null-safety](https://kotlinlang.org/docs/reference/null-safety.html). 它在编译时处理空值,而不是将问题推迟到运行时并遇到 `NullPointerException`. 这有助于消除常见的错误来源,而无需支付像 `Optional` 这样的包装器的成本. Kotlin 还允许使用有可空值的,如 Kotlin `null` [安全综合指南中](https://www.baeldung.com/kotlin-null-safety)所述.

虽然 Java 不允许在其类型系统中表示 `null` 安全,但 Spring Framework、Spring Data 和 Reactor 现在通过易于使用的工具的注解提供其 API 的安全性. 默认情况下,Kotlin 中使用的 Java API 类型被识别为放宽空检查的 [平台类型](https://kotlinlang.org/docs/reference/java-interop.html#null-safety-and-platform-types). Kotlin 对 [JSR 305 注解](https://kotlinlang.org/docs/reference/java-interop.html#jsr-305-support) 的支持与可空注解相结合,为 Kotlin 中 Spring API 相关的代码提供了空安全.

可以通过使用以下选项添加 `-Xjsr305` 编译器标志来配置 JSR 305 检查: `-Xjsr305={strict|warn|ignore}`. 默认行为与 `-Xjsr305=warn` 相同. 在从 Spring API 推断出的 Kotlin 类型中需要考虑 null 安全的 `strict` 值,但是应该使用 Spring API 可空声明甚至可以在次要版本之间发展并且将来可能添加更多检查的方案.

尚不支持泛型类型参数、varargs 和数组元素可空性. 有关最新信息,请参见 [SPR-15942](https://jira.spring.io/browse/SPR-15942). 另请注意,Spring Boot 自己的 API [尚未注解](https://github.com/spring-projects/spring-boot/issues/10712).

### [](#features.kotlin.api)10.3. Kotlin API

#### [](#features.kotlin.api.run-application)10.3.1. runApplication

Spring Boot 提供了使用 `runApplication<MyApplication>(*args)` 运行应用程序的惯用方法,如下所示:

    @SpringBootApplication
    class MyApplication
    
    fun main(args: Array<String>) {
        runApplication<MyApplication>(*args)
    }
    

这是 `SpringApplication.run(MyApplication::class.java, *args)` 的替代方式. 它还允许自定义应用程序,如下所示:

    runApplication<MyApplication>(*args) {
        setBannerMode(OFF)
    }
    

#### [](#features.kotlin.api.extensions)10.3.2. 扩展

Kotlin [扩展](https://kotlinlang.org/docs/reference/extensions.html) 提供了使用附加功能扩展现有类的能力. Spring Boot Kotlin API 利用这些扩展为现有 API 添加新的 Kotlin 特定便利.

提供的 `TestRestTemplate` 扩展类似于 Spring Framework 为 `RestOperations` 提供的. 除此之外,扩展使得利用 Kotlin reified 类型参数变为可能.

### [](#features.kotlin.dependency-management)10.4. 依赖管理

为了避免在 classpath 上混合不同版本的 Kotlin 依赖,Spring Boot会导入Kotlin BOM.

使用Maven,可以通过 `kotlin.version` 属性自定义 Kotlin 版本,并且为 `kotlin-maven-plugin` 提供了插件管理. 使用 Gradle,Spring Boot 插件会自动将 `kotlin.version` 与 Kotlin 插件的版本保一致.

Spring Boot 还通过导入 Kotlin Coroutines BOM 管理 Coroutines 依赖的版本. 可以通过 `kotlin-coroutines.version` 属性自定义版本.

如果在 [start.spring.io](https://start.spring.io/#!language=kotlin) 上构建的 Kotlin 项目有至少一个响应式依赖,则默认提供 `org.jetbrains.kotlinx:kotlinx-coroutines-reactor` 依赖.

### [](#features.kotlin.configuration-properties)10.5. @ConfigurationProperties

`@ConfigurationProperties` 与 [`@ConstructorBinding`](#features.external-config.typesafe-configuration-properties.constructor-binding) 结合使用时,`@ConfigurationProperties` 支持具有不变 `val` 属性的类,如以下示例所示:

    @ConfigurationProperties("example.kotlin")
    data class KotlinExampleProperties(
            val name: String,
            val description: String,
            val myService: MyService) {
    
        data class MyService(
                val apiToken: String,
                val uri: URI
        )
    }
    

为了使用注解处理器 [生成自己的元数据](configuration-metadata.html#appendix.configuration-metadata.annotation-processor) ,应该使用 `spring-boot-configuration-processor` 依赖配置 [`kapt`](https://kotlinlang.org/docs/reference/kapt.html) . 请注意,由于 kapt 提供的模型的限制,某些功能 (例如检测默认值或不推荐使用的项目) 无法正常工作.

### [](#features.kotlin.testing)10.6. 测试

虽然可以使用 JUnit 4 来测试 Kotlin 代码,但建议使用 JUnit 5. JUnit 5 允许测试类实例化一次,并在所有类的测试中复用. 这使得可以在非静态方法上使用 `@BeforeAll` 和 `@AfterAll` 注解,这非常适合 Kotlin.

要模拟 Kotlin 类,建议使用 MockK. 如果您需要与 Mockito 特定的 [`@MockBean` 和 `@SpyBean` 注解](#features.testing.spring-boot-applications.mocking-beans)相对应的 Mockk,则可以使用 SpringMockK,它提供类似的 `@MockkBean` 和 `@SpykBean` 注解.

### [](#features.kotlin.resources)10.7. 资源

#### [](#features.kotlin.resources.further-reading)10.7.1. 进阶阅读

*   [Kotlin 语言参考](https://kotlinlang.org/docs/reference/)
    
*   [Kotlin Slack](https://kotlinlang.slack.com/) (有专用的 #spring 频道)
    
*   [Stackoverflow 上 `spring` 和 `kotlin` 标签](https://stackoverflow.com/questions/tagged/spring+kotlin)
    
*   [在浏览器中尝试 Kotlin](https://try.kotlinlang.org/)
    
*   [Kotlin 博客](https://blog.jetbrains.com/kotlin/)
    
*   [Awesome Kotlin](https://kotlin.link/)
    
*   [教程: 使用 Spring Boot 和 Kotlin 构建 Web 应用程序](https://spring.io/guides/tutorials/spring-boot-kotlin/)
    
*   [使用 Kotlin 开发 Spring Boot 应用程序](https://spring.io/blog/2016/02/15/developing-spring-boot-applications-with-kotlin)
    
*   [使用 Kotlin、Spring Boot 和 PostgreSQL 开发地理信息](https://spring.io/blog/2016/03/20/a-geospatial-messenger-with-kotlin-spring-boot-and-postgresql)
    
*   [在 Spring Framework 5.0 中引入 Kotlin 支持](https://spring.io/blog/2017/01/04/introducing-kotlin-support-in-spring-framework-5-0)
    
*   [Spring Framework 5 Kotlin API 实现函数式](https://spring.io/blog/2017/08/01/spring-framework-5-kotlin-apis-the-functional-way)
    

#### [](#features.kotlin.resources.examples)10.7.2. 示例

*   [spring-boot-kotlin-demo](https://github.com/sdeleuze/spring-boot-kotlin-demo): regular Spring Boot + Spring Data JPA project
    
*   [mixit](https://github.com/mixitconf/mixit): Spring Boot 2 + WebFlux + Reactive Spring Data MongoDB
    
*   [spring-kotlin-fullstack](https://github.com/sdeleuze/spring-kotlin-fullstack): WebFlux Kotlin fullstack example with Kotlin2js for frontend instead of JavaScript or TypeScript
    
*   [spring-petclinic-kotlin](https://github.com/spring-petclinic/spring-petclinic-kotlin): Kotlin version of the Spring PetClinic Sample Application
    
*   [spring-kotlin-deepdive](https://github.com/sdeleuze/spring-kotlin-deepdive): a step by step migration for Boot 1.0 + Java to Boot 2.0 + Kotlin
    
*   [spring-boot-coroutines-demo](https://github.com/sdeleuze/spring-boot-coroutines-demo): Coroutines sample project
    

[](#features.whats-next)11\. 下一步
-------------------------------------------------------------------------------------------------------

如果您想了解本节中讨论的任何类目的更多信息,可以查看 [Spring Boot API 文档](https://docs.spring.io/spring-boot/docs/3.0.0/api) ,也可以直接浏览 [源代码](https://github.com/spring-projects/spring-boot/tree/main) . 如果您有具体问题,请查看 [how-to](howto.html#howto) 部分.

如果您对 Spring Boot 的核心功能感到满意,可以继续阅读有关t [生产就绪功能](actuator.html#actuator)的内容.

> Copyright © 2002 - 2024 VMware, Inc. All Rights Reserved.

> Copies of this document may be made for your own use and for distribution to others, provided that you do not charge any fee for such copies and further provided that each copy contains this Copyright Notice, whether distributed in print or electronically.
