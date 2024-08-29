---
title: 通用抽象
keywords: [Spring Cloud Alibaba,Spring Cloud]
description: "Spring Cloud 中文文档"
author: Spring 教程
date: "2024-04-10"
category: spring-cloud
---

## 3\. Spring Cloud Commons：通用抽象
-----------------------------

服务发现，负载平衡和断路器之类的模式将它们带到一个通用的抽象层，可以由所有Spring Cloud客户端使用，而与实现无关（例如，使用Eureka或Consul进行的发现） ）。

[](#_enablediscoveryclient)3.1 @EnableDiscoveryClient
-----------------------------------------------------------------------------------------------------------

Spring Cloud Commons提供了`@EnableDiscoveryClient`批注。这将寻找`META-INF/spring.factories`与`DiscoveryClient`接口的实现。Discovery Client的实现在`org.springframework.cloud.client.discovery.EnableDiscoveryClient`键下将配置类添加到`spring.factories`。`DiscoveryClient`实现的示例包括[Spring Cloud Netflix Eureka](https://cloud.spring.io/spring-cloud-netflix/)，[Spring Cloud Consul发现](https://cloud.spring.io/spring-cloud-consul/)和[Spring Cloud Zookeeper发现](https://cloud.spring.io/spring-cloud-zookeeper/)。

默认情况下，`DiscoveryClient`的实现会自动将本地Spring Boot服务器注册到远程发现服务器。可以通过在`@EnableDiscoveryClient`中设置`autoRegister=false`来禁用此行为。


不再需要`@EnableDiscoveryClient`。您可以在类路径上放置`DiscoveryClient`实现，以使Spring Boot应用程序向服务发现服务器注册。

### [](#_health_indicator)3.1.1健康指标

公用创建了Spring Boot `HealthIndicator`，`DiscoveryClient`实现可以通过实现`DiscoveryHealthIndicator`来参与。要禁用复合`HealthIndicator`，请设置`spring.cloud.discovery.client.composite-indicator.enabled=false`。基于`DiscoveryClient`的通用`HealthIndicator`是自动配置的（`DiscoveryClientHealthIndicator`）。要禁用它，请设置`spring.cloud.discovery.client.health-indicator.enabled=false`。要禁用`DiscoveryClientHealthIndicator`的描述字段，请设置`spring.cloud.discovery.client.health-indicator.include-description=false`。否则，它可能会像已卷起的`HealthIndicator`中的`description`一样冒泡。

### [](#_ordering_discoveryclient_instances)3.1.2订购`DiscoveryClient`实例

`DiscoveryClient`接口扩展了`Ordered`。当使用多个发现客户端时，这很有用，因为它允许您定义返回的发现客户端的顺序，类似于如何订购由Spring应用程序加载的beans。默认情况下，任何`DiscoveryClient`的顺序都设置为`0`。如果要为自定义`DiscoveryClient`实现设置不同的顺序，则只需覆盖`getOrder()`方法，以便它返回适合您的设置的值。除此之外，您可以使用属性来设置Spring Cloud提供的`DiscoveryClient`实现的顺序，其中包括`ConsulDiscoveryClient`，`EurekaDiscoveryClient`和`ZookeeperDiscoveryClient`。为此，您只需要将`spring.cloud.{clientIdentifier}.discovery.order`（对于Eureka，则为`eureka.client.order`）属性设置为所需的值。

[](#_serviceregistry)3.2服务注册
----------------------------------------------------------------------------------

Commons现在提供一个`ServiceRegistry`接口，该接口提供诸如`register(Registration)`和`deregister(Registration)`之类的方法，这些方法使您可以提供自定义的注册服务。`Registration`是标记界面。

以下示例显示了正在使用的`ServiceRegistry`：

_@Configuration_
_@EnableDiscoveryClient(autoRegister=false)_
public class MyConfiguration {
    private ServiceRegistry registry;

    public MyConfiguration(ServiceRegistry registry) {
        this.registry = registry;
    }

    // called through some external process, such as an event or a custom actuator endpoint
    public void register() {
        Registration registration = constructRegistration();
        this.registry.register(registration);
    }
}

每个`ServiceRegistry`实现都有自己的`Registry`实现。

*   `ZookeeperRegistration`与`ZookeeperServiceRegistry`一起使用
*   `EurekaRegistration`与`EurekaServiceRegistry`一起使用
*   `ConsulRegistration`与`ConsulServiceRegistry`一起使用

如果您使用的是`ServiceRegistry`接口，则将需要为使用的`ServiceRegistry`实现传递正确的`Registry`实现。

### [](#_serviceregistry_auto_registration)3.2.1 ServiceRegistry自动注册

默认情况下，`ServiceRegistry`实现会自动注册正在运行的服务。要禁用该行为，可以设置：\* `@EnableDiscoveryClient(autoRegister=false)`以永久禁用自动注册。\* `spring.cloud.service-registry.auto-registration.enabled=false`通过配置禁用行为。

#### [](#_serviceregistry_auto_registration_events)ServiceRegistry自动注册Events

服务自动注册时将触发两个事件。注册服务之前会触发名为`InstancePreRegisteredEvent`的第一个事件。注册服务后，将触发名为`InstanceRegisteredEvent`的第二个事件。您可以注册`ApplicationListener`，以收听和响应这些事件。

> 如果将`spring.cloud.service-registry.auto-registration.enabled`设置为`false`，则不会触发这些事件。

### [](#_service_registry_actuator_endpoint)3.2.2服务注册表执行器端点

Spring Cloud Commons提供了一个`/service-registry`执行器端点。该端点依赖于Spring应用程序上下文中的`Registration` bean。使用GET调用`/service-registry`会返回`Registration`的状态。对具有JSON正文的同一终结点使用POST会将当前`Registration`的状态更改为新值。JSON正文必须包含带有首选值的`status`字段。请参阅更新状态时用于允许值的`ServiceRegistry`实现的文档以及为状态返回的值。例如，Eureka的受支持状态为`UP`，`DOWN`，`OUT_OF_SERVICE`和`UNKNOWN`。

[](#_spring_resttemplate_as_a_load_balancer_client)3.3 Spring RestTemplate作为负载均衡器客户端
------------------------------------------------------------------------------------------------------------------------------------------

`RestTemplate`可以自动配置为在后台使用负载均衡器客户端。要创建负载均衡的`RestTemplate`，请创建`RestTemplate` `@Bean`并使用`@LoadBalanced`限定符，如以下示例所示：

_@Configuration_
public class MyConfiguration {

    _@LoadBalanced_
    _@Bean_
    RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

public class MyClass {
    _@Autowired_
    private RestTemplate restTemplate;

    public String doOtherStuff() {
        String results = restTemplate.getForObject("http://stores/stores", String.class);
        return results;
    }
}

警告

`RestTemplate` bean不再通过自动配置创建。各个应用程序必须创建它。

URI需要使用虚拟主机名（即服务名，而不是主机名）。Ribbon客户端用于创建完整的物理地址。有关如何设置`RestTemplate`的详细信息，请参见[RibbonAutoConfiguration](https://github.com/spring-cloud/spring-cloud-netflix/blob/master/spring-cloud-netflix-ribbon/src/main/java/org/springframework/cloud/netflix/ribbon/RibbonAutoConfiguration.java)。



重要

为了使用负载均衡的`RestTemplate`，您需要在类路径中具有负载均衡器实现。推荐的实现是`BlockingLoadBalancerClient`\-添加`org.springframework.cloud:spring-cloud-loadbalancer`以便使用它。`RibbonLoadBalancerClient`也可以使用，但是目前正在维护中，我们不建议将其添加到新项目中。

> 如果要使用`BlockingLoadBalancerClient`，请确保项目类路径中没有`RibbonLoadBalancerClient`，因为向后兼容的原因，默认情况下将使用它。

[](#_spring_webclient_as_a_load_balancer_client)3.4 Spring WebClient作为负载均衡器客户端
------------------------------------------------------------------------------------------------------------------------------------

`WebClient`可以自动配置为使用负载均衡器客户端。要创建负载均衡的`WebClient`，请创建`WebClient.Builder` `@Bean`并使用`@LoadBalanced`限定符，如以下示例所示：

_@Configuration_
public class MyConfiguration {

	_@Bean_
	_@LoadBalanced_
	public WebClient.Builder loadBalancedWebClientBuilder() {
		return WebClient.builder();
	}
}

public class MyClass {
    _@Autowired_
    private WebClient.Builder webClientBuilder;

    public Mono<String> doOtherStuff() {
        return webClientBuilder.build().get().uri("http://stores/stores")
        				.retrieve().bodyToMono(String.class);
    }
}

URI需要使用虚拟主机名（即服务名，而不是主机名）。Ribbon客户端用于创建完整的物理地址。



重要

如果要使用`@LoadBalanced WebClient.Builder`，则需要在类路径中有一个loadbalancer实现。建议您将`org.springframework.cloud:spring-cloud-loadbalancer`依赖项添加到项目中。然后，将在下面使用`ReactiveLoadBalancer`。或者，此功能也可以在spring-cloud-starter-netflix-ribbon上使用，但是该请求将由后台的非响应`LoadBalancerClient`处理。此外，spring-cloud-starter-netflix-ribbon已经处于维护模式，因此我们不建议您将其添加到新项目中。



在下面使用的`ReactorLoadBalancer`支持缓存。如果检测到`cacheManager`，将使用`ServiceInstanceSupplier`的缓存版本。如果没有，我们将从发现服务中检索实例，而不进行缓存。如果您使用`ReactiveLoadBalancer`，建议您在项目中[启用缓存](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-caching.html)。

### [](#_retrying_failed_requests)3.4.1重试失败的请求

可以配置负载均衡的`RestTemplate`以重试失败的请求。默认情况下，禁用此逻辑。您可以通过在应用程序的类路径中添加[Spring重试](https://github.com/spring-projects/spring-retry)来启用它。负载平衡的`RestTemplate`遵循与重试失败的请求有关的某些Ribbon配置值。您可以使用`client.ribbon.MaxAutoRetries`，`client.ribbon.MaxAutoRetriesNextServer`和`client.ribbon.OkToRetryOnAllOperations`属性。如果要通过对类路径使用Spring重试来禁用重试逻辑，则可以设置`spring.cloud.loadbalancer.retry.enabled=false`。有关这些属性的作用的说明，请参见[Ribbon文档](https://github.com/Netflix/ribbon/wiki/Getting-Started#the-properties-file-sample-clientproperties)。

如果要在重试中实现`BackOffPolicy`，则需要创建`LoadBalancedRetryFactory`类型的bean并覆盖`createBackOffPolicy`方法：

_@Configuration_
public class MyConfiguration {
    _@Bean_
    LoadBalancedRetryFactory retryFactory() {
        return new LoadBalancedRetryFactory() {
            _@Override_
            public BackOffPolicy createBackOffPolicy(String service) {
        		return new ExponentialBackOffPolicy();
        	}
        };
    }
}

> 前面示例中的`client`应替换为您的Ribbon客户名称。

如果要向重试功能中添加一个或多个`RetryListener`实现，则需要创建类型为`LoadBalancedRetryListenerFactory`的bean，并返回要用于给定服务的`RetryListener`数组，如以下示例所示：

_@Configuration_
public class MyConfiguration {
    _@Bean_
    LoadBalancedRetryListenerFactory retryListenerFactory() {
        return new LoadBalancedRetryListenerFactory() {
            _@Override_
            public RetryListener\[\] createRetryListeners(String service) {
                return new RetryListener\[\]{new RetryListener() {
                    _@Override_
                    public <T, E extends Throwable> boolean open(RetryContext context, RetryCallback<T, E> callback) {
                        //TODO Do you business...
                        return true;
                    }

                    _@Override_
                     public <T, E extends Throwable> void close(RetryContext context, RetryCallback<T, E> callback, Throwable throwable) {
                        //TODO Do you business...
                    }

                    _@Override_
                    public <T, E extends Throwable> void onError(RetryContext context, RetryCallback<T, E> callback, Throwable throwable) {
                        //TODO Do you business...
                    }
                }};
            }
        };
    }
}

[](#_multiple_resttemplate_objects)3.5多个RestTemplate对象
------------------------------------------------------------------------------------------------------------

如果您想要一个`RestTemplate`而不是负载均衡的，请创建一个`RestTemplate` bean并注入它。要访问负载均衡的`RestTemplate`，请在创建`@Bean`时使用`@LoadBalanced`限定符，如以下示例所示：

_@Configuration_
public class MyConfiguration {

    _@LoadBalanced_
    _@Bean_
    RestTemplate loadBalanced() {
        return new RestTemplate();
    }

    _@Primary_
    _@Bean_
    RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

public class MyClass {
_@Autowired_
private RestTemplate restTemplate;

    _@Autowired_
    _@LoadBalanced_
    private RestTemplate loadBalanced;

    public String doOtherStuff() {
        return loadBalanced.getForObject("http://stores/stores", String.class);
    }

    public String doStuff() {
        return restTemplate.getForObject("https://example.com", String.class);
    }
}



重要

注意，在前面的示例中，在普通的`RestTemplate`声明上使用了`@Primary`批注，以消除不合格的`@Autowired`注入的歧义。



如果看到诸如`java.lang.IllegalArgumentException: Can not set org.springframework.web.client.RestTemplate field com.my.app.Foo.restTemplate to com.sun.proxy.$Proxy89`之类的错误，请尝试注入`RestOperations`或设置`spring.aop.proxyTargetClass=true`。

[](#_multiple_webclient_objects)3.6多个WebClient对象
------------------------------------------------------------------------------------------------------

如果要使`WebClient`负载不均衡，请创建一个`WebClient` bean并注入它。要访问负载均衡的`WebClient`，请在创建`@Bean`时使用`@LoadBalanced`限定符，如以下示例所示：

_@Configuration_
public class MyConfiguration {

    _@LoadBalanced_
    _@Bean_
    WebClient.Builder loadBalanced() {
        return WebClient.builder();
    }

    _@Primary_
    _@Bean_
    WebClient.Builder webClient() {
        return WebClient.builder();
    }
}

public class MyClass {
    _@Autowired_
    private WebClient.Builder webClientBuilder;

    _@Autowired_
    _@LoadBalanced_
    private WebClient.Builder loadBalanced;

    public Mono<String> doOtherStuff() {
        return loadBalanced.build().get().uri("http://stores/stores")
        				.retrieve().bodyToMono(String.class);
    }

    public Mono<String> doStuff() {
        return webClientBuilder.build().get().uri("http://example.com")
        				.retrieve().bodyToMono(String.class);
    }
}

[](#loadbalanced-webclient)3.7 Spring WebFlux WebClient作为负载均衡器客户端
-----------------------------------------------------------------------------------------------------------------------

### [](#webflux-with-reactive-loadbalancer)3.7.1 Spring具有响应式负载均衡器的WebFlux WebClient

可以将`WebClient`配置为使用`ReactiveLoadBalancer`。如果将`org.springframework.cloud:spring-cloud-loadbalancer`添加到项目中，并且`spring-webflux`在类路径中，则会自动配置`ReactorLoadBalancerExchangeFilterFunction`。以下示例说明如何配置`WebClient`以在后台使用无功负载均衡器：

public class MyClass {
    _@Autowired_
    private ReactorLoadBalancerExchangeFilterFunction lbFunction;

    public Mono<String> doOtherStuff() {
        return WebClient.builder().baseUrl("http://stores")
            .filter(lbFunction)
            .build()
            .get()
            .uri("/stores")
            .retrieve()
            .bodyToMono(String.class);
    }
}

URI需要使用虚拟主机名（即服务名，而不是主机名）。`ReactorLoadBalancerClient`用于创建完整的物理地址。

### [](#_spring_webflux_webclient_with_non_reactive_load_balancer_client)3.7.2 Spring WebFlux WebClient，带有非反应式负载均衡器客户端

如果您的项目中没有`org.springframework.cloud:spring-cloud-loadbalancer`，但是确实有spring-cloud-starter-netflix-ribbon，则仍可以将`WebClient`与`LoadBalancerClient`结合使用。如果`spring-webflux`在类路径中，将自动配置`LoadBalancerExchangeFilterFunction`。但是请注意，这是在后台使用非反应性客户端。以下示例显示如何配置`WebClient`以使用负载均衡器：

public class MyClass {
    _@Autowired_
    private LoadBalancerExchangeFilterFunction lbFunction;

    public Mono<String> doOtherStuff() {
        return WebClient.builder().baseUrl("http://stores")
            .filter(lbFunction)
            .build()
            .get()
            .uri("/stores")
            .retrieve()
            .bodyToMono(String.class);
    }
}

URI需要使用虚拟主机名（即服务名，而不是主机名）。`LoadBalancerClient`用于创建完整的物理地址。

警告：现在不建议使用此方法。我们建议您将[WebFlux与电抗性负载平衡器一起](#webflux-with-reactive-loadbalancer "3.7.1具有响应式负载均衡器的Spring WebFlux WebClient") 使用。

### [](#_passing_your_own_load_balancer_client_configuration)3.7.3传递自己的Load-Balancer客户端配置

您还可以使用`@LoadBalancerClient`批注传递您自己的负载平衡器客户端配置，并传递负载平衡器客户端的名称和配置类，如下所示：

_@Configuration_
_@LoadBalancerClient(value = "stores", configuration = StoresLoadBalancerClientConfiguration.class)_
public class MyConfiguration {

	_@Bean_
	_@LoadBalanced_
	public WebClient.Builder loadBalancedWebClientBuilder() {
		return WebClient.builder();
	}
}

也可以通过`@LoadBalancerClients`注释将多个配置（对于一个以上的负载均衡器客户端）一起传递，如下所示：

_@Configuration_
_@LoadBalancerClients({@LoadBalancerClient(value = "stores", configuration = StoresLoadBalancerClientConfiguration.class), @LoadBalancerClient(value = "customers", configuration = CustomersLoadBalancerClientConfiguration.class)})_
public class MyConfiguration {

	_@Bean_
	_@LoadBalanced_
	public WebClient.Builder loadBalancedWebClientBuilder() {
		return WebClient.builder();
	}
}

[](#ignore-network-interfaces)3.8忽略网络接口
---------------------------------------------------------------------------------------------

有时，忽略某些命名的网络接口很有用，以便可以将它们从服务发现注册中排除（例如，在Docker容器中运行时）。可以设置正则表达式列表，以使所需的网络接口被忽略。以下配置将忽略`docker0`接口以及所有以`veth`开头的接口：

**application.yml。**

spring:
  cloud:
    inetutils:
      ignoredInterfaces:
        - docker0
        - veth.\*

您还可以通过使用正则表达式列表来强制仅使用指定的网络地址，如以下示例所示：

**bootstrap.yml。**

spring:
  cloud:
    inetutils:
      preferredNetworks:
        - 192.168
        - 10.0

您也可以只使用站点本地地址，如以下示例所示：.application.yml

spring:
  cloud:
    inetutils:
      useOnlySiteLocalInterfaces: true

有关构成站点本地地址的详细信息，请参见[Inet4Address.html.isSiteLocalAddress（）](https://docs.oracle.com/javase/8/docs/api/java/net/Inet4Address.html#isSiteLocalAddress--)。

> Copyright © 2002 - 2024 VMware, Inc. All Rights Reserved.

> Copies of this document may be made for your own use and for distribution to others, provided that you do not charge any fee for such copies and further provided that each copy contains this Copyright Notice, whether distributed in print or electronically.
