namespace FhirHubServer.Api.Features.PatientManagement.DTOs;

public record PatientListDto(
    string Id,
    string Name,
    string BirthDate,
    string Gender,
    string Mrn,
    string? Phone,
    string? Email,
    string? Address,
    string Status,
    int? AlertCount,
    IEnumerable<string> Conditions
);

public record PatientDetailDto(
    string Id,
    string Name,
    string BirthDate,
    string Gender,
    string Mrn,
    string? Phone,
    string? Email,
    string? Address,
    string Status,
    int? AlertCount,
    IEnumerable<string> Conditions,
    string? LastVisit,
    string? PrimaryPhysician
);

public record PatientSummaryDto(
    string Id,
    string Name,
    string BirthDate,
    string Gender,
    string Mrn,
    int? AlertCount
);

public record PatientSearchParams(
    string? Query = null,
    string? Gender = null,
    string? Status = null,
    int Page = 1,
    int PageSize = 10,
    string? SortBy = null,
    string? SortOrder = null
);

public record CreatePatientRequest(
    string FirstName,
    string LastName,
    string BirthDate,
    string Gender,
    string? Phone = null,
    string? Email = null,
    string? AddressLine = null,
    string? City = null,
    string? State = null,
    string? PostalCode = null,
    string? Mrn = null
);
