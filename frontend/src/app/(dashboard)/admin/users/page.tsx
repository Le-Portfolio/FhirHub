"use client";

import { useState, useCallback } from "react";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import { UserPlus, Search, RefreshCw } from "@/components/ui/icons";
import { useUsers } from "@/hooks/useUsers";
import { UserTable } from "@/components/admin/user-table";
import { InviteUserModal } from "@/components/admin/invite-user-modal";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const pageSize = 20;

  const {
    data: users,
    total,
    totalPages,
    loading,
    error,
    refetch,
  } = useUsers({
    search: search || undefined,
    page: currentPage,
    pageSize,
  });

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setCurrentPage(1);
    },
    []
  );

  const handleInviteSuccess = useCallback(() => {
    setShowInviteModal(false);
    refetch();
  }, [refetch]);

  return (
    <PageContainer>
      <PageHeader
        title="User Management"
        description="Manage system users, roles, and access"
        actions={
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn btn-primary btn-sm gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input input-bordered input-sm w-full pl-10"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="btn btn-ghost btn-sm btn-square"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error.message}</span>
          <button onClick={() => refetch()} className="btn btn-sm">
            Retry
          </button>
        </div>
      )}

      {/* User table */}
      <UserTable
        users={users}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={setCurrentPage}
        onRefresh={refetch}
      />

      {/* Invite modal */}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </PageContainer>
  );
}
