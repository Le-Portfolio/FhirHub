namespace FhirHubServer.Core.DTOs.Dashboard;

public record DashboardMetricDto(
    string Title,
    object Value,
    string Icon,
    TrendDto? Trend
);

public record TrendDto(
    decimal Value,
    string? Label,
    bool? IsPositive
);

public record AlertDto(
    string Id,
    string Title,
    string? Description,
    string Priority,
    string Status,
    string? PatientId,
    string? PatientName,
    string Timestamp
);

public record ActivityDto(
    string Id,
    string Type,
    string ResourceType,
    string Description,
    string User,
    string Timestamp
);

public record AlertSearchParams(
    string? Priority = null,
    string? Status = null,
    string? PatientName = null,
    int Page = 1,
    int PageSize = 20
);

public record ActivitySearchParams(
    string? Type = null,
    string? ResourceType = null,
    int Page = 1,
    int PageSize = 20
);
