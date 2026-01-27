"use client";

import { cn } from "@/lib/utils";
import { X } from "@/components/ui/icons";

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiSelect?: boolean;
  className?: string;
}

export function FilterPills({
  options,
  selected,
  onChange,
  multiSelect = true,
  className,
}: FilterPillsProps) {
  const handleToggle = (id: string) => {
    if (multiSelect) {
      if (selected.includes(id)) {
        onChange(selected.filter((s) => s !== id));
      } else {
        onChange([...selected, id]);
      }
    } else {
      if (selected.includes(id)) {
        onChange([]);
      } else {
        onChange([id]);
      }
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option.id);

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleToggle(option.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              "border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              isSelected
                ? "bg-primary text-primary-content border-primary"
                : "bg-base-100 text-base-content/70 border-base-300 hover:border-primary hover:text-primary"
            )}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded-full text-xs",
                  isSelected
                    ? "bg-primary-content/20 text-primary-content"
                    : "bg-base-200 text-base-content/50"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Active filter tags that can be removed
interface ActiveFilter {
  id: string;
  label: string;
  value?: string;
}

interface ActiveFilterTagsProps {
  filters: ActiveFilter[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function ActiveFilterTags({
  filters,
  onRemove,
  onClearAll,
  className,
}: ActiveFilterTagsProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-base-content/60">Active filters:</span>
      {filters.map((filter) => (
        <span
          key={filter.id}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm"
        >
          <span className="font-medium">{filter.label}</span>
          {filter.value && (
            <span className="text-primary/70">: {filter.value}</span>
          )}
          <button
            type="button"
            onClick={() => onRemove(filter.id)}
            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {onClearAll && filters.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm text-base-content/60 hover:text-error transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
