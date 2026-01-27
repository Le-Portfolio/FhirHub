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

export class UserManagementService {
  constructor(private repository: IUserManagementRepository) {}

  async getUsers(params?: UserSearchParamsDTO): Promise<PaginatedUsersResponse> {
    return this.repository.getUsers(params);
  }

  async getUserById(id: string): Promise<KeycloakUserDTO> {
    return this.repository.getUserById(id);
  }

  async createUser(request: CreateUserRequestDTO): Promise<KeycloakUserDTO> {
    return this.repository.createUser(request);
  }

  async updateUser(id: string, request: UpdateUserRequestDTO): Promise<KeycloakUserDTO> {
    return this.repository.updateUser(id, request);
  }

  async deactivateUser(id: string): Promise<void> {
    return this.repository.deactivateUser(id);
  }

  async reactivateUser(id: string): Promise<void> {
    return this.repository.reactivateUser(id);
  }

  async sendPasswordReset(id: string): Promise<void> {
    return this.repository.sendPasswordReset(id);
  }

  async getUserRoles(id: string): Promise<KeycloakRoleDTO[]> {
    return this.repository.getUserRoles(id);
  }

  async assignRoles(id: string, request: AssignRolesRequestDTO): Promise<KeycloakRoleDTO[]> {
    return this.repository.assignRoles(id, request);
  }

  async getUserSessions(id: string): Promise<KeycloakSessionDTO[]> {
    return this.repository.getUserSessions(id);
  }

  async terminateUserSessions(id: string): Promise<void> {
    return this.repository.terminateUserSessions(id);
  }

  async requireMfa(id: string): Promise<void> {
    return this.repository.requireMfa(id);
  }

  async getAvailableRoles(): Promise<KeycloakRoleDTO[]> {
    return this.repository.getAvailableRoles();
  }

  async getAuditEvents(params?: { userId?: string; type?: string; page?: number; pageSize?: number }): Promise<unknown[]> {
    return this.repository.getAuditEvents(params);
  }

  async getAdminEvents(params?: { page?: number; pageSize?: number }): Promise<unknown[]> {
    return this.repository.getAdminEvents(params);
  }
}
