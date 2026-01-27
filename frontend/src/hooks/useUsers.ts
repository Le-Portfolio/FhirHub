"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUserManagementService } from "@/services";
import type {
  KeycloakUserDTO,
  UserSearchParamsDTO,
  PaginatedUsersResponse,
} from "@/types/dto/user-management.dto";

export interface UseUsersOptions extends UserSearchParamsDTO {
  immediate?: boolean;
}

export interface UseUsersResult {
  data: KeycloakUserDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUsers(options: UseUsersOptions = {}): UseUsersResult {
  const { immediate = true, ...searchParams } = options;
  const service = useUserManagementService();
  const searchParamsKey = JSON.stringify(searchParams);

  const [data, setData] = useState<PaginatedUsersResponse>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const fetchingRef = useRef(false);
  const lastFetchedParamsRef = useRef<string | null>(null);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const fetchUsers = useCallback(
    async (force = false) => {
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
        const result = await service.getUsers(searchParamsRef.current);
        setData(result);
        lastFetchedParamsRef.current = searchParamsKey;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch users")
        );
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [service, searchParamsKey]
  );

  useEffect(() => {
    if (immediate) {
      fetchUsers();
    }
  }, [fetchUsers, immediate]);

  return {
    data: data.data,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    totalPages: data.totalPages,
    loading,
    error,
    refetch: () => fetchUsers(true),
  };
}
