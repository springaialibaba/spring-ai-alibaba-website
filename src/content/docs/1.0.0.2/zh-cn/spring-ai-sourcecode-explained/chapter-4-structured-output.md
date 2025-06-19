---
title: 第四章：结构化输出
keywords: [Spring AI, Spring AI Alibaba, 源码解读]
description: "本章介绍了如何让 Spring AI 模型的输出结果遵循特定的结构化格式，例如 `Map`、`List` 或自定义的 Java Bean。这种能力使得 AI 的响应可以直接转换为应用程序易于处理和使用的数据类型。章节通过 `MapListController` 示例，展示了如何结合 `MapOutputConverter` 和 `ListOutputConverter` 将模型的自由文本输出分别转换为 `Map` 和 `List` 数据结构，并解释了如何在提示（Prompt）中加入格式化指令。随后，通过 `BeanController` 和一个名为 `BeanEntity` 的记录（Record）示例，演示了两种将输出直接转换为 Java Bean 对象的方法：一种是使用 `BeanOutputConverter` 进行显式转换，另一种是利用 `ChatClient` 流式 API 中的 `.entity(YourBean.class)` 方法实现更简洁的转换。章节最后开始探讨结构化输出相关的源码实现，首先介绍了 `FormatProvider` 接口，该接口用于定义输出格式的规范。"
---

- 作者：影子, Spring AI Alibaba Committer
- 本文档基于 Spring AI 1.0.0 版本，Spring AI Alibaba 1.0.0.2 版本
- 本章内容是结构化快速上手 + 源码解读

## 结构化输出 快速上手

> 将 AI 模型的结果转换为特定的数据类型（JSON、Java 类等），方便传递到其他应用程序函数和方法。以下实现了 Map、List、实例对象，实战代码可见：https://github.com/GTyingzi/spring-ai-tutorial 下的structured-output

### pom 文件

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-autoconfigure-model-openai</artifactId>
        <version>${spring-ai.version}</version>
    </dependency>

    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-autoconfigure-model-chat-client</artifactId>
    </dependency>

</dependencies>
```

### application.yml

```yaml
server:
  port: 8080

spring:
  application:
    name: structured-output

  ai:
    openai:
      api-key: ${DASHSCOPEAPIKEY}
      base-url: https://dashscope.aliyuncs.com/compatible-mode
      chat:
        options:
          model: qwen-max
```

### Map、List 转换

#### MapListController

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.ListOutputConverter;
import org.springframework.ai.converter.MapOutputConverter;
import org.springframework.core.convert.support.DefaultConversionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/map-list")
public class MapListController {

    private static final Logger logger = LoggerFactory.getLogger(MapListController.class);

    private final ChatClient chatClient;
    private final MapOutputConverter mapConverter;
    private final ListOutputConverter listConverter;

    public MapListController(ChatClient.Builder builder) {
        // map转换器
        this.mapConverter = new MapOutputConverter();
        // list转换器
        this.listConverter = new ListOutputConverter(new DefaultConversionService());

        this.chatClient = builder
                .build();
    }

    
    @GetMapping("/map")
    public Map<String, Object> map(@RequestParam(value = "query", defaultValue = "请为我描述下影子的特性") String query) {
        return chatClient.prompt(query)
                .advisors(
                        a -> a.param(ChatClientAttributes.OUTPUT_FORMAT.getKey(), mapConverter.getFormat())
                ).call().entity(mapConverter);
    }
    
    @GetMapping("/list")
    public List<String> list(@RequestParam(value = "query", defaultValue = "请为我描述下影子的特性") String query) {
        return chatClient.prompt(query)
                .advisors(
                        a -> a.param(ChatClientAttributes.OUTPUT_FORMAT.getKey(), listConverter.getFormat())
                ).call().entity(listConverter);
    }

}
```

##### 效果

转换为 Map 类型

![](/img/user/ai/spring-ai-explained-sourcecode/Iw5gbB01XoaEzixFoiAcgMGEnc3.png)

转换为 List 类型

![](/img/user/ai/spring-ai-explained-sourcecode/C8OrbhbjMoMXtPxUG37cRVw0nUc.png)

### 实例对象转换

#### BeanEntity

```java
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

@JsonPropertyOrder({"title", "date", "author", "content"}) // 指定属性的顺序
public record BeanEntity(String title, String author, String date, String content) {
}
```

#### BeanController

```java
package com.spring.ai.tutorial.outparser.controller;

import com.spring.ai.tutorial.outparser.model.entity.BeanEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.template.st.StTemplateRenderer;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/bean")
public class BeanController {

    private static final Logger log = LoggerFactory.getLogger(BeanController.class);

    private final ChatClient chatClient;
    private final BeanOutputConverter<BeanEntity> converter;

    public BeanController(ChatClient.Builder builder) {
        this.converter = new BeanOutputConverter<>(
                new ParameterizedTypeReference<BeanEntity>() {
                }
        );
        this.chatClient = builder
                .build();
    }

    @GetMapping("/call")
    public String call(@RequestParam(value = "query", defaultValue = "以影子为作者，写一篇200字左右的有关人工智能诗篇") String query) {
        String result = chatClient.prompt(query)
                .call().content();

        log.info("result: {}", result);
        assert result != null;
        try {
            BeanEntity convert = converter.convert(result);
            log.info("反序列成功，convert: {}", convert);
        } catch (Exception e) {
            log.error("反序列化失败");
        }
        return result;
    }

    @GetMapping("/call/format")
    public BeanEntity callFormat(@RequestParam(value = "query", defaultValue = "以影子为作者，写一篇200字左右的有关人工智能诗篇") String query) {
        return chatClient.prompt(query)
                .call().entity(BeanEntity.class);
    }

}
```

##### 效果

![](/img/user/ai/spring-ai-explained-sourcecode/OER3bxN4DoiFnjxTI4IcmsWsnQf.png)

## 结构化源码解读

### FormatProvider（格式提供接口）

用于定义输出格式规划的接口，为 AI 模型生成的内容提供格式化指令

```java
package org.springframework.ai.converter;

public interface FormatProvider {

    String getFormat();

}
```

### Converter（转换接口）

实现 convert 方法，格式 S 转换为 T

```java
import org.springframework.lang.Nullable;
import org.springframework.util.Assert;

@FunctionalInterface
public interface Converter<S, T> {
    @Nullable
    T convert(S source);

    default <U> Converter<S, U> andThen(Converter<? super T, ? extends U> after) {
        Assert.notNull(after, "'after' Converter must not be null");
        return (s) -> {
            T initialResult = this.convert(s);
            return initialResult != null ? after.convert(initialResult) : null;
        };
    }
}
```

### StructuredOutputConverter

用于将 AI 模型的原始输出转换为结构化数据的核心接口，结合 Converter 和 FormatProvider 的能力，既定义了数据转换逻辑，又明确了输出格式规范，确保模型输出能被可靠解析为 Java 对象

- Converter<String, T>：定义将原始字符串（模型输出）转换为结构化类型 T 的约定
- FormatProvider： 提供模型输出应遵循的格式规范（如 JSON、XML、CSV 等），供模型调用时作为提示词的一部分

```java
package org.springframework.ai.converter;

import org.springframework.core.convert.converter.Converter;

public interface StructuredOutputConverter<T> extends Converter<String, T>, FormatProvider {
}
```

### BeanOutputConverter

用于将 AI 模型的原始输出转换为特定 Java 类型对象的转换器，通过生成目标类型的 JSON Schema 确保输出格式规范，并使用 Jackson 进行反序列化，实现从非结构化文本到结构化对象转换

- `Type type`：目标类型信息
- `ObjectMapper objectMapper`：Jackson 的 JSON 序列化/反序列化工具，支持自定义配置
- `String jsonSchema`：生成的目标类型的 JSON Schema 描述，用于模型输出格式约束

<table>
<tr>
<td>方法名称<br/></td><td>描述<br/></td></tr>
<tr>
<td>BeanOutputConverter<br/></td><td>根据目标类型、自定义ObjectMapper、泛型类型等构造<br/></td></tr>
<tr>
<td>convert<br/></td><td>将 LLM 输出的原始文本转换为目标类型对象<br/></td></tr>
<tr>
<td>getFormat<br/></td><td>返回 JSON Schema 指令，指导模型输出格式<br/></td></tr>
<tr>
<td>getJsonSchema<br/></td><td>获取生成的 JSON Schema 字符串<br/></td></tr>
<tr>
<td>getJsonSchemaMap<br/></td><td>将 JSON Schema 转换为 Map 结构，便于程序动态解析<br/></td></tr>
</table>


