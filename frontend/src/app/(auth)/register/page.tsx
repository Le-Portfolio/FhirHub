"use client";

import { useEffect } from "react";
import { initKeycloak, getKeycloak } from "@/lib/keycloak";

export default function RegisterPage() {
  useEffect(() => {
    initKeycloak()
      .then(async () => {
        const keycloak = getKeycloak();
        const url = await keycloak.createRegisterUrl({
          redirectUri: window.location.origin + "/dashboard",
        });
        window.location.assign(url);
      })
      .catch((err) => {
        console.error("Keycloak init failed", err);
      });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="loading loading-spinner loading-lg" />
    </div>
  );
}
