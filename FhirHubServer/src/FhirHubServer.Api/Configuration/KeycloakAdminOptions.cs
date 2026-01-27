namespace FhirHubServer.Api.Configuration;

public class KeycloakAdminOptions
{
    public string AdminApiBaseUrl { get; set; } = "http://localhost:8180";
    public string Realm { get; set; } = "fhirhub";
    public string BackendClientId { get; set; } = "fhirhub-backend";
    public string BackendClientSecret { get; set; } = string.Empty;
}