```java
package org.springframework.ai.converter;

import java.lang.reflect.Type;
import java.util.Map;
import java.util.Objects;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.util.DefaultIndenter;
import com.fasterxml.jackson.core.util.DefaultPrettyPrinter;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.github.victools.jsonschema.generator.Option;
import com.github.victools.jsonschema.generator.SchemaGenerator;
import com.github.victools.jsonschema.generator.SchemaGeneratorConfig;
import com.github.victools.jsonschema.generator.SchemaGeneratorConfigBuilder;
import com.github.victools.jsonschema.module.jackson.JacksonModule;
import com.github.victools.jsonschema.module.jackson.JacksonOption;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.ai.util.JacksonUtils;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.lang.NonNull;

import static org.springframework.ai.util.LoggingMarkers.SENSITIVEDATAMARKER;

public class BeanOutputConverter<T> implements StructuredOutputConverter<T> {

    private final Logger logger = LoggerFactory.getLogger(BeanOutputConverter.class);

    private final Type type;

    private final ObjectMapper objectMapper;

    private String jsonSchema;

    public BeanOutputConverter(Class<T> clazz) {
       this(ParameterizedTypeReference.forType(clazz));
    }

    public BeanOutputConverter(Class<T> clazz, ObjectMapper objectMapper) {
       this(ParameterizedTypeReference.forType(clazz), objectMapper);
    }

    public BeanOutputConverter(ParameterizedTypeReference<T> typeRef) {
       this(typeRef.getType(), null);
    }

    public BeanOutputConverter(ParameterizedTypeReference<T> typeRef, ObjectMapper objectMapper) {
       this(typeRef.getType(), objectMapper);
    }

    private BeanOutputConverter(Type type, ObjectMapper objectMapper) {
       Objects.requireNonNull(type, "Type cannot be null;");
       this.type = type;
       this.objectMapper = objectMapper != null ? objectMapper : getObjectMapper();
       generateSchema();
    }

    private void generateSchema() {
       JacksonModule jacksonModule = new JacksonModule(JacksonOption.RESPECTJSONPROPERTYREQUIRED,
             JacksonOption.RESPECTJSONPROPERTYORDER);
       SchemaGeneratorConfigBuilder configBuilder = new SchemaGeneratorConfigBuilder(
             com.github.victools.jsonschema.generator.SchemaVersion.DRAFT202012,
             com.github.victools.jsonschema.generator.OptionPreset.PLAINJSON)
          .with(jacksonModule)
          .with(Option.FORBIDDENADDITIONALPROPERTIESBYDEFAULT);
       SchemaGeneratorConfig config = configBuilder.build();
       SchemaGenerator generator = new SchemaGenerator(config);
       JsonNode jsonNode = generator.generateSchema(this.type);
       ObjectWriter objectWriter = this.objectMapper.writer(new DefaultPrettyPrinter()
          .withObjectIndenter(new DefaultIndenter().withLinefeed(System.lineSeparator())));
       try {
          this.jsonSchema = objectWriter.writeValueAsString(jsonNode);
       }
       catch (JsonProcessingException e) {
          logger.error("Could not pretty print json schema for jsonNode: {}", jsonNode);
          throw new RuntimeException("Could not pretty print json schema for " + this.type, e);
       }
    }

    @SuppressWarnings("unchecked")
    @Override
    public T convert(@NonNull String text) {
       try {
          // Remove leading and trailing whitespace
          text = text.trim();

          // Check for and remove triple backticks and "json" identifier
          if (text.startsWith("```") && text.endsWith("```")) {
             // Remove the first line if it contains "```json"
             String[] lines = text.split("\n", 2);
             if (lines[0].trim().equalsIgnoreCase("```json")) {
                text = lines.length > 1 ? lines[1] : "";
             }
             else {
                text = text.substring(3); // Remove leading ```
             }

             // Remove trailing ```
             text = text.substring(0, text.length() - 3);

             // Trim again to remove any potential whitespace
             text = text.trim();
          }
          return (T) this.objectMapper.readValue(text, this.objectMapper.constructType(this.type));
       }
       catch (JsonProcessingException e) {
          logger.error(SENSITIVEDATAMARKER,
                "Could not parse the given text to the desired target type: \"{}\" into {}", text, this.type);
          throw new RuntimeException(e);
       }
    }

    protected ObjectMapper getObjectMapper() {
       return JsonMapper.builder()
          .addModules(JacksonUtils.instantiateAvailableModules())
          .configure(DeserializationFeature.FAILONUNKNOWNPROPERTIES, false)
          .build();
    }

    @Override
    public String getFormat() {
       String template = """
             Your response should be in JSON format.
             Do not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.
             Do not include markdown code blocks in your response.
             Remove the ```json markdown from the output.
             Here is the JSON Schema instance your output must adhere to:
             ```%s```
             """;
       return String.format(template, this.jsonSchema);
    }

    public String getJsonSchema() {
       return this.jsonSchema;
    }

    public Map<String, Object> getJsonSchemaMap() {
       try {
          return this.objectMapper.readValue(this.jsonSchema, Map.class);
       }
       catch (JsonProcessingException ex) {
          logger.error("Could not parse the JSON Schema to a Map object", ex);
          throw new IllegalStateException(ex);
       }
    }

}
```

### ListOutputConverter

List 转换器，通过约定逗号分隔的文本格式，实现从非结构化文本到结构化列表数据的高效转换

- 继承自 AbstractConversionServiceOutputConverter 类，DefaultConversionService 实现复杂的类型转换

<table>
<tr>
<td>方法名称<br/></td><td>描述<br/></td></tr>
<tr>
<td>getFormat<br/></td><td>输送给大模型的List格式说明<br/></td></tr>
<tr>
<td>convert<br/></td><td>将模型输出的实例字符串转List<String><br/></td></tr>
</table>


```java
package org.springframework.ai.converter;

import java.util.List;

import org.springframework.core.convert.support.DefaultConversionService;
import org.springframework.lang.NonNull;

public class ListOutputConverter extends AbstractConversionServiceOutputConverter<List<String>> {

    public ListOutputConverter() {
       this(new DefaultConversionService());
    }

    public ListOutputConverter(DefaultConversionService defaultConversionService) {
       super(defaultConversionService);
    }

    @Override
    public String getFormat() {
       return """
             Respond with only a list of comma-separated values, without any leading or trailing text.
             Example format: foo, bar, baz
             """;
    }

    @Override
    public List<String> convert(@NonNull String text) {
       return this.getConversionService().convert(text, List.class);
    }

}
```

#### AbstractConversionServiceOutputConverter

SpringAI 框架中所有基于 ConversionService 的结构化输出转换器的基类，其核心作用是 封装类型转换的通用逻辑，为子类提供统一的 DefaultConversionService 实例

```java
package org.springframework.ai.converter;

import org.springframework.core.convert.support.DefaultConversionService;

public abstract class AbstractConversionServiceOutputConverter<T> implements StructuredOutputConverter<T> {

    private final DefaultConversionService conversionService;

    public AbstractConversionServiceOutputConverter(DefaultConversionService conversionService) {
       this.conversionService = conversionService;
    }

    public DefaultConversionService getConversionService() {
       return this.conversionService;
    }

}
```

#### DefaultConversionService

Spring 框架中用于提供默认类型转逻辑的类，继承自 GenericConversionService，并扩展其能力，支持常见的标量类型、集合类型之间的转换

<table>
<tr>
<td>方法名称<br/></td><td>描述<br/></td></tr>
<tr>
<td>getSharedInstance<br/></td><td>缓存单例实例，确保全局唯一性<br/></td></tr>
<tr>
<td>addDefaultConverters<br/></td><td>向注册表中注册所有默认的类型转换器<br/></td></tr>
<tr>
<td>addCollectionConverters<br/></td><td>注册集合类型（数组、集合、Map）之间的转换器<br/></td></tr>
<tr>
<td>addScalarConverters<br/></td><td>注册标量类型（非集合类型）的转换器<br/></td></tr>
</table>


设计模式的典范：

- 单例模式：通过 getSharedInstance() 提供全局唯一实例，减少资源开销。
- 策略模式：通过 Converter 接口定义统一的转换策略，支持多种类型组合。
- 工厂模式：使用 ConverterFactory 动态生成转换器（如 StringToNumberConverterFactory）。
- 组合模式：通过 addDefaultConverters 组合标量和集合转换器，形成完整的转换体系

```java
package org.springframework.core.convert.support;

