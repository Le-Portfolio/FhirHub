/**
 * Dashboard DTOs
 *
 * Data transfer objects for dashboard metrics, alerts, and activity feeds.
 */

import type { LucideIcon } from "lucide-react";

/**
 * Dashboard Metric DTO
 */
export interface DashboardMetricDTO {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  iconColor?: string;
  iconBgColor?: string;
}

/**
 * Dashboard Metrics collection
 */
export interface DashboardMetricsDTO {
  totalPatients: DashboardMetricDTO;
  totalObservations: DashboardMetricDTO;
  activeConditions: DashboardMetricDTO;
  activeMedications: DashboardMetricDTO;
}

export interface ClinicalOperationsDTO {
  criticalLabTurnaroundMinutesP50: number;
  criticalLabTurnaroundMinutesP95: number;
  alertAcknowledgeMinutesP50: number;
  alertAcknowledgeMinutesP95: number;
  highRiskPatients: number;
  highRiskTrend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
}

export interface PlatformSloDTO {
  apiAvailabilityPercent30d: number;
  apiLatencyP50Ms: number;
  apiLatencyP95Ms: number;
  apiLatencyP99Ms: number;
  errorRatePercent: number;
  exportSuccessRatePercent: number;
}

export interface SecurityPostureDTO {
  mfaEnrollmentPercent: number;
  privilegedActions24h: number;
  failedLogins24h: number;
  auditEvents24h: number;
  auditCoveragePercent: number;
}

export interface InteroperabilityStatusDTO {
  smartLaunches24h: number;
  smartLaunchSuccessRatePercent: number;
  bulkExports24h: number;
  bulkExportSuccessRatePercent: number;
  fhirResourceTypesServed: number;
}

export type SystemStatusLevel = "healthy" | "degraded" | "down" | "unknown";

export interface SystemServiceStatusDTO {
  name: string;
  status: SystemStatusLevel;
  latencyMs: number;
  uptimePercent30d: number;
}

export interface DashboardOverviewDTO {
  summaryKpis: DashboardMetricDTO[];
  clinicalOperations: ClinicalOperationsDTO;
  platformSlo: PlatformSloDTO;
  securityPosture: SecurityPostureDTO;
  interoperability: InteroperabilityStatusDTO;
  systemStatus: SystemServiceStatusDTO[];
  windowLabel: string;
  generatedAt: string;
}

/**
 * Alert priority levels
 */
export type AlertPriority = "critical" | "high" | "medium" | "low";

/**
 * Alert status
 */
export type AlertStatus = "active" | "acknowledged" | "resolved";

/**
 * Alert DTO
 */
export interface AlertDTO {
  id: string;
  title: string;
  description?: string;
  priority: AlertPriority;
  status: AlertStatus;
  patientId?: string;
  patientName?: string;
  timestamp: string;
}

/**
 * Activity type
 */
export type ActivityType = "create" | "update" | "view" | "delete" | "export";

/**
 * Activity DTO for activity feed
 */
export interface ActivityDTO {
  id: string;
  type: ActivityType;
  resourceType: string;
  description: string;
  user: string;
  timestamp: string;
  resourceId?: string;
}

/**
 * Alert search params for paginated alerts list
 */
export interface AlertSearchParams {
  priority?: string;
  status?: string;
  patientName?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Activity search params for paginated activities list
 */
export interface ActivitySearchParams {
  type?: string;
  resourceType?: string;
  page?: number;
  pageSize?: number;
}
