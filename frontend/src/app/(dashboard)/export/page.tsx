"use client";

import { useState, useEffect, useCallback } from "react";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  ExportWizard,
  type ExportConfig,
} from "@/components/export/export-wizard";
import { ExportJobList } from "@/components/export/export-job-list";
import {
  Plus,
  FileArchive,
  AlertTriangle,
  RefreshCw,
} from "@/components/ui/icons";
import { useExportJobs } from "@/hooks";
import { useExportService } from "@/services";
import { Skeleton, ListItemSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { ExportConfigDTO } from "@/types";

export default function ExportPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [resourceCounts, setResourceCounts] = useState<
    Record<string, number> | undefined
  >(undefined);

  const exportService = useExportService();

  const {
    jobs,
    loading,
    error,
    refetch,
    createJob,
    retryJob,
    deleteJob,
    downloadJob,
  } = useExportJobs();

  const fetchResourceCounts = useCallback(async () => {
    try {
      const counts = await exportService.getResourceCounts();
      const map: Record<string, number> = {};
      for (const c of counts) {
        map[c.resourceType] = c.count;
      }
      setResourceCounts(map);
    } catch {
      // Counts are non-critical; wizard will show "—" if unavailable
    }
  }, [exportService]);

  useEffect(() => {
    if (showWizard && resourceCounts === undefined) {
      fetchResourceCounts();
    }
  }, [showWizard, resourceCounts, fetchResourceCounts]);

  const handleExportComplete = async (config: ExportConfig) => {
    const exportConfig: ExportConfigDTO = {
      resourceTypes: config.resourceTypes,
      format: config.format,
      includeReferences: config.includeReferences,
      dateRange: config.dateRange ?? undefined,
    };

    await createJob(exportConfig);
    setShowWizard(false);
  };

  const handleDownload = async (job: { id: string }) => {
    await downloadJob(job.id);
  };

  const handleRetry = async (job: { id: string }) => {
    await retryJob(job.id);
  };

  const handleDelete = async (job: { id: string }) => {
    await deleteJob(job.id);
  };

  // Error state
  if (error && !loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Bulk Data Export"
          description="Export FHIR resources in bulk for analysis or backup"
          icon={FileArchive}
        />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-error mb-4">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Failed to load export jobs
          </h3>
          <p className="text-base-content/60 mb-4">{error.message}</p>
          <button onClick={() => refetch()} className="btn btn-primary gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </PageContainer>
    );
  }

  // Loading state
  if (loading && jobs.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Bulk Data Export"
          description="Export FHIR resources in bulk for analysis or backup"
          icon={FileArchive}
          actions={
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Export
            </Button>
          }
        />
        <div className="space-y-8">
          <section>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ListItemSkeleton key={i} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Bulk Data Export"
        description="Export FHIR resources in bulk for analysis or backup"
        icon={FileArchive}
        actions={
          !showWizard && (
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Export
            </Button>
          )
        }
      />

      <div className="space-y-8">
        {/* Export Wizard */}
        {showWizard && (
          <ExportWizard
            onComplete={handleExportComplete}
            onCancel={() => setShowWizard(false)}
            resourceCounts={resourceCounts}
          />
        )}

        {/* Export Jobs */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Export History</h2>
          {jobs.length === 0 ? (
            <EmptyState
              title="No exports yet"
              description="Create your first bulk data export to get started"
              action={
                <Button onClick={() => setShowWizard(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Export
                </Button>
              }
            />
          ) : (
            <div className={loading ? "opacity-50 pointer-events-none" : ""}>
              <ExportJobList
                jobs={jobs}
                onDownload={handleDownload}
                onRetry={handleRetry}
                onDelete={handleDelete}
              />
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