import java.nio.charset.Charset;
import java.util.Currency;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import kotlin.text.Regex;
import org.springframework.core.KotlinDetector;
import org.springframework.core.convert.ConversionService;
import org.springframework.core.convert.converter.ConverterRegistry;
import org.springframework.lang.Nullable;

public class DefaultConversionService extends GenericConversionService {
    @Nullable
    private static volatile DefaultConversionService sharedInstance;

    public DefaultConversionService() {
        addDefaultConverters(this);
    }

    public static ConversionService getSharedInstance() {
        DefaultConversionService cs = sharedInstance;
        if (cs == null) {
            synchronized(DefaultConversionService.class) {
                cs = sharedInstance;
                if (cs == null) {
                    cs = new DefaultConversionService();
                    sharedInstance = cs;
                }
            }
        }

        return cs;
    }

    public static void addDefaultConverters(ConverterRegistry converterRegistry) {
        addScalarConverters(converterRegistry);
        addCollectionConverters(converterRegistry);
        converterRegistry.addConverter(new ByteBufferConverter((ConversionService)converterRegistry));
        converterRegistry.addConverter(new StringToTimeZoneConverter());
        converterRegistry.addConverter(new ZoneIdToTimeZoneConverter());
        converterRegistry.addConverter(new ZonedDateTimeToCalendarConverter());
        converterRegistry.addConverter(new ObjectToObjectConverter());
        converterRegistry.addConverter(new IdToEntityConverter((ConversionService)converterRegistry));
        converterRegistry.addConverter(new FallbackObjectToStringConverter());
        converterRegistry.addConverter(new ObjectToOptionalConverter((ConversionService)converterRegistry));
    }

    public static void addCollectionConverters(ConverterRegistry converterRegistry) {
        ConversionService conversionService = (ConversionService)converterRegistry;
        converterRegistry.addConverter(new ArrayToCollectionConverter(conversionService));
        converterRegistry.addConverter(new CollectionToArrayConverter(conversionService));
        converterRegistry.addConverter(new ArrayToArrayConverter(conversionService));
        converterRegistry.addConverter(new CollectionToCollectionConverter(conversionService));
        converterRegistry.addConverter(new MapToMapConverter(conversionService));
        converterRegistry.addConverter(new ArrayToStringConverter(conversionService));
        converterRegistry.addConverter(new StringToArrayConverter(conversionService));
        converterRegistry.addConverter(new ArrayToObjectConverter(conversionService));
        converterRegistry.addConverter(new ObjectToArrayConverter(conversionService));
        converterRegistry.addConverter(new CollectionToStringConverter(conversionService));
        converterRegistry.addConverter(new StringToCollectionConverter(conversionService));
        converterRegistry.addConverter(new CollectionToObjectConverter(conversionService));
        converterRegistry.addConverter(new ObjectToCollectionConverter(conversionService));
        converterRegistry.addConverter(new StreamConverter(conversionService));
    }

    private static void addScalarConverters(ConverterRegistry converterRegistry) {
        converterRegistry.addConverterFactory(new NumberToNumberConverterFactory());
        converterRegistry.addConverterFactory(new StringToNumberConverterFactory());
        converterRegistry.addConverter(Number.class, String.class, new ObjectToStringConverter());
        converterRegistry.addConverter(new StringToCharacterConverter());
        converterRegistry.addConverter(Character.class, String.class, new ObjectToStringConverter());
        converterRegistry.addConverter(new NumberToCharacterConverter());
        converterRegistry.addConverterFactory(new CharacterToNumberFactory());
        converterRegistry.addConverter(new StringToBooleanConverter());
        converterRegistry.addConverter(Boolean.class, String.class, new ObjectToStringConverter());
        converterRegistry.addConverterFactory(new StringToEnumConverterFactory());
        converterRegistry.addConverter(new EnumToStringConverter((ConversionService)converterRegistry));
        converterRegistry.addConverterFactory(new IntegerToEnumConverterFactory());
        converterRegistry.addConverter(new EnumToIntegerConverter((ConversionService)converterRegistry));
        converterRegistry.addConverter(new StringToLocaleConverter());
        converterRegistry.addConverter(Locale.class, String.class, new ObjectToStringConverter());
        converterRegistry.addConverter(new StringToCharsetConverter());
        converterRegistry.addConverter(Charset.class, String.class, new ObjectToStringConverter());
        converterRegistry.addConverter(new StringToCurrencyConverter());
        converterRegistry.addConverter(Currency.class, String.class, new ObjectToStringConverter());
        converterRegistry.addConverter(new StringToPropertiesConverter());
        converterRegistry.addConverter(new PropertiesToStringConverter());
        converterRegistry.addConverter(new StringToUUIDConverter());
        converterRegistry.addConverter(UUID.class, String.class, new ObjectToStringConverter());
        converterRegistry.addConverter(new StringToPatternConverter());
        converterRegistry.addConverter(Pattern.class, String.class, new ObjectToStringConverter());
        if (KotlinDetector.isKotlinPresent()) {
            converterRegistry.addConverter(new StringToRegexConverter());
            converterRegistry.addConverter(Regex.class, String.class, new ObjectToStringConverter());
        }

    }
}
```

#### GenericConversionService

为类型转换服务提供了通用的实现基础，定了类型转换的核心机制，实现了 ConfigurableConversionService 接口，主要提供以下功能

- 类型转换：支持任意类型之间的转换（如 String → Integer、List<String> → Set<Integer> 等）
- 转换器管理：支持注册、查找和缓存转换器（Converter、ConverterFactory、GenericConverter）
- 性能优化：通过缓存机制减少重复查找转换器的开销
- 条件匹配：支持动态匹配复杂类型（如泛型、集合、Map 等）

各字段说明

- GenericConverter NOOPCONVERTER：无需转换的场景
- GenericConverter NOMATCH：无匹配的转换器
- Converters converters：存储所有注册的转换器（Converter、ConverterFactory、GenericConverter）
- Map<ConverterCacheKey, GenericConverter> converterCache：缓存已解析的转换器

<table>
<tr>
<td>方法名称<br/></td><td>描述<br/></td></tr>
<tr>
<td>addConverter<br/></td><td>注册一个转换器<br/></td></tr>
<tr>
<td>addConverterFactory<br/></td><td>注册一个转换器工厂<br/></td></tr>
<tr>
<td>convert<br/></td><td>类型转换，将source转换为targetType<br/></td></tr>
<tr>
<td>canConvert<br/></td><td>判断是否支持从 sourceType 到 targetType 的转换<br/></td></tr>
<tr>
<td>getConverter<br/></td><td>根据源类型和目标类型查找匹配的转换器<br/></td></tr>
<tr>
<td>removeConvertible<br/></td><td>移除指定源类型和目标类型的转换器<br/></td></tr>
</table>


```java
package org.springframework.core.convert.support;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.CopyOnWriteArraySet;
import org.springframework.core.DecoratingProxy;
import org.springframework.core.ResolvableType;
import org.springframework.core.convert.ConversionFailedException;
import org.springframework.core.convert.ConverterNotFoundException;
import org.springframework.core.convert.TypeDescriptor;
import org.springframework.core.convert.converter.ConditionalConverter;
import org.springframework.core.convert.converter.ConditionalGenericConverter;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;
import org.springframework.core.convert.converter.GenericConverter;
import org.springframework.lang.Nullable;
import org.springframework.util.Assert;
import org.springframework.util.ClassUtils;
import org.springframework.util.ConcurrentReferenceHashMap;
import org.springframework.util.StringUtils;

public class GenericConversionService implements ConfigurableConversionService {
    private static final GenericConverter NOOPCONVERTER = new NoOpConverter("NOOP");
    private static final GenericConverter NOMATCH = new NoOpConverter("NOMATCH");
    private final Converters converters = new Converters();
    private final Map<ConverterCacheKey, GenericConverter> converterCache = new ConcurrentReferenceHashMap(64);

    public GenericConversionService() {
    }

    public void addConverter(Converter<?, ?> converter) {
        ResolvableType[] typeInfo = this.getRequiredTypeInfo(converter.getClass(), Converter.class);
        if (typeInfo == null && converter instanceof DecoratingProxy decoratingProxy) {
            typeInfo = this.getRequiredTypeInfo(decoratingProxy.getDecoratedClass(), Converter.class);
        }

        if (typeInfo == null) {
            throw new IllegalArgumentException("Unable to determine source type <S> and target type <T> for your Converter [" + converter.getClass().getName() + "]; does the class parameterize those types?");
        } else {
            this.addConverter((GenericConverter)(new ConverterAdapter(converter, typeInfo[0], typeInfo[1])));
        }
    }

