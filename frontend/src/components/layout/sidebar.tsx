"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { hasAnyRole, type AppRole, AppRoles } from "@/lib/auth-utils";
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  FileDown,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  ScrollText,
  UserCog,
  type LucideIcon,
} from "@/components/ui/icons";

interface NavItemConfig {
  href: string;
  icon: LucideIcon;
  label: string;
  requiredRoles?: AppRole[];
}

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
  isActive?: boolean;
}

function NavItem({
  href,
  icon: Icon,
  label,
  isCollapsed,
  isActive,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-base",
        "hover:bg-base-200 focus-ring",
        isActive && "bg-primary/10 text-primary font-medium",
        !isActive && "text-base-content/70 hover:text-base-content"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

interface NavGroupProps {
  title: string;
  items: NavItemConfig[];
  isCollapsed: boolean;
  defaultOpen?: boolean;
  userRoles: string[];
}

function NavGroup({
  title,
  items,
  isCollapsed,
  defaultOpen = true,
  userRoles,
}: NavGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const pathname = usePathname();

  const visibleItems = items.filter(
    (item) => !item.requiredRoles || hasAnyRole(userRoles, item.requiredRoles)
  );

  if (visibleItems.length === 0) return null;

  if (isCollapsed) {
    return (
      <div className="space-y-1">
        {visibleItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isCollapsed={isCollapsed}
            isActive={
              pathname === item.href || pathname.startsWith(item.href + "/")
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-base-content/50 hover:text-base-content/70 transition-colors"
      >
        {title}
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform",
            !isOpen && "-rotate-90"
          )}
        />
      </button>
      {isOpen && (
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isCollapsed={isCollapsed}
              isActive={
                pathname === item.href || pathname.startsWith(item.href + "/")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

const navConfig: Record<string, NavItemConfig[]> = {
  main: [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      requiredRoles: [AppRoles.ADMIN, AppRoles.PRACTITIONER, AppRoles.NURSE],
    },
  ],
  clinical: [
    {
      href: "/patients",
      icon: Users,
      label: "Patients",
      requiredRoles: [
        AppRoles.ADMIN,
        AppRoles.PRACTITIONER,
        AppRoles.NURSE,
        AppRoles.FRONT_DESK,
        AppRoles.PATIENT,
      ],
    },
  ],
  tools: [
    {
      href: "/export",
      icon: FileDown,
      label: "Bulk Export",
      requiredRoles: [AppRoles.ADMIN, AppRoles.PRACTITIONER],
    },
    {
      href: "/smart-launch",
      icon: Zap,
      label: "SMART Launch",
      requiredRoles: [AppRoles.ADMIN, AppRoles.PRACTITIONER],
    },
  ],
  admin: [
    {
      href: "/admin/users",
      icon: UserCog,
      label: "User Management",
      requiredRoles: [AppRoles.ADMIN],
    },
    {
      href: "/admin/audit",
      icon: ScrollText,
      label: "Audit Logs",
      requiredRoles: [AppRoles.ADMIN],
    },
  ],
  settings: [{ href: "/settings", icon: Settings, label: "Settings" }],
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];

  const filterItems = (items: NavItemConfig[]) =>
    items.filter(
      (item) => !item.requiredRoles || hasAnyRole(userRoles, item.requiredRoles)
    );

  const visibleMain = filterItems(navConfig.main);
  const visibleAdmin = filterItems(navConfig.admin);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-base-100 border-r border-base-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-base-200">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-primary-content" />
            </div>
            <span className="font-bold text-lg">FhirHub</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-primary-content" />
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Main */}
        {visibleMain.length > 0 && (
          <div className="space-y-1">
            {visibleMain.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
              />
            ))}
          </div>
        )}

        {/* Clinical */}
        <NavGroup
          title="Clinical"
          items={navConfig.clinical}
          isCollapsed={isCollapsed}
          userRoles={userRoles}
        />

        {/* Tools */}
        <NavGroup
          title="Tools"
          items={navConfig.tools}
          isCollapsed={isCollapsed}
          userRoles={userRoles}
        />

        {/* Admin */}
        {visibleAdmin.length > 0 && (
          <NavGroup
            title="Admin"
            items={navConfig.admin}
            isCollapsed={isCollapsed}
            userRoles={userRoles}
          />
        )}

        {/* Settings */}
        <div className="space-y-1">
          {navConfig.settings.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isCollapsed={isCollapsed}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-base-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-base-200 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
