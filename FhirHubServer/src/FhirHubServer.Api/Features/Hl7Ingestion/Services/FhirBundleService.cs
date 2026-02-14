using FhirHubServer.Api.Common.DependencyInjection;
using FhirHubServer.Api.Common.Infrastructure;
using Hl7.Fhir.Model;
using Hl7.Fhir.Rest;
using Microsoft.Extensions.Logging;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Services;

public class FhirBundleService : IFhirBundleService, IScopedService
{
    private readonly IFhirClientFactory _clientFactory;
    private readonly ILogger<FhirBundleService> _logger;

    public FhirBundleService(IFhirClientFactory clientFactory, ILogger<FhirBundleService> logger)
    {
        _clientFactory = clientFactory;
        _logger = logger;
    }

    public async Task<Bundle> SubmitTransactionAsync(IEnumerable<Resource> resources, CancellationToken ct = default)
    {
        var bundle = new Bundle
        {
            Type = Bundle.BundleType.Transaction
        };

        foreach (var resource in resources)
        {
            var entry = new Bundle.EntryComponent
            {
                Resource = resource,
                Request = CreateRequest(resource)
            };

            // Use fullUrl with UUID for internal references
            entry.FullUrl = resource.Id?.StartsWith("urn:uuid:") == true
                ? resource.Id
                : $"urn:uuid:{Guid.NewGuid()}";

            bundle.Entry.Add(entry);
        }

        _logger.LogDebug("Submitting FHIR transaction bundle with {Count} entries", bundle.Entry.Count);

        var client = _clientFactory.CreateClient();
        var response = await client.TransactionAsync(bundle);

        _logger.LogInformation("FHIR transaction completed with {Count} entries", response.Entry?.Count ?? 0);

        return response;
    }

    private static Bundle.RequestComponent CreateRequest(Resource resource)
    {
        return resource switch
        {
            // Conditional create for Patient by MRN — avoids duplicates
            Patient patient => new Bundle.RequestComponent
            {
                Method = Bundle.HTTPVerb.POST,
                Url = "Patient",
                IfNoneExist = GetPatientConditional(patient)
            },
            // Standard create for other resources
            _ => new Bundle.RequestComponent
            {
                Method = Bundle.HTTPVerb.POST,
                Url = resource.TypeName
            }
        };
    }

    private static string? GetPatientConditional(Patient patient)
    {
        var mrn = patient.Identifier
            .FirstOrDefault(i => i.System == "http://hospital.example.org/mrn");

        if (mrn != null)
            return $"identifier={mrn.System}|{mrn.Value}";

        return null;
    }
}
