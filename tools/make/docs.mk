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

##@ Docs

.PHONY: install
install: ## Install the dependencies.
install:
	@$(LOG_TARGET)
	@if [ -d "node_modules" ]; then \
		echo "node_modules exists, removing..."; \
		rm -rf node_modules; \
	fi
	@echo "Installing dependencies..."
	npm install

.PHONY: preview
preview: ## Start the Docusaurus server in preview mode.
preview:
	@$(LOG_TARGET)
	
	@if [ -d "node_modules" ]; then \
		echo "Starting Docusaurus server..."; \
		npm run dev; \
	else \
		echo "node_modules directory does not exist. Please run 'make install' to install dependencies."; \
	fi
