---
title: 使用starter简化MCP客户端的使用
keywords: [Spring AI, MCP, 模型上下文协议, 智能体应用]
description: "使用starter简化MCP客户端的使用"
---

## 案例3：使用starter简化MCP客户端的使用

在前面的案例中，我们看到了如何手动配置和初始化MCP客户端。Spring AI 提供了更简便的方式来使用MCP，通过starter可以大大简化MCP客户端的配置和使用。Spring AI MCP支持两种不同的传输层实现：基于stdio的实现和基于SSE的实现。

### 传输层介绍

#### stdio传输层

stdio（标准输入输出）传输层是MCP最基本的传输实现方式。它通过进程间通信（IPC）实现，具体工作原理如下：

1. **进程创建**：MCP客户端会启动一个子进程来运行MCP服务器
2. **通信机制**：
   - 使用标准输入（stdin）向MCP服务器发送请求
   - 通过标准输出（stdout）接收MCP服务器的响应
   - 标准错误（stderr）用于日志和错误信息
3. **优点**：
   - 简单可靠，无需网络配置
   - 适合本地部署场景
   - 进程隔离，安全性好
4. **缺点**：
   - 仅支持单机部署
   - 不支持跨网络访问
   - 每个客户端需要独立启动服务器进程

#### SSE传输层

SSE（Server-Sent Events）传输层是基于HTTP的单向通信机制，专门用于服务器向客户端推送数据。其工作原理如下：

1. **连接建立**：
   - 客户端通过HTTP建立与服务器的持久连接
   - 使用`text/event-stream`内容类型
2. **通信机制**：
   - 服务器可以主动向客户端推送消息
   - 支持自动重连机制
   - 支持事件ID和自定义事件类型
3. **优点**：
   - 支持分布式部署
   - 可跨网络访问
   - 支持多客户端连接
   - 轻量级，使用标准HTTP协议
4. **缺点**：
   - 需要额外的网络配置
   - 相比stdio实现略微复杂
   - 需要考虑网络安全性

### 3.1 基于stdio的MCP客户端实现

基于stdio的实现是最常见的MCP客户端实现方式，它通过标准输入输出流与MCP服务器进行通信。这种方式适用于本地部署的MCP服务器，可以直接在同一台机器上启动MCP服务器进程。

#### 添加依赖

首先，在您的项目中添加Spring AI MCP starter依赖：

```xml
<!-- 添加Spring AI MCP starter依赖 -->
<dependency>
   <groupId>org.springframework.ai</groupId>
   <artifactId>spring-ai-mcp-client-spring-boot-starter</artifactId>
</dependency>
```

#### 配置MCP服务器

在`application.yml`中配置MCP服务器：

```yaml
spring:
  ai:
    dashscope:
      # 配置通义千问API密钥
      api-key: ${DASH_SCOPE_API_KEY}
    mcp:
      client:
        stdio:
          # 指定MCP服务器配置文件路径（推荐）
          servers-configuration: classpath:/mcp-servers-config.json
          # 直接配置示例，和上边的配制二选一
          # connections:
          #   server1:
          #     command: java
          #     args:
          #       - -jar
          #       - /path/to/your/mcp-server.jar
```

这个配置文件设置了MCP客户端的基本配置，包括API密钥和服务器配置文件的位置。你也可以选择直接在配置文件中定义服务器配置。

```json
{
    "mcpServers": {
        // 定义名为"weather"的MCP服务器
        "weather": {
            // 指定启动命令为java
            "command": "java",
            // 定义启动参数
            "args": [
                "-Dspring.ai.mcp.server.stdio=true",
                "-Dspring.main.web-application-type=none",
                "-jar",
                "/path/to/your/mcp-server.jar"
            ],
            // 环境变量配置（可选）
            "env": {}
        }
    }
}
```

这个JSON配置文件定义了MCP服务器的详细配置，包括如何启动服务器进程、需要传递的参数以及环境变量设置。

```java
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        // 启动Spring Boot应用
        SpringApplication.run(Application.class, args);
    }

    @Bean
    public CommandLineRunner predefinedQuestions(
            ChatClient.Builder chatClientBuilder, 
            ToolCallbackProvider tools,
            ConfigurableApplicationContext context) {
        return args -> {
            // 构建ChatClient并注入MCP工具
            var chatClient = chatClientBuilder
                    .defaultTools(tools)
                    .build();

            // 定义用户输入
            String userInput = "北京的天气如何？";
            // 打印问题
            System.out.println("\n>>> QUESTION: " + userInput);
            // 调用LLM并打印响应
            System.out.println("\n>>> ASSISTANT: " + 
                chatClient.prompt(userInput).call().content());

            // 关闭应用上下文
            context.close();
        };
    }
}
```

这段代码展示了如何在Spring Boot应用中使用MCP客户端。它创建了一个命令行运行器，构建了ChatClient并注入了MCP工具，然后使用这个客户端发送查询并获取响应。

### 3.2 基于SSE的MCP客户端实现

除了基于stdio的实现外，Spring AI Alibaba还提供了基于Server-Sent Events (SSE)的MCP客户端实现。这种方式适用于远程部署的MCP服务器，可以通过HTTP协议与MCP服务器进行通信。

#### 添加依赖

首先，在您的项目中添加Spring AI MCP starter依赖：

```xml
<dependency>
   <groupId>org.springframework.ai</groupId>
   <artifactId>spring-ai-starter-mcp-client</artifactId>
</dependency>

```

#### 配置MCP服务器

在`application.yml`中配置MCP服务器：

```yaml
spring:
  ai:
    dashscope:
      api-key: ${DASH_SCOPE_API_KEY}
    mcp:
      client:
        sse:
          connections:
            server1:
              url: http://localhost:8080
```

#### 使用MCP客户端

使用方式与基于stdio的实现相同，只需注入`ToolCallbackProvider`和`ChatClient.Builder`：

```java
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    public CommandLineRunner predefinedQuestions(ChatClient.Builder chatClientBuilder, 
                                                ToolCallbackProvider tools,
                                                ConfigurableApplicationContext context) {
        return args -> {
            // 构建ChatClient并注入MCP工具
            var chatClient = chatClientBuilder
                    .defaultTools(tools)
                    .build();

            // 使用ChatClient与LLM交互
            String userInput = "北京的天气如何？";
            System.out.println("\n>>> QUESTION: " + userInput);
            System.out.println("\n>>> ASSISTANT: " + chatClient.prompt(userInput).call().content());

            context.close();
        };
    }
}
```

### 3.3 总结

使用Spring AI Alibaba提供的MCP starter，可以大大简化MCP客户端的配置和使用。您只需要添加相应的依赖，配置MCP服务器，然后注入`ToolCallbackProvider`和`ChatClient.Builder`即可使用MCP功能。

根据您的部署需求，可以选择基于stdio的实现或基于SSE的实现。基于stdio的实现适用于本地部署的MCP服务器，而基于SSE的实现适用于远程部署的MCP服务器。

> 完整示例代码可在以下链接查看：
> - [基于stdio的实现](https://github.com/springaialibaba/spring-ai-alibaba-examples/tree/main/spring-ai-alibaba-mcp-example/spring-ai-alibaba-mcp-starter-example/client/mcp-stdio-client-example)
> - [基于SSE的实现](https://github.com/springaialibaba/spring-ai-alibaba-examples/tree/main/spring-ai-alibaba-mcp-example/spring-ai-alibaba-mcp-starter-example/client/mcp-webflux-client-example)

