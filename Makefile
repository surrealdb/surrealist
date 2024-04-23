# Copyright © 2024 SurrealDB Ltd
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

.PHONY: default
default:
	@echo "Choose a Makefile target:"
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print "  - " $$1}}' | sort

.PHONY: setup
setup:
	@echo "Setup..."
	rustup target add wasm32-unknown-unknown
	cargo install wasm-bindgen-cli
	pnpm install

.PHONY: serve
serve: build-embed
	@echo "Serving..."
	pnpm tauri:dev

.PHONY: deploy
deploy:
	@echo "Deploy..."
	aws s3 sync --region eu-west-2 --cache-control "public, max-age=31536000, immutable" --exclude ".DS_Store" ./dist/assets s3://www.surrealist.app/assets/
	aws s3 cp --region eu-west-2 --cache-control "public, max-age=86400" ./dist/favicon.ico s3://www.surrealist.app/
	aws s3 sync --region eu-west-2 --cache-control "public, max-age=30" --exact-timestamps --delete --exclude "*" --include "*.html" ./dist/ s3://www.surrealist.app/

.PHONY: deploy-dev
deploy-dev:
	@echo "Deploy Dev..."
	aws s3 sync --region eu-west-2 --cache-control "public, max-age=31536000, immutable" --exclude ".DS_Store" ./dist/assets s3://dev.surrealist.app/assets/
	aws s3 cp --region eu-west-2 --cache-control "public, max-age=86400" ./dist/favicon.ico s3://dev.surrealist.app/
	aws s3 sync --region eu-west-2 --cache-control "public, max-age=30" --exact-timestamps --delete --exclude "*" --include "*.html" ./dist/ s3://dev.surrealist.app/