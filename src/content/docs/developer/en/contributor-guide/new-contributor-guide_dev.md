---
title: How to contribute
keywords: [Spring Cloud Alibaba]
description: The purpose of this guide is to provide guidance for newcomers who are preparing to contribute to Spring Cloud Alibaba.
custom_edit_url: https://github.com/spring-cloud-alibaba-group/spring-cloud-alibaba-group.github.io/blob/main/i18n/zh-cn/docusaurus-plugin-content-docs/current/developers/contributor-guide/new-contributor-guide_dev.md
---

## Thank you for contributing to Spring Cloud Alibaba!

Since its inception as an open-source project, Spring Cloud Alibaba has received a lot of attention from members of the community. Every issue and PR from the community is helpful and contributes to the development of a better Spring Cloud.

We sincerely appreciate the students who have raised issues and PRs for this project, especially these contributors: HaojunRen, xiejiashuai, mengxiangrui007, and liaozan.

We hope to see more members of the community join us in making this project a success.

## How to contribute

Before you contribute code, take a moment to understand the process of contributing code to Spring Cloud Alibaba.

### What to contribute

We welcome contributions of any kind, whether it is a simple typo correction, a bug fix, or a new feature. Please feel free to raise issues or submit PRs. We also value documentation and integration with other open-source projects, so contributions in these areas are also highly appreciated.

For more complex changes, we recommend adding a Feature label in the Issue section and providing a brief description of the design and modification points.

### Where to start

If you are a first-time contributor, you can start with [good first issue](https://github.com/spring-cloud-incubator/spring-cloud-alibaba/labels/good%20first%20issue) 和 [help wanted](https://github.com/alibaba/spring-cloud-alibaba/labels/help%20wanted) 中认领一个比较简单的任务。

### Fork the repository and Clone it locally

- Click on [the project](https://github.com/alibaba/spring-cloud-alibaba) in the top right corner of the `Fork` icon will `alibaba/spring-cloud-alibaba` the Fork to their own space.
- To clone the `spring-cloud-alibaba` repository under your own account to your local machine, for example, if your account name is `flystar32`, you can execute the command git clone https://github.com/flystar32/spring-cloud-alibaba.git.

### Configure Github information

- To check your global Git username and email on your machine, execute the `git config --list` command.
- Check if the displayed `user.name` and `user.email` match your GitHub username and email.
- If your company uses its own GitLab or another commercial GitLab, it is possible that the usernames and emails do not match. In this case, you need to set a separate username and email for the Spring Cloud Alibaba project.
- Please refer to the github documentation for the user name and email Settings. Set the [username](https://docs.github.com/en/get-started/getting-started-with-git/setting-your-username-in-git) and [email](https://help.github.com/articles/setting-your-commit-email-address-in-git/).

### Merge latest code

After fork out the code, there may be a new commit in the Master branch of the original repository. At this time, in order to avoid the conflict between the submitted PR and the submit in the Master, merge the master branch in a timely manner (master branch corresponds to the two main branches of the current warehouse, 2.2.x and 2021.x, which are maintained at the same time).

- In your local `spring-cloud-alibaba` directory, Perform `git remote add upstream https://github.com/alibaba/spring-cloud-alibaba` add original warehouse address to the remote in the stream.
- In your local `spring-cloud-alibaba` directory, do `git fetch upstream` to fetch the remote stream locally.
- In your local `spring-cloud-alibaba` directory, execute `git checkout master` to switch to the master branch.
- In your local `spring-cloud-alibaba` directory, execute `git rebase upstream/master` rebase latest code.

### Configure the code format for the Spring Cloud Alibaba

As one of the implementations of Spring Cloud, Spring Cloud Alibaba directly adopts the code formatting rules of the Spring Cloud project. Before starting to contribute, please refer to the relevant Code Format Guidelines and configure the code formatting rules before submitting any code.

### Develop、Commit、Push

After developing your own feature, it is recommended to use the `mvn clean install` command to ensure that the modified code can be compiled locally. This command can also automatically format the code in the Spring style. Then, before submitting the code, please create a new branch related to this feature and use it for code submission.

### Merge latest code

- Similarly, before submitting a PR, it is necessary to rebase the code from the master branch. Please refer to the previous chapter for specific steps.
- If there are conflicts, they need to be resolved first.

### Submit PR

To submit a PR, please state the modification points and the implemented features according to the `Pull request template`. Wait for the code review and merging process to become a Spring Cloud Alibaba Contributor and contribute to the development of a better Spring Cloud.
