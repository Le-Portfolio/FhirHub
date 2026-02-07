// API Dashboard Repository Implementation
// Fetches dashboard data from FhirHubServer backend

import type { IDashboardRepository } from "../interfaces";
import type {
  PaginatedResponse,
  DashboardMetricDTO,
  DashboardOverviewDTO,
  AlertDTO,
  ActivityDTO,
  AlertSearchParams,
  ActivitySearchParams,
} from "@/types";
import type { ApiClient } from "@/lib/api-client";
import {
  Users,
  Activity,
  HeartPulse,
  Pill,
  TestTube,
  FileText,
  Calendar,
  AlertTriangle,
  type LucideIcon,
} from "@/components/ui/icons";

// Map string icon names from API to actual Lucide icon components
const iconMap: Record<string, LucideIcon> = {
  users: Users,
  activity: Activity,
  heartpulse: HeartPulse,
  heart: HeartPulse,
  pill: Pill,
  testtube: TestTube,
  flask: TestTube, // Map flask to TestTube as fallback
  filetext: FileText,
  calendar: Calendar,
  "alert-triangle": AlertTriangle,
};

interface ApiMetricDTO extends Omit<DashboardMetricDTO, "icon"> {
  icon: string | LucideIcon;
}

interface ApiOverviewDTO extends Omit<DashboardOverviewDTO, "summaryKpis"> {
  summaryKpis: ApiMetricDTO[];
}

export class DashboardRepository implements IDashboardRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async getMetrics(): Promise<DashboardMetricDTO[]> {
    const metrics = await this.apiClient.get<ApiMetricDTO[]>(
      "/api/dashboard/metrics"
    );

    // Map string icon names to actual icon components
    return metrics.map((metric) => ({
      ...metric,
      icon:
        typeof metric.icon === "string"
          ? iconMap[metric.icon.toLowerCase()] || Users
          : metric.icon,
    }));
  }

  async getOverview(
    window: "24h" | "7d" | "30d" = "7d"
  ): Promise<DashboardOverviewDTO> {
    const params = new URLSearchParams();
    params.set("window", window);

    const overview = await this.apiClient.get<ApiOverviewDTO>(
      "/api/dashboard/overview",
      params
    );

    return {
      ...overview,
      summaryKpis: overview.summaryKpis.map((metric) => ({
        ...metric,
        icon:
          typeof metric.icon === "string"
            ? iconMap[metric.icon.toLowerCase()] || Users
            : metric.icon,
      })),
    };
  }

  async getAlerts(limit: number = 10): Promise<AlertDTO[]> {
    const params = new URLSearchParams();
    params.set("limit", String(limit));

    return this.apiClient.get<AlertDTO[]>("/api/dashboard/alerts", params);
  }

  async getActivities(limit: number = 10): Promise<ActivityDTO[]> {
    const params = new URLSearchParams();
    params.set("limit", String(limit));

    return this.apiClient.get<ActivityDTO[]>(
      "/api/dashboard/activities",
      params
    );
  }

  async acknowledgeAlert(id: string): Promise<void> {
    await this.apiClient.post<void>(`/api/dashboard/alerts/${id}/acknowledge`);
  }

  async resolveAlert(id: string): Promise<void> {
    await this.apiClient.post<void>(`/api/dashboard/alerts/${id}/resolve`);
  }

  async getAlertsPaginated(
    params: AlertSearchParams
  ): Promise<PaginatedResponse<AlertDTO>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.priority) searchParams.set("priority", params.priority);
    if (params.status) searchParams.set("status", params.status);
    if (params.patientName) searchParams.set("patientName", params.patientName);

    return this.apiClient.get<PaginatedResponse<AlertDTO>>(
      "/api/dashboard/alerts/all",
      searchParams
    );
  }

  async getActivitiesPaginated(
    params: ActivitySearchParams
  ): Promise<PaginatedResponse<ActivityDTO>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.type) searchParams.set("type", params.type);
    if (params.resourceType)
      searchParams.set("resourceType", params.resourceType);

    return this.apiClient.get<PaginatedResponse<ActivityDTO>>(
      "/api/dashboard/activities/all",
      searchParams
    );
  }
}
