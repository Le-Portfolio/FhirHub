using FhirHubServer.Api.Common.Configuration;
using FhirHubServer.Api.Common.DependencyInjection;
using Hl7.Fhir.Rest;
using Microsoft.Extensions.Options;

namespace FhirHubServer.Api.Common.Infrastructure;

public class FhirClientFactory : IFhirClientFactory, ISingletonService
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
