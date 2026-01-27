"use client";

import { useRouter } from "next/navigation";
import {
  DataTable,
  type Column,
  type SortDirection,
} from "@/components/common/data-table";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { FhirAge } from "@/components/fhir/fhir-date";
import { AlertCircle } from "@/components/ui/icons";

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

interface PatientTableProps {
  patients: Patient[];
  loading?: boolean;
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (column: string, direction: SortDirection) => void;
  selectedRows?: Set<string>;
  onSelectRow?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  className?: string;
}

export function PatientTable({
  patients,
  loading = false,
  sortColumn,
  sortDirection,
  onSort,
  selectedRows,
  onSelectRow,
  onSelectAll,
  className,
}: PatientTableProps) {
  const router = useRouter();

  const columns: Column<Patient>[] = [
    {
      key: "name",
      header: "Patient",
      sortable: true,
      render: (patient) => (
        <div className="flex items-center gap-3">
          <Avatar name={patient.name} src={patient.photo} size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{patient.name}</span>
              {patient.alertCount && patient.alertCount > 0 && (
                <Badge variant="critical" size="xs" icon={AlertCircle}>
                  {patient.alertCount}
                </Badge>
              )}
            </div>
            {patient.mrn && (
              <span className="text-xs text-base-content/60">
                MRN: {patient.mrn}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "birthDate",
      header: "Age",
      sortable: true,
      width: "100px",
      render: (patient) => <FhirAge birthDate={patient.birthDate} />,
    },
    {
      key: "gender",
      header: "Gender",
      sortable: true,
      width: "100px",
      render: (patient) => (
        <span className="capitalize">{patient.gender || "-"}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (patient) => (
        <span className="text-sm">{patient.phone || "-"}</span>
      ),
    },
    {
      key: "conditions",
      header: "Conditions",
      render: (patient) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {patient.conditions?.slice(0, 2).map((condition, i) => (
            <Badge key={i} variant="ghost" size="xs">
              {condition}
            </Badge>
          ))}
          {patient.conditions && patient.conditions.length > 2 && (
            <Badge variant="ghost" size="xs">
              +{patient.conditions.length - 2}
            </Badge>
          )}
          {!patient.conditions?.length && "-"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      align: "center",
      render: (patient) => (
        <StatusBadge
          status={patient.status === "active" ? "active" : "inactive"}
        />
      ),
    },
  ];

  return (
    <DataTable
      data={patients}
      columns={columns}
      keyExtractor={(patient) => patient.id}
      loading={loading}
      emptyMessage="No patients found"
      emptyDescription="Try adjusting your search or filters"
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      onRowClick={(patient) => router.push(`/patients/${patient.id}`)}
      selectedRows={selectedRows}
      onSelectRow={onSelectRow}
      onSelectAll={onSelectAll}
      className={className}
    />
  );
}
