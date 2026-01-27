"use client";

// Hook for fetching patient conditions

import { useState, useEffect, useCallback, useRef } from "react";
import { usePatientService } from "@/services";
import type { ConditionDTO } from "@/types";

export interface UseConditionsOptions {
  /**
   * Whether to include resolved conditions
   * @default false
   */
  includeResolved?: boolean;
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;
}

export interface UseConditionsResult {
  conditions: ConditionDTO[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useConditions(
  patientId: string,
  options: UseConditionsOptions = {}
): UseConditionsResult {
  const { includeResolved = false, immediate = true } = options;
  const patientService = usePatientService();

  const [conditions, setConditions] = useState<ConditionDTO[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  // Prevent duplicate fetches (React Strict Mode)
  const fetchingRef = useRef(false);
  const lastFetchedKeyRef = useRef<string | null>(null);

  const fetchKey = `${patientId}-${includeResolved}`;

  const fetchConditions = useCallback(
    async (force = false) => {
      if (!patientId) {
        setError(new Error("Patient ID is required"));
        return;
      }

      if (
        !force &&
        (fetchingRef.current || lastFetchedKeyRef.current === fetchKey)
      ) {
        return;
      }

      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await patientService.getConditions(
          patientId,
          includeResolved
        );
        setConditions(result);
        lastFetchedKeyRef.current = fetchKey;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch conditions")
        );
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [patientService, patientId, includeResolved, fetchKey]
  );

  useEffect(() => {
    if (immediate && patientId) {
      fetchConditions();
    }
  }, [fetchConditions, immediate, patientId]);

  return {
    conditions,
    loading,
    error,
    refetch: () => fetchConditions(true),
  };
}
