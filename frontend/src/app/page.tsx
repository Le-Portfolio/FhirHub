"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { initKeycloak } from "@/lib/keycloak";
import { HeartPulse } from "@/components/ui/icons";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

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
          </div>
        </div>
      </div>
    </div>
  );
}
