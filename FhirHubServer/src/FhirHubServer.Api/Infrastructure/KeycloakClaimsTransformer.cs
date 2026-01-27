using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;

namespace FhirHubServer.Api.Infrastructure;

public class KeycloakClaimsTransformer : IClaimsTransformation
{
    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        var identity = principal.Identity as ClaimsIdentity;
        if (identity is null || !identity.IsAuthenticated)
            return Task.FromResult(principal);

        // Extract roles from Keycloak's realm_access.roles claim
        var realmAccessClaim = identity.FindFirst("realm_access");
        if (realmAccessClaim is not null)
        {
            try
            {
                using var doc = JsonDocument.Parse(realmAccessClaim.Value);
                if (doc.RootElement.TryGetProperty("roles", out var rolesElement)
                    && rolesElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var role in rolesElement.EnumerateArray())
                    {
                        var roleValue = role.GetString();
                        if (!string.IsNullOrEmpty(roleValue)
                            && !identity.HasClaim(ClaimTypes.Role, roleValue))
                        {
                            identity.AddClaim(new Claim(ClaimTypes.Role, roleValue));
                        }
                    }
                }
            }
            catch (JsonException)
            {
                // Malformed realm_access claim — skip silently
            }
        }

        // Extract fhir_patient_id from JWT for patient own-data access
        var fhirPatientIdClaim = identity.FindFirst("fhir_patient_id");
        if (fhirPatientIdClaim is not null
            && !identity.HasClaim("fhir_patient_id", fhirPatientIdClaim.Value))
        {
            // Claim already present from JWT, no action needed
        }

        return Task.FromResult(principal);
    }
}