    public <S, T> void addConverter(Class<S> sourceType, Class<T> targetType, Converter<? super S, ? extends T> converter) {
        this.addConverter((GenericConverter)(new ConverterAdapter(converter, ResolvableType.forClass(sourceType), ResolvableType.forClass(targetType))));
    }

    public void addConverter(GenericConverter converter) {
        this.converters.add(converter);
        this.invalidateCache();
    }

    public void addConverterFactory(ConverterFactory<?, ?> factory) {
        ResolvableType[] typeInfo = this.getRequiredTypeInfo(factory.getClass(), ConverterFactory.class);
        if (typeInfo == null && factory instanceof DecoratingProxy decoratingProxy) {
            typeInfo = this.getRequiredTypeInfo(decoratingProxy.getDecoratedClass(), ConverterFactory.class);
        }

        if (typeInfo == null) {
            throw new IllegalArgumentException("Unable to determine source type <S> and target type <T> for your ConverterFactory [" + factory.getClass().getName() + "]; does the class parameterize those types?");
        } else {
            this.addConverter((GenericConverter)(new ConverterFactoryAdapter(factory, new GenericConverter.ConvertiblePair(typeInfo[0].toClass(), typeInfo[1].toClass()))));
        }
    }

    public void removeConvertible(Class<?> sourceType, Class<?> targetType) {
        this.converters.remove(sourceType, targetType);
        this.invalidateCache();
    }

    public boolean canConvert(@Nullable Class<?> sourceType, Class<?> targetType) {
        Assert.notNull(targetType, "Target type to convert to cannot be null");
        return this.canConvert(sourceType != null ? TypeDescriptor.valueOf(sourceType) : null, TypeDescriptor.valueOf(targetType));
    }

    public boolean canConvert(@Nullable TypeDescriptor sourceType, TypeDescriptor targetType) {
        Assert.notNull(targetType, "Target type to convert to cannot be null");
        return sourceType == null || this.getConverter(sourceType, targetType) != null;
    }

    public boolean canBypassConvert(@Nullable TypeDescriptor sourceType, TypeDescriptor targetType) {
        Assert.notNull(targetType, "Target type to convert to cannot be null");
        return sourceType == null || this.getConverter(sourceType, targetType) == NOOPCONVERTER;
    }

    @Nullable
    public <T> T convert(@Nullable Object source, Class<T> targetType) {
        Assert.notNull(targetType, "Target type to convert to cannot be null");
        return this.convert(source, TypeDescriptor.forObject(source), TypeDescriptor.valueOf(targetType));
    }

    @Nullable
    public Object convert(@Nullable Object source, @Nullable TypeDescriptor sourceType, TypeDescriptor targetType) {
        Assert.notNull(targetType, "Target type to convert to cannot be null");
        if (sourceType == null) {
            Assert.isTrue(source == null, "Source must be [null] if source type == [null]");
            return this.handleResult((TypeDescriptor)null, targetType, this.convertNullSource((TypeDescriptor)null, targetType));
        } else if (source != null && !sourceType.getObjectType().isInstance(source)) {
            String var10002 = String.valueOf(sourceType);
            throw new IllegalArgumentException("Source to convert from must be an instance of [" + var10002 + "]; instead it was a [" + source.getClass().getName() + "]");
        } else {
            GenericConverter converter = this.getConverter(sourceType, targetType);
            if (converter != null) {
                Object result = ConversionUtils.invokeConverter(converter, source, sourceType, targetType);
                return this.handleResult(sourceType, targetType, result);
            } else {
                return this.handleConverterNotFound(source, sourceType, targetType);
            }
        }
    }

    public String toString() {
        return this.converters.toString();
    }

    @Nullable
    protected Object convertNullSource(@Nullable TypeDescriptor sourceType, TypeDescriptor targetType) {
        return targetType.getObjectType() == Optional.class ? Optional.empty() : null;
    }

    @Nullable
    protected GenericConverter getConverter(TypeDescriptor sourceType, TypeDescriptor targetType) {
        ConverterCacheKey key = new ConverterCacheKey(sourceType, targetType);
        GenericConverter converter = (GenericConverter)this.converterCache.get(key);
        if (converter != null) {
            return converter != NOMATCH ? converter : null;
        } else {
            converter = this.converters.find(sourceType, targetType);
            if (converter == null) {
                converter = this.getDefaultConverter(sourceType, targetType);
            }

            if (converter != null) {
                this.converterCache.put(key, converter);
                return converter;
            } else {
                this.converterCache.put(key, NOMATCH);
                return null;
            }
        }
    }

    @Nullable
    protected GenericConverter getDefaultConverter(TypeDescriptor sourceType, TypeDescriptor targetType) {
        return sourceType.isAssignableTo(targetType) ? NOOPCONVERTER : null;
    }

    @Nullable
    private ResolvableType[] getRequiredTypeInfo(Class<?> converterClass, Class<?> genericIfc) {
        ResolvableType resolvableType = ResolvableType.forClass(converterClass).as(genericIfc);
        ResolvableType[] generics = resolvableType.getGenerics();
        if (generics.length < 2) {
            return null;
        } else {
            Class<?> sourceType = generics[0].resolve();
            Class<?> targetType = generics[1].resolve();
            return sourceType != null && targetType != null ? generics : null;
        }
    }

    private void invalidateCache() {
        this.converterCache.clear();
    }

    @Nullable
    private Object handleConverterNotFound(@Nullable Object source, @Nullable TypeDescriptor sourceType, TypeDescriptor targetType) {
        if (source == null) {
            this.assertNotPrimitiveTargetType(sourceType, targetType);
            return null;
        } else if ((sourceType == null || sourceType.isAssignableTo(targetType)) && targetType.getObjectType().isInstance(source)) {
            return source;
        } else {
            throw new ConverterNotFoundException(sourceType, targetType);
        }
    }

    @Nullable
    private Object handleResult(@Nullable TypeDescriptor sourceType, TypeDescriptor targetType, @Nullable Object result) {
        if (result == null) {
            this.assertNotPrimitiveTargetType(sourceType, targetType);
        }

        return result;
    }

    private void assertNotPrimitiveTargetType(@Nullable TypeDescriptor sourceType, TypeDescriptor targetType) {
        if (targetType.isPrimitive()) {
            throw new ConversionFailedException(sourceType, targetType, (Object)null, new IllegalArgumentException("A null value cannot be assigned to a primitive type"));
        }
    }

    private static class Converters {
        private final Set<GenericConverter> globalConverters = new CopyOnWriteArraySet();
        private final Map<GenericConverter.ConvertiblePair, ConvertersForPair> converters = new ConcurrentHashMap(256);

        private Converters() {
        }

        public void add(GenericConverter converter) {
            Set<GenericConverter.ConvertiblePair> convertibleTypes = converter.getConvertibleTypes();
            if (convertibleTypes == null) {
                Assert.state(converter instanceof ConditionalConverter, "Only conditional converters may return null convertible types");
                this.globalConverters.add(converter);
            } else {
                Iterator var3 = convertibleTypes.iterator();

                while(var3.hasNext()) {
                    GenericConverter.ConvertiblePair convertiblePair = (GenericConverter.ConvertiblePair)var3.next();
                    this.getMatchableConverters(convertiblePair).add(converter);
                }
            }

        }

        private ConvertersForPair getMatchableConverters(GenericConverter.ConvertiblePair convertiblePair) {
            return (ConvertersForPair)this.converters.computeIfAbsent(convertiblePair, (k) -> {
                return new ConvertersForPair();
            });
        }

        public void remove(Class<?> sourceType, Class<?> targetType) {
            this.converters.remove(new GenericConverter.ConvertiblePair(sourceType, targetType));
        }

        @Nullable
        public GenericConverter find(TypeDescriptor sourceType, TypeDescriptor targetType) {
            List<Class<?>> sourceCandidates = this.getClassHierarchy(sourceType.getType());
            List<Class<?>> targetCandidates = this.getClassHierarchy(targetType.getType());
            Iterator var5 = sourceCandidates.iterator();

            while(var5.hasNext()) {
                Class<?> sourceCandidate = (Class)var5.next();
                Iterator var7 = targetCandidates.iterator();

                while(var7.hasNext()) {
                    Class<?> targetCandidate = (Class)var7.next();
                    GenericConverter.ConvertiblePair convertiblePair = new GenericConverter.ConvertiblePair(sourceCandidate, targetCandidate);
                    GenericConverter converter = this.getRegisteredConverter(sourceType, targetType, convertiblePair);
                    if (converter != null) {
                        return converter;
                    }
                }
            }

            return null;
        }

