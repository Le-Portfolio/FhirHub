import Keycloak from "keycloak-js";

let instance: Keycloak | null = null;
let _initialized = false;

export function getKeycloak(): Keycloak {
  if (!instance) {
    instance = new Keycloak({
      url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8180",
      realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "fhirhub",
      clientId:
        process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "fhirhub-frontend",
    });
  }
  return instance;
}

export async function initKeycloak(
  options: {
    onLoad?: "login-required" | "check-sso";
    silentCheckSsoRedirectUri?: string;
  } = {}
): Promise<boolean> {
  const kc = getKeycloak();
  if (_initialized) {
    return kc.authenticated ?? false;
  }
  _initialized = true;
  return kc.init({ ...options, pkceMethod: "S256" });
}

export function isKeycloakInitialized(): boolean {
  return _initialized;
}
