"use client";

// Hook for fetching patient list with search/filter/pagination

import { useState, useEffect, useCallback, useRef } from "react";
import { usePatientService } from "@/services";
import type {
  PatientListDTO,
  PatientSearchParams,
  PaginatedResponse,
} from "@/types";

export interface UsePatientsOptions extends PatientSearchParams {
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;
}

export interface UsePatientsResult {
  data: PatientListDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePatients(
  options: UsePatientsOptions = {}
): UsePatientsResult {
  const { immediate = true, ...searchParams } = options;
  const patientService = usePatientService();
  const searchParamsKey = JSON.stringify(searchParams);

  const [data, setData] = useState<PaginatedResponse<PatientListDTO>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  // Prevent duplicate fetches (React Strict Mode)
  const fetchingRef = useRef(false);
  const lastFetchedParamsRef = useRef<string | null>(null);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const fetchPatients = useCallback(
    async (force = false) => {
      // Prevent duplicate fetches unless forced or params changed
      if (
        !force &&
        (fetchingRef.current ||
          lastFetchedParamsRef.current === searchParamsKey)
      ) {
        return;
      }

      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await patientService.getPatients(
          searchParamsRef.current
        );
        setData(result);
        lastFetchedParamsRef.current = searchParamsKey;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch patients")
        );
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [patientService, searchParamsKey]
  );

  useEffect(() => {
    if (immediate) {
      fetchPatients();
    }
  }, [fetchPatients, immediate]);

  return {
    data: data.data,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    totalPages: data.totalPages,
    loading,
    error,
    refetch: () => fetchPatients(true),
  };
}
