"use client";

// Hook for fetching patient timeline events

import { useState, useEffect, useCallback, useRef } from "react";
import { usePatientService } from "@/services";
import type { TimelineEventDTO } from "@/types";

export interface UseTimelineOptions {
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;
}

export interface UseTimelineResult {
  events: TimelineEventDTO[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTimeline(
  patientId: string,
  options: UseTimelineOptions = {}
): UseTimelineResult {
  const { immediate = true } = options;
  const patientService = usePatientService();

  const [events, setEvents] = useState<TimelineEventDTO[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  // Prevent duplicate fetches (React Strict Mode)
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const fetchTimeline = useCallback(
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
        const result = await patientService.getTimeline(patientId);
        setEvents(result);
        hasFetchedRef.current = true;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch timeline")
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
      fetchTimeline();
    }
  }, [fetchTimeline, immediate, patientId]);

  // Reset fetch state when patientId changes
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [patientId]);

  return {
    events,
    loading,
    error,
    refetch: () => fetchTimeline(true),
  };
}
