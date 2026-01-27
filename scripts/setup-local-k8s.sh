#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CLUSTER_NAME="fhirhub"

echo "==> Setting up local Kubernetes cluster for FhirHub"

# Check prerequisites
for cmd in kind kubectl helm docker; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: $cmd is required but not installed."
    exit 1
  fi
done

# Create Kind cluster if it doesn't exist
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
  echo "==> Cluster '${CLUSTER_NAME}' already exists, skipping creation"
else
  echo "==> Creating Kind cluster '${CLUSTER_NAME}'"
  kind create cluster --config "$SCRIPT_DIR/kind-config.yaml"
fi

# Wait for cluster to be ready
echo "==> Waiting for cluster nodes to be ready"
kubectl wait --for=condition=Ready nodes --all --timeout=120s

# Install nginx ingress controller
echo "==> Installing nginx ingress controller"
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
echo "==> Waiting for ingress controller to be ready"
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Install cert-manager
echo "==> Installing cert-manager"
helm repo add jetstack https://charts.jetstack.io 2>/dev/null || true
helm repo update
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true \
  --wait

# Install ArgoCD
echo "==> Installing ArgoCD"
kubectl create namespace argocd 2>/dev/null || true
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
echo "==> Waiting for ArgoCD to be ready"
kubectl wait --namespace argocd \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/name=argocd-server \
  --timeout=180s

# Build and load local images into Kind
echo "==> Building local Docker images"
docker build -t fhirhub-api:local -f "$PROJECT_DIR/FhirHubServer/src/FhirHubServer.Api/Dockerfile" "$PROJECT_DIR/FhirHubServer/"
docker build -t fhirhub-frontend:local -f "$PROJECT_DIR/frontend/Dockerfile" "$PROJECT_DIR/frontend/"

echo "==> Loading images into Kind cluster"
kind load docker-image fhirhub-api:local --name "$CLUSTER_NAME"
kind load docker-image fhirhub-frontend:local --name "$CLUSTER_NAME"

# Deploy FhirHub via Helm
echo "==> Deploying FhirHub via Helm"
helm dependency update "$PROJECT_DIR/helm/fhirhub"
helm upgrade --install fhirhub "$PROJECT_DIR/helm/fhirhub" \
  -f "$PROJECT_DIR/helm/fhirhub/values.yaml" \
  -f "$PROJECT_DIR/helm/fhirhub/values-dev.yaml" \
  --set fhirhub-api.image.repository=fhirhub-api \
  --set fhirhub-api.image.tag=local \
  --set fhirhub-frontend.image.repository=fhirhub-frontend \
  --set fhirhub-frontend.image.tag=local \
  -n fhirhub-dev --create-namespace

# Apply ArgoCD apps
echo "==> Applying ArgoCD ApplicationSet"
kubectl apply -f "$PROJECT_DIR/argocd/app-of-apps.yaml"
kubectl apply -f "$PROJECT_DIR/argocd/applicationset.yaml"

echo ""
echo "============================================"
echo "  FhirHub Local K8s Setup Complete"
echo "============================================"
echo ""
echo "Access URLs:"
echo "  Frontend:  http://localhost"
echo "  API:       http://localhost/api/"
echo "  ArgoCD:    kubectl port-forward svc/argocd-server -n argocd 8443:443"
echo "             https://localhost:8443"
echo ""
echo "ArgoCD admin password:"
echo "  kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
echo ""
echo "Check pod status:"
echo "  kubectl get pods -n fhirhub-dev"
echo ""
