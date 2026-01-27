{{/*
Service template.
Usage:
  include "fhirhub-lib.service" (dict
    "top"        .
    "component"  "api"
    "port"       80
    "targetPort" 8080
    "type"       "ClusterIP"
  )
*/}}
{{- define "fhirhub-lib.service" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "fhirhub-lib.fullname" .top }}-{{ .component }}
  labels:
    {{- include "fhirhub-lib.labels" (dict "top" .top "component" .component) | nindent 4 }}
spec:
  type: {{ .type | default "ClusterIP" }}
  ports:
    - port: {{ .port }}
      targetPort: {{ .targetPort }}
      protocol: TCP
      name: http
  selector:
    {{- include "fhirhub-lib.selectorLabels" (dict "top" .top "component" .component) | nindent 4 }}
{{- end -}}
