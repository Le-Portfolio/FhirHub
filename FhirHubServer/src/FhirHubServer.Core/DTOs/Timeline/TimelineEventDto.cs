namespace FhirHubServer.Core.DTOs.Timeline;

public record TimelineEventDto(
    string Id,
    string ResourceType,
    string Title,
    string Description,
    string Date,
    string Status,
    Dictionary<string, string>? Details
);
