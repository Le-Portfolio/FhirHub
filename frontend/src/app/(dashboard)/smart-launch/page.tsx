"use client";

import { useState, useEffect, useCallback } from "react";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import { LaunchSimulator } from "@/components/smart/launch-simulator";
import { TokenInspector } from "@/components/smart/token-inspector";
import { ScopeVisualizer } from "@/components/smart/scope-visualizer";
import { ContextDisplay } from "@/components/smart/context-display";
import { FhirDataViewer } from "@/components/smart/fhir-data-viewer";
import { Zap, RefreshCw } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  discoverSmartConfig,
  generatePKCE,
  generateState,
  buildAuthorizationUrl,
  SmartAuthState,
  SmartTokenResponse,
} from "@/lib/smart-auth";
import { getKeycloak } from "@/lib/keycloak";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5197";

interface SessionData {
  tokenData: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    scope: string;
    idToken?: string;
    refreshToken?: string;
    patient?: string;
  };
  requestedScopes: string[];
  grantedScopes: string[];
  patient: {
    id: string;
    name: string;
    birthDate: string;
    gender: string;
    mrn: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  practitioner: {
    id: string;
    name: string;
    npi: string;
    specialty?: string;
    organization?: string;
  } | null;
  encounter: null;
}

function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export default function SmartLaunchPage() {
  const [isLaunching, setIsLaunching] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // On mount, check for a completed SMART session in sessionStorage
  const restoreSession = useCallback(async () => {
    const raw = sessionStorage.getItem("smart-session");
    if (!raw) return;

    try {
      const stored = JSON.parse(raw) as {
        tokenResponse: SmartTokenResponse;
        requestedScopes: string[];
        grantedScopes: string[];
        fhirBaseUrl: string;
      };

      const { tokenResponse, requestedScopes, grantedScopes } = stored;

      const payload = decodeTokenPayload(tokenResponse.access_token);
      const patientId =
        (payload?.fhir_patient_id as string) ||
        tokenResponse.patient ||
        (payload?.patient as string) ||
        null;
      const fhirUser = payload?.fhirUser as string | undefined;

      // Fetch real patient data if we have a patient ID
      let patientData: SessionData["patient"] = null;
      if (patientId) {
        try {
          const res = await fetch(`${API_URL}/api/patients/${patientId}`, {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          });
          if (res.ok) {
            const fhirPatient = await res.json();
            const officialName = fhirPatient.name || "";
            patientData = {
              id: fhirPatient.id || patientId,
              name: officialName,
              birthDate: fhirPatient.birthDate || "",
              gender: fhirPatient.gender || "",
              mrn: fhirPatient.mrn || fhirPatient.id || patientId,
              phone: fhirPatient.phone || undefined,
              email: fhirPatient.email || undefined,
              address: fhirPatient.address || undefined,
            };
          }
        } catch {
          // API fetch failed — still show token data
        }
      }

      // Build practitioner context from token claims
      let practitionerData: SessionData["practitioner"] = null;
      if (fhirUser && fhirUser.startsWith("Practitioner/")) {
        const idTokenPayload = tokenResponse.id_token
          ? decodeTokenPayload(tokenResponse.id_token)
          : null;
        practitionerData = {
          id: fhirUser.replace("Practitioner/", ""),
          name:
            (idTokenPayload?.name as string) ||
            (payload?.preferred_username as string) ||
            "Unknown",
          npi: "",
          specialty: undefined,
          organization: undefined,
        };
      }

      setSession({
        tokenData: {
          accessToken: tokenResponse.access_token,
          tokenType: tokenResponse.token_type,
          expiresIn: tokenResponse.expires_in,
          scope: tokenResponse.scope || grantedScopes.join(" "),
          idToken: tokenResponse.id_token,
          refreshToken: tokenResponse.refresh_token,
          patient: patientId || undefined,
        },
        requestedScopes,
        grantedScopes,
        patient: patientData,
        practitioner: practitionerData,
        encounter: null,
      });
    } catch {
      // Invalid stored session — clear it
      sessionStorage.removeItem("smart-session");
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const handleLaunch = async (config: {
    fhirServer: string;
    clientId: string;
    scopes: string[];
    forceLogin?: boolean;
  }) => {
    setIsLaunching(true);
    setLaunchError(null);

    try {
      // 1. Discover SMART configuration from the FHIR server
      const smartConfig = await discoverSmartConfig(config.fhirServer);

      // 2. Generate PKCE verifier + challenge
      const pkce = await generatePKCE();

      // 3. Generate state for CSRF protection
      const state = generateState();

      // 4. Build redirect URI
      const redirectUri = `${window.location.origin}/smart-launch/callback`;

      // 5. Save auth state to sessionStorage for the callback page
      const authState: SmartAuthState = {
        state,
        verifier: pkce.verifier,
        requestedScopes: config.scopes,
        fhirBaseUrl: config.fhirServer,
        clientId: config.clientId,
        redirectUri,
        tokenEndpoint: smartConfig.token_endpoint,
      };
      sessionStorage.setItem("smart-auth-state", JSON.stringify(authState));

      // 6. Build authorization URL and redirect
      const authUrl = buildAuthorizationUrl({
        authorizationEndpoint: smartConfig.authorization_endpoint,
        clientId: config.clientId,
        redirectUri,
        scopes: config.scopes,
        state,
        codeChallenge: pkce.challenge,
        forceLogin: config.forceLogin,
      });

      // 7. Save dashboard Keycloak tokens so we can restore them after
      //    the SMART redirect without a second round-trip to Keycloak
      const kc = getKeycloak();
      if (kc.authenticated && kc.token && kc.refreshToken) {
        sessionStorage.setItem(
          "dashboard-tokens",
          JSON.stringify({
            access_token: kc.token,
            refresh_token: kc.refreshToken,
            id_token: kc.idToken,
          })
        );
      }

      window.location.href = authUrl;
    } catch (err) {
      setIsLaunching(false);
      setLaunchError(
        err instanceof Error ? err.message : "Failed to start SMART launch"
      );
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem("smart-session");
    sessionStorage.removeItem("smart-auth-state");
    setSession(null);
    setLaunchError(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="SMART on FHIR Launch"
        description="Perform a real OAuth2 PKCE flow against Keycloak and inspect tokens, scopes, and FHIR data"
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

      {launchError && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg">
          <p className="font-medium text-error">Launch Error</p>
          <p className="text-sm text-error/80 mt-1">{launchError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
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

      {/* Full-width FHIR Data Viewer below the grid */}
      {session && (
        <div className="mt-6">
          <FhirDataViewer
            accessToken={session.tokenData.accessToken}
            patientId={session.tokenData.patient || null}
            grantedScopes={session.grantedScopes}
          />
        </div>
      )}
    </PageContainer>
  );
}
