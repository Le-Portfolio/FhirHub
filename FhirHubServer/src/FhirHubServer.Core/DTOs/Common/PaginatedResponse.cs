namespace FhirHubServer.Core.DTOs.Common;

public record PaginatedResponse<T>(
    IEnumerable<T> Data,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);

public record ApiError(
    string Code,
    string Message,
    int Status = 500
);
