namespace FhirHubServer.Api.Features.Hl7Ingestion.Models;

public record IngestResult(
    bool Success,
    string MessageControlId,
    string MessageType,
    List<string> ResourcesCreated,
    string? Error = null);
