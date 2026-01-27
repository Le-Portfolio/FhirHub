"use client";

import { cn } from "@/lib/utils";
import { PatientCard } from "@/components/common/patient-card";
import { PatientCardSkeleton } from "@/components/ui/loading-skeleton";
import { NoResultsState } from "@/components/ui/empty-state";

interface Patient {
  id: string;
  name: string;
  birthDate?: string;
  gender?: string;
  mrn?: string;
  phone?: string;
  address?: string;
  photo?: string;
  status?: "active" | "inactive";
  alertCount?: number;
  conditions?: string[];
}

interface PatientGridProps {
  patients: Patient[];
  loading?: boolean;
  searchTerm?: string;
  onClearSearch?: () => void;
  className?: string;
}

export function PatientGrid({
  patients,
  loading = false,
  searchTerm,
  onClearSearch,
  className,
}: PatientGridProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
          className
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PatientCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return <NoResultsState searchTerm={searchTerm} onClear={onClearSearch} />;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
}
