"use client";

import { cn } from "@/lib/utils";

interface PageCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  padding?: "sm" | "md" | "lg";
  className?: string;
}

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function PageCard({
  children,
  title,
  description,
  actions,
  padding = "md",
  className,
}: PageCardProps) {
  return (
    <div
      className={cn(
        "bg-base-100 shadow-sm border border-base-200/50 rounded-box",
        paddingClasses[padding],
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-base-content/60 mt-0.5">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
