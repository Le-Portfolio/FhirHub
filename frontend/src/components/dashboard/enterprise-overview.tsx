"use client";

import { cn } from "@/lib/utils";
import type { DashboardOverviewDTO } from "@/types";
import {
  Shield,
  Gauge,
  Activity,
  Link,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
} from "@/components/ui/icons";

interface EnterpriseOverviewProps {
  overview: DashboardOverviewDTO;
  className?: string;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "healthy":
      return "badge-success";
    case "degraded":
      return "badge-warning";
    case "down":
      return "badge-error";
    default:
      return "badge-ghost";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "healthy":
      return <CheckCircle className="w-3.5 h-3.5" />;
    case "degraded":
      return <AlertTriangle className="w-3.5 h-3.5" />;
    default:
      return <AlertCircle className="w-3.5 h-3.5" />;
  }
}

export function EnterpriseOverview({ overview, className }: EnterpriseOverviewProps) {
  const { clinicalOperations, platformSlo, securityPosture, interoperability } =
    overview;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="card bg-gradient-to-r from-base-100 via-base-100 to-primary/5 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {overview.systemStatus.map((service) => (
              <span
                key={service.name}
                className={cn("badge badge-outline gap-1", statusBadgeClass(service.status))}
              >
                {statusIcon(service.status)}
                {service.name}
                <span className="font-normal opacity-80">
                  {service.latencyMs}ms • {service.uptimePercent30d.toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
          <p className="text-xs text-base-content/60 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Enterprise snapshot window: {overview.windowLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Clinical Operations
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <Metric label="Critical Lab TAT (p50)" value={`${clinicalOperations.criticalLabTurnaroundMinutesP50}m`} />
              <Metric label="Critical Lab TAT (p95)" value={`${clinicalOperations.criticalLabTurnaroundMinutesP95}m`} />
              <Metric label="Alert Ack (p50)" value={`${clinicalOperations.alertAcknowledgeMinutesP50}m`} />
              <Metric label="Alert Ack (p95)" value={`${clinicalOperations.alertAcknowledgeMinutesP95}m`} />
              <Metric label="High-Risk Patients" value={clinicalOperations.highRiskPatients.toLocaleString()} />
              <Metric
                label="High-Risk Trend"
                value={`${clinicalOperations.highRiskTrend?.value ?? 0}%`}
                tone={clinicalOperations.highRiskTrend?.isPositive ? "success" : "warning"}
              />
            </div>
          </div>
        </section>

        <section className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Gauge className="w-4 h-4 text-info" />
              Platform SLO
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <Metric label="API Availability (30d)" value={`${platformSlo.apiAvailabilityPercent30d}%`} tone="success" />
              <Metric label="Error Rate" value={`${platformSlo.errorRatePercent}%`} tone="warning" />
              <Metric label="API p50" value={`${platformSlo.apiLatencyP50Ms}ms`} />
              <Metric label="API p95" value={`${platformSlo.apiLatencyP95Ms}ms`} />
              <Metric label="API p99" value={`${platformSlo.apiLatencyP99Ms}ms`} />
              <Metric label="Export SLA Success" value={`${platformSlo.exportSuccessRatePercent}%`} tone="success" />
            </div>
          </div>
        </section>

        <section className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-warning" />
              Security Posture
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <Metric label="MFA Enrollment" value={`${securityPosture.mfaEnrollmentPercent}%`} tone="success" />
              <Metric label="Audit Coverage" value={`${securityPosture.auditCoveragePercent}%`} tone="success" />
              <Metric label="Audit Events (24h)" value={securityPosture.auditEvents24h.toLocaleString()} />
              <Metric label="Privileged Actions (24h)" value={securityPosture.privilegedActions24h.toLocaleString()} tone="warning" />
              <Metric label="Failed Logins (24h)" value={securityPosture.failedLogins24h.toLocaleString()} tone="error" />
            </div>
          </div>
        </section>

        <section className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Link className="w-4 h-4 text-secondary" />
              Interoperability
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <Metric label="SMART Launches (24h)" value={interoperability.smartLaunches24h.toLocaleString()} />
              <Metric label="SMART Success" value={`${interoperability.smartLaunchSuccessRatePercent}%`} tone="success" />
              <Metric label="Bulk Exports (24h)" value={interoperability.bulkExports24h.toLocaleString()} />
              <Metric label="Bulk Export Success" value={`${interoperability.bulkExportSuccessRatePercent}%`} tone="success" />
              <Metric label="FHIR Resource Types" value={interoperability.fhirResourceTypesServed.toLocaleString()} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "error";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "error"
          ? "text-error"
          : "text-base-content";

  return (
    <div className="rounded-lg border border-base-300 bg-base-200/50 px-3 py-2">
      <p className="text-xs text-base-content/60">{label}</p>
      <p className={cn("text-base font-semibold mt-1", toneClass)}>{value}</p>
    </div>
  );
}
