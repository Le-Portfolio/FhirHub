using FhirHubServer.Core.DTOs.Export;
using FhirHubServer.Core.Interfaces;

namespace FhirHubServer.Core.Services;

public class ExportService
{
    private readonly IExportRepository _repository;

    public ExportService(IExportRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<ExportJobDto>> GetJobsAsync(CancellationToken ct = default)
        => _repository.GetJobsAsync(ct);

    public Task<ExportJobDto?> GetJobAsync(string id, CancellationToken ct = default)
        => _repository.GetJobAsync(id, ct);

    public Task<ExportJobDto> CreateJobAsync(ExportConfigDto config, CancellationToken ct = default)
        => _repository.CreateJobAsync(config, ct);

    public Task CancelJobAsync(string id, CancellationToken ct = default)
        => _repository.CancelJobAsync(id, ct);

    public Task DeleteJobAsync(string id, CancellationToken ct = default)
        => _repository.DeleteJobAsync(id, ct);

    public Task<ExportJobDto> RetryJobAsync(string id, CancellationToken ct = default)
        => _repository.RetryJobAsync(id, ct);

    public Task<IEnumerable<ResourceCountDto>> GetResourceCountsAsync(CancellationToken ct = default)
        => _repository.GetResourceCountsAsync(ct);

    public Task<(string FilePath, string ContentType, string FileName)?> GetExportFileAsync(string id, CancellationToken ct = default)
        => _repository.GetExportFileAsync(id, ct);
}
