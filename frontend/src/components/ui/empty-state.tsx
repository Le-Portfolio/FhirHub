"use client";

import { cn } from "@/lib/utils";
import { FileSearch, type LucideIcon } from "./icons";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
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
    container: "py-16",
    icon: "w-16 h-16",
    title: "text-xl",
    description: "text-base",
  },
};

export function EmptyState({
  icon: Icon = FileSearch,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4",
        sizes.container,
        className
      )}
    >
      <div className="rounded-full bg-base-200 p-4 mb-4">
        <Icon className={cn("text-base-content/50", sizes.icon)} />
      </div>
      <h3 className={cn("font-semibold text-base-content mb-1", sizes.title)}>
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-base-content/60 max-w-sm mb-4",
            sizes.description
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function NoResultsState({
  searchTerm,
  onClear,
}: {
  searchTerm?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon={FileSearch}
      title="No results found"
      description={
        searchTerm
          ? `No results match "${searchTerm}". Try adjusting your search or filters.`
          : "Try adjusting your search or filters."
      }
      action={
        onClear && (
          <button className="btn btn-ghost btn-sm" onClick={onClear}>
            Clear filters
          </button>
        )
      }
    />
  );
}

export function NoDataState({
  resourceName,
  onAdd,
}: {
  resourceName: string;
  onAdd?: () => void;
}) {
  return (
    <EmptyState
      title={`No ${resourceName} yet`}
      description={`Get started by adding your first ${resourceName.toLowerCase()}.`}
      action={
        onAdd && (
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            Add {resourceName}
          </button>
        )
      }
    />
  );
}
