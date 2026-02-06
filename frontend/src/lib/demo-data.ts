import type {
  KeycloakUserDTO,
  PaginatedUsersResponse,
  UserSearchParamsDTO,
} from "@/types/dto/user-management.dto";

// --- Demo Users ---

const DEMO_USERS: KeycloakUserDTO[] = [
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    username: "sarah.chen",
    email: "sarah.chen@fhirhub.demo",
    firstName: "Sarah",
    lastName: "Chen",
    enabled: true,
    emailVerified: true,
    createdTimestamp: Date.now() - 90 * 24 * 60 * 60 * 1000,
    roles: ["admin", "practitioner"],
    requiredActions: [],
  },
  {
    id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    username: "james.wilson",
    email: "james.wilson@fhirhub.demo",
    firstName: "James",
    lastName: "Wilson",
    enabled: true,
    emailVerified: true,
    createdTimestamp: Date.now() - 75 * 24 * 60 * 60 * 1000,
    roles: ["practitioner"],
    requiredActions: [],
  },
  {
    id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    username: "maria.garcia",
    email: "maria.garcia@fhirhub.demo",
    firstName: "Maria",
    lastName: "Garcia",
    enabled: true,
    emailVerified: true,
    createdTimestamp: Date.now() - 60 * 24 * 60 * 60 * 1000,
    roles: ["nurse"],
    requiredActions: [],
  },
  {
    id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80",
    username: "robert.johnson",
    email: "robert.johnson@fhirhub.demo",
    firstName: "Robert",
    lastName: "Johnson",
    enabled: true,
    emailVerified: false,
    createdTimestamp: Date.now() - 45 * 24 * 60 * 60 * 1000,
    roles: ["practitioner", "nurse"],
    requiredActions: ["VERIFY_EMAIL"],
  },
  {
    id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091",
    username: "emily.davis",
    email: "emily.davis@fhirhub.demo",
    firstName: "Emily",
    lastName: "Davis",
    enabled: true,
    emailVerified: true,
    createdTimestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
    roles: ["front_desk"],
    requiredActions: [],
  },
  {
    id: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102",
    username: "michael.brown",
    email: "michael.brown@fhirhub.demo",
    firstName: "Michael",
    lastName: "Brown",
    enabled: false,
    emailVerified: true,
    createdTimestamp: Date.now() - 120 * 24 * 60 * 60 * 1000,
    roles: ["practitioner"],
    requiredActions: [],
  },
  {
    id: "07a8b9c0-d1e2-4f3a-4b5c-6d7e8f901213",
    username: "lisa.martinez",
    email: "lisa.martinez@fhirhub.demo",
    firstName: "Lisa",
    lastName: "Martinez",
    enabled: true,
    emailVerified: true,
    createdTimestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
    roles: ["patient"],
    requiredActions: [],
  },
  {
    id: "18b9c0d1-e2f3-4a4b-5c6d-7e8f90121324",
    username: "api-service",
    email: "api@fhirhub.demo",
    firstName: "API",
    lastName: "Service",
    enabled: true,
    emailVerified: true,
    createdTimestamp: Date.now() - 100 * 24 * 60 * 60 * 1000,
    roles: ["api_client"],
    requiredActions: [],
  },
];

export function getDemoUsers(params?: UserSearchParamsDTO): PaginatedUsersResponse {
  let filtered = [...DEMO_USERS];

  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q)
    );
  }

  if (params?.enabled !== undefined) {
    filtered = filtered.filter((u) => u.enabled === params.enabled);
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return {
    data: paged,
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
  };
}

export function getDemoUserById(userId: string): KeycloakUserDTO | null {
  return DEMO_USERS.find((u) => u.id === userId) ?? null;
}

// --- Demo User Events ---

interface UserEvent {
  time: number;
  type: string;
  userId: string;
  ipAddress: string;
  details?: Record<string, string>;
  error?: string;
}

const now = Date.now();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

