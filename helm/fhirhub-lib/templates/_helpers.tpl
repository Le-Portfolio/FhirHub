{{/*
Chart name, truncated to 63 characters.
*/}}
{{- define "fhirhub-lib.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "fhirhub-lib.fullname" -}}
{{- if .Values.fullnameOverride -}}
  {{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
  {{- $name := default .Chart.Name .Values.nameOverride -}}
  {{- if contains $name .Release.Name -}}
    {{- .Release.Name | trunc 63 | trimSuffix "-" -}}
  {{- else -}}
    {{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
  {{- end -}}
{{- end -}}
{{- end -}}

{{/*
Standard Kubernetes labels.
Usage: include "fhirhub-lib.labels" (dict "top" . "component" "api")
*/}}
{{- define "fhirhub-lib.labels" -}}
app.kubernetes.io/name: {{ include "fhirhub-lib.name" .top }}
app.kubernetes.io/instance: {{ .top.Release.Name }}
{{- if .top.Chart.AppVersion }}
app.kubernetes.io/version: {{ .top.Chart.AppVersion | quote }}
{{- end }}
{{- if .component }}
app.kubernetes.io/component: {{ .component }}
{{- end }}
app.kubernetes.io/part-of: fhirhub
app.kubernetes.io/managed-by: {{ .top.Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .top.Chart.Name .top.Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{/*
Selector labels (used in matchLabels and service selectors).
Usage: include "fhirhub-lib.selectorLabels" (dict "top" . "component" "api")
*/}}
{{- define "fhirhub-lib.selectorLabels" -}}
app.kubernetes.io/name: {{ include "fhirhub-lib.name" .top }}
app.kubernetes.io/instance: {{ .top.Release.Name }}
{{- if .component }}
app.kubernetes.io/component: {{ .component }}
{{- end }}
{{- end -}}
