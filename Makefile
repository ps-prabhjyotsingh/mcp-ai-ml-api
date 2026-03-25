IMAGE_NAME        := mcp-ai-ml-api
IMAGE_TAG         := latest
FULL_IMAGE        := $(IMAGE_NAME):$(IMAGE_TAG)
REGISTRY          := ghcr.io/ps-prabhjyotsingh
REGISTRY_IMAGE    := $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
PLATFORMS         := linux/amd64,linux/arm64
PORT              ?= 3000
AIML_API_KEY      ?= $(shell printenv AIML_API_KEY)
AIML_API_BASE_URL ?= $(shell printenv AIML_API_BASE_URL)

.DEFAULT_GOAL := help
.PHONY: help build run up down logs connect buildx-setup buildx push

help: ## Show available commands
	@echo ""
	@echo "  AIML MCP Server — Docker Makefile"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

build: ## Build Docker image (local, single arch)
	docker build --target production -t $(FULL_IMAGE) .

buildx-setup: ## Create buildx builder for multiarch builds
	@docker buildx inspect aiml-builder >/dev/null 2>&1 || \
		docker buildx create --name aiml-builder --use --bootstrap
	@docker buildx use aiml-builder

buildx: buildx-setup ## Build multiarch image (amd64 + arm64) — local only
	docker buildx build --platform $(PLATFORMS) \
		--target production \
		-t $(REGISTRY_IMAGE) .

push: buildx-setup ## Build and push multiarch image to ghcr.io
	docker buildx build --platform $(PLATFORMS) \
		--target production \
		-t $(REGISTRY_IMAGE) \
		--push .

run: ## Run container — override with: make run AIML_API_KEY=xxx PORT=3000
	@echo ""
	@echo "  docker run --rm -e AIML_API_KEY=\$$AIML_API_KEY -p $(PORT):$(PORT) $(FULL_IMAGE)"
	@echo ""
	@echo "  MCP endpoint : http://localhost:$(PORT)/mcp"
	@echo "  Health check : http://localhost:$(PORT)/health"
	@echo ""
	@echo "  To connect Claude Code after starting:"
	@echo "  claude mcp add --transport http aiml http://localhost:$(PORT)/mcp"
	@echo ""
	docker run --rm \
	  -e AIML_API_KEY=$(AIML_API_KEY) \
	  -e AIML_API_BASE_URL=$(AIML_API_BASE_URL) \
	  -e PORT=$(PORT) \
	  -p $(PORT):$(PORT) \
	  $(FULL_IMAGE)

connect: ## Connect to Claude Code — override with: make connect PORT=3000
	claude mcp add --transport http aiml http://localhost:$(PORT)/mcp
	@echo ""
	@echo "  Connected! Restart Claude Code if already running."
	@echo ""

up: ## Start with docker compose (reads .env automatically)
	docker compose up -d

down: ## Stop docker compose containers
	docker compose down

logs: ## Tail docker compose logs
	docker compose logs -f
