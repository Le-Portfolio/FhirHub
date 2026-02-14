using Hl7.Fhir.Model;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Services;

public interface IFhirBundleService
{
    Task<Bundle> SubmitTransactionAsync(IEnumerable<Resource> resources, CancellationToken ct = default);
}
