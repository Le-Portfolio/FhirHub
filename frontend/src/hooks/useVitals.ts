"use client";

// Hook for fetching patient vitals

import { useState, useEffect, useCallback, useRef } from "react";
import { usePatientService } from "@/services";
import type { VitalSignDTO, VitalChartDataDTO } from "@/types";

export interface UseVitalsOptions {
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;
}

export interface UseVitalsResult {
  vitals: VitalSignDTO[];
  chartData: VitalChartDataDTO[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVitals(
  patientId: string,
  options: UseVitalsOptions = {}
): UseVitalsResult {
  const { immediate = true } = options;
  const patientService = usePatientService();

  const [vitals, setVitals] = useState<VitalSignDTO[]>([]);
  const [chartData, setChartData] = useState<VitalChartDataDTO[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  // Prevent duplicate fetches (React Strict Mode)
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const fetchVitals = useCallback(
    async (force = false) => {
      if (!patientId) {
        setError(new Error("Patient ID is required"));
        return;
      }

      if (!force && (fetchingRef.current || hasFetchedRef.current)) {
        return;
      }

      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const [vitalsResult, chartResult] = await Promise.all([
          patientService.getVitals(patientId),
          patientService.getVitalsChart(patientId),
        ]);
        setVitals(vitalsResult);
        setChartData(chartResult);
        hasFetchedRef.current = true;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch vitals")
        );
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [patientService, patientId]
  );

  useEffect(() => {
    if (immediate && patientId) {
      fetchVitals();
    }
  }, [fetchVitals, immediate, patientId]);

  // Reset fetch state when patientId changes
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [patientId]);

  return {
    vitals,
    chartData,
    loading,
    error,
    refetch: () => fetchVitals(true),
  };
}
