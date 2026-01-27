"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/layout/app-layout";
import { PatientCard } from "@/components/common/patient-card";
import { ListItemSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "@/components/ui/icons";
import type { PatientSummaryDTO } from "@/types";

// Re-export for backwards compatibility
type Patient = PatientSummaryDTO;

interface RecentPatientsListProps {
  patients?: Patient[];
  loading?: boolean;
  maxItems?: number;
  className?: string;
}

export function RecentPatientsList({
  patients = [],
  loading = false,
  maxItems = 5,
  className,
}: RecentPatientsListProps) {
  const displayPatients = patients.slice(0, maxItems);

  return (
    <div className={cn("card bg-base-100 shadow-sm", className)}>
      <div className="card-body">
        <SectionHeader
          title="Recent Patients"
          viewAllHref="/patients"
          viewAllLabel="View all"
        />

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: maxItems }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        ) : displayPatients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No recent patients"
            description="Patients you view will appear here"
            size="sm"
          />
        ) : (
          <div className="space-y-2">
            {displayPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                variant="compact"
              />
            ))}
          </div>
        )}

        {!loading && displayPatients.length > 0 && (
          <div className="mt-4 pt-4 border-t border-base-200">
            <Link href="/patients" className="btn btn-ghost btn-sm btn-block">
              View all patients
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
