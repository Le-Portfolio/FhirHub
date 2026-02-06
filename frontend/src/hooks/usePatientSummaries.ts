"use client";

// Hook for fetching patient summaries for dashboard/quick lists

import { useState, useEffect, useCallback } from "react";
import { usePatientService } from "@/services";
import type { PatientSummaryDTO } from "@/types";

export interface UsePatientSummariesOptions {
  /**
   * Maximum number of summaries to fetch
   * @default 5
   */
  limit?: number;
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;
}

export interface UsePatientSummariesResult {
  patients: PatientSummaryDTO[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePatientSummaries(
  options: UsePatientSummariesOptions = {}
): UsePatientSummariesResult {
  const { limit = 5, immediate = true } = options;
  const patientService = usePatientService();

  const [patients, setPatients] = useState<PatientSummaryDTO[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await patientService.getPatientSummaries(limit);
      setPatients(result);
    } catch {
      // Don't block the dashboard — component handles empty state gracefully
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [patientService, limit]);

  useEffect(() => {
    if (immediate) {
      fetchSummaries();
    }
  }, [fetchSummaries, immediate]);

  return {
    patients,
    loading,
    error,
    refetch: fetchSummaries,
  };
}
