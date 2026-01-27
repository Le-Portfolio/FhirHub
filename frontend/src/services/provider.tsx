"use client";

// Service Provider
// React context for providing services to components

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { createServices, type Services, type ServiceConfig } from "./factory";
import { useAuth } from "@/providers/auth-provider";

// Create context with undefined as default (will be set by provider)
const ServiceContext = createContext<Services | undefined>(undefined);

export interface ServiceProviderProps {
  children: ReactNode;
  /**
   * Base URL for API calls (defaults to NEXT_PUBLIC_API_BASE_URL)
   */
  baseUrl?: string;
}

/**
 * Provides services to the component tree
 */
export function ServiceProvider({ children, baseUrl }: ServiceProviderProps) {
  const { token } = useAuth();
  const getAccessToken = useCallback(() => token, [token]);

  const services = useMemo(() => {
    const config: ServiceConfig = {
      baseUrl,
      getAccessToken,
    };
    return createServices(config);
  }, [baseUrl, getAccessToken]);

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
}

/**
 * Hook to access services from context
 * @throws Error if used outside of ServiceProvider
 */
export function useServices(): Services {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return services;
}

/**
 * Hook to access the patient service
 */
export function usePatientService() {
  const { patientService } = useServices();
  return patientService;
}

/**
 * Hook to access the export service
 */
export function useExportService() {
  const { exportService } = useServices();
  return exportService;
}

/**
 * Hook to access the dashboard service
 */
export function useDashboardService() {
  const { dashboardService } = useServices();
  return dashboardService;
}

/**
 * Hook to access the user management service
 */
export function useUserManagementService() {
  const { userManagementService } = useServices();
  return userManagementService;
}
