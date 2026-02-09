namespace FhirHubServer.Api.Features.PatientManagement.DTOs;

public record TimelineEventDto(
    string Id,
    string ResourceType,
    string Title,
    string Description,
    string Date,
    string Status,
    Dictionary<string, string>? Details
);
