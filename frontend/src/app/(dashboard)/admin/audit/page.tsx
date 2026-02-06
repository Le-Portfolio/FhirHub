"use client";

import { useState, useEffect, useCallback } from "react";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import { RefreshCw, Search } from "@/components/ui/icons";
import { useUserManagementService } from "@/services";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { getDemoUserEvents, getDemoAdminEvents } from "@/lib/demo-data";

type TabType = "user" | "admin";

export default function AuditPage() {
  const [tab, setTab] = useState<TabType>("user");
  const [events, setEvents] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const pageSize = 50;
  const service = useUserManagementService();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "user") {
        const data = await service.getAuditEvents({
          userId: userIdFilter || undefined,
          type: typeFilter || undefined,
          page,
          pageSize,
        });
        setEvents(data);
      } else {
        const data = await service.getAdminEvents({ page, pageSize });
        setEvents(data);
      }
    } catch {
      // Fall back to demo data for portfolio demo
      if (tab === "user") {
        setEvents(getDemoUserEvents());
      } else {
        setEvents(getDemoAdminEvents());
      }
    } finally {
      setLoading(false);
    }
  }, [tab, page, typeFilter, userIdFilter, pageSize, service]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <PageContainer>
      <PageHeader title="Audit Logs" description="View authentication and admin activity events" />

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6 w-fit">
        <button
          className={`tab ${tab === "user" ? "tab-active" : ""}`}
          onClick={() => { setTab("user"); setPage(1); }}
        >
          User Events
        </button>
        <button
          className={`tab ${tab === "admin" ? "tab-active" : ""}`}
          onClick={() => { setTab("admin"); setPage(1); }}
        >
          Admin Events
        </button>
      </div>

      {/* Filters */}
      {tab === "user" && (
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Filter by user ID..."
              value={userIdFilter}
              onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
              className="input input-bordered input-sm pl-10 w-64"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="select select-bordered select-sm"
          >
            <option value="">All Event Types</option>
            <option value="LOGIN">Login</option>
            <option value="LOGIN_ERROR">Login Error</option>
            <option value="LOGOUT">Logout</option>
            <option value="REGISTER">Register</option>
            <option value="UPDATE_PASSWORD">Password Update</option>
            <option value="VERIFY_EMAIL">Email Verification</option>
          </select>
          <button
            onClick={fetchEvents}
            className="btn btn-ghost btn-sm btn-square"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}

      <AuditLogTable events={events} loading={loading} tab={tab} />

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-6">
        <button
          className="btn btn-sm btn-outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span className="btn btn-sm btn-ghost">Page {page}</span>
        <button
          className="btn btn-sm btn-outline"
          disabled={events.length < pageSize}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </PageContainer>
  );
}
