"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { AppRoles } from "@/lib/auth-utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={[AppRoles.ADMIN]} redirectTo="/dashboard">
      {children}
    </RouteGuard>
  );
}
