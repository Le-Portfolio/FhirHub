// API Export Repository Implementation
// Manages export jobs through FhirHubServer backend

import type { IExportRepository } from "../interfaces";
import type { ExportJobDTO, ExportConfigDTO } from "@/types";
import type { ApiClient } from "@/lib/api-client";

export class ExportRepository implements IExportRepository {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(private readonly apiClient: ApiClient) {}

  async getJobs(): Promise<ExportJobDTO[]> {
    return this.apiClient.get<ExportJobDTO[]>("/api/exports");
  }

  async getJob(id: string): Promise<ExportJobDTO> {
    return this.apiClient.get<ExportJobDTO>(`/api/exports/${id}`);
  }

  async createJob(config: ExportConfigDTO): Promise<ExportJobDTO> {
    return this.apiClient.post<ExportJobDTO>("/api/exports", config);
  }

  async cancelJob(id: string): Promise<void> {
    await this.apiClient.post<void>(`/api/exports/${id}/cancel`);
  }

  async deleteJob(id: string): Promise<void> {
    await this.apiClient.delete(`/api/exports/${id}`);
  }

  async retryJob(id: string): Promise<ExportJobDTO> {
    return this.apiClient.post<ExportJobDTO>(`/api/exports/${id}/retry`);
  }

  onJobProgress(
    jobId: string,
    callback: (job: ExportJobDTO) => void
  ): () => void {
    // Use polling for job progress updates
    // In the future, this could be replaced with WebSocket or Server-Sent Events
    const pollInterval = 2000; // Poll every 2 seconds

    const poll = async () => {
      try {
        const job = await this.getJob(jobId);
        callback(job);

        // Stop polling if job is in a terminal state
        if (
          job.status === "completed" ||
          job.status === "failed" ||
          job.status === "cancelled"
        ) {
          this.stopPolling(jobId);
        }
      } catch (error) {
        // Stop polling on error
        console.error(`Error polling export job ${jobId}:`, error);
        this.stopPolling(jobId);
      }
    };

    // Start polling
    poll(); // Initial poll
    const intervalId = setInterval(poll, pollInterval);
    this.pollingIntervals.set(jobId, intervalId);

    // Return unsubscribe function
    return () => {
      this.stopPolling(jobId);
    };
  }

  private stopPolling(jobId: string): void {
    const intervalId = this.pollingIntervals.get(jobId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(jobId);
    }
  }
}
