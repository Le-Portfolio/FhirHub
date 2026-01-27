#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NAMESPACE="fhirhub"
MONITORING_NAMESPACE="monitoring"

echo "============================================"
echo "  FhirHub Single-Node k3s Setup"
echo "============================================"
echo ""

# ─── Prerequisites ──────────────────────────────────────────────────────────

echo "==> Checking prerequisites"

if ! command -v curl &>/dev/null; then
  echo "ERROR: curl is required but not installed."
  exit 1
fi

if [ "$(id -u)" -ne 0 ] && ! sudo -n true 2>/dev/null; then
  echo "INFO: This script requires sudo access for k3s installation."
  echo "      You may be prompted for your password."
fi

# ─── Install k3s ────────────────────────────────────────────────────────────

if command -v k3s &>/dev/null; then
  echo "==> k3s is already installed, skipping installation"
else
  echo "==> Installing k3s"
  curl -sfL https://get.k3s.io | sh -
fi

# ─── Configure kubeconfig ──────────────────────────────────────────────────

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# Make kubeconfig accessible to the current user
if [ -f "$KUBECONFIG" ]; then
  echo "==> Configuring kubeconfig"
  mkdir -p "$HOME/.kube"
  sudo cp /etc/rancher/k3s/k3s.yaml "$HOME/.kube/config"
  sudo chown "$(id -u):$(id -g)" "$HOME/.kube/config"
  export KUBECONFIG="$HOME/.kube/config"
fi

# ─── Wait for k3s ──────────────────────────────────────────────────────────

echo "==> Waiting for k3s node to be Ready"
kubectl wait --for=condition=Ready nodes --all --timeout=120s

echo "==> Node status:"
kubectl get nodes -o wide

# ─── Install Helm ──────────────────────────────────────────────────────────

if command -v helm &>/dev/null; then
  echo "==> Helm is already installed"
else
  echo "==> Installing Helm"
  curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# ─── Add Helm repos ────────────────────────────────────────────────────────

echo "==> Adding Helm repositories"
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo add grafana https://grafana.github.io/helm-charts 2>/dev/null || true
helm repo update

# ─── Deploy FhirHub ────────────────────────────────────────────────────────

echo "==> Deploying FhirHub"
helm dependency update "$PROJECT_DIR/helm/fhirhub"
helm upgrade --install fhirhub "$PROJECT_DIR/helm/fhirhub" \
  -f "$PROJECT_DIR/helm/fhirhub/values.yaml" \
  -f "$PROJECT_DIR/helm/fhirhub/values-single-node.yaml" \
  -n "$NAMESPACE" --create-namespace

# ─── Deploy Monitoring ─────────────────────────────────────────────────────

echo "==> Deploying Prometheus + Grafana"
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  -f "$PROJECT_DIR/helm/monitoring/values-single-node.yaml" \
  -n "$MONITORING_NAMESPACE" --create-namespace

echo "==> Deploying Loki + Promtail"
helm upgrade --install loki grafana/loki-stack \
  -f "$PROJECT_DIR/helm/monitoring/values-single-node.yaml" \
  -n "$MONITORING_NAMESPACE"

# ─── Wait for pods ─────────────────────────────────────────────────────────

echo "==> Waiting for FhirHub pods to be ready (timeout: 5m)"
kubectl wait --for=condition=Ready pods --all \
  -n "$NAMESPACE" --timeout=300s 2>/dev/null || {
  echo "WARNING: Some FhirHub pods are not ready yet. Check with: kubectl get pods -n $NAMESPACE"
}

echo "==> Waiting for monitoring pods to be ready (timeout: 5m)"
kubectl wait --for=condition=Ready pods --all \
  -n "$MONITORING_NAMESPACE" --timeout=300s 2>/dev/null || {
  echo "WARNING: Some monitoring pods are not ready yet. Check with: kubectl get pods -n $MONITORING_NAMESPACE"
}

# ─── Print status ──────────────────────────────────────────────────────────

echo ""
echo "============================================"
echo "  FhirHub Single-Node Setup Complete"
echo "============================================"
echo ""
echo "Pod status:"
kubectl get pods -n "$NAMESPACE"
echo ""
kubectl get pods -n "$MONITORING_NAMESPACE"
echo ""
echo "Access URLs (via Traefik ingress):"
echo "  Frontend:    http://fhirhub.local"
echo "  API:         http://fhirhub.local/api/"
echo "  Keycloak:    http://auth.fhirhub.local"
echo ""
echo "Monitoring (port-forward):"
echo "  Grafana:     kubectl port-forward -n $MONITORING_NAMESPACE svc/prometheus-grafana 3000:80"
echo "               http://localhost:3000"
echo "  Prometheus:  kubectl port-forward -n $MONITORING_NAMESPACE svc/prometheus-kube-prometheus-prometheus 9090:9090"
echo "               http://localhost:9090"
echo ""
echo "Add to /etc/hosts:"
echo "  127.0.0.1 fhirhub.local auth.fhirhub.local"
echo ""
echo "Check pod status:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl get pods -n $MONITORING_NAMESPACE"
echo ""
