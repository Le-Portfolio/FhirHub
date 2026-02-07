using FhirHubServer.Core.DTOs.Common;
using FhirHubServer.Core.DTOs.Dashboard;
using FhirHubServer.Core.Interfaces;

namespace FhirHubServer.Core.Services;

public class DashboardService
{
    private readonly IDashboardRepository _repository;

    public DashboardService(IDashboardRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<DashboardMetricDto>> GetMetricsAsync(CancellationToken ct = default)
        => _repository.GetMetricsAsync(ct);

    public Task<DashboardOverviewDto> GetOverviewAsync(string? window = null, CancellationToken ct = default)
        => _repository.GetOverviewAsync(window, ct);

    public Task<IEnumerable<AlertDto>> GetAlertsAsync(int limit, CancellationToken ct = default)
        => _repository.GetAlertsAsync(limit, ct);

    public Task<IEnumerable<ActivityDto>> GetActivitiesAsync(int limit, CancellationToken ct = default)
        => _repository.GetActivitiesAsync(limit, ct);

    public Task AcknowledgeAlertAsync(string id, CancellationToken ct = default)
        => _repository.AcknowledgeAlertAsync(id, ct);

    public Task ResolveAlertAsync(string id, CancellationToken ct = default)
        => _repository.ResolveAlertAsync(id, ct);

    // Paginated queries
    public Task<PaginatedResponse<AlertDto>> GetAlertsPaginatedAsync(AlertSearchParams searchParams, CancellationToken ct = default)
        => _repository.GetAlertsPaginatedAsync(searchParams, ct);

    public Task<PaginatedResponse<ActivityDto>> GetActivitiesPaginatedAsync(ActivitySearchParams searchParams, CancellationToken ct = default)
        => _repository.GetActivitiesPaginatedAsync(searchParams, ct);
}