const DEMO_USER_EVENTS: UserEvent[] = [
  { time: now - 5 * 60 * 1000, type: "LOGIN", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42", details: { auth_method: "openid-connect" } },
  { time: now - 15 * 60 * 1000, type: "LOGIN", userId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e", ipAddress: "10.0.1.85", details: { auth_method: "openid-connect" } },
  { time: now - 32 * 60 * 1000, type: "LOGOUT", userId: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f", ipAddress: "10.0.2.10" },
  { time: now - 1 * hour, type: "LOGIN", userId: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f", ipAddress: "10.0.2.10", details: { auth_method: "openid-connect" } },
  { time: now - 1.5 * hour, type: "LOGIN_ERROR", userId: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80", ipAddress: "192.168.1.100", error: "Invalid credentials" },
  { time: now - 2 * hour, type: "LOGIN", userId: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80", ipAddress: "192.168.1.100", details: { auth_method: "openid-connect" } },
  { time: now - 3 * hour, type: "LOGOUT", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" },
  { time: now - 4 * hour, type: "UPDATE_PASSWORD", userId: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091", ipAddress: "10.0.3.22" },
  { time: now - 5 * hour, type: "LOGIN", userId: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091", ipAddress: "10.0.3.22", details: { auth_method: "openid-connect" } },
  { time: now - 6 * hour, type: "REGISTER", userId: "07a8b9c0-d1e2-4f3a-4b5c-6d7e8f901213", ipAddress: "172.16.0.55", details: { username: "lisa.martinez" } },
  { time: now - 8 * hour, type: "LOGIN", userId: "18b9c0d1-e2f3-4a4b-5c6d-7e8f90121324", ipAddress: "10.0.0.1", details: { auth_method: "client-secret" } },
  { time: now - 10 * hour, type: "VERIFY_EMAIL", userId: "07a8b9c0-d1e2-4f3a-4b5c-6d7e8f901213", ipAddress: "172.16.0.55" },
  { time: now - 12 * hour, type: "LOGIN", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42", details: { auth_method: "openid-connect" } },
  { time: now - 1 * day, type: "LOGIN_ERROR", userId: "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102", ipAddress: "203.0.113.50", error: "Account disabled" },
  { time: now - 1 * day - 2 * hour, type: "LOGOUT", userId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e", ipAddress: "10.0.1.85" },
  { time: now - 1 * day - 4 * hour, type: "LOGIN", userId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e", ipAddress: "10.0.1.85", details: { auth_method: "openid-connect" } },
  { time: now - 1 * day - 6 * hour, type: "LOGIN", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42", details: { auth_method: "openid-connect" } },
  { time: now - 2 * day, type: "LOGIN", userId: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f", ipAddress: "10.0.2.10", details: { auth_method: "openid-connect" } },
  { time: now - 2 * day - 3 * hour, type: "LOGIN_ERROR", userId: "unknown-user", ipAddress: "198.51.100.23", error: "User not found" },
  { time: now - 3 * day, type: "REGISTER", userId: "18b9c0d1-e2f3-4a4b-5c6d-7e8f90121324", ipAddress: "10.0.0.1", details: { username: "api-service" } },
];

export function getDemoUserEvents(): UserEvent[] {
  return DEMO_USER_EVENTS;
}

// --- Demo Admin Events ---

interface AdminEvent {
  time: number;
  operationType: string;
  resourceType: string;
  resourcePath: string;
  authDetails: {
    realmId: string;
    userId: string;
    ipAddress: string;
  };
}

const DEMO_ADMIN_EVENTS: AdminEvent[] = [
  { time: now - 20 * 60 * 1000, operationType: "UPDATE", resourceType: "USER", resourcePath: "users/d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
  { time: now - 45 * 60 * 1000, operationType: "ACTION", resourceType: "USER", resourcePath: "users/d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80/reset-password", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
  { time: now - 2 * hour, operationType: "CREATE", resourceType: "USER", resourcePath: "users/07a8b9c0-d1e2-4f3a-4b5c-6d7e8f901213", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
  { time: now - 3 * hour, operationType: "CREATE", resourceType: "REALM_ROLE_MAPPING", resourcePath: "users/07a8b9c0-d1e2-4f3a-4b5c-6d7e8f901213/role-mappings/realm", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
  { time: now - 5 * hour, operationType: "UPDATE", resourceType: "USER", resourcePath: "users/f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
  { time: now - 8 * hour, operationType: "DELETE", resourceType: "REALM_ROLE_MAPPING", resourcePath: "users/f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102/role-mappings/realm", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
  { time: now - 10 * hour, operationType: "CREATE", resourceType: "REALM_ROLE", resourcePath: "roles-by-id/api_client", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
  { time: now - 1 * day, operationType: "CREATE", resourceType: "USER", resourcePath: "users/18b9c0d1-e2f3-4a4b-5c6d-7e8f90121324", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
  { time: now - 1 * day - 1 * hour, operationType: "CREATE", resourceType: "REALM_ROLE_MAPPING", resourcePath: "users/18b9c0d1-e2f3-4a4b-5c6d-7e8f90121324/role-mappings/realm", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
  { time: now - 2 * day, operationType: "UPDATE", resourceType: "REALM", resourcePath: "realm", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
  { time: now - 2 * day - 4 * hour, operationType: "CREATE", resourceType: "USER", resourcePath: "users/e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
  { time: now - 3 * day, operationType: "UPDATE", resourceType: "CLIENT", resourcePath: "clients/fhirhub-app", authDetails: { realmId: "fhirhub", userId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", ipAddress: "10.0.1.42" } },
];

export function getDemoAdminEvents(): AdminEvent[] {
  return DEMO_ADMIN_EVENTS;
}
