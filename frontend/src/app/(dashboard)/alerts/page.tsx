"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import { Pagination } from "@/components/common/data-table";
import { Bell, Search, AlertTriangle, RefreshCw, CheckCircle, Check } from "@/components/ui/icons";
import { useAllAlerts } from "@/hooks";
import { useToast } from "@/components/ui/toast";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const priorityColors: Record<string, string> = {
  critical: "badge-error",
  high: "badge-warning",
  medium: "badge-info",
  low: "badge-ghost",
};

const statusColors: Record<string, string> = {
  active: "badge-error",
  acknowledged: "badge-warning",
  resolved: "badge-success",
};

export default function AlertsPage() {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const { success: showSuccess, error: showError } = useToast();

  const {
    data: alerts, total, totalPages, loading, error, refetch,
    acknowledgeAlert, resolveAlert,
  } = useAllAlerts({
    patientName: query || undefined,
    priority: priority || undefined,
    status: status || undefined,
    page: currentPage,
    pageSize,
  });

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setCurrentPage(1);
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      showSuccess("Alert acknowledged");
    } catch {
      showError("Failed to acknowledge alert");
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert(id);
      showSuccess("Alert resolved");
    } catch {
      showError("Failed to resolve alert");
    }
  };

  if (error && !loading) {
    return (
      <PageContainer>
        <PageHeader title="Alerts" description="All system alerts" icon={Bell} />
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-12 h-12 text-error mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load alerts</h3>
          <p className="text-base-content/60 mb-4">{error.message}</p>
          <button onClick={() => refetch()} className="btn btn-primary gap-2">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Alerts" description="All system alerts and notifications" icon={Bell} />

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Search by patient name..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setCurrentPage(1); }}
          className="select select-bordered"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }}
          className="select select-bordered"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alerts list */}
      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        {loading && alerts.length === 0 ? (
          <TableSkeleton rows={8} columns={6} />
        ) : alerts.length === 0 ? (
          <EmptyState title="No alerts" description="No alerts match your search criteria" />
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge badge-sm ${priorityColors[alert.priority] || "badge-ghost"}`}>
                          {alert.priority}
                        </span>
                        <span className={`badge badge-sm ${statusColors[alert.status] || "badge-ghost"}`}>
                          {alert.status}
                        </span>
                      </div>
                      <h3 className="font-semibold">{alert.title}</h3>
                      {alert.description && (
                        <p className="text-sm text-base-content/60 mt-1">{alert.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-base-content/50">
                        {alert.patientName && (
                          <span>
                            Patient:{" "}
                            {alert.patientId ? (
                              <Link href={`/patients/${alert.patientId}`} className="link link-primary">
                                {alert.patientName}
                              </Link>
                            ) : alert.patientName}
                          </span>
                        )}
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    {alert.status === "active" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="btn btn-ghost btn-sm gap-1"
                          title="Acknowledge"
                        >
                          <Check className="w-4 h-4" /> Ack
                        </button>
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="btn btn-ghost btn-sm gap-1 text-success"
                          title="Resolve"
                        >
                          <CheckCircle className="w-4 h-4" /> Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
