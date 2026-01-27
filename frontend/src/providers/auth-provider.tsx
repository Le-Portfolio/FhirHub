"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type Keycloak from "keycloak-js";
import {
  getKeycloak,
  initKeycloak,
  isKeycloakInitialized,
} from "@/lib/keycloak";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
}

interface AuthContextValue {
  authenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractUser(keycloak: Keycloak): AuthUser | null {
  const parsed = keycloak.tokenParsed;
  if (!parsed) return null;

  const p = parsed as Record<string, unknown>;
  const realmAccess = p.realm_access as { roles?: string[] } | undefined;
  const realmRoles: string[] = Array.isArray(realmAccess?.roles)
    ? realmAccess.roles
    : [];

  const givenName = (p.given_name as string) || "";
  const familyName = (p.family_name as string) || "";
  const preferredUsername = (p.preferred_username as string) || "";
  const fullName = `${givenName} ${familyName}`.trim() || preferredUsername;

  return {
    id: parsed.sub ?? "",
    email: (p.email as string) || "",
    firstName: givenName,
    lastName: familyName,
    fullName,
    roles: realmRoles,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);
  const kcRef = useRef<Keycloak | null>(null);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const keycloak = getKeycloak();
    kcRef.current = keycloak;

    const setupAuth = (auth: boolean) => {
      if (auth) {
        setAuthenticated(true);
        setToken(keycloak.token ?? null);
        setUser(extractUser(keycloak));
        sessionStorage.setItem("kc-authenticated", "true");

        keycloak.onTokenExpired = () => {
          keycloak
            .updateToken(30)
            .then((refreshed) => {
              if (refreshed) {
                setToken(keycloak.token ?? null);
              }
            })
            .catch(() => {
              setAuthenticated(false);
              setToken(null);
              setUser(null);
              sessionStorage.removeItem("kc-authenticated");
            });
        };
      }
      setLoading(false);
    };

    // If Keycloak was already initialized (e.g. check-sso on the landing page),
    // reuse its state instead of calling init() again (which would throw).
    if (isKeycloakInitialized()) {
      if (keycloak.authenticated) {
        setupAuth(true);
      } else {
        // Initialized but not authenticated — redirect to Keycloak login.
        // keycloak.login() is broken in v26.0.0 (doesn't await async createLoginUrl),
        // so we build the URL ourselves.
        keycloak
          .createLoginUrl({
            redirectUri: window.location.origin + "/dashboard",
          })
          .then((url) => window.location.assign(url));
      }
      return;
    }

    initKeycloak({ onLoad: "login-required" })
      .then(setupAuth)
      .catch((err) => {
        console.error("Keycloak init failed", err);
        sessionStorage.removeItem("kc-authenticated");
        setLoading(false);
      });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("kc-authenticated");
    kcRef.current?.logout({ redirectUri: window.location.origin });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authenticated, token, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
