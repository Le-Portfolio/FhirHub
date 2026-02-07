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

  // Check for tokens from direct login (e.g. guest login via ROPC grant)
  // or saved dashboard tokens (preserved across SMART launch redirects)
  const directTokens =
    sessionStorage.getItem("direct-login-tokens") ||
    sessionStorage.getItem("dashboard-tokens");
  if (directTokens) {
    sessionStorage.removeItem("direct-login-tokens");
    sessionStorage.removeItem("dashboard-tokens");
    const { access_token, refresh_token, id_token } = JSON.parse(directTokens);
    return kc.init({
      pkceMethod: "S256",
      checkLoginIframe: false,
      token: access_token,
      refreshToken: refresh_token,
      idToken: id_token,
    });
  }

  return kc.init({
    ...options,
    pkceMethod: "S256",
    checkLoginIframe: false,
  });
}

export function isKeycloakInitialized(): boolean {
  return _initialized;
}
