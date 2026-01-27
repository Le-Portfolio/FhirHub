{{/*
ServiceMonitor template (Prometheus Operator CRD).
Usage:
  include "fhirhub-lib.servicemonitor" (dict
    "top"       .
    "component" "api"
    "enabled"   true
    "port"      "http"
    "path"      "/metrics"
    "interval"  "30s"
  )
*/}}
{{- define "fhirhub-lib.servicemonitor" -}}
{{- if .enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "fhirhub-lib.fullname" .top }}-{{ .component }}
  labels:
    {{- include "fhirhub-lib.labels" (dict "top" .top "component" .component) | nindent 4 }}
spec:
  selector:
    matchLabels:
      {{- include "fhirhub-lib.selectorLabels" (dict "top" .top "component" .component) | nindent 6 }}
  endpoints:
    - port: {{ .port | default "http" }}
      path: {{ .path | default "/metrics" }}
      interval: {{ .interval | default "30s" }}
{{- end }}
{{- end -}}
