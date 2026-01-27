"use client";

// Hook for fetching patient lab results

import { useState, useEffect, useCallback, useRef } from "react";
import { usePatientService } from "@/services";
import type { LabPanelDTO } from "@/types";

export interface UseLabResultsOptions {
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;
}

export interface UseLabResultsResult {
  panels: LabPanelDTO[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLabResults(
  patientId: string,
  options: UseLabResultsOptions = {}
): UseLabResultsResult {
  const { immediate = true } = options;
  const patientService = usePatientService();

  const [panels, setPanels] = useState<LabPanelDTO[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  // Prevent duplicate fetches (React Strict Mode)
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const fetchLabResults = useCallback(
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
        const result = await patientService.getLabPanels(patientId);
        setPanels(result);
        hasFetchedRef.current = true;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch lab results")
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
      fetchLabResults();
    }
  }, [fetchLabResults, immediate, patientId]);

  // Reset fetch state when patientId changes
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [patientId]);

  return {
    panels,
    loading,
    error,
    refetch: () => fetchLabResults(true),
  };
}
