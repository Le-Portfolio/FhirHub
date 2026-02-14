using FhirHubServer.Api.Features.Hl7Ingestion.Models;
using NHapi.Base.Model;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Handlers;

public interface IHl7MessageHandler
{
    bool CanHandle(string messageType, string triggerEvent);
    Task<IngestResult> HandleAsync(IMessage message, CancellationToken ct = default);
}
