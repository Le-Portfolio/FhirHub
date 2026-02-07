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

public record DashboardOverviewDto(
    IEnumerable<DashboardMetricDto> SummaryKpis,
    ClinicalOperationsDto ClinicalOperations,
    PlatformSloDto PlatformSlo,
    SecurityPostureDto SecurityPosture,
    InteroperabilityStatusDto Interoperability,
    IEnumerable<SystemServiceStatusDto> SystemStatus,
    string WindowLabel,
    string GeneratedAt
);

public record ClinicalOperationsDto(
    decimal CriticalLabTurnaroundMinutesP50,
    decimal CriticalLabTurnaroundMinutesP95,
    decimal AlertAcknowledgeMinutesP50,
    decimal AlertAcknowledgeMinutesP95,
    int HighRiskPatients,
    TrendDto? HighRiskTrend
);

public record PlatformSloDto(
    decimal ApiAvailabilityPercent30d,
    int ApiLatencyP50Ms,
    int ApiLatencyP95Ms,
    int ApiLatencyP99Ms,
    decimal ErrorRatePercent,
    decimal ExportSuccessRatePercent
);

public record SecurityPostureDto(
    decimal MfaEnrollmentPercent,
    int PrivilegedActions24h,
    int FailedLogins24h,
    int AuditEvents24h,
    decimal AuditCoveragePercent
);

public record InteroperabilityStatusDto(
    int SmartLaunches24h,
    decimal SmartLaunchSuccessRatePercent,
    int BulkExports24h,
    decimal BulkExportSuccessRatePercent,
    int FhirResourceTypesServed
);

public record SystemServiceStatusDto(
    string Name,
    string Status,
    int LatencyMs,
    decimal UptimePercent30d
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
