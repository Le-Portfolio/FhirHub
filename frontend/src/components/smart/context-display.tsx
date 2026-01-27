"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Stethoscope,
  Building,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Hash,
  Clock,
} from "@/components/ui/icons";

interface PatientContext {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  mrn: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface PractitionerContext {
  id: string;
  name: string;
  npi: string;
  specialty?: string;
  organization?: string;
}

interface EncounterContext {
  id: string;
  type: string;
  status: string;
  period: { start: string; end?: string };
  location?: string;
  reason?: string;
}

interface ContextDisplayProps {
  patient?: PatientContext | null;
  practitioner?: PractitionerContext | null;
  encounter?: EncounterContext | null;
  className?: string;
}

export function ContextDisplay({
  patient,
  practitioner,
  encounter,
  className,
}: ContextDisplayProps) {
  const hasContext = patient || practitioner || encounter;

  if (!hasContext) {
    return (
      <div
        className={cn(
          "bg-base-100 rounded-xl border border-base-200 p-6",
          className
        )}
      >
        <div className="text-center text-base-content/60">
          <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No launch context available</p>
          <p className="text-sm">Simulate a launch to see context data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", className)}>
      {/* Patient Context */}
      {patient && (
        <div className="bg-base-100 rounded-xl border border-base-200 overflow-hidden">
          <div className="p-4 bg-base-200 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Patient Context</h3>
              <p className="text-sm text-base-content/60">
                Current patient in session
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <Avatar name={patient.name} size="lg" />
              <div className="flex-1">
                <h4 className="text-lg font-semibold">{patient.name}</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="ghost" size="sm">
                    {patient.gender}
                  </Badge>
                  <Badge variant="ghost" size="sm" icon={Calendar}>
                    DOB: {new Date(patient.birthDate).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4 text-base-content/50" />
                <span className="text-base-content/60">MRN:</span>
                <span className="font-mono">{patient.mrn}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4 text-base-content/50" />
                <span className="text-base-content/60">FHIR ID:</span>
                <span className="font-mono">{patient.id}</span>
              </div>
              {patient.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-base-content/50" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-base-content/50" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-2 text-sm col-span-2">
                  <MapPin className="w-4 h-4 text-base-content/50" />
                  <span>{patient.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Practitioner Context */}
      {practitioner && (
        <div className="bg-base-100 rounded-xl border border-base-200 overflow-hidden">
          <div className="p-4 bg-base-200 flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Stethoscope className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold">Practitioner Context</h3>
              <p className="text-sm text-base-content/60">
                Authenticated provider
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <Avatar name={practitioner.name} size="lg" />
              <div className="flex-1">
                <h4 className="text-lg font-semibold">{practitioner.name}</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {practitioner.specialty && (
                    <Badge variant="ghost" size="sm">
                      {practitioner.specialty}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4 text-base-content/50" />
                <span className="text-base-content/60">NPI:</span>
                <span className="font-mono">{practitioner.npi}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4 text-base-content/50" />
                <span className="text-base-content/60">FHIR ID:</span>
                <span className="font-mono">{practitioner.id}</span>
              </div>
              {practitioner.organization && (
                <div className="flex items-center gap-2 text-sm col-span-2">
                  <Building className="w-4 h-4 text-base-content/50" />
                  <span>{practitioner.organization}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Encounter Context */}
      {encounter && (
        <div className="bg-base-100 rounded-xl border border-base-200 overflow-hidden">
          <div className="p-4 bg-base-200 flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Encounter Context</h3>
              <p className="text-sm text-base-content/60">
                Current visit or admission
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold">{encounter.type}</h4>
                <Badge
                  variant={
                    encounter.status === "in-progress"
                      ? "active"
                      : encounter.status === "finished"
                        ? "resolved"
                        : "ghost"
                  }
                  size="sm"
                >
                  {encounter.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4 text-base-content/50" />
                <span className="text-base-content/60">FHIR ID:</span>
                <span className="font-mono">{encounter.id}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-base-content/50" />
                <span className="text-base-content/60">Started:</span>
                <span>{new Date(encounter.period.start).toLocaleString()}</span>
              </div>
              {encounter.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-base-content/50" />
                  <span>{encounter.location}</span>
                </div>
              )}
              {encounter.reason && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-base-content/60">Reason:</span>
                  <span>{encounter.reason}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
