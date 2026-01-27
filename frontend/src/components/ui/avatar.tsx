"use client";

import { cn } from "@/lib/utils";
import { User } from "./icons";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  showStatus?: boolean;
  status?: "online" | "offline" | "busy" | "away";
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
};

const statusSizeClasses: Record<AvatarSize, string> = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
};

const statusColorClasses: Record<string, string> = {
  online: "bg-success",
  offline: "bg-base-300",
  busy: "bg-error",
  away: "bg-warning",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stringToColor(str: string): string {
  // Generate a consistent color based on the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-primary",
    "bg-secondary",
    "bg-accent",
    "bg-info",
    "bg-success",
    "bg-warning",
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  className,
  showStatus = false,
  status = "offline",
}: AvatarProps) {
  const displayName = alt || name || "User";
  const initials = name ? getInitials(name) : null;
  const bgColor = name ? stringToColor(name) : "bg-base-300";

  return (
    <div className={cn("avatar", showStatus && "online", className)}>
      <div
        className={cn(
          "rounded-full ring ring-base-100 ring-offset-base-100 ring-offset-1",
          sizeClasses[size]
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={displayName} className="object-cover" />
        ) : initials ? (
          <div
            className={cn(
              "flex items-center justify-center w-full h-full font-semibold text-white",
              bgColor
            )}
          >
            {initials}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-base-300 text-base-content">
            <User className="w-1/2 h-1/2" />
          </div>
        )}
      </div>
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-base-100",
            statusSizeClasses[size],
            statusColorClasses[status]
          )}
        />
      )}
    </div>
  );
}

// Avatar group for showing multiple avatars
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    name?: string;
  }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = "sm",
  className,
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={cn("avatar-group -space-x-3", className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar key={index} {...avatar} size={size} />
      ))}
      {remainingCount > 0 && (
        <div className="avatar placeholder">
          <div
            className={cn(
              "bg-neutral text-neutral-content rounded-full",
              sizeClasses[size]
            )}
          >
            <span>+{remainingCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