        @Nullable
        private GenericConverter getRegisteredConverter(TypeDescriptor sourceType, TypeDescriptor targetType, GenericConverter.ConvertiblePair convertiblePair) {
            ConvertersForPair convertersForPair = (ConvertersForPair)this.converters.get(convertiblePair);
            if (convertersForPair != null) {
                GenericConverter converter = convertersForPair.getConverter(sourceType, targetType);
                if (converter != null) {
                    return converter;
                }
            }

            Iterator var7 = this.globalConverters.iterator();

            GenericConverter globalConverter;
            do {
                if (!var7.hasNext()) {
                    return null;
                }

                globalConverter = (GenericConverter)var7.next();
            } while(!((ConditionalConverter)globalConverter).matches(sourceType, targetType));

            return globalConverter;
        }

        private List<Class<?>> getClassHierarchy(Class<?> type) {
            List<Class<?>> hierarchy = new ArrayList(20);
            Set<Class<?>> visited = new HashSet(20);
            this.addToClassHierarchy(0, ClassUtils.resolvePrimitiveIfNecessary(type), false, hierarchy, visited);
            boolean array = type.isArray();

            for(int i = 0; i < hierarchy.size(); ++i) {
                Class<?> candidate = (Class)hierarchy.get(i);
                candidate = array ? candidate.componentType() : ClassUtils.resolvePrimitiveIfNecessary(candidate);
                Class<?> superclass = candidate.getSuperclass();
                if (superclass != null && superclass != Object.class && superclass != Enum.class) {
                    this.addToClassHierarchy(i + 1, candidate.getSuperclass(), array, hierarchy, visited);
                }

                this.addInterfacesToClassHierarchy(candidate, array, hierarchy, visited);
            }

            if (Enum.class.isAssignableFrom(type)) {
                this.addToClassHierarchy(hierarchy.size(), Enum.class, false, hierarchy, visited);
                this.addInterfacesToClassHierarchy(Enum.class, false, hierarchy, visited);
            }

            this.addToClassHierarchy(hierarchy.size(), Object.class, array, hierarchy, visited);
            this.addToClassHierarchy(hierarchy.size(), Object.class, false, hierarchy, visited);
            return hierarchy;
        }

        private void addInterfacesToClassHierarchy(Class<?> type, boolean asArray, List<Class<?>> hierarchy, Set<Class<?>> visited) {
            Class[] var5 = type.getInterfaces();
            int var6 = var5.length;

            for(int var7 = 0; var7 < var6; ++var7) {
                Class<?> implementedInterface = var5[var7];
                this.addToClassHierarchy(hierarchy.size(), implementedInterface, asArray, hierarchy, visited);
            }

        }

        private void addToClassHierarchy(int index, Class<?> type, boolean asArray, List<Class<?>> hierarchy, Set<Class<?>> visited) {
            if (asArray) {
                type = type.arrayType();
            }

            if (visited.add(type)) {
                hierarchy.add(index, type);
            }

        }

        public String toString() {
            StringBuilder builder = new StringBuilder();
            builder.append("ConversionService converters =\n");
            Iterator var2 = this.getConverterStrings().iterator();

            while(var2.hasNext()) {
                String converterString = (String)var2.next();
                builder.append('\t').append(converterString).append('\n');
            }

            return builder.toString();
        }

        private List<String> getConverterStrings() {
            List<String> converterStrings = new ArrayList();
            Iterator var2 = this.converters.values().iterator();

            while(var2.hasNext()) {
                ConvertersForPair convertersForPair = (ConvertersForPair)var2.next();
                converterStrings.add(convertersForPair.toString());
            }

            Collections.sort(converterStrings);
            return converterStrings;
        }
    }

    private final class ConverterAdapter implements ConditionalGenericConverter {
        private final Converter<Object, Object> converter;
        private final GenericConverter.ConvertiblePair typeInfo;
        private final ResolvableType targetType;

        public ConverterAdapter(Converter<?, ?> converter, ResolvableType sourceType, ResolvableType targetType) {
            this.converter = converter;
            this.typeInfo = new GenericConverter.ConvertiblePair(sourceType.toClass(), targetType.toClass());
            this.targetType = targetType;
        }

        public Set<GenericConverter.ConvertiblePair> getConvertibleTypes() {
            return Collections.singleton(this.typeInfo);
        }

        public boolean matches(TypeDescriptor sourceType, TypeDescriptor targetType) {
            if (this.typeInfo.getTargetType() != targetType.getObjectType()) {
                return false;
            } else {
                ResolvableType rt = targetType.getResolvableType();
                if (!(rt.getType() instanceof Class) && !rt.isAssignableFrom(this.targetType) && !this.targetType.hasUnresolvableGenerics()) {
                    return false;
                } else {
                    Converter var5 = this.converter;
                    boolean var10000;
                    if (var5 instanceof ConditionalConverter) {
                        ConditionalConverter conditionalConverter = (ConditionalConverter)var5;
                        if (!conditionalConverter.matches(sourceType, targetType)) {
                            var10000 = false;
                            return var10000;
                        }
                    }

                    var10000 = true;
                    return var10000;
                }
            }
        }

        @Nullable
        public Object convert(@Nullable Object source, TypeDescriptor sourceType, TypeDescriptor targetType) {
            return source == null ? GenericConversionService.this.convertNullSource(sourceType, targetType) : this.converter.convert(source);
        }

        public String toString() {
            String var10000 = String.valueOf(this.typeInfo);
            return var10000 + " : " + String.valueOf(this.converter);
        }
    }

    private final class ConverterFactoryAdapter implements ConditionalGenericConverter {
        private final ConverterFactory<Object, Object> converterFactory;
        private final GenericConverter.ConvertiblePair typeInfo;

        public ConverterFactoryAdapter(ConverterFactory<?, ?> converterFactory, GenericConverter.ConvertiblePair typeInfo) {
            this.converterFactory = converterFactory;
            this.typeInfo = typeInfo;
        }

        public Set<GenericConverter.ConvertiblePair> getConvertibleTypes() {
            return Collections.singleton(this.typeInfo);
        }

        public boolean matches(TypeDescriptor sourceType, TypeDescriptor targetType) {
            boolean matches = true;
            ConverterFactory var5 = this.converterFactory;
            if (var5 instanceof ConditionalConverter conditionalConverterx) {
                matches = conditionalConverterx.matches(sourceType, targetType);
            }

            if (matches) {
                Converter<?, ?> converter = this.converterFactory.getConverter(targetType.getType());
                if (converter instanceof ConditionalConverter) {
                    ConditionalConverter conditionalConverter = (ConditionalConverter)converter;
                    matches = conditionalConverter.matches(sourceType, targetType);
                }
            }

            return matches;
        }

        @Nullable
        public Object convert(@Nullable Object source, TypeDescriptor sourceType, TypeDescriptor targetType) {
            return source == null ? GenericConversionService.this.convertNullSource(sourceType, targetType) : this.converterFactory.getConverter(targetType.getObjectType()).convert(source);
        }

        public String toString() {
            String var10000 = String.valueOf(this.typeInfo);
            return var10000 + " : " + String.valueOf(this.converterFactory);
        }
    }

    private static final class ConverterCacheKey implements Comparable<ConverterCacheKey> {
        private final TypeDescriptor sourceType;
        private final TypeDescriptor targetType;

        public ConverterCacheKey(TypeDescriptor sourceType, TypeDescriptor targetType) {
            this.sourceType = sourceType;
            this.targetType = targetType;
        }

        public boolean equals(@Nullable Object other) {
            boolean var10000;
            if (this != other) {
                label28: {
                    if (other instanceof ConverterCacheKey) {
                        ConverterCacheKey that = (ConverterCacheKey)other;
                        if (this.sourceType.equals(that.sourceType) && this.targetType.equals(that.targetType)) {
                            break label28;
                        }
                    }

                    var10000 = false;
                    return var10000;
                }
            }

            var10000 = true;
            return var10000;
        }

        public int hashCode() {
            return this.sourceType.hashCode() * 29 + this.targetType.hashCode();
        }

        public String toString() {
            String var10000 = String.valueOf(this.sourceType);
            return "ConverterCacheKey [sourceType = " + var10000 + ", targetType = " + String.valueOf(this.targetType) + "]";
        }

        public int compareTo(ConverterCacheKey other) {
            int result = this.sourceType.getResolvableType().toString().compareTo(other.sourceType.getResolvableType().toString());
            if (result == 0) {
                result = this.targetType.getResolvableType().toString().compareTo(other.targetType.getResolvableType().toString());
            }

            return result;
        }
    }

