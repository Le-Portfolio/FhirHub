/**
 * Export DTOs
 *
 * Data transfer objects for bulk data export functionality.
 */

/**
 * Export job status
 */
export type ExportStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Export format
 */
export type ExportFormat = "ndjson" | "json" | "csv";

/**
 * Export Job DTO
 */
export interface ExportJobDTO {
  id: string;
  status: ExportStatus;
  resourceTypes: string[];
  format: ExportFormat;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
  progress?: number;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  includeReferences?: boolean;
}

/**
 * Export Configuration DTO
 */
export interface ExportConfigDTO {
  resourceTypes: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  format: ExportFormat;
  includeReferences: boolean;
}
