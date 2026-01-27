// Export Service
// Acts as a proxy layer between components and repositories

import type { IExportRepository } from "@/repositories";
import type { ExportJobDTO, ExportConfigDTO } from "@/types";

export class ExportService {
  constructor(private repository: IExportRepository) {}

  /**
   * Get all export jobs
   */
  async getJobs(): Promise<ExportJobDTO[]> {
    return this.repository.getJobs();
  }

  /**
   * Get a specific export job by ID
   */
  async getJob(id: string): Promise<ExportJobDTO> {
    return this.repository.getJob(id);
  }

  /**
   * Create a new export job
   */
  async createJob(config: ExportConfigDTO): Promise<ExportJobDTO> {
    return this.repository.createJob(config);
  }

  /**
   * Cancel an export job
   */
  async cancelJob(id: string): Promise<void> {
    return this.repository.cancelJob(id);
  }

  /**
   * Delete an export job
   */
  async deleteJob(id: string): Promise<void> {
    return this.repository.deleteJob(id);
  }

  /**
   * Retry a failed export job
   */
  async retryJob(id: string): Promise<ExportJobDTO> {
    return this.repository.retryJob(id);
  }

  /**
   * Subscribe to job progress updates
   * @returns Unsubscribe function
   */
  onJobProgress(
    jobId: string,
    callback: (job: ExportJobDTO) => void
  ): () => void {
    return this.repository.onJobProgress(jobId, callback);
  }
}
