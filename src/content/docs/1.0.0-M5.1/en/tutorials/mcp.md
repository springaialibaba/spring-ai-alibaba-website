---
title: 模型上下文协议（Model Context Protocol）
keywords: [Spring AI, MCP, 模型上下文协议, 智能体应用]
description: "Spring AI 智能体通过 MCP 集成本地文件数据"
---

## MCP 简介

[模型上下文协议（即 Model Context Protocol，MCP）](https://modelcontextprotocol.io)是一个开放协议，它规范了应用程序如何向大型语言模型（LLM）提供上下文。MCP 提供了一种统一的方式将 AI 模型连接到不同的数据源和工具，它定义了统一的集成方式。在开发智能体（Agent）的过程中，我们经常需要将将智能体与数据和工具集成，MCP 以标准的方式规范了智能体与数据及工具的集成方式，可以帮助您在 LLM 之上构建智能体（Agent）和复杂的工作流。目前已经有大量的服务接入并提供了 MCP server 实现，当前这个生态正在以非常快的速度不断的丰富中，具体可参见：[MCP Servers](https://github.com/modelcontextprotocol/servers)。

## Spring AI MCP

Spring AI MCP 为模型上下文协议提供 Java 和 Spring 框架集成。它使 Spring AI 应用程序能够通过标准化的接口与不同的数据源和工具进行交互，支持同步和异步通信模式。

![spring-ai-mcp-architecture](/img/blog/mcp-filesystem/spring-ai-mcp-architecture.png)

Spring AI MCP 采用模块化架构，包括以下组件：

- Spring AI 应用程序：使用 Spring AI 框架构建想要通过 MCP 访问数据的生成式 AI 应用程序
- Spring MCP 客户端：MCP 协议的 Spring AI 实现，与服务器保持 1:1 连接
- MCP 服务器：轻量级程序，每个程序都通过标准化的模型上下文协议公开特定的功能
- 本地数据源：MCP 服务器可以安全访问的计算机文件、数据库和服务
- 远程服务：MCP 服务器可以通过互联网（例如，通过 API）连接到的外部系统

## 如何使用

要启用此功能，请将以下依赖项添加到您项目的 Maven`pom.xml`文件中：

```xml
<dependency>
    <groupId>org.springframework.experimental</groupId>
    <artifactId>spring-ai-mcp</artifactId>
    <version>0.2.0</version>
</dependency>
```

或者添加到您的 Gradle`build.gradle`文件中：

```groovy
dependencies {
    implementation 'org.springframework.experimental:spring-ai-mcp:0.2.0'
}
```

Spring AI MCP 目前并没有在 Maven Central Repository 中提供。需要将 `Spring milestone`仓库添加到`pom.xml`中，才可以访问 Spring AI MCP 工件：

```xml
<repositories>
  <repository>
    <id>spring-milestones</id>
    <name>Spring Milestones</name>
    <url>https://repo.spring.io/libs-milestone-local</url>
    <snapshots>
      <enabled>false</enabled>
    </snapshots>
  </repository>
</repositories>
```

要使用 MCP，首先需要创建`McpClient`，它提供了与 MCP server 的同步和异步通信能力。现在我们创建一个 McpClient 来注册 MCP Brave 服务和 ChatClient，从而让 LLM 调用它们：

```java
var stdioParams = ServerParameters.builder("npx")
        .args("-y", "@modelcontextprotocol/server-brave-search")
        .addEnvVar("BRAVE_API_KEY", System.getenv("BRAVE_API_KEY"))
        .build();

var mcpClient = McpClient.using(new StdioClientTransport(stdioParams)).sync();

var init = mcpClient.initialize();

var chatClient = chatClientBuilder
        .defaultFunctions(mcpClient.listTools(null)
                .tools()
                .stream()
                .map(tool -> new McpFunctionCallback(mcpClient, tool))
                .toArray(McpFunctionCallback[]::new))
        .build();

String response = chatClient
        .prompt("Does Spring AI supports the Model Context Protocol? Please provide some references.")
        .call().content();
```

在上述代码中，首先通过`npx`命令启动一个独立的进程，运行`@modelcontextprotocol/server-brave-search`服务，并指定 Brave API 密钥。然后创建一个基于 stdio 的传输层，与 MCP server 进行通信。最后初始化与 MCP 服务器的连接。

要使用 McpClient，需要将`McpClient`注入到 Spring AI 的`ChatClient`中，从而让 LLM 调用 MCP server。在 Spring AI 中，可以通过 Function Callbacks 的方式将 MCP 工具转换为 Spring AI 的 Function，从而让 LLM 调用。

最后，通过`ChatClient`与 LLM 进行交互，并使用`McpClient`与 MCP server 进行通信，获取最终的返回结果。

## 案例 1：使用 Spring AI MCP 访问本地文件系统

这里我们提供一个示例智能体应用，这个智能体可以通过 MCP 查询或更新本地文件系统，并以文件系统中的数据作为上下文与模型交互。次示例演示如何使用模型上下文协议（MCP）将 Spring AI 与本地文件系统进行集成。

> 可在此查看 [示例完整源码](https://github.com/springaialibaba/spring-ai-alibaba-examples/tree/main/spring-ai-alibaba-mcp-example)。

### 运行示例

#### 前提条件

1. 安装 npx (Node Package eXecute):
   首先确保本地机器安装了 [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)，然后运行如下命令：

```bash
npm install -g npx
```

2. 下载示例源码

```bash
git clone https://github.com/springaialibaba/spring-ai-alibaba-examples.git
cd spring-ai-alibaba-examples/spring-ai-alibaba-mcp-example/filesystem
```

3. 设置环境变量

```bash
# 通义大模型 Dashscope API-KEY
export AI_DASHSCOPE_API_KEY=${your-api-key-here}
```

4. 构建示例

```bash
./mvnw clean install
```

#### 运行示例应用

运行示例，智能体将向模型发起提问（源码中包含预置问题，可通过源码查看），可通过控制台查看输出结果。

```bash
./mvnw spring-boot:run
```

> 如果您是在 IDE 中运行示例，并且遇到 filesystem mcp server 返回的文件访问权限问题，请确保指定当前进程工作目录为 spring-ai-alibaba-mcp-example/filesystem 目录。

### 示例架构（源码说明）

前文中我们讲解了 Spring AI 与 MCP 集成的基础架构，在接下来的示例中，我们将用到以下关键组件：

1. **MCP Client**，与 MCP 集成的关键，提供了与本地文件系统进行交互的能力。
2. **Function Callbacks**，Spring AI MCP 的 function calling 声明方式。
3. **Chat Client**，Spring AI 关键组件，用于 LLM 模型交互、智能体代理。

#### 声明 ChatClient

```java
// List<McpFunctionCallback> functionCallbacks;
var chatClient = chatClientBuilder.defaultFunctions(functionCallbacks).build();
```

和开发之前的 Spring AI 应用一样，我们先定义一个 ChatClient Bean，用于与大模型交互的代理。需要注意的是，我们为 ChatClient 注入的 functions 是通过 MCP 组件（McpFunctionCallback）创建的。

接下来让我们具体看一下 McpFunctionCallback 是怎么使用的。

#### 声明 MCP Function Callbacks

以下代码段通过 `mcpClient`与 MCP server 交互，将 MCP 工具通过 McpFunctionCallback 适配为标准的 Spring AI function。

1. 发现 MCP server 中可用的工具 tool（Spring AI 中叫做 function） 列表
2. 依次将每个 tool 转换成 Spring AI function callback
3. 最终我们会将这些 McpFunctionCallback 注册到 ChatClient 使用

```java
@Bean
public List<McpFunctionCallback> functionCallbacks(McpSyncClient mcpClient) {
    return mcpClient.listTools(null)
            .tools()
            .stream()
            .map(tool -> new McpFunctionCallback(mcpClient, tool))
            .toList();
}
```

可以看出，ChatClient 与模型交互的过程是没有变化的，模型在需要的时候告知 ChatClient 去做函数调用，只不过 Spring AI 通过 McpFunctionCallback 将实际的函数调用过程委托给了 MCP，通过标准的 MCP 协议与本地文件系统交互:

- 在与大模交互的过程中，ChatClient 处理相关的 function calls 请求
- ChatClient 调用 MCP 工具（通过 McpClient）
- McpClient 与 MCP server（即 filesystem）交互

#### 初始化 McpClient

该智能体应用使用同步 MCP 客户端与本地运行的文件系统 MCP server 通信：

```java
@Bean(destroyMethod = "close")
public McpSyncClient mcpClient() {
    var stdioParams = ServerParameters.builder("npx")
            .args("-y", "@modelcontextprotocol/server-filesystem", "path"))
            .build(); // 1

    var mcpClient = McpClient.sync(new StdioServerTransport(stdioParams),
            Duration.ofSeconds(10), new ObjectMapper()); //2

    var init = mcpClient.initialize(); // 3
    System.out.println("MCP Initialized: " + init);

    return mcpClient;
}
```

在以上代码中：

1. 配置 MCP server 启动命令与参数
2. 初始化 McpClient：关联 MCP server、指定超时时间等
3. Spring AI 会使用 `npx -y @modelcontextprotocol/server-filesystem "/path/to/file"`在本地机器创建一个独立的子进程（代表本地 Mcp server），Spring AI 与 McpClient 通信，McpClient 进而通过与 Mcp server 的连接操作本地文件。

## 案例 2：使用 Spring AI MCP 访问 SQLite 数据库

这个智能体通过命令行界面使您能够与 SQLite 数据库进行自然语言交互。

> 可在此查看 [示例完整源码](https://github.com/springaialibaba/spring-ai-alibaba-examples/tree/main/spring-ai-alibaba-mcp-example)。

### 运行示例

#### 前提条件

1. 安装 uvx（Universal Package Manager 通用包管理器）：
   请参考 [UV 安装文档](https://docs.astral.sh/uv/getting-started/installation/)

2. 下载示例源码

```bash
git clone https://github.com/springaialibaba/spring-ai-alibaba-examples.git
cd spring-ai-alibaba-examples/spring-ai-alibaba-mcp-example/chatbot
```

3. 设置环境变量

```bash
# 通义大模型 Dashscope API-KEY
export AI_DASHSCOPE_API_KEY=${your-api-key-here}
```

4. 构建示例

```bash
./mvnw clean install
```

#### 运行示例应用

运行示例，用户可以对数据库中的数据进行查询。

```bash
./mvnw spring-boot:run
```

输入想要查询的内容，进行数据库的查询：

```
USER: 所有商品的价格总和是多少
ASSISTANT: 所有商品的价格总和是1642.8元。
```

还可以支持更复杂的查询：

```
USER: 告诉我价格高于平均值的商品
ASSISTANT:
以下是价格高于平均值的商品：

1. Smart Watch，价格为 199.99 元
2. Wireless Earbuds，价格为 89.99 元
3. Mini Drone，价格为 299.99 元
4. Keyboard，价格为 129.99 元
5. Gaming Headset，价格为 159.99 元
6. Fitness Tracker，价格为 119.99 元
7. Portable SSD，价格为 179.99 元

```

### 示例架构（源码说明）

#### 初始化 McpClient

```java
@Bean(destroyMethod = "close")
public McpSyncClient mcpClient() {

    var stdioParams = ServerParameters.builder("uvx")
            .args("mcp-server-sqlite", "--db-path", getDbPath())
            .build();

    var mcpClient = McpClient.sync(new StdioServerTransport(stdioParams),
            Duration.ofSeconds(10), new ObjectMapper());

    var init = mcpClient.initialize();

    System.out.println("MCP Initialized: " + init);

    return mcpClient;
}
```

在这段代码中：

1、通过 uvx 包管理工具，创建一个独立的进程，运行 mcp-server-sqlite 服务。

2、创建一个基于 stdio 的传输层，与 uvx 运行的 MCP 服务器进行通信

3、指定 SQLite 作为后端数据库及其位置，设置操作的超时时间为 10 秒，使用 Jackson 进行 JSON 序列化。
最后初始化与 MCP 服务器的连接

#### Function Callbacks

通过 Spring AI 注册 MCP 工具：

```java
@Bean
public List<McpFunctionCallback> functionCallbacks(McpSyncClient mcpClient) {
    return mcpClient.listTools(null)
            .tools()
            .stream()
            .map(tool -> new McpFunctionCallback(mcpClient, tool))
            .toList();
}
```

在这段代码中：

1、通过 mcpClient 获取 MCP 可用客户端。

2、将 MCP 客户端转换为为 Spring AI 的 Function Callbacks。

3、将这些 Function Callbacks 注册到 ChatClient 中。
