{{/*
Expand the name of the chart.
*/}}
{{- define "fhirhub.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "fhirhub.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "fhirhub.labels" -}}
helm.sh/chart: {{ include "fhirhub.name" . }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/part-of: fhirhub
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}
