// Service Factory
// Creates service instances with API repository implementations

import {
  PatientRepository,
  ExportRepository,
  DashboardRepository,
  UserManagementRepository,
} from "@/repositories/api";
import { createApiClient, API_BASE_URL } from "@/lib/api-client";
import { PatientService } from "./patient.service";
import { ExportService } from "./export.service";
import { DashboardService } from "./dashboard.service";
import { UserManagementService } from "./user-management.service";

export interface ServiceConfig {
  /**
   * Base URL for API calls
   */
  baseUrl?: string;
  /**
   * Function to get the current access token for authenticated API calls
   */
  getAccessToken?: () => string | null;
}

export interface Services {
  patientService: PatientService;
  exportService: ExportService;
  dashboardService: DashboardService;
  userManagementService: UserManagementService;
}

/**
 * Creates all service instances with API repository implementations
 */
export function createServices(config?: ServiceConfig): Services {
  const apiClient = createApiClient(
    config?.baseUrl || API_BASE_URL,
    config?.getAccessToken
  );

  return {
    patientService: new PatientService(new PatientRepository(apiClient)),
    exportService: new ExportService(new ExportRepository(apiClient)),
    dashboardService: new DashboardService(new DashboardRepository(apiClient)),
    userManagementService: new UserManagementService(new UserManagementRepository(apiClient)),
  };
}

// Singleton instance for non-context usage
let servicesInstance: Services | null = null;

/**
 * Get or create the singleton services instance
 */
export function getServices(config?: ServiceConfig): Services {
  if (!servicesInstance) {
    servicesInstance = createServices(config);
  }
  return servicesInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetServices(): void {
  servicesInstance = null;
}
