"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Clock,
  Check,
  AlertTriangle,
  Loader2,
  Trash2,
  RefreshCw,
  FileArchive,
} from "@/components/ui/icons";
import type { ExportJobDTO } from "@/types";

// Re-export for backwards compatibility
export type ExportJob = ExportJobDTO;

interface ExportJobListProps {
  jobs: ExportJob[];
  onDownload: (job: ExportJob) => void;
  onRetry: (job: ExportJob) => void;
  onDelete: (job: ExportJob) => void;
  className?: string;
}

export function ExportJobList({
  jobs,
  onDownload,
  onRetry,
  onDelete,
  className,
}: ExportJobListProps) {
  if (jobs.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <FileArchive className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
        <h3 className="text-lg font-medium text-base-content/70">
          No exports yet
        </h3>
        <p className="text-sm text-base-content/50 mt-1">
          Create a new export using the wizard above
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {jobs.map((job) => (
        <ExportJobCard
          key={job.id}
          job={job}
          onDownload={() => onDownload(job)}
          onRetry={() => onRetry(job)}
          onDelete={() => onDelete(job)}
        />
      ))}
    </div>
  );
}

interface ExportJobCardProps {
  job: ExportJob;
  onDownload: () => void;
  onRetry: () => void;
  onDelete: () => void;
}

export function ExportJobCard({
  job,
  onDownload,
  onRetry,
  onDelete,
}: ExportJobCardProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-base-content/50",
      bgColor: "bg-base-200",
      label: "Pending",
    },
    "in-progress": {
      icon: Loader2,
      color: "text-info",
      bgColor: "bg-info/10",
      label: "In Progress",
    },
    completed: {
      icon: Check,
      color: "text-success",
      bgColor: "bg-success/10",
      label: "Completed",
    },
    failed: {
      icon: AlertTriangle,
      color: "text-error",
      bgColor: "bg-error/10",
      label: "Failed",
    },
    cancelled: {
      icon: Clock,
      color: "text-base-content/50",
      bgColor: "bg-base-200",
      label: "Cancelled",
    },
  };

  const config = statusConfig[job.status];
  const StatusIcon = config.icon;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? "s" : ""} remaining`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <div className="bg-base-100 border border-base-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        {/* Status and info */}
        <div className="flex items-start gap-4">
          <div className={cn("p-2 rounded-lg", config.bgColor)}>
            <StatusIcon
              className={cn(
                "w-5 h-5",
                config.color,
                job.status === "in-progress" && "animate-spin"
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Export #{job.id.slice(0, 8)}</h4>
              <Badge
                variant={
                  job.status === "completed"
                    ? "success"
                    : job.status === "failed"
                      ? "critical"
                      : job.status === "in-progress"
                        ? "active"
                        : "ghost"
                }
                size="xs"
              >
                {config.label}
              </Badge>
            </div>

            {/* Resource types */}
            <div className="flex flex-wrap gap-1 mt-2">
              {job.resourceTypes.map((type) => (
                <span
                  key={type}
                  className="badge badge-sm badge-outline px-2.5"
                >
                  {type}
                </span>
              ))}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-base-content/60">
              <span>Created: {formatDate(job.createdAt)}</span>
              {job.completedAt && (
                <span>Completed: {formatDate(job.completedAt)}</span>
              )}
              {job.fileSize && <span>Size: {formatBytes(job.fileSize)}</span>}
              <span className="badge badge-sm px-2.5">
                {job.format.toUpperCase()}
              </span>
            </div>

            {/* Progress bar */}
            {job.status === "in-progress" && job.progress !== undefined && (
              <div className="mt-3 w-64">
                <div className="flex justify-between text-xs mb-1">
                  <span>Processing...</span>
                  <span>{job.progress}%</span>
                </div>
                <progress
                  className="progress progress-info w-full"
                  value={job.progress}
                  max="100"
                />
              </div>
            )}

            {/* Error message */}
            {job.status === "failed" && job.error && (
              <div className="mt-2 text-sm text-error">{job.error}</div>
            )}

            {/* Expiration warning */}
            {job.status === "completed" && job.expiresAt && (
              <div className="mt-2 text-sm text-warning">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                {getTimeRemaining(job.expiresAt)}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {job.status === "completed" && (
            <Button size="sm" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          {job.status === "failed" && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
          {(job.status === "completed" || job.status === "failed") && (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
