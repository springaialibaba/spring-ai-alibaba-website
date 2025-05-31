---
title: 代码风格和质量指南
keywords: [Spring Ai Alibaba]
description: Spring Ai Alibaba 开源贡献代码风格指南
---

## 1. Pull Request 和变更规则

1. **Issue/PR** 得引导和命名
   1. 新建 `PR` 后需要在 `PR` 页面的 Github Development 按钮处关联已存在的对应 `ISSUE`(若无建议新建对应ISSUE)
   2. 标题命名格式(英文，小写) `[feature/bugfix/doc/improve/refactor/bug/cleanup] title`

2. 添加描述信息
   - 新建 `PR` 时请仔细描述此贡献，描述文档和代码同样重要。审阅者可以从描述中，而不仅仅是从代码中，了解问题和解决方案。
   - 如果是 Todo List，请勾选是否完成了对应的 todo，便于审阅者审阅。

3. 建议一次 `PR` 只包含 一个功能/一种修复/一类改进/一种重构/一次清理/一类文档 等
4. Commit Messagte(提交消息) (英文，小写，无特殊字符)
   消息的提交应遵循与 `PR` 类似的模式：`[feature/bugfix/doc/improve/refactor/bug/cleanup] title`

## 2. 代码检查样式

### 2.1 Spring AI Alibaba 代码风格检查

在 Spring AI Alibaba（下文简称 SAA） 主干仓库中配置有 spring-boot code format 的代码检查插件。在提交代码之前，您可以本地运行：`mvn spring-javaformat:apply` 调整代码格式。避免 CI 报错。

> Tips: 您可以在本地执行 make help，查看 SAA 提供的 make  指令，SAA 的 Github CI 全部通过本地化的 Makefile 文件集成。

### 2.2  编程规范

在 SAA 的代码中，遵循基本的 Java 编程准则。但是作为一个基础架构类型的项目，在编写相关组件时，不希望引入如下依赖：

- lombok：lombok 插件会简化实体，但是在 debug 时会增加难度；
- hutool/guava：项目中不希望引入 hutool/guava 等工具类库，在基础架构类型项目中，我们应该尽量减少依赖，避免项目体积过大；
- Fastjson/Gson：项目使用 Spring 构建，我们希望使用 jackson 作为统一的序列化框架；
- 尽量避免引入多余的依赖项。

在单元测试中，建议使用 spring-boot-test/junit5 等。如果出现某些需要 ak 才能测试的服务或者插件，可以使用 Junit 的 `@EnabledIfEnvironmentVariable` 来标记。

我们希望在您提交的代码中，编写了足量的单元测试。
