"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to root — check-sso will auto-redirect to dashboard if authenticated,
    // otherwise the landing page is shown with Sign In / Register options.
    router.replace("/");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="loading loading-spinner loading-lg" />
    </div>
  );
}
