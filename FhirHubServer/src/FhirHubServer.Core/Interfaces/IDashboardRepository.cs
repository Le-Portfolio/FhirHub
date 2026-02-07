using FhirHubServer.Core.DTOs.Common;
using FhirHubServer.Core.DTOs.Dashboard;

namespace FhirHubServer.Core.Interfaces;

public interface IDashboardRepository
{
    Task<IEnumerable<DashboardMetricDto>> GetMetricsAsync(CancellationToken ct = default);
    Task<DashboardOverviewDto> GetOverviewAsync(string? window = null, CancellationToken ct = default);
    Task<IEnumerable<AlertDto>> GetAlertsAsync(int limit, CancellationToken ct = default);
    Task<IEnumerable<ActivityDto>> GetActivitiesAsync(int limit, CancellationToken ct = default);
    Task AcknowledgeAlertAsync(string id, CancellationToken ct = default);
    Task ResolveAlertAsync(string id, CancellationToken ct = default);

    // Paginated queries
    Task<PaginatedResponse<AlertDto>> GetAlertsPaginatedAsync(AlertSearchParams searchParams, CancellationToken ct = default);
    Task<PaginatedResponse<ActivityDto>> GetActivitiesPaginatedAsync(ActivitySearchParams searchParams, CancellationToken ct = default);
}
