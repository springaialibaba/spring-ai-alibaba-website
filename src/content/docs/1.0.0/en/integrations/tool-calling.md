---
title: Tool Calling Plugin Integration
keywords: [Spring AI Alibaba,Integration,ToolCalling]
description: "Quickly integrate third-party services using Spring AI Alibaba community's Tool Calling"
---

## Usage

Spring AI Alibaba community offers multiple Tool Calling extension implementations, enabling developers to activate plugins declaratively and avoid redundant development efforts.

The `artifactId` of community-provided Tool Calling plugins follows the format `spring-ai-alibaba-starter-tool-calling-xxx`. Below, we use Alibaba Translate Service (`alitranslate`) as an example to demonstrate the steps for using a community Tool Calling plugin.

1. **Add Maven Dependency**:

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

2. **Enable the plugin and configure required parameters in the configuration file**:

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

3. **Register Tool when invoking ChatClient**:

```java
String response = chatClient.prompt("You are a translation assistant.")
    .user("Please help me translate 'Thank you for using this product' into Chinese and Japanese.")
    .toolNames("aliTranslateService")
    .call()
    .content();
```

**Or register Tool when constructing the ChatClient**:

```java
chatClient = ChatClient.builder(chatModel)
    .defaultToolNames("aliTranslateService")
    .build();
String response = chatClient.prompt("You are a translation assistant.")
        .user("Please help me translate 'Thank you for using this product' into Chinese and Japanese.")
        .call()
        .content();
```

## Available Community Extensions

Below is the list of available Tool Callings for version `1.0.0.2` (**subject to change in future updates, please refer to the corresponding version code**), which can be used according to business needs:

- Alibaba Cloud Machine Translation
    - **Tool Name**: `aliTranslateService`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.alitranslate`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-alitranslate`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `access-key-id`: AccessKeyId of the service. If not provided, the value will be read from the system environment variable`ALITRANSLATE_ACCESS_KEY_ID`.
        - `secret-key`: SecretKey of the service. If not provided, the value will be read from the system environment variable`ALITRANSLATE_ACCESS_KEY_SECRET`.
- Get city weather from Amap
    - **Tool Name**: `gaoDeGetAddressWeather`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.amap`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-amap`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `api-key`: ApiKey of the service. If not provided, the value will be read from the system environment variable`GAODE_AMAP_API_KEY`.
- Baidu Map
    - **Tool Name**: 
        - `baiduMapGetAddressInformation`: get detail information of address.
        - `baiDuMapGetAddressWeatherInformation`: get weather of a city.
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.baidu.map`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-baidumap`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `api-key`: ApiKey of the service. If not provided, the value will be read from the system environment variable`BAIDU_MAP_API_KEY`.
- Baidu Search
    - **Tool Name**: `baiduSearch`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.baidu.search`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-baidusearch`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
- Baidu Translate
    - **Tool Name**: `baiduTranslate`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.baidu.translate`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-baidutranslate`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `secret-key`: SecretKey of Service. If not provided, the value will be read from the system environment variable`BAIDU_TRANSLATE_SECRET_KEY`.
        - `app-id`: AppId of the service. If not provided, the value will be read from the system environment variable`BAIDU_TRANSLATE_APP_ID`.
- Bing Search
    - **Tool Name**: `bingSearch`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.bingsearch`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-bingsearch`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `token`: Token of the service. If not provided, the value will be read from the system environment variable`BING_SEARCH_TOKEN`.
- Dingtalk Group Send Message
    - **Tool Name**: `dingTalkGroupSendMessageByCustomRobot`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.dingtalk`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-dingtalk`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `custom-robot-access-token`: AccessToken of custom robot. It must be provided.
        - `custom-robot-signature`: Signature of custom robot. It must be provided.
- DuckDuckGo Query News
    - **Tool Name**: `duckDuckGoQueryNews`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.duckduckgo`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-duckduckgo`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `api-key`: ApiKey of Serpapi service. If not provided, the value will be read from the system environment variable`SERPAPI_KEY`.
- GitHub Tool Kits
    - **Tool Name**: 
        - `getIssue`: Retrieve issue information from a GitHub repository.
        - `createPullRequest`: Create a Pull Request in a GitHub repository.
        - `SearchRepository`: Query repository information by name on GitHub.
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.githubtoolkit`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-githubtoolkit`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `token`: Token of GitHub account. If not provided, the value will be read from the system environment variable`GITHUB_TOKEN`.
        - `owner`: The repository owner to query. It must be provided.
        - `repository`: The name to query. It must be provided.
