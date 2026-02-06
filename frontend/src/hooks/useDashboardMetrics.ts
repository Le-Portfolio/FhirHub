"use client";

// Hook for fetching dashboard metrics, alerts, and activities

import { useState, useEffect, useCallback } from "react";
import { useDashboardService } from "@/services";
import type { DashboardMetricDTO, AlertDTO, ActivityDTO } from "@/types";

export interface UseDashboardOptions {
  /**
   * Number of alerts to fetch
   * @default 10
   */
  alertsLimit?: number;
  /**
   * Number of activities to fetch
   * @default 10
   */
  activitiesLimit?: number;
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;
}

export interface UseDashboardResult {
  metrics: DashboardMetricDTO[];
  alerts: AlertDTO[];
  activities: ActivityDTO[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
}

export function useDashboardMetrics(
  options: UseDashboardOptions = {}
): UseDashboardResult {
  const { alertsLimit = 10, activitiesLimit = 10, immediate = true } = options;
  const dashboardService = useDashboardService();

  const [metrics, setMetrics] = useState<DashboardMetricDTO[]>([]);
  const [alerts, setAlerts] = useState<AlertDTO[]>([]);
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [metricsResult, alertsResult, activitiesResult] =
      await Promise.allSettled([
        dashboardService.getMetrics(),
        dashboardService.getAlerts(alertsLimit),
        dashboardService.getActivities(activitiesLimit),
      ]);

    setMetrics(
      metricsResult.status === "fulfilled" ? metricsResult.value : []
    );
    setAlerts(
      alertsResult.status === "fulfilled" ? alertsResult.value : []
    );
    setActivities(
      activitiesResult.status === "fulfilled" ? activitiesResult.value : []
    );

    // Only set error if ALL requests failed
    const allFailed = [metricsResult, alertsResult, activitiesResult].every(
      (r) => r.status === "rejected"
    );
    if (allFailed) {
      const firstErr = (metricsResult as PromiseRejectedResult).reason;
      setError(
        firstErr instanceof Error
          ? firstErr
          : new Error("Failed to fetch dashboard data")
      );
    }

    setLoading(false);
  }, [dashboardService, alertsLimit, activitiesLimit]);

  const acknowledgeAlert = useCallback(
    async (id: string): Promise<void> => {
      await dashboardService.acknowledgeAlert(id);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === id
            ? { ...alert, status: "acknowledged" as const }
            : alert
        )
      );
    },
    [dashboardService]
  );

  const resolveAlert = useCallback(
    async (id: string): Promise<void> => {
      await dashboardService.resolveAlert(id);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === id ? { ...alert, status: "resolved" as const } : alert
        )
      );
    },
    [dashboardService]
  );

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  return {
    metrics,
    alerts,
    activities,
    loading,
    error,
    refetch: fetchData,
    acknowledgeAlert,
    resolveAlert,
  };
}
