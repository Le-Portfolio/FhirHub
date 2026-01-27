using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FhirHubServer.Api.Configuration;
using FhirHubServer.Core.DTOs.UserManagement;
using Microsoft.Extensions.Options;

namespace FhirHubServer.Api.Infrastructure;

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

public class KeycloakAdminService : IKeycloakAdminService
{
    private readonly HttpClient _httpClient;
    private readonly KeycloakAdminOptions _options;
    private readonly ILogger<KeycloakAdminService> _logger;
    private string? _cachedToken;
    private DateTime _tokenExpiry = DateTime.MinValue;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public KeycloakAdminService(
        HttpClient httpClient,
        IOptions<KeycloakAdminOptions> options,
        ILogger<KeycloakAdminService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    private string AdminBaseUrl => $"{_options.AdminApiBaseUrl}/admin/realms/{_options.Realm}";

    private async Task EnsureAccessTokenAsync(CancellationToken ct)
    {
        if (_cachedToken is not null && DateTime.UtcNow < _tokenExpiry)
            return;

        var tokenUrl = $"{_options.AdminApiBaseUrl}/realms/{_options.Realm}/protocol/openid-connect/token";
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials",
            ["client_id"] = _options.BackendClientId,
            ["client_secret"] = _options.BackendClientSecret,
        });

