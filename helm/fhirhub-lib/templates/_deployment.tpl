{{/*
Deployment template.
Usage:
  include "fhirhub-lib.deployment" (dict
    "top"                .
    "component"          "api"
    "containerPort"      8080
    "image"              (dict "repository" "ghcr.io/org/api" "tag" "latest" "pullPolicy" "IfNotPresent")
    "resources"          .Values.api.resources
    "env"                .Values.api.env
    "probes"             (dict
                            "readiness" (dict "path" "/healthz" "port" 8080 "initialDelaySeconds" 10 "periodSeconds" 10)
                            "liveness"  (dict "path" "/healthz" "port" 8080 "initialDelaySeconds" 30 "periodSeconds" 15))
    "replicaCount"       2
    "serviceAccountName" "default"
  )
*/}}
{{- define "fhirhub-lib.deployment" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "fhirhub-lib.fullname" .top }}-{{ .component }}
  labels:
    {{- include "fhirhub-lib.labels" (dict "top" .top "component" .component) | nindent 4 }}
spec:
  {{- if .replicaCount }}
  replicas: {{ .replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "fhirhub-lib.selectorLabels" (dict "top" .top "component" .component) | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "fhirhub-lib.labels" (dict "top" .top "component" .component) | nindent 8 }}
    spec:
      {{- if .serviceAccountName }}
      serviceAccountName: {{ .serviceAccountName }}
      {{- end }}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    {{- include "fhirhub-lib.selectorLabels" (dict "top" .top "component" .component) | nindent 20 }}
                topologyKey: kubernetes.io/hostname
      containers:
        - name: {{ .component }}
          image: "{{ .image.repository }}:{{ .image.tag }}"
          imagePullPolicy: {{ .image.pullPolicy | default "IfNotPresent" }}
          ports:
            - name: http
              containerPort: {{ .containerPort }}
              protocol: TCP
          {{- if .probes }}
          {{- if .probes.readiness }}
          readinessProbe:
            httpGet:
              path: {{ .probes.readiness.path }}
              port: {{ .probes.readiness.port }}
            initialDelaySeconds: {{ .probes.readiness.initialDelaySeconds | default 10 }}
            periodSeconds: {{ .probes.readiness.periodSeconds | default 10 }}
          {{- end }}
          {{- if .probes.liveness }}
          livenessProbe:
            httpGet:
              path: {{ .probes.liveness.path }}
              port: {{ .probes.liveness.port }}
            initialDelaySeconds: {{ .probes.liveness.initialDelaySeconds | default 30 }}
            periodSeconds: {{ .probes.liveness.periodSeconds | default 15 }}
          {{- end }}
          {{- end }}
          {{- if .resources }}
          resources:
            {{- toYaml .resources | nindent 12 }}
          {{- end }}
          {{- if .env }}
          env:
            {{- toYaml .env | nindent 12 }}
          {{- end }}
{{- end -}}
