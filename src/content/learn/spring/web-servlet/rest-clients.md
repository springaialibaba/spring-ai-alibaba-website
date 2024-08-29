---
title: "Web Clients"
keywords: [Spring Cloud Alibaba,Spring Boot, Web, Rest, Client]
description: "Spring 官方文档、中文文档，Spring Rest Endpoints 使用方式与原理。"
author: Spring 教程
date: "2024-04-19"
category: spring
---

## 1. REST Clients
Spring Framework 为调用 REST 端点提供了以下选择：

- [WebClient](#rest-webclient) - 具有非阻塞、响应式的流式 API 客户端。
- [RestTemplate](#rest-resttemplate) - 具有 template method API 的同步客户端.
- [HTTP Interface](#rest-http-interface) - 具有生成的动态代理实现的注解接口。

### 1.1. WebClient

WebClient 是一个非阻塞的、响应式的客户端，用于执行 HTTP 请求。 它在 5.0 中引入，提供了 RestTemplate 的替代方案，支持同步、异步和流式场景。
WebClient 支持以下内容:

- 非阻塞 I/O。
- Reactive Streams 背压.
- 高并发，硬件资源少。
- 利用 Java 8 lambda 的函数式、流式的 API。
- 同步和异步交互。
- 流式传输到服务器或从服务器进行流式传输。

参阅 Spring 官方文档 WebClient 章节获取更多细节.
### 1.2. RestTemplate
RestTemplate 在 HTTP 客户端库上提供了更高级别的 API,它使得在一行中调用 REST 端点变得容易. 它暴露了以下重载方法组:

> 从 5.0 版本开始， RestTemplate 处于维护模式， 以后只有很小的更改和错误请求被接受. 请考虑使用 WebClient API 替代.


| Method group | Description |
| --- | --- |
| getForObject | 通过 GET 获取响应. |
| getForEntity | 使用 GET 获取 ResponseEntity (即status, headers和body) |
| headForHeaders | 使用 HEAD 获取所有 headers |
| postForLocation | 使用 POST 创建新资源,并从响应中返回 Location 请求头. |
| postForObject | 使用 POST 创建新资源并从响应中返回表示. |
| postForEntity | 使用 POST 创建新资源并从响应中返回表示. |
| put | 使用 PUT 创建或更新资源. |
| patchForObject | 使用 PATCH 更新资源并从响应中返回表示. 请注意,JDK HttpURLConnection 不支持 PATCH,但Apache HttpComponents 和其他一样. |
| delete | 使用 DELETE 删除指定 URI 处的资源. |
| optionsForAllow | 使用 ALLOW 检索资源的允许 HTTP 方法. |
| exchange | 上述方法的更通用 (且不太固定) 的版本,在需要时提供额外的灵活性. 它接受 RequestEntity (包括 HTTP 方法,URL,headers 和正文作为输入) 并返回 ResponseEntity.
这些方法允许使用 ParameterizedTypeReference 而不是 Class 来指定具有泛型的响应类型. |
| execute | 执行请求的最通用方式,通过回调接口完全控制请求准备和响应提取. |

#### 1.2.1. 初始化
默认构造函数使用 java.net.HttpURLConnection 来执行请求. 您可以使用 ClientHttpRequestFactory 的实现切换到不同的 HTTP 库. 内置支持以下内容:

- Apache HttpComponents
- Netty
- OkHttp

例如,要切换到 Apache HttpComponents,您可以使用以下命令:
```
RestTemplate template = new RestTemplate(new HttpComponentsClientHttpRequestFactory());
```
每个 ClientHttpRequestFactory 都暴露特定于底层 HTTP 客户端库的配置选项 - 例如,用于凭据,连接池和其他详细信息.

> 请注意,HTTP 请求的 java.net 实现在访问表示错误的响应的状态 (例如 401) 时可能引发异常. 如果这是一个问题,请切换到另一个 HTTP 客户端库.


##### URIs
许多 RestTemplate 方法都接受 URI 模板和 URI 模板变量， 作为 String 变量参数或 Map<String,String>.
以下示例使用 String 变量参数:
```java
String result = restTemplate.getForObject(
    "https://example.com/hotels/{hotel}/bookings/{booking}", String.class, "42", "21");
```
以下示例使用 Map<String, String>:
```java
Map<String, String> vars = Collections.singletonMap("hotel", "42");

String result = restTemplate.getForObject(
    "https://example.com/hotels/{hotel}/rooms/{hotel}", String.class, vars);
```
请注意， URI 模板是自动编码的， 如以下示例所示:
```java
restTemplate.getForObject("https://example.com/hotel list", String.class);

// Results in request to "https://example.com/hotel%20list"
```
您可以使用 RestTemplate 的 uriTemplateHandler 属性来自定义 URI 的编码方式. 或者， 您可以创建一个 java.net.URI , 并且使用 RestTemplate 中接受 URI 参数的方法之一.
有关使用和编码 URI 的更多详细信息， 请参阅 [URI Links](#mvc-uri-building).
##### Headers
你可以使用 exchange() 方法指定特殊的请求头, 如下:
```java
String uriTemplate = "https://example.com/hotels/{hotel}";
URI uri = UriComponentsBuilder.fromUriString(uriTemplate).build(42);

RequestEntity<Void> requestEntity = RequestEntity.get(uri)
.header("MyRequestHeader", "MyValue")
.build();

ResponseEntity<String> response = template.exchange(requestEntity, String.class);

String responseHeader = response.getHeaders().getFirst("MyResponseHeader");
String body = response.getBody();
```
您可以通过许多返回 ResponseEntity 的 RestTemplate 方法来获取响应头.
#### 1.2.2. Body
在 HttpMessageConverter 的帮助下， 传递到 RestTemplate 方法和从 RestTemplate 方法返回的对象与原始内容进行转换.
在 POST 请求中， 输入对象被序列化到请求主体， 如以下示例所示:
URI location = template.postForLocation("https://example.com/people", person);
您无需显式设置请求的 Content-Type 头. 在大多数情况下， 您可以找到基于源对象类型的兼容消息转换器， 并且所选消息转换器会相应地设置内容类型. 如有必要， 可以使用 exchange 方法显式提供 Content-Type 请求头， 从而影响选择哪种消息转换器.
在 GET 上， 响应主体反序列化为输出 Object， 如以下示例所示:
Person person = restTemplate.getForObject("https://example.com/people/{id}", Person.class, 42);
不需要显式设置请求的 Accept 头. 在大多数情况下， 可以根据预期的响应类型找到兼容的消息转换器， 这有助于填充 Accept 头. 如有必要， 可以使用 exchange 方法显式提供 Accept 头.
默认情况下， RestTemplate 注册所有内置 [消息转换](#rest-message-conversion)， 这取决于类路径检查， 这些检查有助于确定存在哪些可选转换库. 您还可以将消息转换器设置为显式使用.
#### 1.2.3. 消息转换
WebFlux
spring-web 模块包含 HttpMessageConverter ， 用于通过 InputStream 和 OutputStream 读取和写入 HTTP 请求和响应正文. 在客户端 (例如， 在 RestTemplate 中) 和服务器端 (例如， 在 Spring MVC REST 控制器中) 使用 HttpMessageConverter 实例.
框架中提供了主要的媒体 (MIME) 类型的具体实现， 默认情况下， 这些实现在客户端的 RestTemplate 和服务器的 RequestMappingHandlerAdapter 进行了注册 (请参阅 [配置消息转换器](#mvc-config-message-converters)) .
以下各节介绍了 HttpMessageConverter 的实现. 对于所有转换器， 都使用默认的媒体类型， 但是您可以通过设置 supportedMediaTypes bean 属性来覆盖它. 下表描述了每种实现:

| MessageConverter | Description |
| --- | --- |
| StringHttpMessageConverter | 一个 HttpMessageConverter 实现,可以从 HTTP 请求和响应中读取和写入 String 实例. 默认情况下,此转换器支持所有文本媒体类型 (text/*) ,并使用 Content-Type 为 text/plain 进行写入. |
| FormHttpMessageConverter | 一个 HttpMessageConverter 实现,可以从 HTTP 请求和响应中读取和写入表单数据. 默认情况下,此转换器读取和写入 application/x-www-form-urlencoded 媒体类型. 表单数据从 MultiValueMap<String, String> 读取并写入. 转换器还可以将 MultiValueMap<String, String> 写入 (但不能读) multipart 数据, 从 "MultiValueMap<String,Object>" 读取的数据. 默认情况下, multipart/form-data 是支持的. 从 Spring Framework 5.2 开始,可以支持其他的多部分子类型. 编写表格数据. 有关更多详细信息,请查阅 Javadoc 中的 FormHttpMessageConverter. |
| ByteArrayHttpMessageConverter | 一个 HttpMessageConverter 实现,可以从 HTTP 请求和响应中读取和写入字节数组. 默认情况下,此转换器支持所有媒体类型 (**/**) ,并使用 Content-Type 为 application/octet-stream 进行写入. 您可以通过设置 supportedMediaTypes 属性并覆盖 getContentType(byte[]) 来覆盖它. |
| MarshallingHttpMessageConverter | 一个 HttpMessageConverter 实现,可以使用 org.springframework.oxm 包中的 Spring 的 Marshaller 和 Unmarshaller 抽象来读写 XML. 该转换器需要 Marshaller 和 Unmarshaller 才能使用. 您可以通过构造函数或 bean 属性注入这些. 默认情况下,此转换器支持 text/xml 和 application/xml. |
| MappingJackson2HttpMessageConverter | 一个 HttpMessageConverter 实现,可以使用 Jackson 的 ObjectMapper 读写JSON. 您可以根据需要通过使用 Jackson 提供的注解来自定义 JSON 映射. 当您需要进一步控制时 (对于需要为特定类型提供自定义 JSON 序列化器/反序列化器的情况) ,您可以通过 ObjectMapper 属性注入自定义 ObjectMapper. 默认情况下,此转换器支持 application/json. |
| MappingJackson2XmlHttpMessageConverter | 一个 HttpMessageConverter 实现,可以使用 [Jackson XML](https://github.com/FasterXML/jackson-dataformat-xml) 扩展的 XmlMapper 读写XML. 您可以根据需要通过使用 JAXB 或 Jackson 提供的注解来自定义XML映射. 当您需要进一步控制时 (对于需要为特定类型提供自定义 XML 序列化器/反序列化器的情况) ,您可以通过 ObjectMapper 属性注入自定义 XmlMapper. 默认情况下,此转换器支持 application/xml. |
| SourceHttpMessageConverter | 一个 HttpMessageConverter 实现,可以从 HTTP 请求和响应中读取和写入 javax.xml.transform.Source. 仅支持 DOMSource,SAXSource 和 StreamSource. 默认情况下,此转换器支持 text/xml 和 application/xml. |
| BufferedImageHttpMessageConverter | 一个 HttpMessageConverter 实现,可以从 HTTP 请求和响应中读取和写入 java.awt.image.BufferedImage. 此转换器读取和写入 Java I/O API 支持的媒体类型. |

#### 1.2.4. Jackson JSON Views
您可以指定 [Jackson JSON View](https://www.baeldung.com/jackson-json-view-annotation) 来序列化对象属性的一部分， 如以下示例所示:
```java
MappingJacksonValue value = new MappingJacksonValue(new User("eric", "7!jd#h23"));
value.setSerializationView(User.WithoutPasswordView.class);

RequestEntity<MappingJacksonValue> requestEntity =
RequestEntity.post(new URI("https://example.com/user")).body(value);

ResponseEntity<String> response = template.exchange(requestEntity, String.class);
```

#### 1.2.5. Multipart
要发送 multipart data， 您需要提供一个 MultiValueMap<String, Object>， 其值可能是一个 Object 的部分内容， 一个 Resource 的文件部分， 或一个 HttpEntity 的部分内容的头. 例如:
```java
MultiValueMap<String, Object> parts = new LinkedMultiValueMap<>();

parts.add("fieldPart", "fieldValue");
parts.add("filePart", new FileSystemResource("...logo.png"));
parts.add("jsonPart", new Person("Jason"));

HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_XML);
parts.add("xmlPart", new HttpEntity<>(myBean, headers));
```
在大多数情况下， 您不必为每个部分指定 Content-Type 头. 内容类型是根据选择用于序列化的 HttpMessageConverter 自动确定的， 或者对于基于文件扩展名的 Resource 是自动确定的. 如有必要， 可以为 MediaType 显式提供 HttpEntity 包装器.

一旦 MultiValueMap 准备就绪， 您可以将其传递给 RestTemplate， 如下所示:
```java
MultiValueMap<String, Object> parts = ...;
template.postForObject("https://example.com/upload", parts, Void.class);
```
如果 MultiValueMap 包含至少一个非 String 值， 则 FormHttpMessageConverter 将 Content-Type 设置为 multipart/form-data. 如果 MultiValueMap 具有字符串值， 则 Content-Type 默认为 application/x-www-form-urlencoded. 如有必要， 还可以显式设置 Content-Type.
### 1.3. HTTP Interface
Spring 框架允许您将 HTTP 服务定义为带有用于 HTTP exchanges 的注解方法的 Java 接口。 然后，您可以生成一个实现此接口并执行交换的代理。 这有助于简化 HTTP 远程访问，这通常涉及包装使用底层 HTTP 客户端的细节的外观。
首先，用 @HttpExchange 方法声明一个接口：
```
interface RepositoryService {

    @GetExchange("/repos/{owner}/{repo}")
    Repository getRepository(@PathVariable String owner, @PathVariable String repo);

    // more HTTP exchange methods...

}
```
第二，创建一个将执行声明的 HTTP 交换的代理：
```
WebClient client = WebClient.builder().baseUrl("https://api.github.com/").build();
HttpServiceProxyFactory factory = HttpServiceProxyFactory.builder(WebClientAdapter.forClient(client)).build();

RepositoryService service = factory.createClient(RepositoryService.class);
```
@HttpExchange 支持在所有的方法上进行注解：
```java
@HttpExchange(url = "/repos/{owner}/{repo}", accept = "application/vnd.github.v3+json")
interface RepositoryService {

    @GetExchange
    Repository getRepository(@PathVariable String owner, @PathVariable String repo);

    @PatchExchange(contentType = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    void updateRepository(@PathVariable String owner, @PathVariable String repo,
                          @RequestParam String name, @RequestParam String description, @RequestParam String homepage);

}
```
#### 1.3.1. 方法参数
带注解的 HTTP 交换方法支持具有以下方法参数：

| 方法参数 | 描述 |
| --- | --- |
| URI | 动态设置请求的 URL，覆盖注解的 url 属性。 |
| HttpMethod | 动态设置请求的 HTTP 方法，覆盖注解的 method 属性 |
| @RequestHeader | 添加请求头或多个请求头。参数可以是 Map<String, ?> 或 MultiValueMap<String, ?> （多个请求头）、 Collection<?> 或单个值。 非字符串值支持类型转换。 |
| @PathVariable | 添加一个变量以扩展请求 URL 中的占位符。 参数可以是具有多个变量或单个值的 Map<String, ?>。 非字符串值支持类型转换。 |
| @RequestBody | 将请求的主体作为要序列化的对象提供，或者 Reactive Streams Publisher 提供，例如 Mono、Flux 或通过配置的 ReactiveAdapterRegistry 支持的任何其他异步类型。 |
| @RequestParam | 添加请求参数或多个参数。 参数可以是具有多个参数的 Map<String, ?> or MultiValueMap<String, ?> 、Collection<?> 或单个值。 非字符串值支持类型转换。 当 "content-type" 设置为 "application/x-www-form-urlencoded" 时，请求参数在请求体中进行编码。 否则，它们将作为 URL 查询参数添加。 |
| @RequestPart | 添加请求部分，可以是 String（表单字段）、Resource（文件部分）、Object（要编码的实体，例如 JSON）、HttpEntity（部分内容和标头）、Spring Part 或 Reactive Streams Publisher 以上任何一项。 |
| @CookieValue | 添加一个 cookie 或多个 cookie。 参数可以是具有多个 cookie 的 Map<String, ?> 或 MultiValueMap<String, ?>、Collection<?> 或单个值。 非字符串值支持类型转换。 |

#### 1.3.2. 返回值
带注解的 HTTP 交换方法支持以下返回值：:

| 方法返回值 | 描述 |
| --- | --- |
| void, Mono<Void> | 执行请求，不返回任何内容 |
| HttpHeaders, Mono<HttpHeaders> | 执行请求，返回响应头（如果存在） |
| <T>, Mono<T> | 执行请求，将响应内容解码为指定类型的流 |
| <T>, Flux<T> | 执行请求，将响应内容解码为指定类型的流 |
| ResponseEntity<Void>, Mono<ResponseEntity<Void>> | 执行请求，并返回具有 status 和 headers 的 ResponseEntity。 |
| ResponseEntity<T>, Mono<ResponseEntity<T>> | 执行请求，将响应内容解码为声明的返回类型，并返回具有 status, headers 和解码正文的 ResponseEntity。 |
| Mono<ResponseEntity<Flux<T>> | 执行请求，将响应内容解码为声明元素类型的流，并返回具有 status, headers 和解码的响应正文流的 ResponseEntity。 |


> 您还可以使用在 ReactiveAdapterRegistry 中注册的任何其他异步或反应类型。


#### 1.3.3. 异常处理
默认情况下，WebClient 为 4xx 和 5xx HTTP 状态代码引发 WebClientResponseException。 要对此进行自定义，您可以注册一个响应状态处理程序，该处理程序适用于通过客户端执行的所有响应：

```java
WebClient webClient = WebClient.builder()
.defaultStatusHandler(HttpStatusCode::isError, resp -> ...)
.build();

WebClientAdapter clientAdapter = WebClientAdapter.forClient(webClient);
HttpServiceProxyFactory factory = HttpServiceProxyFactory
.builder(clientAdapter).build();
```

有关更多详细信息和选项，例如 suppressing 错误状态代码，请参阅 WebClient.Builder 中 defaultStatusHandler 的 Javadoc。

> Rod Johnson, Juergen Hoeller, Keith Donald, Colin Sampaleanu, Rob Harrop, Thomas Risberg, Alef Arendsen, Darren Davison, Dmitriy Kopylenko, Mark Pollack, Thierry Templier, Erwin Vervaet, Portia Tung, Ben Hale, Adrian Colyer, John Lewis, Costin Leau, Mark Fisher, Sam Brannen, Ramnivas Laddad, Arjen Poutsma, Chris Beams, Tareq Abedrabbo, Andy Clement, Dave Syer, Oliver Gierke, Rossen Stoyanchev, Phillip Webb, Rob Winch, Brian Clozel, Stephane Nicoll, Sebastien Deleuze, Jay Bryant, Mark Paluch

> Copyright © 2002 - 2024 VMware, Inc. All Rights Reserved.

> Copies of this document may be made for your own use and for distribution to others, provided that you do not charge any fee for such copies and further provided that each copy contains this Copyright Notice, whether distributed in print or electronically.

