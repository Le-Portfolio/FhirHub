.PHONY: build up down logs dev dev-api dev-frontend test test-api test-frontend lint seed \
       build-api build-frontend push-api push-frontend k8s-create k8s-deploy monitoring-up \
       single-node-setup single-node-deploy single-node-teardown clean help

COMPOSE := docker compose
COMPOSE_PROD := docker compose -f docker-compose.yml -f docker-compose.prod.yml
DOCKERHUB_USERNAME ?= $(shell echo $$DOCKERHUB_USERNAME)
IMAGE_TAG ?= latest

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Docker ──────────────────────────────────────────────────────────────────

build: ## Build all Docker images
	$(COMPOSE) build

up: ## Start all services
	$(COMPOSE) up -d

down: ## Stop all services
	$(COMPOSE) down

logs: ## Tail logs from all services
	$(COMPOSE) logs -f

dev: ## Start infrastructure services only (postgres, hapi, keycloak)
	$(COMPOSE) up -d postgres hapi-fhir keycloak-postgres keycloak

dev-api: dev ## Start infra + API (for frontend local dev)
	$(COMPOSE) up -d fhirhub-api

dev-frontend: ## Run frontend in dev mode (requires API running)
	cd frontend && npm run dev

# ─── Testing ─────────────────────────────────────────────────────────────────

test: test-api test-frontend ## Run all tests

test-api: ## Run API tests
	cd FhirHubServer && dotnet test --verbosity normal

test-frontend: ## Run frontend tests
	cd frontend && npm run test:run

# ─── Linting ─────────────────────────────────────────────────────────────────

lint: ## Run all linters
	cd frontend && npm run lint
	cd frontend && npm run typecheck
	cd frontend && npm run format:check

# ─── Data ────────────────────────────────────────────────────────────────────

seed: ## Seed FHIR server with sample data
	@echo "Seeding HAPI FHIR with sample data..."
	@echo "TODO: Add seed script"

# ─── Docker Build & Push ────────────────────────────────────────────────────

build-api: ## Build API Docker image
	docker build -t $(DOCKERHUB_USERNAME)/fhirhub-api:$(IMAGE_TAG) -f FhirHubServer/src/FhirHubServer.Api/Dockerfile FhirHubServer/

build-frontend: ## Build Frontend Docker image
	docker build -t $(DOCKERHUB_USERNAME)/fhirhub-frontend:$(IMAGE_TAG) -f frontend/Dockerfile frontend/

push-api: build-api ## Build and push API image to Docker Hub
	docker push $(DOCKERHUB_USERNAME)/fhirhub-api:$(IMAGE_TAG)

push-frontend: build-frontend ## Build and push Frontend image to Docker Hub
	docker push $(DOCKERHUB_USERNAME)/fhirhub-frontend:$(IMAGE_TAG)

# ─── Kubernetes ──────────────────────────────────────────────────────────────

k8s-create: ## Create local Kind cluster
	./scripts/setup-local-k8s.sh

k8s-deploy: ## Deploy FhirHub to local Kind cluster via Helm
	helm dependency update helm/fhirhub
	helm upgrade --install fhirhub helm/fhirhub \
		-f helm/fhirhub/values.yaml \
		-f helm/fhirhub/values-dev.yaml \
		-n fhirhub-dev --create-namespace

monitoring-up: ## Deploy monitoring stack to Kind cluster
	helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
	helm repo add grafana https://grafana.github.io/helm-charts
	helm repo update
	helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
		-f helm/monitoring/values-prometheus-stack.yaml \
		-n monitoring --create-namespace
	helm upgrade --install loki grafana/loki-stack \
		-f helm/monitoring/values-loki.yaml \
		-n monitoring

# ─── Single-Node (k3s) ──────────────────────────────────────────────────────

single-node-setup: ## Install k3s and deploy FhirHub + monitoring on a single machine
	./scripts/setup-single-node.sh

single-node-deploy: ## Deploy FhirHub to existing k3s with single-node values
	helm dependency update helm/fhirhub
	helm upgrade --install fhirhub helm/fhirhub \
		-f helm/fhirhub/values.yaml \
		-f helm/fhirhub/values-single-node.yaml \
		-n fhirhub --create-namespace
	helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
	helm repo add grafana https://grafana.github.io/helm-charts 2>/dev/null || true
	helm repo update
	helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
		-f helm/monitoring/values-single-node.yaml \
		-n monitoring --create-namespace
	helm upgrade --install loki grafana/loki-stack \
		-f helm/monitoring/values-single-node.yaml \
		-n monitoring

single-node-teardown: ## Remove FhirHub, monitoring, and k3s from the machine
	./scripts/teardown-single-node.sh

# ─── Cleanup ─────────────────────────────────────────────────────────────────

clean: ## Remove all containers, volumes, and local cluster
	$(COMPOSE) down -v --remove-orphans
	kind delete cluster --name fhirhub 2>/dev/null || true
