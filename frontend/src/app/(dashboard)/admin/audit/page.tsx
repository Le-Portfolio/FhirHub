"use client";

import { useState, useEffect, useCallback } from "react";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import { RefreshCw } from "@/components/ui/icons";
import { useUserManagementService } from "@/services";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { getDemoUserEvents, getDemoAdminEvents } from "@/lib/demo-data";
import { TabNav } from "@/components/ui/tab-nav";
import { SearchInput } from "@/components/forms/search-input";
import { FilterBar } from "@/components/forms/filter-bar";
import { Pagination } from "@/components/common/data-table";

type TabType = "user" | "admin";

const auditTabs: { id: TabType; label: string }[] = [
  { id: "user", label: "User Events" },
  { id: "admin", label: "Admin Events" },
];

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
      <div className="animate-fade-in-up">
        <TabNav
          tabs={auditTabs}
          activeTab={tab}
          onTabChange={(t) => { setTab(t); setPage(1); }}
          variant="boxed"
          className="mb-6"
        />
      </div>

      {/* Filters */}
      {tab === "user" && (
        <FilterBar className="animate-fade-in-up">
          <SearchInput
            value={userIdFilter}
            onChange={(v) => { setUserIdFilter(v); setPage(1); }}
            placeholder="Filter by user ID..."
            size="sm"
            className="w-64"
          />
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
        </FilterBar>
      )}

      <AuditLogTable events={events} loading={loading} tab={tab} />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={events.length < pageSize ? page : page + 1}
        totalItems={0}
        pageSize={pageSize}
        onPageChange={setPage}
        className="mt-6"
      />
    </PageContainer>
  );
}
