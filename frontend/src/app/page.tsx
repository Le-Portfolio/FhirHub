"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { initKeycloak } from "@/lib/keycloak";
import { HeartPulse } from "@/components/ui/icons";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  useEffect(() => {
    initKeycloak({
      onLoad: "check-sso",
      silentCheckSsoRedirectUri:
        window.location.origin + "/silent-check-sso.html",
    })
      .then((authenticated) => {
        if (authenticated) {
          router.replace("/dashboard");
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        setReady(true);
      });
  }, [router]);

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setGuestError(null);

    const keycloakUrl =
      process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8180";
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "fhirhub";
    const clientId =
      process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "fhirhub-frontend";

    try {
      const res = await fetch(
        `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "password",
            client_id: clientId,
            username: "guest",
            password: "guest",
          }),
        }
      );

      if (!res.ok) {
        setGuestError("Guest login unavailable");
        setGuestLoading(false);
        return;
      }

      const tokens = await res.json();
      sessionStorage.setItem("direct-login-tokens", JSON.stringify(tokens));
      // Full page navigation so keycloak module resets and picks up the stored tokens
      window.location.href = "/dashboard";
    } catch {
      setGuestError("Guest login unavailable");
      setGuestLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm bg-base-100 shadow-lg">
        <div className="card-body items-center text-center gap-6">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-base-content">FhirHub</h1>
          </div>
          <p className="text-sm text-base-content/60">
            FHIR data management platform
          </p>
          <div className="flex flex-col w-full gap-3">
            <Link href="/dashboard" className="btn btn-primary w-full">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-ghost w-full">
              Create Account
            </Link>
            <div className="divider text-xs text-base-content/40 my-0">or</div>
            <button
              onClick={handleGuestLogin}
              disabled={guestLoading}
              className="btn btn-outline btn-secondary w-full"
            >
              {guestLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Continue as Guest"
              )}
            </button>
            {guestError && (
              <p className="text-xs text-error">{guestError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
