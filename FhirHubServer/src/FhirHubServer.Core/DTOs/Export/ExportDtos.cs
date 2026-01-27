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
    string? Error
);

public record ExportConfigDto(
    IEnumerable<string> ResourceTypes,
    string Format,
    bool IncludeReferences
);
