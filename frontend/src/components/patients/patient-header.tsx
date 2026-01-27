"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { IdentifierDisplay } from "@/components/fhir/identifier-display";
import { FhirAge } from "@/components/fhir/fhir-date";
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
} from "@/components/ui/icons";

interface Patient {
  id: string;
  name: string;
  birthDate?: string;
  gender?: string;
  mrn?: string;
  phone?: string;
  email?: string;
  address?: string;
  photo?: string;
  status?: "active" | "inactive";
  alertCount?: number;
}

interface PatientHeaderProps {
  patient: Patient;
  onEdit?: () => void;
  onPrintSummary?: () => void;
  onExportData?: () => void;
  onViewAuditLog?: () => void;
  onArchivePatient?: () => void;
  className?: string;
}

export function PatientHeader({
  patient,
  onEdit,
  onPrintSummary,
  onExportData,
  onViewAuditLog,
  onArchivePatient,
  className,
}: PatientHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 bg-base-100 border-b border-base-200",
        className
      )}
    >
      <div className="px-4 md:px-6 lg:px-8 py-4">
        {/* Back link */}
        <Link
          href="/patients"
          className="inline-flex items-center gap-1 text-sm text-base-content/60 hover:text-base-content mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to patients
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Patient info */}
          <div className="flex items-start gap-4">
            <Avatar name={patient.name} src={patient.photo} size="xl" />
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{patient.name}</h1>
                {patient.alertCount && patient.alertCount > 0 && (
                  <Badge variant="critical" icon={AlertCircle}>
                    {patient.alertCount} Alert
                    {patient.alertCount > 1 ? "s" : ""}
                  </Badge>
                )}
                <StatusBadge
                  status={patient.status === "active" ? "active" : "inactive"}
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/70">
                {patient.mrn && (
                  <IdentifierDisplay value={patient.mrn} label="MRN" copyable />
                )}
                {patient.birthDate && (
                  <span>
                    <FhirAge birthDate={patient.birthDate} /> old
                  </span>
                )}
                {patient.gender && (
                  <span className="capitalize">{patient.gender}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-base-content/60">
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {patient.phone}
                  </span>
                )}
                {patient.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {patient.email}
                  </span>
                )}
                {patient.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {patient.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="btn btn-outline btn-sm gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <div className="dropdown dropdown-end">
              <button className="btn btn-ghost btn-sm btn-square">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <ul className="dropdown-content z-50 menu p-2 bg-base-100 rounded-box w-52 shadow-lg border border-base-200">
                <li>
                  <button onClick={onPrintSummary}>Print Summary</button>
                </li>
                <li>
                  <button onClick={onExportData}>Export Data</button>
                </li>
                <li>
                  <button onClick={onViewAuditLog}>View Audit Log</button>
                </li>
                <li className="text-error">
                  <button onClick={onArchivePatient}>Archive Patient</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
