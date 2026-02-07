"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Activity,
  HeartPulse,
  Pill,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "@/components/ui/icons";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5197";

interface FhirDataViewerProps {
  accessToken: string;
  patientId: string | null;
  grantedScopes: string[];
  className?: string;
}

interface FhirSection {
  scope: string;
  label: string;
  icon: React.ElementType;
  endpoint: string;
}

const FHIR_SECTIONS: FhirSection[] = [
  {
    scope: "patient/Patient.read",
    label: "Patient",
    icon: FileText,
    endpoint: "patients",
  },
  {
    scope: "patient/Observation.read",
    label: "Observations (Vitals)",
    icon: Activity,
    endpoint: "vitals",
  },
  {
    scope: "patient/Condition.read",
    label: "Conditions",
    icon: HeartPulse,
    endpoint: "conditions",
  },
  {
    scope: "patient/MedicationRequest.read",
    label: "Medications",
    icon: Pill,
    endpoint: "medications",
  },
  {
    scope: "patient/Encounter.read",
    label: "Encounters (Timeline)",
    icon: Stethoscope,
    endpoint: "timeline",
  },
];

export function FhirDataViewer({
  accessToken,
  patientId,
  grantedScopes,
  className,
}: FhirDataViewerProps) {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const enabledSections = FHIR_SECTIONS.filter((s) =>
    grantedScopes.includes(s.scope)
  );

  const fetchSection = useCallback(
    async (section: FhirSection) => {
      if (!patientId) return;

      setLoading((prev) => ({ ...prev, [section.scope]: true }));
      setErrors((prev) => ({ ...prev, [section.scope]: "" }));

      try {
        // Map section endpoint to the actual API route
        let url: string;
        if (section.endpoint === "patients") {
          url = `${API_URL}/api/patients/${patientId}`;
        } else {
          url = `${API_URL}/api/patients/${patientId}/${section.endpoint}`;
        }

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}`);
        }

        const json = await res.json();
        setData((prev) => ({ ...prev, [section.scope]: json }));
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [section.scope]:
            err instanceof Error ? err.message : "Failed to fetch",
        }));
      } finally {
        setLoading((prev) => ({ ...prev, [section.scope]: false }));
      }
    },
    [accessToken, patientId]
  );

  // Auto-fetch Patient data on mount
  useEffect(() => {
    const patientSection = enabledSections.find(
      (s) => s.scope === "patient/Patient.read"
    );
    if (patientSection && patientId && !data["patient/Patient.read"]) {
      fetchSection(patientSection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const toggleExpanded = (scope: string) => {
    setExpanded((prev) => ({ ...prev, [scope]: !prev[scope] }));
  };

  if (!patientId) {
    return (
      <div
        className={cn(
          "bg-base-100 rounded-xl border border-base-200 p-6",
          className
        )}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-base-200 rounded-lg">
            <FileText className="w-5 h-5 text-base-content/50" />
          </div>
          <div>
            <h3 className="font-semibold">FHIR Data Viewer</h3>
            <p className="text-sm text-base-content/60">
              No patient context — log in as a user with a fhir_patient_id to
              see real FHIR data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("bg-base-100 rounded-xl border border-base-200", className)}
    >
      <div className="p-6 border-b border-base-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-info/10 rounded-lg">
            <FileText className="w-5 h-5 text-info" />
          </div>
          <div>
            <h3 className="font-semibold">FHIR Data Viewer</h3>
            <p className="text-sm text-base-content/60">
              Real FHIR resources fetched via the .NET API using your SMART
              access token
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-base-200">
        {enabledSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expanded[section.scope];
          const isLoading = loading[section.scope];
          const error = errors[section.scope];
          const sectionData = data[section.scope];
          const hasFetched = sectionData !== undefined || !!error;

          return (
            <div key={section.scope} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-base-content/60" />
                  <span className="font-medium text-sm">{section.label}</span>
                  <Badge variant="ghost" size="xs">
                    <code className="text-[10px]">{section.scope}</code>
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {!hasFetched && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchSection(section)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Fetch"
                      )}
                    </Button>
                  )}
                  {hasFetched && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(section.scope)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-sm text-error mt-2">Error: {error}</p>
              )}

              {isExpanded && sectionData !== undefined && (
                <pre className="mt-3 bg-base-200 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
                  {JSON.stringify(sectionData, null, 2)}
                </pre>
              )}
            </div>
          );
        })}

        {enabledSections.length === 0 && (
          <div className="p-6 text-center text-base-content/60 text-sm">
            No FHIR data scopes were granted in this session.
          </div>
        )}
      </div>
    </div>
  );
}
