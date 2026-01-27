"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import {
  Calendar,
  Phone,
  MapPin,
  AlertCircle,
  ChevronRight,
} from "@/components/ui/icons";

interface PatientCardProps {
  patient: {
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
  };
  variant?: "default" | "compact";
  className?: string;
  onClick?: () => void;
}

function formatAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} years`;
}

export function PatientCard({
  patient,
  variant = "default",
  className,
  onClick,
}: PatientCardProps) {
  const compactContent = (
    <>
      <Avatar name={patient.name} src={patient.photo} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{patient.name}</p>
        <p className="text-sm text-base-content/60">
          {patient.birthDate && formatAge(patient.birthDate)}
          {patient.gender && ` · ${patient.gender}`}
        </p>
      </div>
      {patient.alertCount && patient.alertCount > 0 && (
        <Badge variant="critical" size="xs" icon={AlertCircle}>
          {patient.alertCount}
        </Badge>
      )}
      <ChevronRight className="w-4 h-4 text-base-content/40" />
    </>
  );

  if (variant === "compact") {
    if (onClick) {
      return (
        <button
          onClick={onClick}
          type="button"
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg bg-base-100 hover:bg-base-200 transition-colors text-left w-full",
            className
          )}
        >
          {compactContent}
        </button>
      );
    }
    return (
      <Link
        href={`/patients/${patient.id}`}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg bg-base-100 hover:bg-base-200 transition-colors text-left w-full",
          className
        )}
      >
        {compactContent}
      </Link>
    );
  }

  return (
    <Link
      href={`/patients/${patient.id}`}
      className={cn(
        "card bg-base-100 shadow-sm card-hover cursor-pointer",
        className
      )}
    >
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar name={patient.name} src={patient.photo} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{patient.name}</h3>
              {patient.alertCount && patient.alertCount > 0 && (
                <Badge variant="critical" size="xs" icon={AlertCircle}>
                  {patient.alertCount}
                </Badge>
              )}
            </div>
            {patient.mrn && (
              <p className="text-sm text-base-content/60">MRN: {patient.mrn}</p>
            )}
            <div className="flex items-center gap-3 mt-1 text-sm text-base-content/60">
              {patient.birthDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatAge(patient.birthDate)}
                </span>
              )}
              {patient.gender && <span>{patient.gender}</span>}
            </div>
          </div>
        </div>

        {/* Contact info */}
        {(patient.phone || patient.address) && (
          <div className="space-y-1 mt-3 text-sm text-base-content/70">
            {patient.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{patient.address}</span>
              </div>
            )}
          </div>
        )}

        {/* Conditions */}
        {patient.conditions && patient.conditions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {patient.conditions.slice(0, 3).map((condition, index) => (
              <Badge key={index} variant="ghost" size="xs">
                {condition}
              </Badge>
            ))}
            {patient.conditions.length > 3 && (
              <Badge variant="ghost" size="xs">
                +{patient.conditions.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-base-200">
          {patient.status && (
            <StatusBadge
              status={patient.status === "active" ? "active" : "inactive"}
            />
          )}
          <span className="text-xs text-primary flex items-center gap-1">
            View details
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
