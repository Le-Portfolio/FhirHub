"use client";

import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import {
  MetricsRow,
  EnterpriseOverview,
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

export default function DashboardPage() {
  const {
    metrics,
    overview,
    alerts,
    activities,
    loading: dashboardLoading,
  } = useDashboardMetrics();

  const {
    patients,
    loading: patientsLoading,
  } = usePatientSummaries({ limit: 5 });

  const loading = dashboardLoading || patientsLoading;

  // Loading state
  if (loading && metrics.length === 0) {
    return (
      <PageContainer>
        <PageHeader
          title="Dashboard"
          description="Enterprise command center for clinical, platform, and interoperability performance"
        />
        <DashboardSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Enterprise command center for clinical, platform, and interoperability performance"
      />

      {/* Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="animate-fade-in-up">
          <MetricsRow metrics={metrics} className="mb-6" />
        </div>
      )}

      {/* Enterprise overview */}
      {overview && (
        <div className="animate-fade-in-up animate-stagger-1">
          <EnterpriseOverview overview={overview} className="mb-6" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="animate-fade-in-up animate-stagger-1">
        <QuickActions className="mb-6" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up animate-stagger-2">
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
          <SystemStatus
            services={overview?.systemStatus.map((service) => ({
              name: service.name,
              status: service.status,
              latency: service.latencyMs,
            }))}
          />
        </div>
      </div>
    </PageContainer>
  );
}
