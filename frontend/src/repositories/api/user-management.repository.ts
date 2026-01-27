import type { ApiClient } from "@/lib/api-client";
import type { IUserManagementRepository } from "@/repositories/interfaces";
import type {
  KeycloakUserDTO,
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  UserSearchParamsDTO,
  AssignRolesRequestDTO,
  KeycloakSessionDTO,
  KeycloakRoleDTO,
  PaginatedUsersResponse,
} from "@/types/dto/user-management.dto";

export class UserManagementRepository implements IUserManagementRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async getUsers(params: UserSearchParamsDTO = {}): Promise<PaginatedUsersResponse> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.enabled !== undefined) searchParams.set("enabled", String(params.enabled));
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    return this.apiClient.get<PaginatedUsersResponse>("/api/users", searchParams);
  }

  async getUserById(id: string): Promise<KeycloakUserDTO> {
    return this.apiClient.get<KeycloakUserDTO>(`/api/users/${id}`);
  }

  async createUser(request: CreateUserRequestDTO): Promise<KeycloakUserDTO> {
    return this.apiClient.post<KeycloakUserDTO>("/api/users", request);
  }

  async updateUser(id: string, request: UpdateUserRequestDTO): Promise<KeycloakUserDTO> {
    return this.apiClient.put<KeycloakUserDTO>(`/api/users/${id}`, request);
  }

  async deactivateUser(id: string): Promise<void> {
    await this.apiClient.post(`/api/users/${id}/deactivate`);
  }

  async reactivateUser(id: string): Promise<void> {
    await this.apiClient.post(`/api/users/${id}/reactivate`);
  }

  async sendPasswordReset(id: string): Promise<void> {
    await this.apiClient.post(`/api/users/${id}/send-password-reset`);
  }

  async getUserRoles(id: string): Promise<KeycloakRoleDTO[]> {
    return this.apiClient.get<KeycloakRoleDTO[]>(`/api/users/${id}/roles`);
  }

  async assignRoles(id: string, request: AssignRolesRequestDTO): Promise<KeycloakRoleDTO[]> {
    return this.apiClient.put<KeycloakRoleDTO[]>(`/api/users/${id}/roles`, request);
  }

  async getUserSessions(id: string): Promise<KeycloakSessionDTO[]> {
    return this.apiClient.get<KeycloakSessionDTO[]>(`/api/users/${id}/sessions`);
  }

  async terminateUserSessions(id: string): Promise<void> {
    await this.apiClient.delete(`/api/users/${id}/sessions`);
  }

  async requireMfa(id: string): Promise<void> {
    await this.apiClient.post(`/api/users/${id}/require-mfa`);
  }

  async getAvailableRoles(): Promise<KeycloakRoleDTO[]> {
    return this.apiClient.get<KeycloakRoleDTO[]>("/api/users/roles");
  }

  async getAuditEvents(params: { userId?: string; type?: string; page?: number; pageSize?: number } = {}): Promise<unknown[]> {
    const searchParams = new URLSearchParams();
    if (params.userId) searchParams.set("userId", params.userId);
    if (params.type) searchParams.set("type", params.type);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    return this.apiClient.get<unknown[]>("/api/audit/events", searchParams);
  }

  async getAdminEvents(params: { page?: number; pageSize?: number } = {}): Promise<unknown[]> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    return this.apiClient.get<unknown[]>("/api/audit/admin-events", searchParams);
  }
}
