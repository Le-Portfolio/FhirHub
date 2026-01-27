"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  Play,
  Server,
  User,
  Stethoscope,
  Building,
  RefreshCw,
} from "@/components/ui/icons";

interface LaunchConfig {
  fhirServer: string;
  clientId: string;
  launchContext: "patient" | "practitioner" | "standalone";
  patientId?: string;
  practitionerId?: string;
  encounterId?: string;
}

interface LaunchSimulatorProps {
  onLaunch: (config: LaunchConfig) => void;
  isLaunching?: boolean;
  className?: string;
}

const mockEHRs = [
  {
    id: "epic",
    name: "Epic MyChart",
    url: "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
  },
  {
    id: "cerner",
    name: "Cerner Millennium",
    url: "https://fhir-myrecord.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d",
  },
  {
    id: "allscripts",
    name: "Allscripts Pro EHR",
    url: "https://open.allscripts.com/fhir/r4",
  },
  { id: "hapi", name: "HAPI FHIR Server", url: "https://hapi.fhir.org/baseR4" },
];

const mockPatients = [
  { id: "patient-123", name: "Sarah Johnson", mrn: "MRN-001234" },
  { id: "patient-456", name: "Michael Chen", mrn: "MRN-005678" },
  { id: "patient-789", name: "Emily Davis", mrn: "MRN-009012" },
];

const mockPractitioners = [
  { id: "prac-001", name: "Dr. Robert Wilson", npi: "1234567890" },
  { id: "prac-002", name: "Dr. Lisa Anderson", npi: "0987654321" },
];

export function LaunchSimulator({
  onLaunch,
  isLaunching = false,
  className,
}: LaunchSimulatorProps) {
  const [config, setConfig] = useState<LaunchConfig>({
    fhirServer: mockEHRs[0].url,
    clientId: "fhirhub-demo-client",
    launchContext: "patient",
    patientId: mockPatients[0].id,
    practitionerId: mockPractitioners[0].id,
  });

  const [selectedEHR, setSelectedEHR] = useState(mockEHRs[0].id);

  const handleEHRChange = (ehrId: string) => {
    const ehr = mockEHRs.find((e) => e.id === ehrId);
    if (ehr) {
      setSelectedEHR(ehrId);
      setConfig({ ...config, fhirServer: ehr.url });
    }
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
          <h3 className="font-semibold">EHR Launch Simulator</h3>
          <p className="text-sm text-base-content/60">
            Simulate a SMART on FHIR launch from an EHR system
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* EHR Selection */}
        <div>
          <label className="label">
            <span className="label-text font-medium">EHR System</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mockEHRs.map((ehr) => (
              <button
                key={ehr.id}
                onClick={() => handleEHRChange(ehr.id)}
                className={cn(
                  "p-3 rounded-lg border-2 text-left transition-colors",
                  selectedEHR === ehr.id
                    ? "border-primary bg-primary/5"
                    : "border-base-200 hover:border-base-300"
                )}
              >
                <Server className="w-5 h-5 mb-2 text-base-content/70" />
                <p className="font-medium text-sm">{ehr.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Launch Context */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Launch Context</span>
          </label>
          <div className="flex gap-3">
            {[
              { id: "patient", label: "Patient Launch", icon: User },
              {
                id: "practitioner",
                label: "Practitioner Launch",
                icon: Stethoscope,
              },
              { id: "standalone", label: "Standalone Launch", icon: Building },
            ].map((ctx) => (
              <button
                key={ctx.id}
                onClick={() =>
                  setConfig({
                    ...config,
                    launchContext: ctx.id as LaunchConfig["launchContext"],
                  })
                }
                className={cn(
                  "flex-1 flex items-center gap-2 p-3 rounded-lg border-2 transition-colors",
                  config.launchContext === ctx.id
                    ? "border-primary bg-primary/5"
                    : "border-base-200 hover:border-base-300"
                )}
              >
                <ctx.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{ctx.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Patient Selection (for patient launch) */}
        {config.launchContext === "patient" && (
          <div>
            <label className="label">
              <span className="label-text font-medium">Select Patient</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={config.patientId}
              onChange={(e) =>
                setConfig({ ...config, patientId: e.target.value })
              }
            >
              {mockPatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.mrn})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Practitioner Selection */}
        {config.launchContext !== "standalone" && (
          <div>
            <label className="label">
              <span className="label-text font-medium">Practitioner</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={config.practitionerId}
              onChange={(e) =>
                setConfig({ ...config, practitionerId: e.target.value })
              }
            >
              {mockPractitioners.map((prac) => (
                <option key={prac.id} value={prac.id}>
                  {prac.name} (NPI: {prac.npi})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Client ID */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Client ID</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full font-mono"
            value={config.clientId}
            onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
          />
        </div>

        {/* FHIR Server URL */}
        <div>
          <label className="label">
            <span className="label-text font-medium">FHIR Server URL</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full font-mono text-sm"
            value={config.fhirServer}
            onChange={(e) =>
              setConfig({ ...config, fhirServer: e.target.value })
            }
          />
        </div>

        {/* Launch Button */}
        <Button
          className="w-full"
          onClick={() => onLaunch(config)}
          disabled={isLaunching}
        >
          {isLaunching ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Launching...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Simulate Launch
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
