"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "./icons";

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "active"
  | "resolved"
  | "pending"
  | "critical"
  | "outline"
  | "ghost";

export type BadgeSize = "xs" | "sm" | "md" | "lg";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "badge-neutral",
  primary: "badge-primary",
  secondary: "badge-secondary",
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
  info: "badge-info",
  active: "bg-active-light text-active border-active/20",
  resolved: "bg-resolved-light text-resolved border-resolved/20",
  pending: "bg-pending-light text-pending border-pending/20",
  critical: "bg-critical-light text-critical border-critical/20",
  outline: "badge-outline",
  ghost: "badge-ghost",
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: "badge-xs text-[10px] px-2 py-0.5",
  sm: "badge-sm text-xs px-2.5 py-0.5",
  md: "badge-md text-sm px-3",
  lg: "badge-lg text-base px-3",
};

const iconSizes: Record<BadgeSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  icon: Icon,
  iconPosition = "left",
  dot = false,
  className,
}: BadgeProps) {
  const iconSize = iconSizes[size];

  return (
    <span
      className={cn(
        "badge gap-1 font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "status-dot",
            variant === "active" && "status-dot-active",
            variant === "resolved" && "status-dot-resolved",
            variant === "pending" && "status-dot-pending",
            variant === "critical" && "status-dot-critical",
            !["active", "resolved", "pending", "critical"].includes(variant) &&
              "bg-current opacity-75"
          )}
        />
      )}
      {Icon && iconPosition === "left" && (
        <Icon size={iconSize} className="shrink-0" />
      )}
      {children}
      {Icon && iconPosition === "right" && (
        <Icon size={iconSize} className="shrink-0" />
      )}
    </span>
  );
}

// Status-specific badge presets
export function StatusBadge({
  status,
  className,
}: {
  status: "active" | "resolved" | "pending" | "critical" | "inactive";
  className?: string;
}) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> =
    {
      active: { variant: "active", label: "Active" },
      resolved: { variant: "resolved", label: "Resolved" },
      pending: { variant: "pending", label: "Pending" },
      critical: { variant: "critical", label: "Critical" },
      inactive: { variant: "ghost", label: "Inactive" },
    };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  );
}