    private static class NoOpConverter implements GenericConverter {
        private final String name;

        public NoOpConverter(String name) {
            this.name = name;
        }

        @Nullable
        public Set<GenericConverter.ConvertiblePair> getConvertibleTypes() {
            return null;
        }

        @Nullable
        public Object convert(@Nullable Object source, TypeDescriptor sourceType, TypeDescriptor targetType) {
            return source;
        }

        public String toString() {
            return this.name;
        }
    }

    private static class ConvertersForPair {
        private final Deque<GenericConverter> converters = new ConcurrentLinkedDeque();

        private ConvertersForPair() {
        }

        public void add(GenericConverter converter) {
            this.converters.addFirst(converter);
        }

        @Nullable
        public GenericConverter getConverter(TypeDescriptor var1, TypeDescriptor var2) {
            // $FF: Couldn't be decompiled
        }

        public String toString() {
            return StringUtils.collectionToCommaDelimitedString(this.converters);
        }
    }
}
```

#### ConfigurableConversionService

一个组合接口，继承并整合了以下两个关键接口的

- ConversionService：提供类型转换的核心方法（如 convert、canConvert），用于执行具体的类型转换逻辑
- ConverterRegistry：提供注册和管理转换器的方法（如 addConverter、removeConvertible），用于动态扩展类型转换能力

```java
package org.springframework.core.convert.support;

import org.springframework.core.convert.ConversionService;
import org.springframework.core.convert.converter.ConverterRegistry;

public interface ConfigurableConversionService extends ConversionService, ConverterRegistry {
}
```

#### ConversionService

Spring 类型转换机制的核心接口，提供了灵活的类型转换能力。

- canConvert：判断是否可以将 sourceType 类型转换为 targetType 类型
- convert：将 sourceType 类型对象转换为 targetType 类型对象

```java
package org.springframework.core.convert;

import org.springframework.lang.Nullable;

public interface ConversionService {
    boolean canConvert(@Nullable Class<?> sourceType, Class<?> targetType);

    boolean canConvert(@Nullable TypeDescriptor sourceType, TypeDescriptor targetType);

    @Nullable
    <T> T convert(@Nullable Object source, Class<T> targetType);

    @Nullable
    default Object convert(@Nullable Object source, TypeDescriptor targetType) {
        return this.convert(source, TypeDescriptor.forObject(source), targetType);
    }

    @Nullable
    Object convert(@Nullable Object source, @Nullable TypeDescriptor sourceType, TypeDescriptor targetType);
}
```

#### ConverterRegistry

用于管理类型转换器的接口，提供了多种方法来注册和移除转换器。

- addConverter：添加一个转换器，用于从源类型到目标类型的转换
- addConverterFactory：工厂类，创建特定类型的转换器
- removeConvertible：移除注册表中与指定源类型和目标类型匹配的转换器

```java
package org.springframework.core.convert.converter;

public interface ConverterRegistry {
    void addConverter(Converter<?, ?> converter);

    <S, T> void addConverter(Class<S> sourceType, Class<T> targetType, Converter<? super S, ? extends T> converter);

    void addConverter(GenericConverter converter);

    void addConverterFactory(ConverterFactory<?, ?> factory);

    void removeConvertible(Class<?> sourceType, Class<?> targetType);
}
```

### MapOutputConverter

Map 转换器，实现从非结构化文本到结构化键值对数据的高效转换

- 继承自 AbstractMessageOutputConverter 类，MappingJackson2MessageConverter 实现复杂的类型转换

<table>
<tr>
<td>方法名称<br/></td><td>描述<br/></td></tr>
<tr>
<td>getFormat<br/></td><td>输送给大模型的Map<String, Object>格式说明<br/></td></tr>
<tr>
<td>convert<br/></td><td>将模型输出的实例字符串转Map<String, Object><br/></td></tr>
</table>


```java
package org.springframework.ai.converter;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.support.MessageBuilder;

public class MapOutputConverter extends AbstractMessageOutputConverter<Map<String, Object>> {
    public MapOutputConverter() {
        super(new MappingJackson2MessageConverter());
    }

    public Map<String, Object> convert(@NonNull String text) {
        if (text.startsWith("```json") && text.endsWith("```")) {
            text = text.substring(7, text.length() - 3);
        }
        // 将字符串text转换为UTF-8编码的字节数组，确保文本数据能以字节刘的形式传输
        // 构建Message对象，并将字节数组作为消息的负载
        Message<?> message = MessageBuilder.withPayload(text.getBytes(StandardCharsets.UTF8)).build();
        return (Map)this.getMessageConverter().fromMessage(message, HashMap.class);
    }

    public String getFormat() {
        String raw = "Your response should be in JSON format.\nThe data structure for the JSON should match this Java class: %s\nDo not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.\nRemove the ```json markdown surrounding the output including the trailing \"```\".\n";
        return String.format(raw, HashMap.class.getName());
    }
}
```

#### AbstractMessageOutputConverter

使用预配置的 MessageConverter 来将 AI 模型的输出转换为目标类型格式

```java
package org.springframework.ai.converter;

import org.springframework.messaging.converter.MessageConverter;

public abstract class AbstractMessageOutputConverter<T> implements StructuredOutputConverter<T> {
    private MessageConverter messageConverter;

    public AbstractMessageOutputConverter(MessageConverter messageConverter) {
        this.messageConverter = messageConverter;
    }

    public MessageConverter getMessageConverter() {
        return this.messageConverter;
    }
}
```

#### MessageConverter

消息转换接口，用于将消息内容（payload）与目标类型之间进行转换

<table>
<tr>
<td>方法名称<br/></td><td>描述<br/></td></tr>
<tr>
<td>fromMessage<br/></td><td>将Message对象转换为目标类型的对象<br/></td></tr>
<tr>
<td>toMessage<br/></td><td>将给定对象转换为Message对象<br/></td></tr>
</table>


```java
package org.springframework.messaging.converter;

import org.springframework.lang.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHeaders;

public interface MessageConverter {
    @Nullable
    Object fromMessage(Message<?> message, Class<?> targetClass);

    @Nullable
    Message<?> toMessage(Object payload, @Nullable MessageHeaders headers);
}
```

#### SmartMessageConverter

聪明的消息转换接口，用于将消息内容（payload）与目标类型之间进行转换

<table>
<tr>
<td>方法名称<br/></td><td>描述<br/></td></tr>
<tr>
<td>fromMessage<br/></td><td>将Message对象转换为目标类型的对象<br/></td></tr>
<tr>
<td>toMessage<br/></td><td>将给定对象转换为Message对象<br/></td></tr>
</table>


```java
package org.springframework.messaging.converter;

import org.springframework.lang.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHeaders;

public interface SmartMessageConverter extends MessageConverter {
    @Nullable
    Object fromMessage(Message<?> message, Class<?> targetClass, @Nullable Object conversionHint);

    @Nullable
    Message<?> toMessage(Object payload, @Nullable MessageHeaders headers, @Nullable Object conversionHint);
}
```

#### MappingJackson2MessageConverter

基于 Jackson 库实现了消息的序列化和反序列化，主要用于将 Java 对象转换为 JSON 格式的字节流（序列化），或将 JSON 字节流还原为 Java 对象（反序列化）。这类操作通常用于在系统之间传递数据，例如网络通信、消息队列等场景

- `MimeType[] DEFAULTMIMETYPES`：定义默认支持的 MIME 类型，如 application/json 和 application/*+json
- `ObjectMapper objectMapper`：Jackson 库的核心类，负责实际的 JSON 转换工作
- `Boolean prettyPrint`：控制是否以美化格式输出 JSON 数据（即带有缩进和换行）

<table>
<tr>
<td>方法名称<br/></td><td>描述<br/></td></tr>
<tr>
<td>canConvertFrom<br/></td><td>判断是否可以从消息中反序列化出目标类型的对象<br/></td></tr>
<tr>
<td>canConvertTo<br/></td><td>判断是否可以将给定的对象序列化为 JSON 消息<br/></td></tr>
<tr>
<td>convertFromInternal<br/></td><td>将消息内容（payload）反序列化为目标 Java 对象<br/></td></tr>
<tr>
<td>convertToInternal<br/></td><td>将 Java 对象序列化为 JSON 字符串或字节数组<br/></td></tr>
<tr>
<td>logWarningIfNecessary<br/></td><td>在反序列化失败时记录警告日志<br/></td></tr>
<tr>
<td>getJsonEncoding<br/></td><td>根据 MIME 类型获取对应的 JSON 编码方式（如 UTF-8）<br/></td></tr>
<tr>
<td>getSerializationView<br/></td><td>从 conversionHint 中提取用于序列化/反序列化的视图类<br/></td></tr>
<tr>
<td>extractViewClass<br/></td><td>从 @JsonView 注解中提取具体的视图类<br/></td></tr>
</table>


```java
package org.springframework.messaging.converter;

