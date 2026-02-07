namespace FhirHubServer.Api.Configuration;

public class SmartConfigOptions
{
    public string PublicIssuer { get; set; } = "http://localhost:8180/realms/fhirhub";
    public string[] ScopesSupported { get; set; } =
    [
        "openid",
        "fhirUser",
        "launch/patient",
        "patient/Patient.read",
        "patient/Observation.read",
        "patient/Condition.read",
        "patient/MedicationRequest.read",
        "patient/Encounter.read"
    ];
}
