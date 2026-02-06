export const APP_NAME = "FhirHub";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5197";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
} as const;
