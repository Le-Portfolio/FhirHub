{{/*
HorizontalPodAutoscaler template.
Usage:
  include "fhirhub-lib.hpa" (dict
    "top"          .
    "component"    "api"
    "enabled"      true
    "minReplicas"  2
    "maxReplicas"  10
    "targetCPU"    80
    "targetMemory" 80
  )
*/}}
{{- define "fhirhub-lib.hpa" -}}
{{- if .enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "fhirhub-lib.fullname" .top }}-{{ .component }}
  labels:
    {{- include "fhirhub-lib.labels" (dict "top" .top "component" .component) | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "fhirhub-lib.fullname" .top }}-{{ .component }}
  minReplicas: {{ .minReplicas | default 1 }}
  maxReplicas: {{ .maxReplicas | default 10 }}
  metrics:
    {{- if .targetCPU }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .targetCPU }}
    {{- end }}
    {{- if .targetMemory }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .targetMemory }}
    {{- end }}
{{- end }}
{{- end -}}
