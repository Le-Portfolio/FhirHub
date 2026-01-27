"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDashboardService } from "@/services";
import type { ActivityDTO, ActivitySearchParams } from "@/types";

export interface UseAllActivitiesOptions extends ActivitySearchParams {
  immediate?: boolean;
}

export interface UseAllActivitiesResult {
  data: ActivityDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAllActivities(
  options: UseAllActivitiesOptions = {}
): UseAllActivitiesResult {
  const { immediate = true, ...searchParams } = options;
  const dashboardService = useDashboardService();
  const searchParamsKey = JSON.stringify(searchParams);

  const [data, setData] = useState<ActivityDTO[]>([]);
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
        const result = await dashboardService.getActivitiesPaginated(paramsRef.current);
        setData(result.data);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
        setTotalPages(result.totalPages);
        lastFetchedRef.current = searchParamsKey;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch activities"));
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [dashboardService, searchParamsKey]
  );

  useEffect(() => {
    if (immediate) fetchData();
  }, [fetchData, immediate]);

  return { data, total, page, pageSize, totalPages, loading, error, refetch: () => fetchData(true) };
}
