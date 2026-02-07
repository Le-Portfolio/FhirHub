"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { Play, Server, RefreshCw, Shield, Check } from "@/components/ui/icons";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5197";

const AVAILABLE_SCOPES = [
  {
    id: "openid",
    label: "OpenID Connect",
    description: "Basic identity verification",
    default: true,
    required: true,
  },
  {
    id: "fhirUser",
    label: "FHIR User",
    description: "Your FHIR user resource reference",
    default: true,
  },
  {
    id: "launch/patient",
    label: "Patient Context",
    description: "Receive patient ID in launch context",
    default: true,
  },
  {
    id: "patient/Patient.read",
    label: "Patient Demographics",
    description: "Read patient name, DOB, contact info",
    default: true,
  },
  {
    id: "patient/Observation.read",
    label: "Observations",
    description: "Read vital signs, lab results",
    default: true,
  },
  {
    id: "patient/Condition.read",
    label: "Conditions",
    description: "Read diagnoses and health conditions",
    default: true,
  },
  {
    id: "patient/MedicationRequest.read",
    label: "Medications",
    description: "Read medication orders and prescriptions",
    default: true,
  },
  {
    id: "patient/Encounter.read",
    label: "Encounters",
    description: "Read visit and admission records",
    default: false,
  },
];

interface LaunchSimulatorProps {
  onLaunch: (config: {
    fhirServer: string;
    clientId: string;
    scopes: string[];
    forceLogin?: boolean;
  }) => void;
  isLaunching?: boolean;
  className?: string;
}

export function LaunchSimulator({
  onLaunch,
  isLaunching = false,
  className,
}: LaunchSimulatorProps) {
  const [clientId, setClientId] = useState("fhirhub-smart");
  const [fhirServer, setFhirServer] = useState(API_URL);
  const [forceLogin, setForceLogin] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(
    () =>
      new Set(
        AVAILABLE_SCOPES.filter((s) => s.default).map((s) => s.id)
      )
  );

  const toggleScope = (scopeId: string) => {
    const scope = AVAILABLE_SCOPES.find((s) => s.id === scopeId);
    if (scope?.required) return; // Can't deselect required scopes

    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scopeId)) {
        next.delete(scopeId);
      } else {
        next.add(scopeId);
      }
      return next;
    });
  };

  const handleLaunch = () => {
    onLaunch({
      fhirServer,
      clientId,
      scopes: Array.from(selectedScopes),
      forceLogin,
    });
  };

  return (
    <div
      className={cn(
        "bg-base-100 rounded-xl border border-base-200 p-6",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Play className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">SMART App Launcher</h3>
          <p className="text-sm text-base-content/60">
            Launch a real OAuth2 PKCE flow against Keycloak
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* FHIR Server */}
        <div>
          <label className="label">
            <span className="label-text font-medium flex items-center gap-2">
              <Server className="w-4 h-4" />
              FHIR Server (API Gateway)
            </span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full font-mono text-sm"
            value={fhirServer}
            onChange={(e) => setFhirServer(e.target.value)}
          />
          <p className="text-xs text-base-content/50 mt-1">
            The .NET API serves .well-known/smart-configuration
          </p>
        </div>

        {/* Client ID */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Client ID</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full font-mono"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
        </div>

        {/* Scope Picker */}
        <div>
          <label className="label">
            <span className="label-text font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Requested Scopes
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_SCOPES.map((scope) => {
              const isSelected = selectedScopes.has(scope.id);
              return (
                <button
                  key={scope.id}
                  onClick={() => toggleScope(scope.id)}
                  disabled={scope.required}
                  className={cn(
                    "flex items-start gap-2 p-3 rounded-lg border text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-base-200 hover:border-base-300",
                    scope.required && "cursor-default"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-base-300"
                    )}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-primary-content" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{scope.label}</p>
                    <p className="text-xs text-base-content/50 truncate">
                      {scope.description}
                    </p>
                    <code className="text-[10px] text-base-content/40">
                      {scope.id}
                    </code>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Force Login Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setForceLogin(!forceLogin)}
            className={cn(
              "w-10 h-6 rounded-full relative transition-colors",
              forceLogin ? "bg-primary" : "bg-base-300"
            )}
          >
            <span
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                forceLogin ? "left-5" : "left-1"
              )}
            />
          </button>
          <div>
            <p className="text-sm font-medium">Force Re-authentication</p>
            <p className="text-xs text-base-content/50">
              Adds prompt=login to test with different users
            </p>
          </div>
        </div>

        {/* Launch Button */}
        <Button
          className="w-full"
          onClick={handleLaunch}
          disabled={isLaunching}
        >
          {isLaunching ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Redirecting to Keycloak...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Launch SMART App
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
