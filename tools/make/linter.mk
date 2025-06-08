# Copyright 2024-2025 the original author or authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

LINKINATOR_IGNORE := "img/blog langchain.com golang.org goproxy.cn wikipedia.org docs.spring.io aliyun.com gov.cn favicon.ico github.com githubusercontent.com example.com github.io gnu.org _print"

##@ Linter

.PHONY: lint
lint: ## Check files
# md and links There are too many file errors, close temporarily
# lint: markdown-lint yaml-lint code-spell newline-check checklinks
lint: yaml-lint codespell newline-check

.PHONY: codespell
codespell: CODESPELL_SKIP := $(shell cat tools/linter/codespell/.codespell.skip | tr \\n ',')
codespell: ## Check the code-spell
	@$(LOG_TARGET)
	codespell --version
	codespell --skip $(CODESPELL_SKIP) --ignore-words ./tools/linter/codespell/.codespell.ignorewords

.PHONY: yaml-lint
yaml-lint: ## Check the yaml lint
	@$(LOG_TARGET)
	yamllint --version
	yamllint -c ./tools/linter/yamllint/.yamllint .

.PHONY: yaml-lint-fix
yaml-lint-fix: ## Yaml lint fix
	@$(LOG_TARGET)
	yamlfmt -version
	yamlfmt .

.PHONY: markdown-lint-check
markdown-lint: ## Check the markdown files.
	@$(LOG_TARGET)
	markdownlint --version
	markdownlint --config ./tools/linter/markdownlint/markdown_lint_config.yaml ./src/content

.PHONY: markdown-lint-fix
markdown-lint-fix: ## Fix the markdown files style.
	@$(LOG_TARGET)
	markdownlint --version
	markdownlint --config ./tools/linter/markdownlint/markdown_lint_config.yaml --fix ./src/content

.PHONY: newline-check
newline-check: ## Check the newline
	@$(LOG_TARGET)
	python tools/scripts/newline-check.py check

.PHONY: newline-fix
newline-fix: ## Fix the newline
	@$(LOG_TARGET)
	python tools/scripts/newline-check.py fix

.PHONY: checklinks
checklinks: ## Check for broken links in the docs
	@$(LOG_TARGET)
	cd src/content && \
	linkinator "**/*.md" --recurse --retry --concurrency 25 --skip $(LINKINATOR_IGNORE)
