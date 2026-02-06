"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import {
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Menu,
} from "@/components/ui/icons";
import { useAuth } from "@/providers/auth-provider";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Path segments that are layout-only routes (no actual page exists)
const layoutOnlySegments = new Set(["admin"]);

function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [];

  segments.forEach((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Check if this is a dynamic segment (like an ID)
    const isId = /^[a-f0-9-]{8,}$/i.test(segment) || !isNaN(Number(segment));

    const isLastSegment = index === segments.length - 1;
    const isLayoutOnly = layoutOnlySegments.has(segment);

    breadcrumbs.push({
      label: isId ? "Details" : label,
      href: !isLastSegment && !isLayoutOnly ? href : undefined,
    });
  });

  return breadcrumbs;
}

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  className?: string;
}

export function Header({
  onMenuClick,
  showMenuButton,
  className,
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const breadcrumbs = useBreadcrumbs();
  const { user, logout } = useAuth();

  const displayName = user?.fullName || "User";

  return (
    <header
      className={cn(
        "h-16 bg-base-100 border-b border-base-200 px-4 flex items-center justify-between gap-4",
        className
      )}
    >
      {/* Left side: Menu button + Breadcrumbs */}
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="btn btn-ghost btn-sm btn-square lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-base-content/40" />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-base-content/60 hover:text-base-content transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right side: Search, Notifications, User */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          {isSearchOpen ? (
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search patients, records..."
                className="input input-bordered input-sm w-64 pr-8"
                autoFocus
                onBlur={() => setIsSearchOpen(false)}
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-2 text-base-content/50 hover:text-base-content"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <div className="dropdown dropdown-end">
          <button
            className="btn btn-ghost btn-sm btn-circle indicator"
            aria-label="Notifications"
          >
            <span className="indicator-item badge badge-primary badge-xs px-1.5">
              3
            </span>
            <Bell className="w-5 h-5" />
          </button>
          <div className="dropdown-content z-50 mt-2 w-80 bg-base-100 rounded-box shadow-lg border border-base-200">
            <div className="p-4 border-b border-base-200">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
              <NotificationItem
                title="New lab results"
                description="Patient John Doe has new lab results available"
                time="5 min ago"
                unread
              />
              <NotificationItem
                title="Export completed"
                description="Your bulk export is ready for download"
                time="1 hour ago"
                unread
              />
              <NotificationItem
                title="Critical alert"
                description="Patient Jane Smith has abnormal vitals"
                time="2 hours ago"
              />
            </div>
            <div className="p-2 border-t border-base-200">
              <Link
                href="/notifications"
                className="btn btn-ghost btn-sm btn-block"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </div>

        {/* User menu */}
        <details className="dropdown dropdown-end">
          <summary
            className="btn btn-ghost btn-sm gap-2 px-2 list-none [&::-webkit-details-marker]:hidden"
            aria-label="User menu"
          >
            <Avatar name={displayName} size="xs" />
            <span className="hidden md:inline font-medium">{displayName}</span>
          </summary>
          <ul className="dropdown-content z-50 mt-2 menu p-2 bg-base-100 rounded-box w-52 shadow-lg border border-base-200">
            <li>
              <Link href="/profile">
                <User className="w-4 h-4" />
                Profile
              </Link>
            </li>
            <li>
              <Link href="/settings">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </li>
            <div className="divider my-1" />
            <li>
              <button className="text-error" onClick={logout}>
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </li>
          </ul>
        </details>
      </div>
    </header>
  );
}

function NotificationItem({
  title,
  description,
  time,
  unread,
}: {
  title: string;
  description: string;
  time: string;
  unread?: boolean;
}) {
  return (
    <button
      className={cn(
        "w-full text-left p-3 rounded-lg hover:bg-base-200 transition-colors",
        unread && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-2">
        {unread && (
          <span className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{title}</p>
          <p className="text-xs text-base-content/60 line-clamp-2">
            {description}
          </p>
          <p className="text-xs text-base-content/40 mt-1">{time}</p>
        </div>
      </div>
    </button>
  );
}
