"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileQuestion,
  ArrowLeft,
  Search,
  Home,
  User,
  Activity,
  HeartPulse,
  Pill,
  type LucideIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type FhirResourceType =
  | "Patient"
  | "Observation"
  | "Condition"
  | "MedicationRequest"
  | "DiagnosticReport"
  | "Encounter"
  | "Procedure"
  | "Generic";

interface ResourceNotFoundProps {
  resourceType?: FhirResourceType;
  resourceId?: string;
  message?: string;
  backLink?: string;
  backLabel?: string;
  className?: string;
}

const resourceConfig: Record<
  FhirResourceType,
  { icon: LucideIcon; label: string; listPath: string }
> = {
  Patient: { icon: User, label: "Patient", listPath: "/patients" },
  Observation: {
    icon: Activity,
    label: "Observation",
    listPath: "/patients",
  },
  Condition: { icon: HeartPulse, label: "Condition", listPath: "/patients" },
  MedicationRequest: {
    icon: Pill,
    label: "Medication",
    listPath: "/patients",
  },
  DiagnosticReport: {
    icon: FileQuestion,
    label: "Diagnostic Report",
    listPath: "/reports",
  },
  Encounter: {
    icon: FileQuestion,
    label: "Encounter",
    listPath: "/encounters",
  },
  Procedure: {
    icon: FileQuestion,
    label: "Procedure",
    listPath: "/procedures",
  },
  Generic: { icon: FileQuestion, label: "Resource", listPath: "/" },
};

export function ResourceNotFound({
  resourceType = "Generic",
  resourceId,
  message,
  backLink,
  backLabel,
  className,
}: ResourceNotFoundProps) {
  const config = resourceConfig[resourceType];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "min-h-[400px] flex items-center justify-center p-8",
        className
      )}
    >
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
          <Icon className="w-10 h-10 text-warning" />
        </div>

        <h1 className="text-2xl font-bold mb-2">{config.label} Not Found</h1>

        <p className="text-base-content/60 mb-2">
          {message ||
            `The ${config.label.toLowerCase()} you're looking for could not be found.`}
        </p>

        {resourceId && (
          <p className="text-sm text-base-content/50 mb-6">
            Resource ID:{" "}
            <code className="font-mono bg-base-200 px-2 py-0.5 rounded">
              {resourceId}
            </code>
          </p>
        )}

        <div className="space-y-3 mb-8">
          <p className="text-sm text-base-content/70">
            This could happen because:
          </p>
          <ul className="text-sm text-base-content/60 space-y-1">
            <li>• The {config.label.toLowerCase()} was deleted or moved</li>
            <li>• The ID is incorrect or malformed</li>
            <li>• You don&apos;t have permission to access this resource</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {backLink ? (
            <Button variant="outline" asChild>
              <Link href={backLink}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backLabel || "Go Back"}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href={config.listPath}>
                <Search className="w-4 h-4 mr-2" />
                Search {config.label}s
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
