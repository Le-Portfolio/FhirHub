"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePatientService } from "@/services";
import type { ObservationListDTO, ObservationSearchParams } from "@/types";

export interface UseAllObservationsOptions extends ObservationSearchParams {
  immediate?: boolean;
}

export interface UseAllObservationsResult {
  data: ObservationListDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAllObservations(
  options: UseAllObservationsOptions = {}
): UseAllObservationsResult {
  const { immediate = true, ...searchParams } = options;
  const patientService = usePatientService();
  const searchParamsKey = JSON.stringify(searchParams);

  const [data, setData] = useState<ObservationListDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const fetchingRef = useRef(false);
  const lastFetchedRef = useRef<string | null>(null);
  const paramsRef = useRef(searchParams);
  paramsRef.current = searchParams;

  const fetchData = useCallback(
    async (force = false) => {
      if (!force && (fetchingRef.current || lastFetchedRef.current === searchParamsKey)) return;

      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await patientService.getAllObservations(paramsRef.current);
        setData(result.data);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
        setTotalPages(result.totalPages);
        lastFetchedRef.current = searchParamsKey;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch observations"));
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [patientService, searchParamsKey]
  );

  useEffect(() => {
    if (immediate) fetchData();
  }, [fetchData, immediate]);

  return { data, total, page, pageSize, totalPages, loading, error, refetch: () => fetchData(true) };
}
