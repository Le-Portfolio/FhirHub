"use client";

import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import {
  MetricsRow,
  RecentPatientsList,
  AlertsPanel,
  ActivityFeed,
  QuickActions,
  SystemStatus,
} from "@/components/dashboard";
import { useDashboardMetrics, usePatientSummaries } from "@/hooks";
import {
  DashboardSkeleton,
  StatsCardSkeleton,
  ListItemSkeleton,
} from "@/components/ui/loading-skeleton";
import { AlertTriangle, RefreshCw } from "@/components/ui/icons";

export default function DashboardPage() {
  const {
    metrics,
    alerts,
    activities,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardMetrics();

  const {
    patients,
    loading: patientsLoading,
    error: patientsError,
    refetch: refetchPatients,
  } = usePatientSummaries({ limit: 5 });

  const loading = dashboardLoading || patientsLoading;
  const error = dashboardError || patientsError;

  const handleRefresh = async () => {
    await Promise.all([refetchDashboard(), refetchPatients()]);
  };

  // Error state
  if (error && !loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Dashboard"
          description="Overview of your FHIR data and clinical insights"
        />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-error mb-4">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Failed to load dashboard
          </h3>
          <p className="text-base-content/60 mb-4">{error.message}</p>
          <button onClick={handleRefresh} className="btn btn-primary gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </PageContainer>
    );
  }

  // Loading state
  if (loading && metrics.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Dashboard"
          description="Overview of your FHIR data and clinical insights"
        />
        <DashboardSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your FHIR data and clinical insights"
      />

      {/* Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <MetricsRow metrics={metrics} className="mb-6" />
      )}

      {/* Quick Actions */}
      <QuickActions className="mb-6" />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Alerts + Activity */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <>
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <div className="h-5 w-24 bg-base-300 rounded animate-pulse mb-4" />
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ListItemSkeleton key={i} />
                  ))}
                </div>
              </div>
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <div className="h-5 w-32 bg-base-300 rounded animate-pulse mb-4" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ListItemSkeleton key={i} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <AlertsPanel alerts={alerts} />
              <ActivityFeed activities={activities} />
            </>
          )}
        </div>

        {/* Right column: Recent Patients + System Status */}
        <div className="space-y-6">
          {loading ? (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="h-5 w-32 bg-base-300 rounded animate-pulse mb-4" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <ListItemSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <RecentPatientsList patients={patients} />
          )}
          <SystemStatus />
        </div>
      </div>
    </PageContainer>
  );
}
