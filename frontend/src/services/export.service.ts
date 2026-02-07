// Export Service
// Acts as a proxy layer between components and repositories

import type { IExportRepository } from "@/repositories";
import type { ExportJobDTO, ExportConfigDTO, ResourceCountDTO } from "@/types";

export class ExportService {
  constructor(private repository: IExportRepository) {}

  async getJobs(): Promise<ExportJobDTO[]> {
    return this.repository.getJobs();
  }

  async getJob(id: string): Promise<ExportJobDTO> {
    return this.repository.getJob(id);
  }

  async createJob(config: ExportConfigDTO): Promise<ExportJobDTO> {
    return this.repository.createJob(config);
  }

  async cancelJob(id: string): Promise<void> {
    return this.repository.cancelJob(id);
  }

  async deleteJob(id: string): Promise<void> {
    return this.repository.deleteJob(id);
  }

  async retryJob(id: string): Promise<ExportJobDTO> {
    return this.repository.retryJob(id);
  }

  onJobProgress(
    jobId: string,
    callback: (job: ExportJobDTO) => void
  ): () => void {
    return this.repository.onJobProgress(jobId, callback);
  }

  async getResourceCounts(): Promise<ResourceCountDTO[]> {
    return this.repository.getResourceCounts();
  }

  async downloadExport(id: string): Promise<Blob> {
    return this.repository.downloadExport(id);
  }
}
