"use client";

// Hook for managing export jobs

import { useState, useEffect, useCallback } from "react";
import { useExportService } from "@/services";
import type { ExportJobDTO, ExportConfigDTO } from "@/types";

export interface UseExportJobsOptions {
  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;
}

export interface UseExportJobsResult {
  jobs: ExportJobDTO[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createJob: (config: ExportConfigDTO) => Promise<ExportJobDTO>;
  retryJob: (id: string) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  cancelJob: (id: string) => Promise<void>;
  downloadJob: (id: string) => Promise<void>;
}

export function useExportJobs(
  options: UseExportJobsOptions = {}
): UseExportJobsResult {
  const { immediate = true } = options;
  const exportService = useExportService();

  const [jobs, setJobs] = useState<ExportJobDTO[]>([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await exportService.getJobs();
      setJobs(result);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch export jobs")
      );
    } finally {
      setLoading(false);
    }
  }, [exportService]);

  const createJob = useCallback(
    async (config: ExportConfigDTO): Promise<ExportJobDTO> => {
      const newJob = await exportService.createJob(config);

      // Add the new job to the list
      setJobs((prev) => [newJob, ...prev]);

      // Subscribe to progress updates
      const unsubscribe = exportService.onJobProgress(
        newJob.id,
        (updatedJob) => {
          setJobs((prev) =>
            prev.map((job) => (job.id === updatedJob.id ? updatedJob : job))
          );
        }
      );

      // Clean up subscription when job is complete or failed
      const checkComplete = () => {
        const job = jobs.find((j) => j.id === newJob.id);
        if (job && (job.status === "completed" || job.status === "failed")) {
          unsubscribe();
        }
      };

      // Check periodically (the subscription will also update)
      const interval = setInterval(checkComplete, 1000);
      setTimeout(() => {
        clearInterval(interval);
        unsubscribe();
      }, 60000); // Max 1 minute

      return newJob;
    },
    [exportService, jobs]
  );

  const retryJob = useCallback(
    async (id: string): Promise<void> => {
      const updatedJob = await exportService.retryJob(id);
      setJobs((prev) => prev.map((job) => (job.id === id ? updatedJob : job)));

      // Subscribe to progress updates
      const unsubscribe = exportService.onJobProgress(id, (job) => {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
      });

      // Clean up after completion
      setTimeout(() => unsubscribe(), 60000);
    },
    [exportService]
  );

  const deleteJob = useCallback(
    async (id: string): Promise<void> => {
      await exportService.deleteJob(id);
      setJobs((prev) => prev.filter((job) => job.id !== id));
    },
    [exportService]
  );

  const cancelJob = useCallback(
    async (id: string): Promise<void> => {
      await exportService.cancelJob(id);
      setJobs((prev) =>
        prev.map((job) =>
          job.id === id ? { ...job, status: "cancelled" as const } : job
        )
      );
    },
    [exportService]
  );

  const downloadJob = useCallback(
    async (id: string): Promise<void> => {
      const blob = await exportService.downloadExport(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        blob.type === "application/x-ndjson" ? "export.ndjson" : "export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [exportService]
  );

  useEffect(() => {
    if (immediate) {
      fetchJobs();
    }
  }, [fetchJobs, immediate]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
    createJob,
    retryJob,
    deleteJob,
    cancelJob,
    downloadJob,
  };
}
