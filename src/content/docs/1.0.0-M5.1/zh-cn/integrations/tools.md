---
title: Tool Calling 工具插件集成
keywords: [Spring Ai Alibaba, tool calling, function calling]
description: "Spring Ai Alibaba插件与工具生态，本文档主要涵盖 tool calling 工具的集成适配于使用方法。"
---

## 基本使用方法
Spring AI Alibaba 官方社区提供了很多 Tool Calling（Function Calling）扩展实现，方便开发者通过声明的方式直接开启插件，避免重复开发的麻烦。


以下是使用官方社区 Tool Calling 插件的步骤：

1. **增加 maven 依赖**

```xml
<dependency>
  <groupId>com.alibaba.cloud.ai</groupId>
  <artifactId>spring-ai-alibaba-starter-tool-calling-baidutranslate</artifactId>
  <version>${spring.ai.alibaba.version}</version>
</dependency>
```

2. **在配置文件中配置开关开启插件**

```properties
spring.ai.alibaba.toolcalling.baidutranslate.enable=true
spring.ai.alibaba.toolcalling.baidutranslate.appId=xxx
spring.ai.alibaba.toolcalling.baidutranslate.secretKey=xxx
```

3. **在代码中注册插件**

```java
chatClient.prompt(DEFAULT_PROMPT).functions("baiduTranslateFunction").call().content();
// 或者注册全局函数
ChatClient.builder(chatModel).defaultFunctions("baiduTranslateFunction").build();
```

> 其中 `baiduTranslateFunction` 即为下表中的 tool 名称。

## 社区实现列表

以下是当前社区提供的官方插件实现列表，可根据业务需要使用。

