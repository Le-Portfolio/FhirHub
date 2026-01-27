"use client";

// Hook for fetching a single patient's details

import { useState, useEffect, useCallback, useRef } from "react";
import { usePatientService } from "@/services";
import type { PatientDetailDTO } from "@/types";

export interface UsePatientOptions {
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;
}

export interface UsePatientResult {
  data: PatientDetailDTO | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePatient(
  id: string,
  options: UsePatientOptions = {}
): UsePatientResult {
  const { immediate = true } = options;
  const patientService = usePatientService();

  const [data, setData] = useState<PatientDetailDTO | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  // Prevent duplicate fetches (React Strict Mode)
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const fetchPatient = useCallback(
    async (force = false) => {
      if (!id) {
        setError(new Error("Patient ID is required"));
        return;
      }

      // Prevent duplicate fetches unless forced (manual refetch)
      if (!force && (fetchingRef.current || hasFetchedRef.current)) {
        return;
      }

      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await patientService.getPatient(id);
        setData(result);
        hasFetchedRef.current = true;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch patient")
        );
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [patientService, id]
  );

  useEffect(() => {
    if (immediate && id) {
      fetchPatient();
    }
  }, [fetchPatient, immediate, id]);

  // Reset fetch state when id changes
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [id]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchPatient(true),
  };
}
