using FhirHubServer.Api.Authorization;
using FhirHubServer.Api.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FhirHubServer.Api.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize(Policy = AuthorizationPolicies.CanViewAuditLogs)]
public class AuditLogController : ControllerBase
{
    private readonly IKeycloakAdminService _keycloakAdmin;

    public AuditLogController(IKeycloakAdminService keycloakAdmin)
    {
        _keycloakAdmin = keycloakAdmin;
    }

    [HttpGet("events")]
    public async Task<IActionResult> GetUserEvents(
        [FromQuery] string? userId,
        [FromQuery] string? type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var first = (page - 1) * pageSize;
        var events = await _keycloakAdmin.GetUserEventsAsync(userId, type, first, pageSize, ct);
        return Ok(events);
    }

    [HttpGet("admin-events")]
    public async Task<IActionResult> GetAdminEvents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var first = (page - 1) * pageSize;
        var events = await _keycloakAdmin.GetAdminEventsAsync(first, pageSize, ct);
        return Ok(events);
    }
}
