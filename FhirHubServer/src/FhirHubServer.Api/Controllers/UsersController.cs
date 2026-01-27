using FhirHubServer.Api.Authorization;
using FhirHubServer.Api.Infrastructure;
using FhirHubServer.Core.DTOs.UserManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FhirHubServer.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Policy = AuthorizationPolicies.CanManageUsers)]
public class UsersController : ControllerBase
{
    private readonly IKeycloakAdminService _keycloakAdmin;

    public UsersController(IKeycloakAdminService keycloakAdmin)
    {
        _keycloakAdmin = keycloakAdmin;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] UserSearchParams searchParams, CancellationToken ct)
    {
        var users = await _keycloakAdmin.GetUsersAsync(searchParams, ct);
        var total = await _keycloakAdmin.GetUserCountAsync(searchParams, ct);
        return Ok(new
        {
            data = users,
            total,
            page = searchParams.Page,
            pageSize = searchParams.PageSize,
            totalPages = (int)Math.Ceiling((double)total / searchParams.PageSize),
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
    {
        var user = await _keycloakAdmin.GetUserByIdAsync(id, ct);
        if (user is null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        var userId = await _keycloakAdmin.CreateUserAsync(request, ct);
        var user = await _keycloakAdmin.GetUserByIdAsync(userId, ct);
        return Created($"/api/users/{userId}", user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        await _keycloakAdmin.UpdateUserAsync(id, request, ct);
        var user = await _keycloakAdmin.GetUserByIdAsync(id, ct);
        return Ok(user);
    }

    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(string id, CancellationToken ct)
    {
        await _keycloakAdmin.DeactivateUserAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id}/reactivate")]
    public async Task<IActionResult> Reactivate(string id, CancellationToken ct)
    {
        await _keycloakAdmin.ReactivateUserAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id}/send-password-reset")]
    public async Task<IActionResult> SendPasswordReset(string id, CancellationToken ct)
    {
        await _keycloakAdmin.SendPasswordResetEmailAsync(id, ct);
        return NoContent();
    }

    [HttpGet("{id}/roles")]
    public async Task<IActionResult> GetRoles(string id, CancellationToken ct)
    {
        var roles = await _keycloakAdmin.GetUserRolesAsync(id, ct);
        return Ok(roles);
    }

    [HttpPut("{id}/roles")]
    public async Task<IActionResult> AssignRoles(string id, [FromBody] AssignRolesRequest request, CancellationToken ct)
    {
        // Get current roles and compute diff
        var currentRoles = await _keycloakAdmin.GetUserRolesAsync(id, ct);
        var currentRoleNames = currentRoles.Select(r => r.Name).ToList();

        var rolesToAdd = request.Roles.Except(currentRoleNames, StringComparer.OrdinalIgnoreCase).ToList();
        var rolesToRemove = currentRoleNames.Except(request.Roles, StringComparer.OrdinalIgnoreCase).ToList();

        if (rolesToAdd.Count > 0)
            await _keycloakAdmin.AssignRolesAsync(id, rolesToAdd, ct);
        if (rolesToRemove.Count > 0)
            await _keycloakAdmin.RemoveRolesAsync(id, rolesToRemove, ct);

        var updatedRoles = await _keycloakAdmin.GetUserRolesAsync(id, ct);
        return Ok(updatedRoles);
    }

    [HttpGet("{id}/sessions")]
    public async Task<IActionResult> GetSessions(string id, CancellationToken ct)
    {
        var sessions = await _keycloakAdmin.GetUserSessionsAsync(id, ct);
        return Ok(sessions);
    }

    [HttpDelete("{id}/sessions")]
    public async Task<IActionResult> TerminateSessions(string id, CancellationToken ct)
    {
        await _keycloakAdmin.TerminateUserSessionsAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id}/require-mfa")]
    public async Task<IActionResult> RequireMfa(string id, CancellationToken ct)
    {
        await _keycloakAdmin.RequireMfaSetupAsync(id, ct);
        return NoContent();
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetAvailableRoles(CancellationToken ct)
    {
        var roles = await _keycloakAdmin.GetAvailableRolesAsync(ct);
        return Ok(roles);
    }
}
