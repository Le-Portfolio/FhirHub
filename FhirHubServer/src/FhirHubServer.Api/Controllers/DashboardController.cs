using FhirHubServer.Api.Authorization;
using FhirHubServer.Core.DTOs.Dashboard;
using FhirHubServer.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FhirHubServer.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("metrics")]
    [Authorize(Policy = AuthorizationPolicies.CanViewDashboard)]
    public async Task<IActionResult> GetMetrics(CancellationToken ct)
    {
        var result = await _dashboardService.GetMetricsAsync(ct);
        return Ok(result);
    }

    [HttpGet("overview")]
    [Authorize(Policy = AuthorizationPolicies.CanViewDashboard)]
    public async Task<IActionResult> GetOverview([FromQuery] string? window = "7d", CancellationToken ct = default)
    {
        var result = await _dashboardService.GetOverviewAsync(window, ct);
        return Ok(result);
    }

    [HttpGet("alerts")]
    [Authorize(Policy = AuthorizationPolicies.CanViewDashboard)]
    public async Task<IActionResult> GetAlerts([FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var result = await _dashboardService.GetAlertsAsync(limit, ct);
        return Ok(result);
    }

    [HttpGet("activities")]
    [Authorize(Policy = AuthorizationPolicies.CanViewDashboard)]
    public async Task<IActionResult> GetActivities([FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var result = await _dashboardService.GetActivitiesAsync(limit, ct);
        return Ok(result);
    }

    [HttpPost("alerts/{id}/acknowledge")]
    [Authorize(Policy = AuthorizationPolicies.CanManageAlerts)]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> AcknowledgeAlert(string id, CancellationToken ct)
    {
        await _dashboardService.AcknowledgeAlertAsync(id, ct);
        return NoContent();
    }

    [HttpPost("alerts/{id}/resolve")]
    [Authorize(Policy = AuthorizationPolicies.CanManageAlerts)]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> ResolveAlert(string id, CancellationToken ct)
    {
        await _dashboardService.ResolveAlertAsync(id, ct);
        return NoContent();
    }

    [HttpGet("alerts/all")]
    [Authorize(Policy = AuthorizationPolicies.CanViewDashboard)]
    public async Task<IActionResult> GetAlertsPaginated([FromQuery] AlertSearchParams searchParams, CancellationToken ct)
    {
        var result = await _dashboardService.GetAlertsPaginatedAsync(searchParams, ct);
        return Ok(result);
    }

    [HttpGet("activities/all")]
    [Authorize(Policy = AuthorizationPolicies.CanViewDashboard)]
    public async Task<IActionResult> GetActivitiesPaginated([FromQuery] ActivitySearchParams searchParams, CancellationToken ct)
    {
        var result = await _dashboardService.GetActivitiesPaginatedAsync(searchParams, ct);
        return Ok(result);
    }
}
