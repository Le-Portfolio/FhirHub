"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import { hasAnyRole, type AppRole } from "@/lib/auth-utils";

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
}

export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  if (!hasAnyRole(roles, allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
