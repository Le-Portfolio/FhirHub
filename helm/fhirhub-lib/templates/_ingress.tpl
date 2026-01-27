{{/*
Ingress template.
Usage:
  include "fhirhub-lib.ingress" (dict
    "top"         .
    "component"   "api"
    "enabled"     true
    "className"   "nginx"
    "annotations" (dict "nginx.ingress.kubernetes.io/rewrite-target" "/")
    "hosts"       (list (dict "host" "api.example.com" "paths" (list (dict "path" "/" "pathType" "Prefix"))))
    "tls"         (list (dict "secretName" "api-tls" "hosts" (list "api.example.com")))
  )
*/}}
{{- define "fhirhub-lib.ingress" -}}
{{- if .enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "fhirhub-lib.fullname" .top }}-{{ .component }}
  labels:
    {{- include "fhirhub-lib.labels" (dict "top" .top "component" .component) | nindent 4 }}
  {{- if .annotations }}
  annotations:
    {{- toYaml .annotations | nindent 4 }}
  {{- end }}
spec:
  {{- if .className }}
  ingressClassName: {{ .className }}
  {{- end }}
  {{- if .tls }}
  tls:
    {{- range .tls }}
    - secretName: {{ .secretName }}
      hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
    {{- end }}
  {{- end }}
  rules:
    {{- range .hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType | default "Prefix" }}
            backend:
              service:
                name: {{ include "fhirhub-lib.fullname" $.top }}-{{ $.component }}
                port:
                  name: http
          {{- end }}
    {{- end }}
{{- end }}
{{- end -}}
