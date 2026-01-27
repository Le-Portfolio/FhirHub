"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { hasAnyRole, type AppRole } from "@/lib/auth-utils";
import { ShieldAlert } from "@/components/ui/icons";

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

export function RouteGuard({ children, allowedRoles, redirectTo }: RouteGuardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const roles = user?.roles ?? [];
  const hasAccess = hasAnyRole(roles, allowedRoles);

  useEffect(() => {
    if (!hasAccess && redirectTo) {
      router.replace(redirectTo);
    }
  }, [hasAccess, redirectTo, router]);

  if (!hasAccess) {
    if (redirectTo) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="loading loading-spinner loading-lg" />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <ShieldAlert className="w-16 h-16 text-error/50" />
        <h2 className="text-xl font-semibold text-base-content">Access Denied</h2>
        <p className="text-base-content/60">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
