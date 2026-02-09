namespace FhirHubServer.Api.Features.UserManagement.DTOs;

public record KeycloakUserDto
{
    public string Id { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public bool Enabled { get; init; }
    public bool EmailVerified { get; init; }
    public long? CreatedTimestamp { get; init; }
    public List<string> Roles { get; init; } = [];
    public List<string> RequiredActions { get; init; } = [];
    public Dictionary<string, List<string>>? Attributes { get; init; }
}

public record CreateUserRequest
{
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public List<string> Roles { get; init; } = [];
    public bool SendInvitation { get; init; } = true;
}

public record UpdateUserRequest
{
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Email { get; init; }
}

public record UserSearchParams
{
    public string? Search { get; init; }
    public bool? Enabled { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

public record AssignRolesRequest
{
    public List<string> Roles { get; init; } = [];
}

public record KeycloakSessionDto
{
    public string Id { get; init; } = string.Empty;
    public string IpAddress { get; init; } = string.Empty;
    public long Start { get; init; }
    public long LastAccess { get; init; }
    public Dictionary<string, string>? Clients { get; init; }
}

public record KeycloakRoleDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
}
