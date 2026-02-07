namespace FhirHubServer.Core.DTOs.Export;

public record ExportJobDto(
    string Id,
    string Status,
    IEnumerable<string> ResourceTypes,
    string Format,
    string CreatedAt,
    string? CompletedAt,
    int? Progress,
    string? DownloadUrl,
    string? Error,
    long? FileSize,
    string? ExpiresAt
);

public record ExportConfigDto(
    IEnumerable<string> ResourceTypes,
    string Format,
    bool IncludeReferences,
    DateRangeDto? DateRange = null
);

public record DateRangeDto(string Start, string End);

public record ResourceCountDto(string ResourceType, int Count);
