import { NextResponse } from "next/server";

export async function POST() {
  const internalKeycloakUrl =
    process.env.KEYCLOAK_INTERNAL_URL || "http://keycloak:8080";
  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "fhirhub";
  const clientId =
    process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "fhirhub-frontend";

  try {
    const response = await fetch(
      `${internalKeycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "password",
          client_id: clientId,
          username: "guest",
          password: "guest",
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Guest login unavailable" },
        { status: response.status }
      );
    }

    const tokens = await response.json();
    return NextResponse.json(tokens, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Guest login unavailable" },
      { status: 500 }
    );
  }
}
