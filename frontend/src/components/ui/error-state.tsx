"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, type LucideIcon } from "./icons";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  icon?: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "py-8",
    icon: "w-10 h-10",
    title: "text-base",
    description: "text-sm",
  },
  md: {
    container: "py-12",
    icon: "w-12 h-12",
    title: "text-lg",
    description: "text-sm",
  },
  lg: {
    container: "py-16 min-h-[50vh]",
    icon: "w-16 h-16",
    title: "text-xl",
    description: "text-base",
  },
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  icon: Icon = AlertTriangle,
  size = "md",
  className,
}: ErrorStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4",
        sizes.container,
        className
      )}
    >
      <div className="rounded-full bg-error/10 p-4 mb-4">
        <Icon className={cn("text-error", sizes.icon)} />
      </div>
      <h3 className={cn("font-semibold text-base-content mb-1", sizes.title)}>
        {title}
      </h3>
      <p
        className={cn(
          "text-base-content/60 max-w-sm mb-4",
          sizes.description
        )}
      >
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
