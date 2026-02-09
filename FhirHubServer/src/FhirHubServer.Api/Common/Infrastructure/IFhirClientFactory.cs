using Hl7.Fhir.Rest;

namespace FhirHubServer.Api.Common.Infrastructure;

public interface IFhirClientFactory
{
    FhirClient CreateClient();
}
