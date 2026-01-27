"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUserManagementService } from "@/services";
import type { KeycloakUserDTO } from "@/types/dto/user-management.dto";

export interface UseUserOptions {
  immediate?: boolean;
}

export interface UseUserResult {
  data: KeycloakUserDTO | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUser(
  userId: string | null,
  options: UseUserOptions = {}
): UseUserResult {
  const { immediate = true } = options;
  const service = useUserManagementService();

  const [data, setData] = useState<KeycloakUserDTO | null>(null);
  const [loading, setLoading] = useState(!!userId && immediate);
  const [error, setError] = useState<Error | null>(null);
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const fetchUser = useCallback(
    async (force = false) => {
      if (!userId) return;
      if (!force && (fetchingRef.current || hasFetchedRef.current)) return;

      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await service.getUserById(userId);
        setData(result);
        hasFetchedRef.current = true;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch user")
        );
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [userId, service]
  );

  useEffect(() => {
    if (userId && immediate) {
      hasFetchedRef.current = false;
      fetchUser();
    }
  }, [userId, fetchUser, immediate]);

  useEffect(() => {
    if (!userId) {
      setData(null);
      setError(null);
      hasFetchedRef.current = false;
    }
  }, [userId]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchUser(true),
  };
}
