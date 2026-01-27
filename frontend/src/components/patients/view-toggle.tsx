"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid, List } from "@/components/ui/icons";

type ViewMode = "grid" | "table";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ mode, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn("join", className)}>
      <button
        className={cn("join-item btn btn-sm", mode === "grid" && "btn-active")}
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={mode === "grid"}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        className={cn("join-item btn btn-sm", mode === "table" && "btn-active")}
        onClick={() => onChange("table")}
        aria-label="Table view"
        aria-pressed={mode === "table"}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
