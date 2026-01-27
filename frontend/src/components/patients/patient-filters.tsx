"use client";

import { cn } from "@/lib/utils";
import { FilterPills, ActiveFilterTags } from "@/components/forms/filter-pills";

interface QuickFilter {
  id: string;
  label: string;
  count?: number;
}

interface PatientFiltersProps {
  quickFilters?: QuickFilter[];
  selectedFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  className?: string;
}

const defaultQuickFilters: QuickFilter[] = [
  { id: "has-alerts", label: "Has Alerts", count: 12 },
  { id: "active-conditions", label: "Active Conditions", count: 89 },
  { id: "recent", label: "Recently Updated", count: 45 },
  { id: "needs-followup", label: "Needs Follow-up", count: 23 },
];

export function PatientFilters({
  quickFilters = defaultQuickFilters,
  selectedFilters,
  onFiltersChange,
  className,
}: PatientFiltersProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <FilterPills
        options={quickFilters}
        selected={selectedFilters}
        onChange={onFiltersChange}
        multiSelect
      />

      {selectedFilters.length > 0 && (
        <ActiveFilterTags
          filters={selectedFilters.map((id) => ({
            id,
            label: quickFilters.find((f) => f.id === id)?.label || id,
          }))}
          onRemove={(id) =>
            onFiltersChange(selectedFilters.filter((f) => f !== id))
          }
          onClearAll={() => onFiltersChange([])}
        />
      )}
    </div>
  );
}
