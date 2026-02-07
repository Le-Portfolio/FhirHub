"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "@/components/ui/icons";

export default function GuestLoginPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runGuestLogin = async () => {
      try {
        const res = await fetch("/api/auth/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          setError("Guest login unavailable");
          setLoading(false);
          return;
        }

        const tokens = await res.json();
        sessionStorage.setItem("direct-login-tokens", JSON.stringify(tokens));
        window.location.assign("/dashboard");
      } catch {
        setError("Guest login unavailable");
        setLoading(false);
      }
    };

    runGuestLogin();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      {loading ? (
        <span className="loading loading-spinner loading-lg" />
      ) : (
        <div className="max-w-sm w-full rounded-xl border border-base-300 bg-base-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-error shrink-0" />
            <h1 className="text-sm font-semibold">Guest Login Failed</h1>
          </div>
          <p className="text-sm text-base-content/70 mb-4">
            {error || "Unable to sign in with guest credentials."}
          </p>
          <Link href="/" className="btn btn-primary btn-sm w-full">
            Back to Home
          </Link>
        </div>
      )}
    </div>
  );
}
