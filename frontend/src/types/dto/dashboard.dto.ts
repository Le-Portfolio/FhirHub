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
