"use client";

import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({
  loading,
  children,
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "transition-opacity duration-200",
        loading && "opacity-50 pointer-events-none",
        className
      )}
    >
      {children}
    </div>
  );
}