import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.core.JsonEncoding;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.io.Writer;
import java.lang.reflect.Type;
import java.nio.charset.Charset;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.core.MethodParameter;
import org.springframework.lang.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHeaders;
import org.springframework.util.Assert;
import org.springframework.util.ClassUtils;
import org.springframework.util.MimeType;

public class MappingJackson2MessageConverter extends AbstractMessageConverter {
    private static final MimeType[] DEFAULTMIMETYPES = new MimeType[]{new MimeType("application", "json"), new MimeType("application", "*+json")};
    private ObjectMapper objectMapper;
    @Nullable
    private Boolean prettyPrint;

    public MappingJackson2MessageConverter() {
        this(DEFAULTMIMETYPES);
    }

    public MappingJackson2MessageConverter(MimeType... supportedMimeTypes) {
        super(supportedMimeTypes);
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(MapperFeature.DEFAULTVIEWINCLUSION, false);
        this.objectMapper.configure(DeserializationFeature.FAILONUNKNOWNPROPERTIES, false);
    }

    public MappingJackson2MessageConverter(ObjectMapper objectMapper) {
        this(objectMapper, DEFAULTMIMETYPES);
    }

    public MappingJackson2MessageConverter(ObjectMapper objectMapper, MimeType... supportedMimeTypes) {
        super(supportedMimeTypes);
        Assert.notNull(objectMapper, "ObjectMapper must not be null");
        this.objectMapper = objectMapper;
    }

    public void setObjectMapper(ObjectMapper objectMapper) {
        Assert.notNull(objectMapper, "ObjectMapper must not be null");
        this.objectMapper = objectMapper;
        this.configurePrettyPrint();
    }

    public ObjectMapper getObjectMapper() {
        return this.objectMapper;
    }

    public void setPrettyPrint(boolean prettyPrint) {
        this.prettyPrint = prettyPrint;
        this.configurePrettyPrint();
    }

    private void configurePrettyPrint() {
        if (this.prettyPrint != null) {
            this.objectMapper.configure(SerializationFeature.INDENTOUTPUT, this.prettyPrint);
        }

    }

    protected boolean canConvertFrom(Message<?> message, @Nullable Class<?> targetClass) {
        if (targetClass != null && this.supportsMimeType(message.getHeaders())) {
            JavaType javaType = this.objectMapper.constructType(targetClass);
            AtomicReference<Throwable> causeRef = new AtomicReference();
            if (this.objectMapper.canDeserialize(javaType, causeRef)) {
                return true;
            } else {
                this.logWarningIfNecessary(javaType, (Throwable)causeRef.get());
                return false;
            }
        } else {
            return false;
        }
    }

    protected boolean canConvertTo(Object payload, @Nullable MessageHeaders headers) {
        if (!this.supportsMimeType(headers)) {
            return false;
        } else {
            AtomicReference<Throwable> causeRef = new AtomicReference();
            if (this.objectMapper.canSerialize(payload.getClass(), causeRef)) {
                return true;
            } else {
                this.logWarningIfNecessary(payload.getClass(), (Throwable)causeRef.get());
                return false;
            }
        }
    }

    protected void logWarningIfNecessary(Type type, @Nullable Throwable cause) {
        if (cause != null) {
            boolean debugLevel = cause instanceof JsonMappingException && cause.getMessage() != null && cause.getMessage().startsWith("Cannot find");
            if (debugLevel) {
                if (!this.logger.isDebugEnabled()) {
                    return;
                }
            } else if (!this.logger.isWarnEnabled()) {
                return;
            }

            String msg = "Failed to evaluate Jackson " + (type instanceof JavaType ? "de" : "") + "serialization for type [" + String.valueOf(type) + "]";
            if (debugLevel) {
                this.logger.debug(msg, cause);
            } else if (this.logger.isDebugEnabled()) {
                this.logger.warn(msg, cause);
            } else {
                this.logger.warn(msg + ": " + String.valueOf(cause));
            }

        }
    }

    protected boolean supports(Class<?> clazz) {
        throw new UnsupportedOperationException();
    }

    @Nullable
    protected Object convertFromInternal(Message<?> message, Class<?> targetClass, @Nullable Object conversionHint) {
        JavaType javaType = this.objectMapper.constructType(getResolvedType(targetClass, conversionHint));
        Object payload = message.getPayload();
        Class<?> view = this.getSerializationView(conversionHint);

        try {
            if (ClassUtils.isAssignableValue(targetClass, payload)) {
                return payload;
            } else if (payload instanceof byte[]) {
                byte[] bytes = (byte[])payload;
                return view != null ? this.objectMapper.readerWithView(view).forType(javaType).readValue(bytes) : this.objectMapper.readValue(bytes, javaType);
            } else {
                return view != null ? this.objectMapper.readerWithView(view).forType(javaType).readValue(payload.toString()) : this.objectMapper.readValue(payload.toString(), javaType);
            }
        } catch (IOException var8) {
            throw new MessageConversionException(message, "Could not read JSON: " + var8.getMessage(), var8);
        }
    }

    @Nullable
    protected Object convertToInternal(Object payload, @Nullable MessageHeaders headers, @Nullable Object conversionHint) {
        try {
            Class<?> view = this.getSerializationView(conversionHint);
            if (byte[].class == this.getSerializedPayloadClass()) {
                ByteArrayOutputStream out = new ByteArrayOutputStream(1024);
                JsonEncoding encoding = this.getJsonEncoding(this.getMimeType(headers));
                JsonGenerator generator = this.objectMapper.getFactory().createGenerator(out, encoding);

                try {
                    if (view != null) {
                        this.objectMapper.writerWithView(view).writeValue(generator, payload);
                    } else {
                        this.objectMapper.writeValue(generator, payload);
                    }

                    payload = out.toByteArray();
                } catch (Throwable var11) {
                    if (generator != null) {
                        try {
                            generator.close();
                        } catch (Throwable var10) {
                            var11.addSuppressed(var10);
                        }
                    }

                    throw var11;
                }

                if (generator != null) {
                    generator.close();
                }
            } else {
                Writer writer = new StringWriter(1024);
                if (view != null) {
                    this.objectMapper.writerWithView(view).writeValue(writer, payload);
                } else {
                    this.objectMapper.writeValue(writer, payload);
                }

                payload = writer.toString();
            }

            return payload;
        } catch (IOException var12) {
            throw new MessageConversionException("Could not write JSON: " + var12.getMessage(), var12);
        }
    }

    @Nullable
    protected Class<?> getSerializationView(@Nullable Object conversionHint) {
        if (conversionHint instanceof MethodParameter param) {
            JsonView annotation = param.getParameterIndex() >= 0 ? (JsonView)param.getParameterAnnotation(JsonView.class) : (JsonView)param.getMethodAnnotation(JsonView.class);
            if (annotation != null) {
                return this.extractViewClass(annotation, conversionHint);
            }
        } else {
            if (conversionHint instanceof JsonView jsonView) {
                return this.extractViewClass(jsonView, conversionHint);
            }

            if (conversionHint instanceof Class<?> clazz) {
                return clazz;
            }
        }

        return null;
    }

    private Class<?> extractViewClass(JsonView annotation, Object conversionHint) {
        Class<?>[] classes = annotation.value();
        if (classes.length != 1) {
            throw new IllegalArgumentException("@JsonView only supported for handler methods with exactly 1 class argument: " + String.valueOf(conversionHint));
        } else {
            return classes[0];
        }
    }

