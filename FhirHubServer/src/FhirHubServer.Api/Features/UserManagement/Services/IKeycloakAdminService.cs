using System.Text.Json;
using FhirHubServer.Api.Features.UserManagement.DTOs;

namespace FhirHubServer.Api.Features.UserManagement.Services;

public interface IKeycloakAdminService
{
    Task<List<KeycloakUserDto>> GetUsersAsync(UserSearchParams searchParams, CancellationToken ct = default);
    Task<int> GetUserCountAsync(UserSearchParams searchParams, CancellationToken ct = default);
    Task<KeycloakUserDto?> GetUserByIdAsync(string userId, CancellationToken ct = default);
    Task<string> CreateUserAsync(CreateUserRequest request, CancellationToken ct = default);
    Task UpdateUserAsync(string userId, UpdateUserRequest request, CancellationToken ct = default);
    Task DeactivateUserAsync(string userId, CancellationToken ct = default);
    Task ReactivateUserAsync(string userId, CancellationToken ct = default);
    Task SendInvitationEmailAsync(string userId, CancellationToken ct = default);
    Task SendPasswordResetEmailAsync(string userId, CancellationToken ct = default);
    Task<List<KeycloakRoleDto>> GetUserRolesAsync(string userId, CancellationToken ct = default);
    Task AssignRolesAsync(string userId, List<string> roleNames, CancellationToken ct = default);
    Task RemoveRolesAsync(string userId, List<string> roleNames, CancellationToken ct = default);
    Task<List<KeycloakSessionDto>> GetUserSessionsAsync(string userId, CancellationToken ct = default);
    Task TerminateUserSessionsAsync(string userId, CancellationToken ct = default);
    Task RequireMfaSetupAsync(string userId, CancellationToken ct = default);
    Task<List<KeycloakRoleDto>> GetAvailableRolesAsync(CancellationToken ct = default);
    Task<List<JsonElement>> GetUserEventsAsync(string? userId, string? type, int first, int max, CancellationToken ct = default);
    Task<List<JsonElement>> GetAdminEventsAsync(int first, int max, CancellationToken ct = default);
}
