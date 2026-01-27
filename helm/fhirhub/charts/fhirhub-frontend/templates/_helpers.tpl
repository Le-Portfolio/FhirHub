{{- define "fhirhub-frontend.fullname" -}}
{{- printf "%s-frontend" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "fhirhub-frontend.labels" -}}
{{ include "fhirhub-lib.labels" (dict "top" . "component" "frontend") }}
{{- end }}

{{- define "fhirhub-frontend.selectorLabels" -}}
{{ include "fhirhub-lib.selectorLabels" (dict "top" . "component" "frontend") }}
{{- end }}
