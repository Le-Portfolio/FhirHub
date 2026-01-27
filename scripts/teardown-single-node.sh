#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="fhirhub"
MONITORING_NAMESPACE="monitoring"

echo "============================================"
echo "  FhirHub Single-Node Teardown"
echo "============================================"
echo ""

# ─── Configure kubeconfig ──────────────────────────────────────────────────

if [ -f "$HOME/.kube/config" ]; then
  export KUBECONFIG="$HOME/.kube/config"
elif [ -f /etc/rancher/k3s/k3s.yaml ]; then
  export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
fi

# ─── Uninstall Helm releases ──────────────────────────────────────────────

if command -v helm &>/dev/null; then
  echo "==> Uninstalling FhirHub"
  helm uninstall fhirhub -n "$NAMESPACE" 2>/dev/null || echo "  FhirHub release not found, skipping"

  echo "==> Uninstalling Loki"
  helm uninstall loki -n "$MONITORING_NAMESPACE" 2>/dev/null || echo "  Loki release not found, skipping"

  echo "==> Uninstalling Prometheus"
  helm uninstall prometheus -n "$MONITORING_NAMESPACE" 2>/dev/null || echo "  Prometheus release not found, skipping"
else
  echo "WARNING: Helm not found, skipping Helm uninstall"
fi

# ─── Delete namespaces ─────────────────────────────────────────────────────

echo "==> Deleting namespaces"
kubectl delete namespace "$NAMESPACE" 2>/dev/null || echo "  Namespace $NAMESPACE not found, skipping"
kubectl delete namespace "$MONITORING_NAMESPACE" 2>/dev/null || echo "  Namespace $MONITORING_NAMESPACE not found, skipping"

# ─── Uninstall k3s ─────────────────────────────────────────────────────────

if [ -f /usr/local/bin/k3s-uninstall.sh ]; then
  echo "==> Uninstalling k3s"
  /usr/local/bin/k3s-uninstall.sh
else
  echo "==> k3s uninstall script not found, skipping"
fi

echo ""
echo "============================================"
echo "  Teardown Complete"
echo "============================================"
echo ""
