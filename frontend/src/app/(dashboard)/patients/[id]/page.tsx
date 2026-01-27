"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  PatientHeader,
  PatientTabs,
  type PatientTab,
  PatientExportModal,
  AuditLogDrawer,
  RecordVitalsModal,
  OrderLabsModal,
  AddConditionModal,
  AddMedicationModal,
} from "@/components/patients";
import { VitalsChart } from "@/components/patients/vitals-chart";
import { LabsPanel } from "@/components/patients/labs-panel";
import { TimelineView } from "@/components/patients/timeline-view";
import { SectionHeader } from "@/components/layout/app-layout";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/modal";
import { StatsCard } from "@/components/common/stats-card";
import { DataTable, type Column } from "@/components/common/data-table";
import {
  Activity,
  HeartPulse,
  Pill,
  TestTube,
  Plus,
  AlertTriangle,
  RefreshCw,
} from "@/components/ui/icons";
import {
  usePatient,
  useVitals,
  useConditions,
  useMedications,
  useLabResults,
  useTimeline,
} from "@/hooks";
import {
  Skeleton,
  StatsCardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  ListItemSkeleton,
} from "@/components/ui/loading-skeleton";
import { useToast } from "@/components/ui/toast";
import type { ConditionDTO, MedicationDTO } from "@/types";

// Hook to trigger fetch only when tab becomes active for the first time
function useLazyFetch(
  isActive: boolean,
  refetch: () => Promise<void>,
  hasFetchedRef: React.MutableRefObject<boolean>
) {
  useEffect(() => {
    if (isActive && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      refetch();
    }
  }, [isActive, refetch, hasFetchedRef]);
}

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [activeTab, setActiveTab] = useState<PatientTab>("overview");
  const { info } = useToast();

  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showRecordVitals, setShowRecordVitals] = useState(false);
  const [showOrderLabs, setShowOrderLabs] = useState(false);
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);

  const {
    data: patient,
    loading: patientLoading,
    error: patientError,
    refetch: refetchPatient,
  } = usePatient(patientId);

  // Header action handlers
  const handlePrintSummary = () => {
    window.print();
  };

  const handleArchiveConfirm = () => {
    info("Archive functionality coming soon");
    setShowArchiveConfirm(false);
  };

  // Error state
  if (patientError && !patientLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-error mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Failed to load patient</h3>
          <p className="text-base-content/60 mb-4">{patientError.message}</p>
          <button
            onClick={() => refetchPatient()}
            className="btn btn-primary gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state for patient header
  if (patientLoading || !patient) {
    return (
      <div className="min-h-screen bg-base-200">
        <div className="bg-base-100 border-b p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <PatientHeader
        patient={patient}
        onPrintSummary={handlePrintSummary}
        onExportData={() => setShowExportModal(true)}
        onViewAuditLog={() => setShowAuditDrawer(true)}
        onArchivePatient={() => setShowArchiveConfirm(true)}
      />
      <PatientTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="p-4 md:p-6 lg:p-8 w-full">
        {/* Only render the active tab to prevent multiple mounts */}
        {activeTab === "overview" && (
          <OverviewTab
            patientId={patientId}
            isActive={activeTab === "overview"}
            onTabChange={setActiveTab}
          />
        )}
        {activeTab === "vitals" && (
          <VitalsTab
            patientId={patientId}
            isActive={activeTab === "vitals"}
            onRecordVitals={() => setShowRecordVitals(true)}
          />
        )}
        {activeTab === "labs" && (
          <LabsTab
            patientId={patientId}
            isActive={activeTab === "labs"}
            onOrderLabs={() => setShowOrderLabs(true)}
          />
        )}
        {activeTab === "conditions" && (
          <ConditionsTab
            patientId={patientId}
            isActive={activeTab === "conditions"}
            onAddCondition={() => setShowAddCondition(true)}
          />
        )}
        {activeTab === "medications" && (
          <MedicationsTab
            patientId={patientId}
            isActive={activeTab === "medications"}
            onAddMedication={() => setShowAddMedication(true)}
          />
        )}
        {activeTab === "timeline" && (
          <TimelineTab
            patientId={patientId}
            isActive={activeTab === "timeline"}
          />
        )}
      </div>

      {/* Modals and Drawers */}
      <PatientExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        patientName={patient.name}
        patientId={patientId}
      />

      <AuditLogDrawer
        isOpen={showAuditDrawer}
        onClose={() => setShowAuditDrawer(false)}
        patientName={patient.name}
      />

      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleArchiveConfirm}
        title="Archive Patient"
        description={`Are you sure you want to archive ${patient.name}? This will hide the patient from active lists but preserve all records.`}
        confirmText="Archive"
        variant="danger"
      />

      <RecordVitalsModal
        isOpen={showRecordVitals}
        onClose={() => setShowRecordVitals(false)}
        patientId={patientId}
        patientName={patient.name}
      />

      <OrderLabsModal
        isOpen={showOrderLabs}
        onClose={() => setShowOrderLabs(false)}
        patientId={patientId}
        patientName={patient.name}
      />

      <AddConditionModal
        isOpen={showAddCondition}
        onClose={() => setShowAddCondition(false)}
        patientId={patientId}
        patientName={patient.name}
      />

      <AddMedicationModal
        isOpen={showAddMedication}
        onClose={() => setShowAddMedication(false)}
        patientId={patientId}
        patientName={patient.name}
      />
    </div>
  );
}

