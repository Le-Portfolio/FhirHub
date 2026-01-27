{{/*
PodDisruptionBudget template.
Usage:
  include "fhirhub-lib.pdb" (dict
    "top"          .
    "component"    "api"
    "enabled"      true
    "minAvailable" 1
  )
*/}}
{{- define "fhirhub-lib.pdb" -}}
{{- if .enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "fhirhub-lib.fullname" .top }}-{{ .component }}
  labels:
    {{- include "fhirhub-lib.labels" (dict "top" .top "component" .component) | nindent 4 }}
spec:
  minAvailable: {{ .minAvailable | default 1 }}
  selector:
    matchLabels:
      {{- include "fhirhub-lib.selectorLabels" (dict "top" .top "component" .component) | nindent 6 }}
{{- end }}
{{- end -}}
