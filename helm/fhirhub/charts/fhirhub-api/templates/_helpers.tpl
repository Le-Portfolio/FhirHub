{{- define "fhirhub-api.fullname" -}}
{{- printf "%s-api" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "fhirhub-api.labels" -}}
{{ include "fhirhub-lib.labels" (dict "top" . "component" "api") }}
{{- end }}

{{- define "fhirhub-api.selectorLabels" -}}
{{ include "fhirhub-lib.selectorLabels" (dict "top" . "component" "api") }}
{{- end }}
