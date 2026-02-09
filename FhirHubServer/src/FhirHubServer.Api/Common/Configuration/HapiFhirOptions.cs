namespace FhirHubServer.Api.Common.Configuration;

public class HapiFhirOptions
{
    public string BaseUrl { get; set; } = "http://localhost:8080/fhir";
    public int TimeoutSeconds { get; set; } = 30;
}
