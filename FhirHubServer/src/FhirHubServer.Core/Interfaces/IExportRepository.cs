using FhirHubServer.Core.DTOs.Export;

namespace FhirHubServer.Core.Interfaces;

public interface IExportRepository
{
    Task<IEnumerable<ExportJobDto>> GetJobsAsync(CancellationToken ct = default);
    Task<ExportJobDto?> GetJobAsync(string id, CancellationToken ct = default);
    Task<ExportJobDto> CreateJobAsync(ExportConfigDto config, CancellationToken ct = default);
    Task CancelJobAsync(string id, CancellationToken ct = default);
    Task DeleteJobAsync(string id, CancellationToken ct = default);
    Task<ExportJobDto> RetryJobAsync(string id, CancellationToken ct = default);
}
