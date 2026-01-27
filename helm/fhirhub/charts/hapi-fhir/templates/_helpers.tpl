{{- define "hapi-fhir.fullname" -}}
{{- printf "%s-hapi-fhir" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "hapi-fhir.labels" -}}
app.kubernetes.io/name: hapi-fhir
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/component: fhir-server
app.kubernetes.io/part-of: fhirhub
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "hapi-fhir.selectorLabels" -}}
app.kubernetes.io/name: hapi-fhir
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
