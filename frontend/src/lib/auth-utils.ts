export const AppRoles = {
  ADMIN: "admin",
  PRACTITIONER: "practitioner",
  NURSE: "nurse",
  FRONT_DESK: "front_desk",
  PATIENT: "patient",
  API_CLIENT: "api_client",
} as const;

export type AppRole = (typeof AppRoles)[keyof typeof AppRoles];

export function hasRole(userRoles: string[], role: AppRole): boolean {
  return userRoles.includes(role);
}

export function hasAnyRole(userRoles: string[], roles: AppRole[]): boolean {
  return roles.some((role) => userRoles.includes(role));
}

export function canAccessPatients(roles: string[]): boolean {
  return hasAnyRole(roles, [
    AppRoles.ADMIN,
    AppRoles.PRACTITIONER,
    AppRoles.NURSE,
    AppRoles.FRONT_DESK,
    AppRoles.PATIENT,
  ]);
}

export function canWritePatients(roles: string[]): boolean {
  return hasAnyRole(roles, [AppRoles.ADMIN, AppRoles.PRACTITIONER]);
}

export function canAccessDashboard(roles: string[]): boolean {
  return hasAnyRole(roles, [
    AppRoles.ADMIN,
    AppRoles.PRACTITIONER,
    AppRoles.NURSE,
  ]);
}

export function canAccessClinicalOverviews(roles: string[]): boolean {
  return hasAnyRole(roles, [
    AppRoles.ADMIN,
    AppRoles.PRACTITIONER,
    AppRoles.NURSE,
  ]);
}

export function canManageExports(roles: string[]): boolean {
  return hasAnyRole(roles, [AppRoles.ADMIN, AppRoles.PRACTITIONER]);
}

export function canManageUsers(roles: string[]): boolean {
  return hasRole(roles, AppRoles.ADMIN);
}

export function canViewAuditLogs(roles: string[]): boolean {
  return hasRole(roles, AppRoles.ADMIN);
}
