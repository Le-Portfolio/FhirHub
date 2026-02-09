using FhirHubServer.Api.Common.DTOs;

namespace FhirHubServer.Api.Features.PatientManagement.DTOs;

public record VitalSignDto(
    string? Id,
    CodeableConceptDto Code,
    object Value,
    string Unit,
    string EffectiveDateTime,
    ReferenceRangeDto? ReferenceRange,
    InterpretationDto? Interpretation,
    string Type,
    string Date,
    string Status
);

public record VitalChartDataDto(
    string Date,
    decimal? Systolic,
    decimal? Diastolic,
    decimal? HeartRate,
    decimal? Temperature,
    decimal? RespiratoryRate,
    decimal? OxygenSaturation,
    decimal? Weight,
    decimal? Height
);

public record ConditionDto(
    string Id,
    string Name,
    string Code,
    string Status,
    string Onset,
    string? Abatement,
    string Severity,
    string? Notes
);

public record MedicationDto(
    string Id,
    string Name,
    string Dosage,
    string Frequency,
    string Prescriber,
    string Status,
    string StartDate,
    string? EndDate,
    string? Instructions,
    string? Reason
);

public record LabResultDto(
    string Id,
    CodeableConceptDto Code,
    QuantityDto? ValueQuantity,
    string? ValueString,
    ReferenceRangeDto? ReferenceRange,
    InterpretationDto? Interpretation,
    string EffectiveDateTime,
    string Status,
    // Legacy fields for frontend compatibility
    string TestName,
    decimal Value,
    string Unit,
    string Date
);

public record LabPanelDto(
    string Id,
    string Name,
    string Date,
    string Status,
    IEnumerable<LabResultDto> Results
);

// Request DTOs for creating clinical data

public record CreateConditionRequest(
    string Name,
    string? IcdCode,
    string? OnsetDate,
    string Severity,
    string ClinicalStatus,
    string? Notes
);

public record CreateMedicationRequest(
    string Name,
    string? Dosage,
    string? Unit,
    string? Route,
    string Frequency,
    string? StartDate,
    string? Instructions
);

public record RecordVitalsRequest(
    decimal? Systolic,
    decimal? Diastolic,
    decimal? HeartRate,
    decimal? Temperature,
    decimal? RespiratoryRate,
    decimal? OxygenSaturation,
    decimal? Weight
);

public record OrderLabsRequest(
    IEnumerable<string> PanelIds,
    string Priority,
    string? Notes
);

public record LabOrderDto(
    string Id,
    string Status,
    IEnumerable<string> PanelNames,
    string Priority,
    string OrderedAt
);

// Validation response wrappers

/// <summary>
/// Represents a clinical warning for a vital sign or other clinical value.
/// </summary>
public record ClinicalWarning(
    string Field,
    WarningLevel Level,
    string Message,
    string? NormalRange = null
);

/// <summary>
/// Response wrapper that includes clinical warnings alongside the data.
/// </summary>
public record ValidatedResponse<T>(
    T Data,
    IEnumerable<ClinicalWarning> Warnings,
    IEnumerable<string> AlertsCreated
);

/// <summary>
/// Response for recording vitals, including warnings and any alerts created.
/// </summary>
public record RecordVitalsResponse(
    IEnumerable<VitalSignDto> Vitals,
    IEnumerable<ClinicalWarning> Warnings,
    IEnumerable<string> AlertsCreated
);

// Cross-patient search params and list DTOs

public record ObservationSearchParams(
    string? PatientName = null,
    string? Category = null,
    string? DateFrom = null,
    string? DateTo = null,
    int Page = 1,
    int PageSize = 20
);

public record ConditionSearchParams(
    string? PatientName = null,
    string? ClinicalStatus = null,
    string? Severity = null,
    string? Query = null,
    int Page = 1,
    int PageSize = 20
);

public record MedicationSearchParams(
    string? PatientName = null,
    string? Status = null,
    string? Query = null,
    int Page = 1,
    int PageSize = 20
);

public record ObservationListDto(
    string Id,
    string? PatientId,
    string PatientName,
    string Type,
    string Value,
    string Unit,
    string Date,
    string Status,
    string? Interpretation
);

public record ConditionListDto(
    string Id,
    string? PatientId,
    string PatientName,
    string Name,
    string Code,
    string Status,
    string Onset,
    string Severity
);

public record MedicationListDto(
    string Id,
    string? PatientId,
    string PatientName,
    string Name,
    string Dosage,
    string Frequency,
    string Status,
    string StartDate
);
