"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import { Pagination } from "@/components/common/data-table";
import {
  PatientSearch,
  PatientFilters,
  PatientGrid,
  PatientTable,
  ViewToggle,
} from "@/components/patients";
import { UserPlus } from "@/components/ui/icons";
import { usePatients } from "@/hooks";
import {
  PatientListSkeleton,
  PatientCardSkeleton,
  TableSkeleton,
} from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

export default function PatientsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filters, setFilters] = useState<{
    query: string;
    searchField: "all" | "name" | "mrn" | "phone" | "email";
    birthDate?: string;
    gender?: string;
    hasAlerts?: boolean;
    hasActiveConditions?: boolean;
  }>({
    query: "",
    searchField: "all",
  });
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Use the patients hook with search params
  const {
    data: patients,
    total,
    totalPages,
    loading,
    error,
    refetch,
  } = usePatients({
    query: filters.query,
    searchField: filters.searchField,
    gender: filters.gender,
    hasAlerts: filters.hasAlerts,
    hasActiveConditions: filters.hasActiveConditions,
    page: currentPage,
    pageSize,
  });

  // Wrap setFilters to also reset to page 1
  const handleFiltersChange = useCallback(
    (
      newFilters: typeof filters | ((prev: typeof filters) => typeof filters)
    ) => {
      setFilters(newFilters);
      setCurrentPage(1);
    },
    []
  );

  // Error state
  if (error && !loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Patients"
          description="Manage and view patient records"
          actions={
            <Link href="/patients/new" className="btn btn-primary gap-2">
              <UserPlus className="w-4 h-4" />
              Add Patient
            </Link>
          }
        />
        <ErrorState
          title="Failed to load patients"
          message={error.message}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  // Loading state (initial load)
  if (loading && patients.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Patients"
          description="Manage and view patient records"
          actions={
            <Link href="/patients/new" className="btn btn-primary gap-2">
              <UserPlus className="w-4 h-4" />
              Add Patient
            </Link>
          }
        />
        <PatientListSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Patients"
        description="Manage and view patient records"
        actions={
          <Link href="/patients/new" className="btn btn-primary gap-2">
            <UserPlus className="w-4 h-4" />
            Add Patient
          </Link>
        }
      />

      {/* Search and filters */}
      <div className="space-y-4 mb-6 animate-fade-in-up">
        <PatientSearch
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
        <div className="flex items-center justify-between gap-4">
          <PatientFilters
            selectedFilters={quickFilters}
            onFiltersChange={setQuickFilters}
          />
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Loading overlay for subsequent fetches */}
      <LoadingOverlay loading={loading}>
        {/* Results */}
        {patients.length === 0 ? (
          <EmptyState
            title="No patients found"
            description={
              filters.query
                ? `No patients match "${filters.query}"`
                : "No patients have been added yet"
            }
            action={
              filters.query ? (
                <button
                  onClick={() => handleFiltersChange({ ...filters, query: "" })}
                  className="btn btn-primary"
                >
                  Clear Search
                </button>
              ) : (
                <Link href="/patients/new" className="btn btn-primary gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add First Patient
                </Link>
              )
            }
          />
        ) : viewMode === "grid" ? (
          loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <PatientCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <PatientGrid
              patients={patients}
              searchTerm={filters.query}
              onClearSearch={() => setFilters({ ...filters, query: "" })}
            />
          )
        ) : loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : (
          <PatientTable patients={patients} />
        )}
      </LoadingOverlay>

      {/* Pagination */}
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
