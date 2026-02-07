// Dashboard Service
// Acts as a proxy layer between components and repositories

import type { IDashboardRepository } from "@/repositories";
import type {
  PaginatedResponse,
  DashboardMetricDTO,
  DashboardOverviewDTO,
  AlertDTO,
  ActivityDTO,
  AlertSearchParams,
  ActivitySearchParams,
} from "@/types";

export class DashboardService {
  constructor(private repository: IDashboardRepository) {}

  /**
   * Get dashboard metrics
   */
  async getMetrics(): Promise<DashboardMetricDTO[]> {
    return this.repository.getMetrics();
  }

  /**
   * Get enterprise dashboard overview
   */
  async getOverview(
    window: "24h" | "7d" | "30d" = "7d"
  ): Promise<DashboardOverviewDTO> {
    return this.repository.getOverview(window);
  }

  /**
   * Get active alerts
   */
  async getAlerts(limit?: number): Promise<AlertDTO[]> {
    return this.repository.getAlerts(limit);
  }

  /**
   * Get recent activities
   */
  async getActivities(limit?: number): Promise<ActivityDTO[]> {
    return this.repository.getActivities(limit);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(id: string): Promise<void> {
    return this.repository.acknowledgeAlert(id);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(id: string): Promise<void> {
    return this.repository.resolveAlert(id);
  }

  /**
   * Get paginated alerts with filters
   */
  async getAlertsPaginated(
    params: AlertSearchParams
  ): Promise<PaginatedResponse<AlertDTO>> {
    return this.repository.getAlertsPaginated(params);
  }

  /**
   * Get paginated activities with filters
   */
  async getActivitiesPaginated(
    params: ActivitySearchParams
  ): Promise<PaginatedResponse<ActivityDTO>> {
    return this.repository.getActivitiesPaginated(params);
  }
}
