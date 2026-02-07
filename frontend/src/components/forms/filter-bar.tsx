"use client";

import { cn } from "@/lib/utils";

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn("flex flex-col sm:flex-row gap-3 mb-6", className)}
    >
      {children}
    </div>
  );
}
