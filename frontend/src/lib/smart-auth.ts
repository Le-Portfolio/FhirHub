// SMART on FHIR OAuth2 Authorization Code flow with PKCE
// Uses browser-native crypto.subtle — no external dependencies

export interface SmartConfiguration {
  authorization_endpoint: string;
  token_endpoint: string;
  scopes_supported: string[];
  response_types_supported: string[];
  grant_types_supported: string[];
  code_challenge_methods_supported: string[];
  capabilities: string[];
}

export interface SmartTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
  refresh_token?: string;
  patient?: string;
}

export interface SmartAuthState {
  state: string;
  verifier: string;
  requestedScopes: string[];
  fhirBaseUrl: string;
  clientId: string;
  redirectUri: string;
  tokenEndpoint: string;
}

/**
 * Fetches .well-known/smart-configuration from the FHIR server base URL.
 */
export async function discoverSmartConfig(
  fhirBaseUrl: string
): Promise<SmartConfiguration> {
  const url = `${fhirBaseUrl.replace(/\/$/, "")}/fhir/.well-known/smart-configuration`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch SMART configuration: ${res.status} ${res.statusText}`
    );
  }
  return res.json();
}

/**
 * Generates a PKCE code verifier and challenge using crypto.subtle.
 */
export async function generatePKCE(): Promise<{
  verifier: string;
  challenge: string;
}> {
  // Generate a random 32-byte code verifier
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = base64UrlEncode(array);

  // SHA-256 hash the verifier to create the challenge
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const challenge = base64UrlEncode(new Uint8Array(digest));

  return { verifier, challenge };
}

/**
 * Builds the Keycloak authorization URL with PKCE parameters.
 */
export function buildAuthorizationUrl(params: {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  codeChallenge: string;
  forceLogin?: boolean;
}): string {
  const url = new URL(params.authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scopes.join(" "));
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (params.forceLogin) {
    url.searchParams.set("prompt", "login");
  }
  return url.toString();
}

/**
 * Exchanges the authorization code for tokens at the token endpoint.
 */
export async function exchangeCodeForTokens(params: {
  tokenEndpoint: string;
  code: string;
  verifier: string;
  clientId: string;
  redirectUri: string;
}): Promise<SmartTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.verifier,
  });

  const res = await fetch(params.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Token exchange failed: ${res.status} ${res.statusText} — ${errorText}`
    );
  }

  return res.json();
}

/**
 * Generates a cryptographically random state string.
 */
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// --- Helpers ---

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
