import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5197";
const keycloakUrl =
  process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8180";
const hapiFhirUrl =
  process.env.NEXT_PUBLIC_HAPI_FHIR_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ${apiUrl} ${keycloakUrl} ${hapiFhirUrl}; frame-src 'self' ${keycloakUrl}; frame-ancestors 'self'`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