    protected JsonEncoding getJsonEncoding(@Nullable MimeType contentType) {
        if (contentType != null && contentType.getCharset() != null) {
            Charset charset = contentType.getCharset();
            JsonEncoding[] var3 = JsonEncoding.values();
            int var4 = var3.length;

            for(int var5 = 0; var5 < var4; ++var5) {
                JsonEncoding encoding = var3[var5];
                if (charset.name().equals(encoding.getJavaName())) {
                    return encoding;
                }
            }
        }

        return JsonEncoding.UTF8;
    }
}
```

#### AbstractMessageConverter

Spring 框架中消息转换的抽象基类，主要用于消息的序列化和反序列化。具体的转换逻辑由子类实现

- `List<MimeType> supportedMimeTypes`：当前转换器支持的 MIME 类型列表，如 application/json
- `ContentTypeResolver contentTypeResolver`：内容类型解析器，默认使用 DefaultContentTypeResolver
- `boolean strictContentTypeMatch`：是否严格匹配 MIME 类型（精确匹配 subtype）
- `Class<?> serializedPayloadClass`：序列化后的消息体类型，只能是 byte[] 或 String

<table>
<tr>
<td>方法名称<br/></td><td>描述<br/></td></tr>
<tr>
<td>fromMessage<br/></td><td>将消息体反序列化为目标类的对象<br/></td></tr>
<tr>
<td>toMessage<br/></td><td>将 Java 对象序列化为消息对象<br/></td></tr>
<tr>
<td>canConvertFrom<br/></td><td>判断当前消息是否可以被反序列化为目标类型<br/></td></tr>
<tr>
<td>canConvertTo<br/></td><td>判断当前对象是否可以被序列化为消息<br/></td></tr>
<tr>
<td>supportsMimeType<br/></td><td>判断消息头中的 MIME 类型是否在支持范围内<br/></td></tr>
<tr>
<td>getMimeType<br/></td><td>使用配置的 contentTypeResolver 解析消息头中的 MIME 类型<br/></td></tr>
<tr>
<td>getDefaultContentType<br/></td><td>获取默认的内容类型（即 supportedMimeTypes 中的第一个）<br/></td></tr>
<tr>
<td>supports<br/></td><td>子类需实现：判断是否支持给定类型的转换<br/></td></tr>
<tr>
<td>convertFromInternal<br/></td><td>子类需实现：从消息体中反序列化出目标对象<br/></td></tr>
<tr>
<td>convertToInternal<br/></td><td>子类需实现：将对象序列化为消息体<br/></td></tr>
<tr>
<td>getResolvedType<br/></td><td>解析泛型类型信息<br/></td></tr>
</table>


```java
package org.springframework.messaging.converter;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.core.GenericTypeResolver;
import org.springframework.core.MethodParameter;
import org.springframework.lang.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.util.Assert;
import org.springframework.util.MimeType;

public abstract class AbstractMessageConverter implements SmartMessageConverter {
    protected final Log logger;
    private final List<MimeType> supportedMimeTypes;
    @Nullable
    private ContentTypeResolver contentTypeResolver;
    private boolean strictContentTypeMatch;
    private Class<?> serializedPayloadClass;

    protected AbstractMessageConverter(MimeType supportedMimeType) {
        this((Collection)Collections.singletonList(supportedMimeType));
    }

    protected AbstractMessageConverter(MimeType... supportedMimeTypes) {
        this((Collection)Arrays.asList(supportedMimeTypes));
    }

    protected AbstractMessageConverter(Collection<MimeType> supportedMimeTypes) {
        this.logger = LogFactory.getLog(this.getClass());
        this.supportedMimeTypes = new ArrayList(4);
        this.contentTypeResolver = new DefaultContentTypeResolver();
        this.strictContentTypeMatch = false;
        this.serializedPayloadClass = byte[].class;
        this.supportedMimeTypes.addAll(supportedMimeTypes);
    }

    public List<MimeType> getSupportedMimeTypes() {
        return Collections.unmodifiableList(this.supportedMimeTypes);
    }

    protected void addSupportedMimeTypes(MimeType... supportedMimeTypes) {
        this.supportedMimeTypes.addAll(Arrays.asList(supportedMimeTypes));
    }

    public void setContentTypeResolver(@Nullable ContentTypeResolver resolver) {
        this.contentTypeResolver = resolver;
    }

    @Nullable
    public ContentTypeResolver getContentTypeResolver() {
        return this.contentTypeResolver;
    }

    public void setStrictContentTypeMatch(boolean strictContentTypeMatch) {
        if (strictContentTypeMatch) {
            Assert.notEmpty(this.getSupportedMimeTypes(), "Strict match requires non-empty list of supported mime types");
            Assert.notNull(this.getContentTypeResolver(), "Strict match requires ContentTypeResolver");
        }

        this.strictContentTypeMatch = strictContentTypeMatch;
    }

    public boolean isStrictContentTypeMatch() {
        return this.strictContentTypeMatch;
    }

    public void setSerializedPayloadClass(Class<?> payloadClass) {
        Assert.isTrue(byte[].class == payloadClass || String.class == payloadClass, () -> {
            return "Payload class must be byte[] or String: " + String.valueOf(payloadClass);
        });
        this.serializedPayloadClass = payloadClass;
    }

    public Class<?> getSerializedPayloadClass() {
        return this.serializedPayloadClass;
    }

    @Nullable
    public final Object fromMessage(Message<?> message, Class<?> targetClass) {
        return this.fromMessage(message, targetClass, (Object)null);
    }

    @Nullable
    public final Object fromMessage(Message<?> message, Class<?> targetClass, @Nullable Object conversionHint) {
        return !this.canConvertFrom(message, targetClass) ? null : this.convertFromInternal(message, targetClass, conversionHint);
    }

    @Nullable
    public final Message<?> toMessage(Object payload, @Nullable MessageHeaders headers) {
        return this.toMessage(payload, headers, (Object)null);
    }

    @Nullable
    public final Message<?> toMessage(Object payload, @Nullable MessageHeaders headers, @Nullable Object conversionHint) {
        if (!this.canConvertTo(payload, headers)) {
            return null;
        } else {
            Object payloadToUse = this.convertToInternal(payload, headers, conversionHint);
            if (payloadToUse == null) {
                return null;
            } else {
                MimeType mimeType = this.getDefaultContentType(payloadToUse);
                if (headers != null) {
                    MessageHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(headers, MessageHeaderAccessor.class);
                    if (accessor != null && accessor.isMutable()) {
                        if (mimeType != null) {
                            accessor.setHeaderIfAbsent("contentType", mimeType);
                        }

                        return MessageBuilder.createMessage(payloadToUse, accessor.getMessageHeaders());
                    }
                }

                MessageBuilder<?> builder = MessageBuilder.withPayload(payloadToUse);
                if (headers != null) {
                    builder.copyHeaders(headers);
                }

                if (mimeType != null) {
                    builder.setHeaderIfAbsent("contentType", mimeType);
                }

                return builder.build();
            }
        }
    }

    protected boolean canConvertFrom(Message<?> message, Class<?> targetClass) {
        return this.supports(targetClass) && this.supportsMimeType(message.getHeaders());
    }

    protected boolean canConvertTo(Object payload, @Nullable MessageHeaders headers) {
        return this.supports(payload.getClass()) && this.supportsMimeType(headers);
    }

    protected boolean supportsMimeType(@Nullable MessageHeaders headers) {
        if (this.getSupportedMimeTypes().isEmpty()) {
            return true;
        } else {
            MimeType mimeType = this.getMimeType(headers);
            if (mimeType == null) {
                return !this.isStrictContentTypeMatch();
            } else {
                Iterator var3 = this.getSupportedMimeTypes().iterator();

                MimeType current;
                do {
                    if (!var3.hasNext()) {
                        return false;
                    }

                    current = (MimeType)var3.next();
                } while(!current.getType().equals(mimeType.getType()) || !current.getSubtype().equals(mimeType.getSubtype()));

                return true;
            }
        }
    }

    @Nullable
    protected MimeType getMimeType(@Nullable MessageHeaders headers) {
        return this.contentTypeResolver != null ? this.contentTypeResolver.resolve(headers) : null;
    }

    @Nullable
    protected MimeType getDefaultContentType(Object payload) {
        List<MimeType> mimeTypes = this.getSupportedMimeTypes();
        return !mimeTypes.isEmpty() ? (MimeType)mimeTypes.get(0) : null;
    }

    protected abstract boolean supports(Class<?> clazz);

    @Nullable
    protected Object convertFromInternal(Message<?> message, Class<?> targetClass, @Nullable Object conversionHint) {
        return null;
    }

    @Nullable
    protected Object convertToInternal(Object payload, @Nullable MessageHeaders headers, @Nullable Object conversionHint) {
        return null;
    }

    static Type getResolvedType(Class<?> targetClass, @Nullable Object conversionHint) {
        if (conversionHint instanceof MethodParameter param) {
            param = param.nestedIfOptional();
            if (Message.class.isAssignableFrom(param.getParameterType())) {
                param = param.nested();
            }

            Type genericParameterType = param.getNestedGenericParameterType();
            Class<?> contextClass = param.getContainingClass();
            return GenericTypeResolver.resolveType(genericParameterType, contextClass);
        } else {
            return targetClass;
        }
    }
}
```
