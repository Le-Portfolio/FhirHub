"use client";

// Hook for fetching patient medications

import { useState, useEffect, useCallback, useRef } from "react";
import { usePatientService } from "@/services";
import type { MedicationDTO } from "@/types";

export interface UseMedicationsOptions {
  /**
   * Whether to include discontinued medications
   * @default false
   */
  includeDiscontinued?: boolean;
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;
}

export interface UseMedicationsResult {
  medications: MedicationDTO[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useMedications(
  patientId: string,
  options: UseMedicationsOptions = {}
): UseMedicationsResult {
  const { includeDiscontinued = false, immediate = true } = options;
  const patientService = usePatientService();

  const [medications, setMedications] = useState<MedicationDTO[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  // Prevent duplicate fetches (React Strict Mode)
  const fetchingRef = useRef(false);
  const lastFetchedKeyRef = useRef<string | null>(null);

  const fetchKey = `${patientId}-${includeDiscontinued}`;

  const fetchMedications = useCallback(
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
        const result = await patientService.getMedications(
          patientId,
          includeDiscontinued
        );
        setMedications(result);
        lastFetchedKeyRef.current = fetchKey;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch medications")
        );
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [patientService, patientId, includeDiscontinued, fetchKey]
  );

  useEffect(() => {
    if (immediate && patientId) {
      fetchMedications();
    }
  }, [fetchMedications, immediate, patientId]);

  return {
    medications,
    loading,
    error,
    refetch: () => fetchMedications(true),
  };
}