        var response = await _httpClient.PostAsync(tokenUrl, content, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>(ct);
        _cachedToken = json.GetProperty("access_token").GetString();
        var expiresIn = json.GetProperty("expires_in").GetInt32();
        _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 30); // 30s buffer
    }

    private async Task<HttpRequestMessage> CreateRequestAsync(HttpMethod method, string url, CancellationToken ct)
    {
        await EnsureAccessTokenAsync(ct);
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _cachedToken);
        return request;
    }

    private async Task<T> SendAsync<T>(HttpRequestMessage request, CancellationToken ct)
    {
        var response = await _httpClient.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>(JsonOptions, ct))!;
    }

    private async Task SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var response = await _httpClient.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
    }

    public async Task<List<KeycloakUserDto>> GetUsersAsync(UserSearchParams searchParams, CancellationToken ct)
    {
        var first = (searchParams.Page - 1) * searchParams.PageSize;
        var query = $"?first={first}&max={searchParams.PageSize}&briefRepresentation=false";
        if (!string.IsNullOrEmpty(searchParams.Search))
            query += $"&search={Uri.EscapeDataString(searchParams.Search)}";
        if (searchParams.Enabled.HasValue)
            query += $"&enabled={searchParams.Enabled.Value.ToString().ToLower()}";

        var request = await CreateRequestAsync(HttpMethod.Get, $"{AdminBaseUrl}/users{query}", ct);
        var users = await SendAsync<List<KeycloakUserRepresentation>>(request, ct);

        var result = new List<KeycloakUserDto>();
        foreach (var u in users)
        {
            var roles = await GetUserRolesAsync(u.Id, ct);
            result.Add(MapToDto(u, roles.Select(r => r.Name).ToList()));
        }
        return result;
    }

    public async Task<int> GetUserCountAsync(UserSearchParams searchParams, CancellationToken ct)
    {
        var query = "?";
        if (!string.IsNullOrEmpty(searchParams.Search))
            query += $"search={Uri.EscapeDataString(searchParams.Search)}&";
        if (searchParams.Enabled.HasValue)
            query += $"enabled={searchParams.Enabled.Value.ToString().ToLower()}&";

        var request = await CreateRequestAsync(HttpMethod.Get, $"{AdminBaseUrl}/users/count{query.TrimEnd('&', '?')}", ct);
        var response = await _httpClient.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        var countStr = await response.Content.ReadAsStringAsync(ct);
        return int.Parse(countStr);
    }

    public async Task<KeycloakUserDto?> GetUserByIdAsync(string userId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get, $"{AdminBaseUrl}/users/{userId}", ct);
        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode) return null;

        var user = await response.Content.ReadFromJsonAsync<KeycloakUserRepresentation>(JsonOptions, ct);
        if (user is null) return null;

        var roles = await GetUserRolesAsync(userId, ct);
        return MapToDto(user, roles.Select(r => r.Name).ToList());
    }

    public async Task<string> CreateUserAsync(CreateUserRequest createRequest, CancellationToken ct)
    {
        var kcUser = new
        {
            username = createRequest.Email,
            email = createRequest.Email,
            firstName = createRequest.FirstName,
            lastName = createRequest.LastName,
            enabled = true,
            emailVerified = false,
        };

        var request = await CreateRequestAsync(HttpMethod.Post, $"{AdminBaseUrl}/users", ct);
        request.Content = new StringContent(JsonSerializer.Serialize(kcUser, JsonOptions), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        // Extract user ID from Location header
        var location = response.Headers.Location?.ToString() ?? "";
        var userId = location.Split('/').Last();

        // Assign roles if specified
        if (createRequest.Roles.Count > 0)
        {
            await AssignRolesAsync(userId, createRequest.Roles, ct);
        }

        // Send invitation email if requested
        if (createRequest.SendInvitation)
        {
            await SendInvitationEmailAsync(userId, ct);
        }

        return userId;
    }

    public async Task UpdateUserAsync(string userId, UpdateUserRequest updateRequest, CancellationToken ct)
    {
        // Get current user first
        var getRequest = await CreateRequestAsync(HttpMethod.Get, $"{AdminBaseUrl}/users/{userId}", ct);
        var currentUser = await SendAsync<KeycloakUserRepresentation>(getRequest, ct);

        var updated = new
        {
            firstName = updateRequest.FirstName ?? currentUser.FirstName,
            lastName = updateRequest.LastName ?? currentUser.LastName,
            email = updateRequest.Email ?? currentUser.Email,
        };

        var request = await CreateRequestAsync(HttpMethod.Put, $"{AdminBaseUrl}/users/{userId}", ct);
        request.Content = new StringContent(JsonSerializer.Serialize(updated, JsonOptions), Encoding.UTF8, "application/json");
        await SendAsync(request, ct);
    }

    public async Task DeactivateUserAsync(string userId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Put, $"{AdminBaseUrl}/users/{userId}", ct);
        request.Content = new StringContent(JsonSerializer.Serialize(new { enabled = false }, JsonOptions), Encoding.UTF8, "application/json");
        await SendAsync(request, ct);
    }

    public async Task ReactivateUserAsync(string userId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Put, $"{AdminBaseUrl}/users/{userId}", ct);
        request.Content = new StringContent(JsonSerializer.Serialize(new { enabled = true }, JsonOptions), Encoding.UTF8, "application/json");
        await SendAsync(request, ct);
    }

    public async Task SendInvitationEmailAsync(string userId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Put,
            $"{AdminBaseUrl}/users/{userId}/execute-actions-email", ct);
        request.Content = new StringContent(
            JsonSerializer.Serialize(new[] { "VERIFY_EMAIL", "UPDATE_PASSWORD" }, JsonOptions),
            Encoding.UTF8, "application/json");
        await SendAsync(request, ct);
    }

    public async Task SendPasswordResetEmailAsync(string userId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Put,
            $"{AdminBaseUrl}/users/{userId}/execute-actions-email", ct);
        request.Content = new StringContent(
            JsonSerializer.Serialize(new[] { "UPDATE_PASSWORD" }, JsonOptions),
            Encoding.UTF8, "application/json");
        await SendAsync(request, ct);
    }

    public async Task<List<KeycloakRoleDto>> GetUserRolesAsync(string userId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get,
            $"{AdminBaseUrl}/users/{userId}/role-mappings/realm", ct);
        var roles = await SendAsync<List<KeycloakRoleRepresentation>>(request, ct);
        return roles.Select(r => new KeycloakRoleDto
        {
            Id = r.Id,
            Name = r.Name,
            Description = r.Description,
        }).ToList();
    }

    public async Task AssignRolesAsync(string userId, List<string> roleNames, CancellationToken ct)
    {
        var availableRoles = await GetAvailableRolesAsync(ct);
        var rolesToAssign = availableRoles
            .Where(r => roleNames.Contains(r.Name, StringComparer.OrdinalIgnoreCase))
            .Select(r => new { id = r.Id, name = r.Name })
            .ToList();

        if (rolesToAssign.Count == 0) return;

        var request = await CreateRequestAsync(HttpMethod.Post,
            $"{AdminBaseUrl}/users/{userId}/role-mappings/realm", ct);
        request.Content = new StringContent(
            JsonSerializer.Serialize(rolesToAssign, JsonOptions),
            Encoding.UTF8, "application/json");
        await SendAsync(request, ct);
    }

    public async Task RemoveRolesAsync(string userId, List<string> roleNames, CancellationToken ct)
    {
        var currentRoles = await GetUserRolesAsync(userId, ct);
        var rolesToRemove = currentRoles
            .Where(r => roleNames.Contains(r.Name, StringComparer.OrdinalIgnoreCase))
            .Select(r => new { id = r.Id, name = r.Name })
            .ToList();

        if (rolesToRemove.Count == 0) return;

        var request = await CreateRequestAsync(HttpMethod.Delete,
            $"{AdminBaseUrl}/users/{userId}/role-mappings/realm", ct);
        request.Content = new StringContent(
            JsonSerializer.Serialize(rolesToRemove, JsonOptions),
            Encoding.UTF8, "application/json");
        await SendAsync(request, ct);
    }

    public async Task<List<KeycloakSessionDto>> GetUserSessionsAsync(string userId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get,
            $"{AdminBaseUrl}/users/{userId}/sessions", ct);
        var sessions = await SendAsync<List<KeycloakSessionRepresentation>>(request, ct);
        return sessions.Select(s => new KeycloakSessionDto
        {
            Id = s.Id,
            IpAddress = s.IpAddress ?? "",
            Start = s.Start,
            LastAccess = s.LastAccess,
            Clients = s.Clients,
        }).ToList();
    }

    public async Task TerminateUserSessionsAsync(string userId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Post,
            $"{AdminBaseUrl}/users/{userId}/logout", ct);
        await SendAsync(request, ct);
    }

    public async Task RequireMfaSetupAsync(string userId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Put,
            $"{AdminBaseUrl}/users/{userId}/execute-actions-email", ct);
        request.Content = new StringContent(
            JsonSerializer.Serialize(new[] { "CONFIGURE_OTP" }, JsonOptions),
            Encoding.UTF8, "application/json");
        await SendAsync(request, ct);
    }

    public async Task<List<KeycloakRoleDto>> GetAvailableRolesAsync(CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get, $"{AdminBaseUrl}/roles", ct);
        var roles = await SendAsync<List<KeycloakRoleRepresentation>>(request, ct);
        return roles
            .Where(r => !r.Name.StartsWith("default-roles-") && r.Name != "offline_access" && r.Name != "uma_authorization")
            .Select(r => new KeycloakRoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
            }).ToList();
    }

    public async Task<List<JsonElement>> GetUserEventsAsync(string? userId, string? type, int first, int max, CancellationToken ct)
    {
        var query = $"?first={first}&max={max}";
        if (!string.IsNullOrEmpty(userId)) query += $"&user={Uri.EscapeDataString(userId)}";
        if (!string.IsNullOrEmpty(type)) query += $"&type={Uri.EscapeDataString(type)}";

        var request = await CreateRequestAsync(HttpMethod.Get, $"{AdminBaseUrl}/events{query}", ct);
        return await SendAsync<List<JsonElement>>(request, ct);
    }

    public async Task<List<JsonElement>> GetAdminEventsAsync(int first, int max, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get,
            $"{AdminBaseUrl}/admin-events?first={first}&max={max}", ct);
        return await SendAsync<List<JsonElement>>(request, ct);
    }

    private static KeycloakUserDto MapToDto(KeycloakUserRepresentation user, List<string> roles) => new()
    {
        Id = user.Id,
        Username = user.Username ?? "",
        Email = user.Email ?? "",
        FirstName = user.FirstName ?? "",
        LastName = user.LastName ?? "",
        Enabled = user.Enabled,
        EmailVerified = user.EmailVerified,
        CreatedTimestamp = user.CreatedTimestamp,
        Roles = roles,
        RequiredActions = user.RequiredActions ?? [],
        Attributes = user.Attributes,
    };

    // Internal Keycloak representations for deserialization
    private record KeycloakUserRepresentation
    {
        [JsonPropertyName("id")]
        public string Id { get; init; } = "";
        [JsonPropertyName("username")]
        public string? Username { get; init; }
        [JsonPropertyName("email")]
        public string? Email { get; init; }
        [JsonPropertyName("firstName")]
        public string? FirstName { get; init; }
        [JsonPropertyName("lastName")]
        public string? LastName { get; init; }
        [JsonPropertyName("enabled")]
        public bool Enabled { get; init; }
        [JsonPropertyName("emailVerified")]
        public bool EmailVerified { get; init; }
        [JsonPropertyName("createdTimestamp")]
        public long? CreatedTimestamp { get; init; }
        [JsonPropertyName("requiredActions")]
        public List<string>? RequiredActions { get; init; }
        [JsonPropertyName("attributes")]
        public Dictionary<string, List<string>>? Attributes { get; init; }
    }

    private record KeycloakRoleRepresentation
    {
        [JsonPropertyName("id")]
        public string Id { get; init; } = "";
        [JsonPropertyName("name")]
        public string Name { get; init; } = "";
        [JsonPropertyName("description")]
        public string? Description { get; init; }
    }

    private record KeycloakSessionRepresentation
    {
        [JsonPropertyName("id")]
        public string Id { get; init; } = "";
        [JsonPropertyName("ipAddress")]
        public string? IpAddress { get; init; }
        [JsonPropertyName("start")]
        public long Start { get; init; }
        [JsonPropertyName("lastAccess")]
        public long LastAccess { get; init; }
        [JsonPropertyName("clients")]
        public Dictionary<string, string>? Clients { get; init; }
    }
}
