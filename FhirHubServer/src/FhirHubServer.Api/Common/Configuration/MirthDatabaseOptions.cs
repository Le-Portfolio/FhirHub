namespace FhirHubServer.Api.Common.Configuration;

public class MirthDatabaseOptions
{
    public string ConnectionString { get; set; } = "";
    public int CommandTimeout { get; set; } = 30;
}
