using FhirHubServer.Api.Configuration;
using Hl7.Fhir.Rest;
using Microsoft.Extensions.Options;

namespace FhirHubServer.Api.Infrastructure;

public interface IFhirClientFactory
{
    FhirClient CreateClient();
}

public class FhirClientFactory : IFhirClientFactory
{
    private readonly HapiFhirOptions _options;

    public FhirClientFactory(IOptions<HapiFhirOptions> options)
    {
        _options = options.Value;
    }

    public FhirClient CreateClient()
    {
        var settings = new FhirClientSettings
        {
            PreferredFormat = ResourceFormat.Json,
            Timeout = (int)TimeSpan.FromSeconds(_options.TimeoutSeconds).TotalMilliseconds
        };

        return new FhirClient(_options.BaseUrl, settings);
    }
}