// Overview Tab - uses lazy loading to only fetch when tab is active
function OverviewTab({
  patientId,
  isActive,
  onTabChange,
}: {
  patientId: string;
  isActive: boolean;
  onTabChange: (tab: PatientTab) => void;
}) {
  // Track if data has been fetched
  const hasFetchedVitals = useRef(false);
  const hasFetchedConditions = useRef(false);
  const hasFetchedMedications = useRef(false);
  const hasFetchedLabs = useRef(false);

  // Use immediate: false to prevent automatic fetching on mount
  const {
    vitals,
    loading: vitalsLoading,
    refetch: refetchVitals,
  } = useVitals(patientId, { immediate: false });
  const {
    conditions,
    loading: conditionsLoading,
    refetch: refetchConditions,
  } = useConditions(patientId, { immediate: false });
  const {
    medications,
    loading: medicationsLoading,
    refetch: refetchMedications,
  } = useMedications(patientId, { immediate: false });
  const {
    panels,
    loading: labsLoading,
    refetch: refetchLabs,
  } = useLabResults(patientId, { immediate: false });

  // Fetch all data when tab becomes active
  useEffect(() => {
    if (isActive) {
      if (!hasFetchedVitals.current) {
        hasFetchedVitals.current = true;
        refetchVitals();
      }
      if (!hasFetchedConditions.current) {
        hasFetchedConditions.current = true;
        refetchConditions();
      }
      if (!hasFetchedMedications.current) {
        hasFetchedMedications.current = true;
        refetchMedications();
      }
      if (!hasFetchedLabs.current) {
        hasFetchedLabs.current = true;
        refetchLabs();
      }
    }
  }, [
    isActive,
    refetchVitals,
    refetchConditions,
    refetchMedications,
    refetchLabs,
  ]);

  const loading =
    vitalsLoading || conditionsLoading || medicationsLoading || labsLoading;

  const activeConditionsCount = conditions.filter(
    (c) => c.status === "active"
  ).length;
  const activeMedicationsCount = medications.filter(
    (m) => m.status === "active"
  ).length;
  const labResultsCount = panels.reduce((acc, p) => acc + p.results.length, 0);

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
        ) : (
          <>
            <StatsCard
              title="Active Conditions"
              value={activeConditionsCount}
              icon={HeartPulse}
              iconColor="text-warning"
              iconBgColor="bg-warning/10"
            />
            <StatsCard
              title="Active Medications"
              value={activeMedicationsCount}
              icon={Pill}
              iconColor="text-success"
              iconBgColor="bg-success/10"
            />
            <StatsCard
              title="Recent Vitals"
              value={vitals.length}
              icon={Activity}
              iconColor="text-info"
              iconBgColor="bg-info/10"
            />
            <StatsCard
              title="Lab Results"
              value={labResultsCount}
              icon={TestTube}
              iconColor="text-primary"
              iconBgColor="bg-primary/10"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Vitals */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <SectionHeader
              title="Recent Vitals"
              onViewAllClick={() => onTabChange("vitals")}
            />
            {vitalsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {vitals.slice(0, 4).map((vital, i) => {
                  const interpretCode = vital.interpretation?.code;
                  const isAbnormal = interpretCode && interpretCode !== "N";
                  const isCritical =
                    interpretCode === "HH" || interpretCode === "LL";
                  return (
                    <div key={i} className="p-3 bg-base-200 rounded-lg">
                      <p className="text-sm text-base-content/60">
                        {vital.type}
                      </p>
                      <p className="text-xl font-semibold">
                        {vital.value}{" "}
                        <span className="text-sm font-normal text-base-content/60">
                          {vital.unit}
                        </span>
                      </p>
                      {isAbnormal && (
                        <Badge
                          variant={isCritical ? "critical" : "warning"}
                          size="xs"
                          className="mt-1"
                        >
                          {vital.interpretation?.display || vital.status}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Active Conditions */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <SectionHeader
              title="Active Conditions"
              onViewAllClick={() => onTabChange("conditions")}
            />
            {conditionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ListItemSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {conditions
                  .filter((c) => c.status === "active")
                  .slice(0, 4)
                  .map((condition) => (
                    <div
                      key={condition.id}
                      className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{condition.name}</p>
                        <p className="text-sm text-base-content/60">
                          ICD-10: {condition.code} · Since {condition.onset}
                        </p>
                      </div>
                      <StatusBadge status="active" />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div className="card bg-base-100 shadow-sm lg:col-span-2">
          <div className="card-body">
            <SectionHeader
              title="Current Medications"
              onViewAllClick={() => onTabChange("medications")}
            />
            {medicationsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medications
                  .filter((m) => m.status === "active")
                  .map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center gap-3 p-3 bg-base-200 rounded-lg"
                    >
                      <div className="p-2 bg-success/10 rounded-lg">
                        <Pill className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-base-content/60">
                          {med.frequency}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Vitals Tab - lazy loading
function VitalsTab({
  patientId,
  isActive,
  onRecordVitals,
}: {
  patientId: string;
  isActive: boolean;
  onRecordVitals: () => void;
}) {
  const hasFetched = useRef(false);
  const { vitals, chartData, loading, error, refetch } = useVitals(patientId, {
    immediate: false,
  });

  useLazyFetch(isActive, refetch, hasFetched);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="w-12 h-12 text-error mb-4" />
        <p className="text-base-content/60 mb-4">{error.message}</p>
        <button onClick={() => refetch()} className="btn btn-primary gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <SectionHeader
            title="Vital Signs Trends"
            actions={
              <button
                onClick={onRecordVitals}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                Record Vitals
              </button>
            }
          />
          {loading ? <ChartSkeleton /> : <VitalsChart data={chartData} />}
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <SectionHeader title="Recent Readings" />
          {loading ? (
            <TableSkeleton rows={6} columns={4} />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vitals.map((vital, i) => {
                    const interpretCode = vital.interpretation?.code;
                    const isNormal = !interpretCode || interpretCode === "N";
                    const isCritical =
                      interpretCode === "HH" || interpretCode === "LL";
                    return (
                      <tr key={i}>
                        <td className="font-medium">{vital.type}</td>
                        <td>
                          {vital.value} {vital.unit}
                        </td>
                        <td>{vital.date}</td>
                        <td>
                          <Badge
                            variant={
                              isNormal
                                ? "success"
                                : isCritical
                                  ? "critical"
                                  : "warning"
                            }
                            size="sm"
                          >
                            {vital.interpretation?.display || vital.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Labs Tab - lazy loading
function LabsTab({
  patientId,
  isActive,
  onOrderLabs,
}: {
  patientId: string;
  isActive: boolean;
  onOrderLabs: () => void;
}) {
  const hasFetched = useRef(false);
  const { panels, loading, error, refetch } = useLabResults(patientId, {
    immediate: false,
  });

  useLazyFetch(isActive, refetch, hasFetched);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="w-12 h-12 text-error mb-4" />
        <p className="text-base-content/60 mb-4">{error.message}</p>
        <button onClick={() => refetch()} className="btn btn-primary gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <SectionHeader
          title="Laboratory Results"
          actions={
            <button
              onClick={onOrderLabs}
              className="btn btn-primary btn-sm gap-2"
            >
              <Plus className="w-4 h-4" />
              Order Labs
            </button>
          }
        />
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : (
          <LabsPanel panels={panels} />
        )}
      </div>
    </div>
  );
}

// Conditions Tab - lazy loading
function ConditionsTab({
  patientId,
  isActive,
  onAddCondition,
}: {
  patientId: string;
  isActive: boolean;
  onAddCondition: () => void;
}) {
  const [showResolved, setShowResolved] = useState(false);
  const hasFetched = useRef(false);
  const prevShowResolved = useRef(showResolved);
  const { conditions, loading, error, refetch } = useConditions(patientId, {
    includeResolved: showResolved,
    immediate: false,
  });

  useLazyFetch(isActive, refetch, hasFetched);

  // Refetch when filter changes (only after initial fetch and when value actually changed)
  useEffect(() => {
    if (hasFetched.current && prevShowResolved.current !== showResolved) {
      refetch();
    }
    prevShowResolved.current = showResolved;
  }, [showResolved, refetch]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="w-12 h-12 text-error mb-4" />
        <p className="text-base-content/60 mb-4">{error.message}</p>
        <button onClick={() => refetch()} className="btn btn-primary gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  const displayConditions = showResolved
    ? conditions
    : conditions.filter((c) => c.status === "active");

  const columns: Column<ConditionDTO>[] = [
    {
      key: "name",
      header: "Condition",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-base-content/60">ICD-10: {row.code}</p>
        </div>
      ),
    },
    { key: "severity", header: "Severity" },
    { key: "onset", header: "Onset Date" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.status === "active" ? "active" : "resolved"} />
      ),
    },
  ];

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <SectionHeader
          title="Conditions"
          actions={
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showResolved}
                  onChange={(e) => setShowResolved(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">Show resolved</span>
              </label>
              <button
                onClick={onAddCondition}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </button>
            </div>
          }
        />
        {loading ? (
          <TableSkeleton rows={4} columns={4} />
        ) : (
          <DataTable
            data={displayConditions}
            columns={columns}
            keyExtractor={(row) => row.id}
          />
        )}
      </div>
    </div>
  );
}

// Medications Tab - lazy loading
function MedicationsTab({
  patientId,
  isActive,
  onAddMedication,
}: {
  patientId: string;
  isActive: boolean;
  onAddMedication: () => void;
}) {
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  const hasFetched = useRef(false);
  const prevShowDiscontinued = useRef(showDiscontinued);
  const { medications, loading, error, refetch } = useMedications(patientId, {
    includeDiscontinued: showDiscontinued,
    immediate: false,
  });

  useLazyFetch(isActive, refetch, hasFetched);

  // Refetch when filter changes (only after initial fetch and when value actually changed)
  useEffect(() => {
    if (
      hasFetched.current &&
      prevShowDiscontinued.current !== showDiscontinued
    ) {
      refetch();
    }
    prevShowDiscontinued.current = showDiscontinued;
  }, [showDiscontinued, refetch]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="w-12 h-12 text-error mb-4" />
        <p className="text-base-content/60 mb-4">{error.message}</p>
        <button onClick={() => refetch()} className="btn btn-primary gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  const displayMedications = showDiscontinued
    ? medications
    : medications.filter((m) => m.status === "active");

  const columns: Column<MedicationDTO>[] = [
    {
      key: "name",
      header: "Medication",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <Pill className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-base-content/60">{row.dosage}</p>
          </div>
        </div>
      ),
    },
    { key: "frequency", header: "Frequency" },
    { key: "prescriber", header: "Prescriber" },
    { key: "startDate", header: "Start Date" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.status === "active" ? "active" : "resolved"} />
      ),
    },
  ];

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <SectionHeader
          title="Medications"
          actions={
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDiscontinued}
                  onChange={(e) => setShowDiscontinued(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">Show discontinued</span>
              </label>
              <button
                onClick={onAddMedication}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Medication
              </button>
            </div>
          }
        />
        {loading ? (
          <TableSkeleton rows={4} columns={5} />
        ) : (
          <DataTable
            data={displayMedications}
            columns={columns}
            keyExtractor={(row) => row.id}
          />
        )}
      </div>
    </div>
  );
}

// Timeline Tab - lazy loading
function TimelineTab({
  patientId,
  isActive,
}: {
  patientId: string;
  isActive: boolean;
}) {
  const hasFetched = useRef(false);
  const { events, loading, error, refetch } = useTimeline(patientId, {
    immediate: false,
  });

  useLazyFetch(isActive, refetch, hasFetched);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="w-12 h-12 text-error mb-4" />
        <p className="text-base-content/60 mb-4">{error.message}</p>
        <button onClick={() => refetch()} className="btn btn-primary gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <SectionHeader title="Patient Timeline" />
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        ) : (
          <TimelineView events={events} />
        )}
      </div>
    </div>
  );
}
