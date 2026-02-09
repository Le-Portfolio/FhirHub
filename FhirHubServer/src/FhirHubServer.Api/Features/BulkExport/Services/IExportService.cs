using FhirHubServer.Api.Features.BulkExport.DTOs;

namespace FhirHubServer.Api.Features.BulkExport.Services;

public interface IExportService
{
    Task<IEnumerable<ExportJobDto>> GetJobsAsync(CancellationToken ct = default);
    Task<ExportJobDto?> GetJobAsync(string id, CancellationToken ct = default);
    Task<ExportJobDto> CreateJobAsync(ExportConfigDto config, CancellationToken ct = default);
    Task CancelJobAsync(string id, CancellationToken ct = default);
    Task DeleteJobAsync(string id, CancellationToken ct = default);
    Task<ExportJobDto> RetryJobAsync(string id, CancellationToken ct = default);
    Task<IEnumerable<ResourceCountDto>> GetResourceCountsAsync(CancellationToken ct = default);
    Task<(string FilePath, string ContentType, string FileName)?> GetExportFileAsync(string id, CancellationToken ct = default);
}
