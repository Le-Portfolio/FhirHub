export interface KeycloakUserDTO {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp: number | null;
  roles: string[];
  requiredActions: string[];
  attributes?: Record<string, string[]>;
}

export interface CreateUserRequestDTO {
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  sendInvitation: boolean;
}

export interface UpdateUserRequestDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface UserSearchParamsDTO {
  search?: string;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AssignRolesRequestDTO {
  roles: string[];
}

export interface KeycloakSessionDTO {
  id: string;
  ipAddress: string;
  start: number;
  lastAccess: number;
  clients?: Record<string, string>;
}

export interface KeycloakRoleDTO {
  id: string;
  name: string;
  description?: string;
}

export interface PaginatedUsersResponse {
  data: KeycloakUserDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
