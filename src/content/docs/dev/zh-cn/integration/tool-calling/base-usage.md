---
title: Tool Calling 工具插件集成
keywords: [Spring AI Alibaba,生态集成,ToolCalling,工具调用]
description: "使用Spring AI Alibaba社区的Tool Calling快速接入第三方服务"
---

## 使用方法

Spring AI Alibaba 社区提供了很多 Tool Calling 扩展实现，方便开发者通过声明的方式直接开启插件，避免重复开发的麻烦。

社区提供的 Tool Calling 插件的 `artifactId` 均为 `spring-ai-alibaba-starter-tool-calling-xxx` 的格式。 下面以阿里翻译服务（ `alitranslate` ）为例，介绍使用社区 Tool Calling 插件的步骤：

1. **添加 Maven 依赖**：

```xml
<dependency>
    <groupId>com.alibaba.cloud.ai</groupId>
    <artifactId>spring-ai-alibaba-starter-dashscope</artifactId>
    <version>1.0.0.2</version>
</dependency>

<dependency>
    <groupId>com.alibaba.cloud.ai</groupId>
    <artifactId>spring-ai-alibaba-starter-tool-calling-alitranslate</artifactId>
    <version>1.0.0.2</version>
</dependency>
```

2. **在配置文件中配置开启插件和必要的参数**：

```yaml
spring:
  ai:
    alibaba:
      toolcalling:
        alitranslate:
          enabled: true
          access-key-id: ${ALITRANSLATE_ACCESS_KEY_ID}
          secret-key: ${ALITRANSLATE_ACCESS_KEY_SECRET}
```

3. **在调用 ChatClient 时注册 Tool**：

```java
String response = chatClient.prompt("你是一个翻译助手。")
    .user("请帮我把“感谢您使用本产品”翻译成英语和日语")
    .toolNames("aliTranslateService")
    .call()
    .content();
```

**或者在构造 ChatClient 时注册 Tool**：

```java
chatClient = ChatClient.builder(chatModel)
    .defaultToolNames("aliTranslateService")
    .build();
String response = chatClient.prompt("你是一个翻译助手。")
        .user("请帮我把“感谢您使用本产品”翻译成英语和日语")
        .call()
        .content();
```

## 社区实现列表

以下是版本为 `1.0.0.2` 可用的 Tool Calling 列表，可根据业务需要使用：

- 阿里云机器翻译
    - **工具名称（Tool Name）**：`aliTranslateService`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.alitranslate`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-alitranslate`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `access-key-id`：服务的AccessKeyId，若不提供则读取系统环境变量`ALITRANSLATE_ACCESS_KEY_ID`的值。
        - `secret-key`：服务的SecretKey，若不提供则读取系统环境变量`ALITRANSLATE_ACCESS_KEY_SECRET`的值。
- 高德地图获取城市天气
    - **工具名称（Tool Name）**：`gaoDeGetAddressWeather`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.amap`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-amap`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：高德地图服务的ApiKey，若不提供则读取系统环境变量`GAODE_AMAP_API_KEY`的值。
- 百度地图获取地址详细信息
    - **工具名称（Tool Name）**：`baiduMapGetAddressInformation`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.baidu.map`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-baidumap`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：百度地图服务的ApiKey，若不提供则读取系统环境变量`BAIDU_MAP_API_KEY`的值。
- 百度地图获取城市天气
    - **工具名称（Tool Name）**：`baiDuMapGetAddressWeatherInformation`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.baidu.map`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-baidumap`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：百度地图服务的ApiKey，若不提供则读取系统环境变量`BAIDU_MAP_API_KEY`的值。
- 百度搜索
    - **工具名称（Tool Name）**：`baiduSearch`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.baidu.search`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-baidusearch`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
- 百度翻译
    - **工具名称（Tool Name）**：``
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.baidu.translate`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-baidutranslate`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `secret-key`：百度翻译服务的SecretKey，若不提供则读取系统环境变量`BAIDU_TRANSLATE_SECRET_KEY`的值。
        - `app-id`：百度翻译服务的AppId，若不提供则读取系统环境变量`BAIDU_TRANSLATE_APP_ID`的值。
- 必应搜索
    - **工具名称（Tool Name）**：`bingSearch`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.bingsearch`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-bingsearch`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `token`：必应服务的Token，若不提供则读取系统环境变量`BING_SEARCH_TOKEN`的值。
- 钉钉群发消息
    - **工具名称（Tool Name）**：`dingTalkGroupSendMessageByCustomRobot`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.dingtalk`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-dingtalk`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `custom-robot-access-token`：自定义机器人的AccessToken，必须提供。
        - `custom-robot-signature`：自定义机器人的Signature，必须提供。
- DuckDuckGo 查询最近新闻
    - **工具名称（Tool Name）**：`duckDuckGoQueryNews`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.duckduckgo`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-duckduckgo`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：Serpapi服务的ApiKey，若不提供则读取系统环境变量`SERPAPI_KEY`的值。
- 获取 Github 某个仓库的 Issue 信息
    - **工具名称（Tool Name）**：`getIssue`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.githubtoolkit`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-githubtoolkit`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `token`：Github的Token，若不提供则读取系统环境变量`GITHUB_TOKEN`。
        - `owner`：要查询的仓库所有者，必须设置。
        - `repository`：要查询的仓库名称，必须设置。
- 在 Github 某个仓库创建 PR
    - **工具名称（Tool Name）**：`createPullRequest`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.githubtoolkit`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-githubtoolkit`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `token`：Github的Token，若不提供则读取系统环境变量`GITHUB_TOKEN`。
        - `owner`：要创建PR的仓库所有者，必须设置。
        - `repository`：要创建PR的仓库名称，必须设置。
- 查询 Github 某个名称的仓库信息
    - **工具名称（Tool Name）**：`SearchRepository`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.githubtoolkit`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-githubtoolkit`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `token`：Github的Token，若不提供则读取系统环境变量`GITHUB_TOKEN`。
- 谷歌翻译
    - **工具名称（Tool Name）**：`googleTranslate`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.googletranslate`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-googletranslate`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：谷歌翻译的ApiKey，若不提供则读取系统环境变量`GOOGLE_TRANSLATE_APIKEY`。
- JSON 处理工具
    - **工具名称（Tool Name）**：
        - `jsonInsertPropertyFieldFunction`：给一个 JSON 对象添加字段值。
        - `jsonParsePropertyFunction`：获取 JSON 对象某个字段的值。
        - `jsonRemovePropertyFieldFunction`：删除 JSON 对象某个字段。
        - `jsonReplacePropertyFiledValueFunction`： 替换 JSON 对象某个字段的值。
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.jsonprocessor`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-jsonprocessor`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
- 快递100查询快递信息
    - **工具名称（Tool Name）**：`queryTrack`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.kuaidi100`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-kuaidi100`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：快递100的ApiKey，若不提供则读取系统环境变量`KUAIDI100_KEY`的值。
        - `app-id`：快递100的AppId，若不提供则读取系统环境变量`KUAIDI100_CUSTOMER`的值。
- 名字
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - 2
        - 3
- 名字
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - 2
        - 3
- 名字
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - 2
        - 3
- 名字
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - 2
        - 3
- 名字
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - 2
        - 3
- 名字
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - 2
        - 3
- 名字
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - 2
        - 3
- 名字
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - 2
        - 3
- 名字
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - 2
        - 3
- 名字
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - 2
        - 3
- 名字
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-`
    - **必填参数以及说明**：
        - `enabled`：设置为`true`时启动插件。
        - 2
        - 3