- Google Translate
    - **Tool Name**: `googleTranslate`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.googletranslate`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-googletranslate`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `api-key`: ApiKey of the service. If not provided, the value will be read from the system environment variable`GOOGLE_TRANSLATE_APIKEY`.
- JSON Prase Tools
    - **Tool Name**: 
        - `jsonInsertPropertyFieldFunction`: Add a field value to a JSON object.
        - `jsonParsePropertyFunction`: Retrieve the value of a field from a JSON object.
        - `jsonRemovePropertyFieldFunction`: Remove a field from a JSON object.
        - `jsonReplacePropertyFiledValueFunction`:  Replace the value of a field in a JSON object.
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.jsonprocessor`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-jsonprocessor`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
- Query express delivery information via Kuaidi100
    - **Tool Name**: `queryTrack`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.kuaidi100`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-kuaidi100`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `api-key`: ApiKey of the service. If not provided, the value will be read from the system environment variable`KUAIDI100_KEY`.
        - `app-id`: AppId of the service. If not provided, the value will be read from the system environment variable`KUAIDI100_CUSTOMER`.
- LarkSuite
    - **Tool Name**: 
        - `larksuiteCreateDocFunction`: Create doc.
        - `larksuiteChatFunction`: Send chat message.
        - `larksuiteCreateSheetFunction`: Create sheet.
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.larksuite`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-larksuite`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `app-id`: AppId of the service. It must be provided.
        - `app-secret`: AppSecret of the service. It must be provided.
- Microsoft Translate
    - **Tool Name**: `microSoftTranslateFunction`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.microsofttranslate`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-microsofttranslate<`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `api-key`: ApiKey of the service. If not provided, the value will be read from the system environment variable`MICROSOFT_TRANSLATE_API_KEY`.
        - `region`: Set the value for the request header `Ocp-Apim-Subscription-Region`. It must be provided.
- Regular expression query
    - **Tool Name**: `regexFindAll`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.regex`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-regex`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
- Sensitive Filter
    - **Tool Name**: `sensitiveFilter`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.sensitivefilter`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-sensitivefilter`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `replacement`: The replacement string for sensitive information, defaulting to `***`.
        - `filterPhoneNumber`: Whether to filter phone numbers, defaults to `true`.
        - `filterIdCard`: Whether to filter ID cards, defaults to `true`.
        - `filterBankCard`: Whether to filter bank cards, defaults to `true`.
        - `filterEmail`: Whether to filter emails, defaults to `true`.
- Serpai Search
    - **Tool Name**: 
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.serpai`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-serpai`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `api-key`: ApiKey of the service. If not provided, the value will be read from the system environment variable`SERPAPI_KEY`.
        - `engine`: Select the search engine to use. It must be provided.
- Sina News
    - **Tool Name**: `getSinaNews`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.sinanews`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-sinanews`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
- Tavily Search
    - **Tool Name**: `tavilySearch`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.tavilysearch`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-tavilysearch`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `api-key`: ApiKey of the service. If not provided, the value will be read from the system environment variable`TAVILY_SEARCH_API_KEY`.
- Get the time for a specific timezone
    - **Tool Name**: `getCityTimeFunction`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.time`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-time`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
- Toutiao News
    - **Tool Name**: `getToutiaoNews`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.toutiaonews`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-toutiaonews`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
- Weather Api
    - **Tool Name**: `getWeatherService`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.weather`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-weather`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `api-key`: ApiKey of the service. If not provided, the value will be read from the system environment variable`WEATHER_API_KEY`.
- Youdao Translate
    - **Tool Name**: `youdaoTranslate`
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.youdaotranslate`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-youdaotranslate`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `secret-key`: AppSecret of the service. If not provided, the value will be read from the system environment variable`YOUDAO_APP_SECRET`.
        - `app-id`: AppId of the service. If not provided, the value will be read from the system environment variable`YOUDAO_APP_ID`.
- Yuque
    - **Tool Name**: 
        - `createYuqueDoc`: Create Yuque doc.
        - `createYuqueBook`: Create Yuque book.
        - `updateDocService`: Update doc.
        - `deleteDocService`: Delete doc.
    - **Configuration Prefix**: `spring.ai.alibaba.toolcalling.yuque`
    - **Maven ArtifactId**: `spring-ai-alibaba-starter-tool-calling-yuque`
    - **Properties Description**: 
        - `enabled`: Enable the Tool when set to `true`.
        - `token`，Token of the service. It must be provided.
