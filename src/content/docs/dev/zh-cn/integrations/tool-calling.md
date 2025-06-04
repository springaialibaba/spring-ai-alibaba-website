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

以下是版本为 `1.0.0.2` 可用的 Tool Calling 列表（**未来的版本更新可能会有变动，请以对应的版本代码为准。**），可根据业务需要使用：

- 阿里云机器翻译
    - **工具名称（Tool Name）**：`aliTranslateService`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.alitranslate`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-alitranslate`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `access-key-id`：服务的AccessKeyId，若不提供则读取系统环境变量`ALITRANSLATE_ACCESS_KEY_ID`的值。
        - `secret-key`：服务的SecretKey，若不提供则读取系统环境变量`ALITRANSLATE_ACCESS_KEY_SECRET`的值。
- 高德地图获取城市天气
    - **工具名称（Tool Name）**：`gaoDeGetAddressWeather`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.amap`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-amap`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：高德地图服务的ApiKey，若不提供则读取系统环境变量`GAODE_AMAP_API_KEY`的值。
- 百度地图
    - **工具名称（Tool Name）**：
        - `baiduMapGetAddressInformation`：获取地址详细信息
        - `baiDuMapGetAddressWeatherInformation`：获取城市天气
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.baidu.map`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-baidumap`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：百度地图服务的ApiKey，若不提供则读取系统环境变量`BAIDU_MAP_API_KEY`的值。
- 百度搜索
    - **工具名称（Tool Name）**：`baiduSearch`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.baidu.search`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-baidusearch`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
- 百度翻译
    - **工具名称（Tool Name）**：``
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.baidu.translate`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-baidutranslate`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `secret-key`：百度翻译服务的SecretKey，若不提供则读取系统环境变量`BAIDU_TRANSLATE_SECRET_KEY`的值。
        - `app-id`：百度翻译服务的AppId，若不提供则读取系统环境变量`BAIDU_TRANSLATE_APP_ID`的值。
- 必应搜索
    - **工具名称（Tool Name）**：`bingSearch`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.bingsearch`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-bingsearch`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `token`：必应服务的Token，若不提供则读取系统环境变量`BING_SEARCH_TOKEN`的值。
- 钉钉群发消息
    - **工具名称（Tool Name）**：`dingTalkGroupSendMessageByCustomRobot`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.dingtalk`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-dingtalk`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `custom-robot-access-token`：自定义机器人的AccessToken，必须提供。
        - `custom-robot-signature`：自定义机器人的Signature，必须提供。
- DuckDuckGo 查询最近新闻
    - **工具名称（Tool Name）**：`duckDuckGoQueryNews`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.duckduckgo`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-duckduckgo`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：Serpapi服务的ApiKey，若不提供则读取系统环境变量`SERPAPI_KEY`的值。
- GitHub Tool Kits
    - **工具名称（Tool Name）**：
        - `getIssue`：获取 GitHub 某个仓库的 Issue 信息
        - `createPullRequest`：在 GitHub 某个仓库创建 PR
        - `SearchRepository`：查询 Github 某个名称的仓库信息
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.githubtoolkit`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-githubtoolkit`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `token`：Github的Token，若不提供则读取系统环境变量`GITHUB_TOKEN`。
        - `owner`：要查询的仓库所有者，必须设置。
        - `repository`：要查询的仓库名称，必须设置。
- 谷歌翻译
    - **工具名称（Tool Name）**：`googleTranslate`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.googletranslate`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-googletranslate`
    - **配置字段说明**：
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
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
- 快递100查询快递信息
    - **工具名称（Tool Name）**：`queryTrack`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.kuaidi100`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-kuaidi100`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：快递100的ApiKey，若不提供则读取系统环境变量`KUAIDI100_KEY`的值。
        - `app-id`：快递100的AppId，若不提供则读取系统环境变量`KUAIDI100_CUSTOMER`的值。
- 飞书文档
    - **工具名称（Tool Name）**：
        - `larksuiteCreateDocFunction`：创建文档
        - `larksuiteChatFunction`：发送聊天消息
        - `larksuiteCreateSheetFunction`：创建工作表
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.larksuite`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-larksuite`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `app-id`：飞书的AppId，必须提供。
        - `app-secret`：飞书的AppSecret，必须提供。
- 微软翻译
    - **工具名称（Tool Name）**：`microSoftTranslateFunction`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.microsofttranslate`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-microsofttranslate<`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：微软翻译的ApiKey，若不提供则读取系统环境变量`MICROSOFT_TRANSLATE_API_KEY`的值。
        - `region`：为请求头`Ocp-Apim-Subscription-Region`的值，必须提供。
- 正则表达式查询
    - **工具名称（Tool Name）**：`regexFindAll`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.regex`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-regex`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
- 敏感信息过滤
    - **工具名称（Tool Name）**：`sensitiveFilter`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.sensitivefilter`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-sensitivefilter`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `replacement`：用来替换敏感信息的字符串，默认为`"***"`。
        - `filterPhoneNumber`：是否过滤电话号码，默认为`true`。
        - `filterIdCard`：是否过滤 ID 卡号，默认为`true`。
        - `filterBankCard`：是否过滤银行卡号，默认为`true`。
        - `filterEmail`：是否过滤邮箱地址，默认为`true`。
- Serpai 查询
    - **工具名称（Tool Name）**：
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.serpai`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-serpai`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：Serpapi服务的ApiKey，若不提供则读取系统环境变量`SERPAPI_KEY`的值。
        - `engine`：选择使用的搜索引擎，必填。
- 新浪新闻
    - **工具名称（Tool Name）**：`getSinaNews`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.sinanews`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-sinanews`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
- Tavily Search
    - **工具名称（Tool Name）**：`tavilySearch`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.tavilysearch`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-tavilysearch`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `api-key`：Tavily Search 的ApiKey，若不设置则读取系统环境变量`TAVILY_SEARCH_API_KEY`的值。
- 获取某个时区时间
    - **工具名称（Tool Name）**：`getCityTimeFunction`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.time`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-time`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
- 今日头条
    - **工具名称（Tool Name）**：`getToutiaoNews`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.toutiaonews`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-toutiaonews`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
- Weather Api 获取城市天气
    - **工具名称（Tool Name）**：`getWeatherService`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.weather`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-weather`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
- 有道翻译
    - **工具名称（Tool Name）**：`youdaoTranslate`
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.youdaotranslate`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-youdaotranslate`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `secret-key`：有道翻译的AppSecret，若不设置则读取系统环境变量`YOUDAO_APP_SECRET`的值。
        - `app-id`：有道翻译的AppId，若不设置则读取系统环境变量`YOUDAO_APP_ID`的值。
- 语雀
    - **工具名称（Tool Name）**：
        - `createYuqueDoc`：创建语雀文档。
        - `createYuqueBook`：创建语雀Book知识库。
        - `updateDocService`：更新语雀文档。
        - `deleteDocService`：删除语雀文档。
    - **配置文件前缀**：`spring.ai.alibaba.toolcalling.yuque`
    - **Maven 依赖名**：`spring-ai-alibaba-starter-tool-calling-yuque`
    - **配置字段说明**：
        - `enabled`：设置为`true`时启动插件。
        - `token`，语雀的Token，必须设置。
