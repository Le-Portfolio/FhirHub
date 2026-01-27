"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/forms/search-input";
import { SelectDropdown } from "@/components/forms/select-dropdown";
import { DatePicker } from "@/components/forms/date-picker";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
} from "@/components/ui/icons";

interface PatientSearchFilters {
  query: string;
  searchField: "all" | "name" | "mrn" | "phone" | "email";
  birthDate?: string;
  gender?: string;
  hasAlerts?: boolean;
  hasActiveConditions?: boolean;
}

interface PatientSearchProps {
  filters: PatientSearchFilters;
  onFiltersChange: (filters: PatientSearchFilters) => void;
  loading?: boolean;
  className?: string;
}

const searchFieldOptions = [
  { value: "all", label: "All fields" },
  { value: "name", label: "Name" },
  { value: "mrn", label: "MRN" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
];

const genderOptions = [
  { value: "", label: "Any gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export function PatientSearch({
  filters,
  onFiltersChange,
  loading = false,
  className,
}: PatientSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = <K extends keyof PatientSearchFilters>(
    key: K,
    value: PatientSearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      query: "",
      searchField: "all",
      birthDate: undefined,
      gender: undefined,
      hasAlerts: undefined,
      hasActiveConditions: undefined,
    });
  };

  const hasActiveFilters =
    filters.birthDate ||
    filters.gender ||
    filters.hasAlerts ||
    filters.hasActiveConditions;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <SearchInput
            value={filters.query}
            onChange={(value) => updateFilter("query", value)}
            placeholder="Search patients..."
            loading={loading}
            className="flex-1"
          />
          <SelectDropdown
            options={searchFieldOptions}
            value={filters.searchField}
            onChange={(e) =>
              updateFilter(
                "searchField",
                e.target.value as PatientSearchFilters["searchField"]
              )
            }
            className="w-32 hidden sm:block"
          />
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "btn btn-ghost gap-2",
            hasActiveFilters && "text-primary"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="badge badge-primary badge-sm px-2.5">
              {
                [
                  filters.birthDate,
                  filters.gender,
                  filters.hasAlerts,
                  filters.hasActiveConditions,
                ].filter(Boolean).length
              }
            </span>
          )}
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="p-4 bg-base-200 rounded-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DatePicker
              label="Birth Date"
              value={filters.birthDate}
              onChange={(e) =>
                updateFilter("birthDate", e.target.value || undefined)
              }
            />

            <SelectDropdown
              label="Gender"
              options={genderOptions}
              value={filters.gender || ""}
              onChange={(e) =>
                updateFilter("gender", e.target.value || undefined)
              }
            />

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  checked={filters.hasAlerts || false}
                  onChange={(e) =>
                    updateFilter("hasAlerts", e.target.checked || undefined)
                  }
                  className="checkbox checkbox-primary checkbox-sm"
                />
                <span className="label-text">Has alerts</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  checked={filters.hasActiveConditions || false}
                  onChange={(e) =>
                    updateFilter(
                      "hasActiveConditions",
                      e.target.checked || undefined
                    )
                  }
                  className="checkbox checkbox-primary checkbox-sm"
                />
                <span className="label-text">Active conditions</span>
              </label>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="btn btn-ghost btn-sm gap-2"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
