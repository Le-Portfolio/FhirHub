"use client";

import { useState, useCallback } from "react";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import { Pagination } from "@/components/common/data-table";
import { History } from "@/components/ui/icons";
import { useAllActivities } from "@/hooks";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { FilterBar } from "@/components/forms/filter-bar";

const typeIcons: Record<string, string> = {
  create: "bg-success/10 text-success",
  update: "bg-info/10 text-info",
  view: "bg-primary/10 text-primary",
  delete: "bg-error/10 text-error",
  export: "bg-warning/10 text-warning",
};

export default function ActivityPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data: activities, total, totalPages, loading, error, refetch } =
    useAllActivities({
      type: typeFilter || undefined,
      resourceType: resourceTypeFilter || undefined,
      page: currentPage,
      pageSize,
    });

  if (error && !loading) {
    return (
      <PageContainer>
        <PageHeader title="Activity" description="System activity log" icon={History} />
        <ErrorState
          title="Failed to load activities"
          message={error.message}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Activity" description="System activity log" icon={History} />

      {/* Filters */}
      <FilterBar className="animate-fade-in-up">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          className="select select-bordered"
        >
          <option value="">All Types</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="view">View</option>
          <option value="delete">Delete</option>
          <option value="export">Export</option>
        </select>
        <select
          value={resourceTypeFilter}
          onChange={(e) => { setResourceTypeFilter(e.target.value); setCurrentPage(1); }}
          className="select select-bordered"
        >
          <option value="">All Resources</option>
          <option value="Patient">Patient</option>
          <option value="Observation">Observation</option>
          <option value="Condition">Condition</option>
          <option value="MedicationRequest">MedicationRequest</option>
          <option value="Encounter">Encounter</option>
        </select>
      </FilterBar>

      {/* Activities */}
      <LoadingOverlay loading={loading}>
        {loading && activities.length === 0 ? (
          <TableSkeleton rows={8} columns={5} />
        ) : activities.length === 0 ? (
          <EmptyState title="No activity" description="No activity matches your filter criteria" />
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity.id} className="card bg-base-100 shadow-sm">
                <div className="card-body p-4 flex-row items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold uppercase ${typeIcons[activity.type] || "bg-base-200"}`}>
                    {activity.type.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.description}</p>
                    <div className="flex items-center gap-3 text-xs text-base-content/50 mt-1">
                      <span className="badge badge-ghost badge-sm">{activity.resourceType}</span>
                      <span>{activity.user}</span>
                      <span>{new Date(activity.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className={`badge badge-sm ${
                    activity.type === "create" ? "badge-success" :
                    activity.type === "update" ? "badge-info" :
                    activity.type === "delete" ? "badge-error" : "badge-ghost"
                  }`}>
                    {activity.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </LoadingOverlay>

      {total > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      )}
    </PageContainer>
  );
}
