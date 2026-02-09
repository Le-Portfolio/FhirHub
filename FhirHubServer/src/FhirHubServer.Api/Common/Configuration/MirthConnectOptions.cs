namespace FhirHubServer.Api.Common.Configuration;

public class MirthConnectOptions
{
    public string BaseUrl { get; set; } = "https://mirth:8443/api";
    public string Username { get; set; } = "admin";
    public string Password { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 30;
}
