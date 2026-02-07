"use client";

import { useEffect, useState } from "react";
import { exchangeCodeForTokens, SmartAuthState } from "@/lib/smart-auth";

export default function SmartCallbackPage() {
  const [status, setStatus] = useState<"exchanging" | "success" | "error">(
    "exchanging"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        const error = params.get("error");
        const errorDescription = params.get("error_description");

        // Handle Keycloak error responses (e.g. user denied consent)
        if (error) {
          throw new Error(
            errorDescription || `Authorization error: ${error}`
          );
        }

        if (!code || !state) {
          throw new Error("Missing code or state parameter in callback URL");
        }

        // Validate state against what we stored before redirect
        const savedRaw = sessionStorage.getItem("smart-auth-state");
        if (!savedRaw) {
          throw new Error(
            "No saved auth state found — session may have expired"
          );
        }

        const savedState: SmartAuthState = JSON.parse(savedRaw);
        if (savedState.state !== state) {
          throw new Error(
            "State mismatch — possible CSRF. Expected: " +
              savedState.state +
              ", got: " +
              state
          );
        }

        // Exchange the authorization code for tokens
        const tokenResponse = await exchangeCodeForTokens({
          tokenEndpoint: savedState.tokenEndpoint,
          code,
          verifier: savedState.verifier,
          clientId: savedState.clientId,
          redirectUri: savedState.redirectUri,
        });

        // Store the full session in sessionStorage
        sessionStorage.setItem(
          "smart-session",
          JSON.stringify({
            tokenResponse,
            requestedScopes: savedState.requestedScopes,
            grantedScopes: tokenResponse.scope
              ? tokenResponse.scope.split(" ")
              : [],
            fhirBaseUrl: savedState.fhirBaseUrl,
            timestamp: Date.now(),
          })
        );

        // Clean up the auth state
        sessionStorage.removeItem("smart-auth-state");

        setStatus("success");

        // Redirect back to the SMART Launch page
        window.location.href = "/smart-launch";
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Unknown error during callback"
        );
      }
    }

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="bg-base-100 rounded-xl border border-base-200 p-8 max-w-md w-full text-center">
        {status === "exchanging" && (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Exchanging Authorization Code
            </h2>
            <p className="text-sm text-base-content/60">
              Completing the SMART on FHIR OAuth2 flow...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">
              Authorization Complete
            </h2>
            <p className="text-sm text-base-content/60">
              Redirecting to SMART Launch page...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Authorization Failed</h2>
            <p className="text-sm text-error mb-4">{errorMessage}</p>
            <a
              href="/smart-launch"
              className="inline-block px-4 py-2 bg-primary text-primary-content rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Back to SMART Launch
            </a>
          </>
        )}
      </div>
    </div>
  );
}
