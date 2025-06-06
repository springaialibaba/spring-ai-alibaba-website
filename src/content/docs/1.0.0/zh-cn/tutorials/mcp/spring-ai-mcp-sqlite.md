---
title: 使用 Spring AI MCP 访问 SQLite 数据库
keywords: [Spring AI, MCP, 模型上下文协议, 智能体应用]
description: "Spring AI 智能体通过 MCP 集成本地文件数据"
---

## 案例 2：使用 Spring AI MCP 访问 SQLite 数据库

这个智能体通过命令行界面使您能够与 SQLite 数据库进行自然语言交互。

> 可在此查看 [示例完整源码](https://github.com/springaialibaba/spring-ai-alibaba-examples/tree/main/spring-ai-alibaba-mcp-example/spring-ai-alibaba-mcp-manual-example/sqlite/ai-mcp-sqlite-chatbot)。

### 运行示例

#### 前提条件

1. 安装 uvx（Universal Package Manager 通用包管理器）：
   请参考 [UV 安装文档](https://docs.astral.sh/uv/getting-started/installation/)

2. 下载示例源码

```bash
git clone https://github.com/springaialibaba/spring-ai-alibaba-examples.git
cd spring-ai-alibaba-examples/spring-ai-alibaba-mcp-example/spring-ai-alibaba-mcp-manual-example/sqlite/ai-mcp-sqlite-chatbot
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

2、将MCP客户端转换为为 Spring AI 的Function Callbacks。

3、将这些Function Callbacks注册到 ChatClient 中。

