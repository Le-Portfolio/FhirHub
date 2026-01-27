"use client";

import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import { LaunchSimulator } from "@/components/smart/launch-simulator";
import { TokenInspector } from "@/components/smart/token-inspector";
import { ScopeVisualizer } from "@/components/smart/scope-visualizer";
import { ContextDisplay } from "@/components/smart/context-display";
import { Zap, RefreshCw } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

// Mock token data for demonstration
const generateMockToken = (patientId: string, practitionerId: string) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "https://fhir.example.com",
    sub: practitionerId,
    aud: "fhirhub-demo-client",
    exp: now + 3600,
    iat: now,
    nbf: now,
    jti: `token-${Math.random().toString(36).slice(2)}`,
    patient: patientId,
    fhirUser: `Practitioner/${practitionerId}`,
    scope:
      "openid fhirUser launch/patient patient/Patient.read patient/Observation.read patient/Condition.read patient/MedicationRequest.read",
  };

  const header = { alg: "RS256", typ: "JWT", kid: "key-1" };

  // Create a mock JWT structure (not cryptographically valid, just for display)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const mockSignature = btoa(
    "mock-signature-" + Math.random().toString(36).slice(2)
  );

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
};

const generateMockIdToken = (practitionerId: string) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "https://fhir.example.com",
    sub: practitionerId,
    aud: "fhirhub-demo-client",
    exp: now + 3600,
    iat: now,
    auth_time: now - 60,
    name: "Dr. Robert Wilson",
    email: "rwilson@hospital.example.com",
    fhirUser: `Practitioner/${practitionerId}`,
  };

  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const mockSignature = btoa(
    "mock-id-signature-" + Math.random().toString(36).slice(2)
  );

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
};

interface SessionData {
  tokenData: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    scope: string;
    idToken: string;
    refreshToken: string;
    patient: string;
  };
  requestedScopes: string[];
  grantedScopes: string[];
  patient: {
    id: string;
    name: string;
    birthDate: string;
    gender: string;
    mrn: string;
    phone: string;
    email: string;
    address: string;
  };
  practitioner: {
    id: string;
    name: string;
    npi: string;
    specialty: string;
    organization: string;
  };
  encounter: {
    id: string;
    type: string;
    status: string;
    period: { start: string };
    location: string;
    reason: string;
  } | null;
}

export default function SmartLaunchPage() {
  const [isLaunching, setIsLaunching] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);

  const handleLaunch = async (config: {
    fhirServer: string;
    clientId: string;
    launchContext: string;
    patientId?: string;
    practitionerId?: string;
  }) => {
    setIsLaunching(true);

    // Simulate OAuth flow delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const patientId = config.patientId || "patient-123";
    const practitionerId = config.practitionerId || "prac-001";

    const requestedScopes = [
      "openid",
      "fhirUser",
      "launch/patient",
      "patient/Patient.read",
      "patient/Observation.read",
      "patient/Condition.read",
      "patient/MedicationRequest.read",
      "patient/DiagnosticReport.read",
      "patient/*.write",
    ];

    // Simulate some scopes being denied
    const grantedScopes = requestedScopes.filter(
      (s) => !s.includes(".write") && !s.includes("DiagnosticReport")
    );

    const sessionData: SessionData = {
      tokenData: {
        accessToken: generateMockToken(patientId, practitionerId),
        tokenType: "Bearer",
        expiresIn: 3600,
        scope: grantedScopes.join(" "),
        idToken: generateMockIdToken(practitionerId),
        refreshToken: `refresh-${Math.random().toString(36).slice(2, 18)}`,
        patient: patientId,
      },
      requestedScopes,
      grantedScopes,
      patient: {
        id: patientId,
        name:
          patientId === "patient-123"
            ? "Sarah Johnson"
            : patientId === "patient-456"
              ? "Michael Chen"
              : "Emily Davis",
        birthDate: "1985-03-15",
        gender: "Female",
        mrn: "MRN-001234",
        phone: "(555) 123-4567",
        email: "sarah.johnson@email.com",
        address: "123 Main Street, Anytown, CA 90210",
      },
      practitioner: {
        id: practitionerId,
        name:
          practitionerId === "prac-001"
            ? "Dr. Robert Wilson"
            : "Dr. Lisa Anderson",
        npi: "1234567890",
        specialty: "Internal Medicine",
        organization: "City General Hospital",
      },
      encounter:
        config.launchContext === "patient"
          ? {
              id: "enc-001",
              type: "Office Visit",
              status: "in-progress",
              period: { start: new Date().toISOString() },
              location: "Clinic A, Room 204",
              reason: "Annual Physical Examination",
            }
          : null,
    };

    setSession(sessionData);
    setIsLaunching(false);
  };

  const handleReset = () => {
    setSession(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="SMART on FHIR Demo"
        description="Simulate EHR launch and explore OAuth tokens and contexts"
        icon={Zap}
        actions={
          session && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Session
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Launch & Token */}
        <div className="space-y-6">
          <LaunchSimulator onLaunch={handleLaunch} isLaunching={isLaunching} />
          <TokenInspector tokenData={session?.tokenData || null} />
        </div>

        {/* Right Column - Scopes & Context */}
        <div className="space-y-6">
          <ScopeVisualizer
            requestedScopes={session?.requestedScopes || []}
            grantedScopes={session?.grantedScopes || []}
          />
          <ContextDisplay
            patient={session?.patient}
            practitioner={session?.practitioner}
            encounter={session?.encounter}
          />
        </div>
      </div>
    </PageContainer>
  );
}