| 名称（代码引用名） | application.properties 配置 | Maven 依赖 | 说明 |
| --- | --- | --- | --- |
| baiduTranslateFunction | spring.ai.alibaba.toolcalling.baidutranslate.enable=true<br/>spring.ai.alibaba.toolcalling.baidutranslate.appId=xxx（可选）<br/>spring.ai.alibaba.toolcalling.baidutranslate.secretKey=xxx（可选） | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-baidutranslate</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ```  | 百度翻译工具，可用于如中文到英文翻译等场景。示例地址（如有） |
| baiduTranslateFunction | spring.ai.alibaba.toolcalling.baidutranslate.enable=true <br/>spring.ai.alibaba.toolcalling.baidutranslate.appId=xxx<br/>spring.ai.alibaba.toolcalling.baidutranslate.secretKey=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-baidutranslate</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ```  | 百度翻译工具，可用于如中文到英文翻译等场景 |
| aliTranslateFunction | spring.ai.alibaba.toolcalling.aliTranslateFunction.enable=true<br/>spring.ai.alibaba.toolcalling.alitranslate.accessKeyId=xxx（可选）<br/>spring.ai.alibaba.toolcalling.alitranslate.accessKeySecret=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-alitranslate</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 阿里翻译工具，可用于如中文到英文翻译等场景 |
| gaoDeGetAddressWeatherFunction | spring.ai.alibaba.toolcalling.gaoDeGetAddressWeatherFunction.enable=true<br/>spring.ai.alibaba.toolcalling.amap.webApiKey=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-amap</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 高德地图获取地址天气工具，可用于如获取指定地址的天气等场景 |
| baiDuMapGetAddressInformationFunction | spring.ai.alibaba.toolcalling.baidumap.enable=true<br/>spring.ai.alibaba.toolcalling.baiduMap.webApiKey=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-baidumap</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 百度地图获取地址信息工具，可用于如获取指定地址的详细信息等场景 |
| baiduSearchFunction | spring.ai.alibaba.toolcalling.baidusearch.enable=true | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-baidusearch</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 百度搜索工具，可用于如搜索指定关键词等场景 |
| bingSearchFunction | spring.ai.alibaba.toolcalling.bingsearch.enable=true<br/>spring.ai.alibaba.toolcalling.bingsearch.token=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-bingsearch</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 必应搜索工具，可用于如搜索指定关键词等场景 |
| jinaFunction | spring.ai.alibaba.toolcalling.crawler.jina.enable=true<br/>spring.ai.alibaba.toolcalling.crawler.jina.token=xxx <br/>spring.ai.alibaba.toolcalling.crawler.jina.targetSelector=xxx<br/>spring.ai.alibaba.toolcalling.crawler.jina.waitForSelector=xxx<br/>spring.ai.alibaba.toolcalling.crawler.jina.removeSelector=xxx<br/>spring.ai.alibaba.toolcalling.crawler.jina.retainImages=xxx<br/>spring.ai.alibaba.toolcalling.crawler.withLinksSummary=xxx<br/>spring.ai.alibaba.toolcalling.crawler.setCookie=xxx<br/>spring.ai.alibaba.toolcalling.crawler.withGeneratedAlt=xxx<br/>spring.ai.alibaba.toolcalling.crawler.proxyUrl=xxx<br/>spring.ai.alibaba.toolcalling.crawler.noCache=xxx<br/>spring.ai.alibaba.toolcalling.crawler.locale=xxx<br/>spring.ai.alibaba.toolcalling.crawler.withIframe=xxx<br/>spring.ai.alibaba.toolcalling.crawler.withIframe=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-crawler-jina</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | Jina 搜索工具，可用于如搜索指定关键词等场景 |
| dingTalkGroupSendMessageByCustomRobotFunction | spring.ai.alibaba.toolcalling.dingtalk.enable=true<br/>spring.ai.alibaba.toolcalling.dingtalk.customRobotAccessToken=xxx<br/>spring.ai.alibaba.toolcalling.dingtalk.customRobotSignature=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-dingtalk</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 钉钉群发送消息工具，可用于如发送消息到指定钉钉群等场景 |
| duckDuckGoQueryNewsFunction | spring.ai.alibaba.toolcalling.duckduckgo.enable=true<br/>spring.ai.alibaba.toolcalling.duckduckgo.apiKey=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-duckduckgo</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | DuckDuckGo 查询新闻工具，可用于如查询指定关键词的新闻等场景 |
| getIssueFunction | spring.ai.alibaba.toolcalling.github.enable=true<br/>spring.ai.alibaba.toolcalling.github.token=xxx<br/>spring.ai.alibaba.toolcalling.github.owner=xxx<br/>spring.ai.alibaba.toolcalling.github.repository=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-github</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | GitHub 获取问题工具 |
| SearchRepositoryFunction | spring.ai.alibaba.toolcalling.github.enable=true<br/>spring.ai.alibaba.toolcalling.github.token=xxx<br/>spring.ai.alibaba.toolcalling.github.owner=xxx<br/>spring.ai.alibaba.toolcalling.github.repository=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-github</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | GitHub 获取仓库工具 |
| createPullRequestFunction | spring.ai.alibaba.toolcalling.github.enable=true<br/>spring.ai.alibaba.toolcalling.github.token=xxx<br/>spring.ai.alibaba.toolcalling.github.owner=xxx<br/>spring.ai.alibaba.toolcalling.github.repository=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-github</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | Github创建Pr工具 |
| googleTranslateFunction | spring.ai.alibaba.toolcalling.googletranslate.enable=true<br/>spring.ai.alibaba.toolcalling.googletranslate.apikey=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-googletranslate</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | Google 翻译工具，可用于如中文到英文翻译等场景。示例地址（如有） |
| jsonInsertPropertyFieldFunction | spring.ai.alibaba.toolcalling.jsonprocessor.enable=true | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-json</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | JSON 插入属性字段工具 |
| jsonParsePropertyFunction | spring.ai.alibaba.toolcalling.jsonprocessor.enable=true | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-jsonprocessor</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | JSON 解析属性工具 |
| jsonRemovePropertyFieldFunction | spring.ai.alibaba.toolcalling.jsonprocessor.enable=true | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-jsonprocessor</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | JSON 删除属性字段工具 |
| jsonReplacePropertyFiledValueFunction | sprring.ai-alibaba.toolcalling.jsonprocessor.enable=true | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-jsonprocessor</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | JSON 替换属性字段值工具 |
| queryTrackFunction | spring.ai.alibaba.toolcalling.kuaidi100.enable=true<br/>spring.ai.alibaba.toolcalling.kuaidi100.key=xxx<br/>spring.ai.alibaba.toolcalling.kuaidi100.customer=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-kuaidi100</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 快递信息查询工具 |
| larksuiteCreateDocFunction | spring.ai.alibaba.toolcalling.larksuite.enable=true<br/>spring.ai.alibaba.toolcalling.larksuite.appId=xxx<br/>spring.ai.alibaba.toolcalling.larksuite.appSecret=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-larksuite</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 飞书文档创建工具 |
| larksuiteChatFunction | spring.ai.alibaba.toolcalling.larksuite.enable=true<br/>spring.ai.alibaba.toolcalling.larksuite.appId=xxx<br/>spring.ai.alibaba.toolcalling.larksuite.appSecret=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-larksuite</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 飞书聊天工具 |
| microSoftTranslateFunction | spring.ai.alibaba.toolcalling.microsofttranslate.enable=true<br/>spring.ai.alibaba.toolcalling.microsoft.apikey=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-microsofttranslate</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 微软翻译工具，可用于如中文到英文翻译等场景。示例地址（如有） |
| regexFindAllFunction | spring.ai.alibaba.toolcalling.regex.enable=true | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-regexfindall</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 正则表达式工具 |
| serpApiFunction | spring.ai.alibaba.toolcalling.serpapi.enable=true<br/>spring.ai.alibaba.toolcalling.serpapi.apiKey=xxx<br/>spring.ai.alibaba.toolcalling.serpapi.engine=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-serpapi</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | SerpApi 搜索工具 |
| getSinaNewsFunction | spring.ai.alibaba.toolcalling.sinanews.enable=true | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-sina</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 新浪新闻查询工具，可用于如查询指定关键词的新闻等场景。示例地址（如有） |
| getCityTimeFunction | spring.ai.alibaba.toolcalling.time.enable=true | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-time</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 时区查询工具 |
| getToutiaoNewsFunction | spring.ai.alibaba.toolcalling.toutiaonews.enable=true | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-toutiaonews</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 今日头条新闻查询工具 |
| getWeatherServiceFunction | spring.ai.alibaba.toolcalling.weather.enable=true<br/>spring.ai.alibaba.toolcalling.weather.apiKey=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-weather</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 天气查询工具 |
| youdaoTranslateFunction | spring.ai.alibaba.toolcalling.youdaotranslate.enable=true<br/>spring.ai.alibaba.toolcalling.youdaotranslate.appKey=xxx<br/>spring.ai.alibaba.toolcalling.youdaotranslate.appSecret=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-youdaotranslate</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 有道翻译工具 |
| createYuqueDocFunction | spring.ai.alibaba.toolcalling.yuque.enable=true<br/>spring.ai.alibaba.toolcalling.yuque.authToken=xxx | ``` <dependency>   <groupId>com.alibaba.cloud.ai</groupId>   <artifactId>spring-ai-alibaba-starter-tool-calling-yuque</artifactId>   <version>${spring.ai.alibaba.version}</version> </dependency> ``` | 语雀文档创建工具 |
