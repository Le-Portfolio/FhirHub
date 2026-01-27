"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Check,
  X,
  Eye,
  Edit,
  User,
  Activity,
  Pill,
  HeartPulse,
  FileText,
  Stethoscope,
  Lock,
} from "@/components/ui/icons";

interface ScopeVisualizerProps {
  requestedScopes: string[];
  grantedScopes: string[];
  className?: string;
}

const scopeDescriptions: Record<
  string,
  { label: string; description: string; icon: React.ElementType }
> = {
  "patient/*.read": {
    label: "Read All Patient Data",
    description: "Read access to all patient-related resources",
    icon: Eye,
  },
  "patient/*.write": {
    label: "Write All Patient Data",
    description: "Write access to all patient-related resources",
    icon: Edit,
  },
  "patient/Patient.read": {
    label: "Read Patient Demographics",
    description: "Access patient name, DOB, contact info",
    icon: User,
  },
  "patient/Observation.read": {
    label: "Read Observations",
    description: "Access vital signs, lab results, assessments",
    icon: Activity,
  },
  "patient/MedicationRequest.read": {
    label: "Read Medications",
    description: "Access medication orders and prescriptions",
    icon: Pill,
  },
  "patient/Condition.read": {
    label: "Read Conditions",
    description: "Access diagnoses and health conditions",
    icon: HeartPulse,
  },
  "patient/DiagnosticReport.read": {
    label: "Read Diagnostic Reports",
    description: "Access lab reports and imaging results",
    icon: FileText,
  },
  "patient/Encounter.read": {
    label: "Read Encounters",
    description: "Access visit and admission records",
    icon: Stethoscope,
  },
  "user/*.read": {
    label: "Read User Data",
    description: "Read access based on user context",
    icon: User,
  },
  "launch/patient": {
    label: "Patient Launch Context",
    description: "Receive patient ID from EHR launch",
    icon: User,
  },
  "launch/encounter": {
    label: "Encounter Launch Context",
    description: "Receive encounter ID from EHR launch",
    icon: Stethoscope,
  },
  openid: {
    label: "OpenID Connect",
    description: "Basic identity verification",
    icon: Lock,
  },
  profile: {
    label: "User Profile",
    description: "Access user profile information",
    icon: User,
  },
  fhirUser: {
    label: "FHIR User",
    description: "Access FHIR user resource reference",
    icon: User,
  },
  offline_access: {
    label: "Offline Access",
    description: "Refresh token for extended access",
    icon: Lock,
  },
};

export function ScopeVisualizer({
  requestedScopes,
  grantedScopes,
  className,
}: ScopeVisualizerProps) {
  const allScopes = [...new Set([...requestedScopes, ...grantedScopes])];

  const getScopeInfo = (scope: string) => {
    return (
      scopeDescriptions[scope] || {
        label: scope,
        description: "Custom scope",
        icon: Shield,
      }
    );
  };

  const getPermissionLevel = (scope: string): "read" | "write" | "other" => {
    if (scope.includes(".read") || scope.includes("/*.read")) return "read";
    if (scope.includes(".write") || scope.includes("/*.write")) return "write";
    return "other";
  };

  const groupedScopes = {
    read: allScopes.filter((s) => getPermissionLevel(s) === "read"),
    write: allScopes.filter((s) => getPermissionLevel(s) === "write"),
    other: allScopes.filter((s) => getPermissionLevel(s) === "other"),
  };

  const deniedScopes = requestedScopes.filter(
    (s) => !grantedScopes.includes(s)
  );

  return (
    <div
      className={cn("bg-base-100 rounded-xl border border-base-200", className)}
    >
      <div className="p-6 border-b border-base-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Scope Visualizer</h3>
            <p className="text-sm text-base-content/60">
              {grantedScopes.length} of {requestedScopes.length} requested
              scopes granted
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-success/10 rounded-lg text-center">
            <p className="text-2xl font-bold text-success">
              {grantedScopes.length}
            </p>
            <p className="text-sm text-base-content/60">Granted</p>
          </div>
          <div className="p-4 bg-error/10 rounded-lg text-center">
            <p className="text-2xl font-bold text-error">
              {deniedScopes.length}
            </p>
            <p className="text-sm text-base-content/60">Denied</p>
          </div>
          <div className="p-4 bg-base-200 rounded-lg text-center">
            <p className="text-2xl font-bold">{requestedScopes.length}</p>
            <p className="text-sm text-base-content/60">Requested</p>
          </div>
        </div>

        {/* Read Permissions */}
        {groupedScopes.read.length > 0 && (
          <ScopeGroup
            title="Read Permissions"
            icon={Eye}
            scopes={groupedScopes.read}
            grantedScopes={grantedScopes}
            getScopeInfo={getScopeInfo}
          />
        )}

        {/* Write Permissions */}
        {groupedScopes.write.length > 0 && (
          <ScopeGroup
            title="Write Permissions"
            icon={Edit}
            scopes={groupedScopes.write}
            grantedScopes={grantedScopes}
            getScopeInfo={getScopeInfo}
          />
        )}

        {/* Other Permissions */}
        {groupedScopes.other.length > 0 && (
          <ScopeGroup
            title="Other Permissions"
            icon={Shield}
            scopes={groupedScopes.other}
            grantedScopes={grantedScopes}
            getScopeInfo={getScopeInfo}
          />
        )}

        {/* Denied Scopes Warning */}
        {deniedScopes.length > 0 && (
          <div className="alert alert-warning">
            <X className="w-5 h-5" />
            <div>
              <p className="font-medium">Some scopes were denied</p>
              <p className="text-sm">
                The following scopes were requested but not granted:{" "}
                {deniedScopes.join(", ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ScopeGroupProps {
  title: string;
  icon: React.ElementType;
  scopes: string[];
  grantedScopes: string[];
  getScopeInfo: (scope: string) => {
    label: string;
    description: string;
    icon: React.ElementType;
  };
}

function ScopeGroup({
  title,
  icon: GroupIcon,
  scopes,
  grantedScopes,
  getScopeInfo,
}: ScopeGroupProps) {
  return (
    <div>
      <h4 className="font-medium flex items-center gap-2 mb-3">
        <GroupIcon className="w-4 h-4" />
        {title}
      </h4>
      <div className="space-y-2">
        {scopes.map((scope) => {
          const info = getScopeInfo(scope);
          const isGranted = grantedScopes.includes(scope);
          const Icon = info.icon;

          return (
            <div
              key={scope}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                isGranted
                  ? "border-success/30 bg-success/5"
                  : "border-error/30 bg-error/5"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-md",
                  isGranted ? "bg-success/20" : "bg-error/20"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isGranted ? "text-success" : "text-error"
                  )}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{info.label}</span>
                  <Badge
                    variant={isGranted ? "success" : "critical"}
                    size="xs"
                    icon={isGranted ? Check : X}
                  >
                    {isGranted ? "Granted" : "Denied"}
                  </Badge>
                </div>
                <p className="text-sm text-base-content/60">
                  {info.description}
                </p>
                <code className="text-xs text-base-content/50 font-mono">
                  {scope}
                </code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
