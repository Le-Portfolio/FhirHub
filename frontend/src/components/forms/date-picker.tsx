"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/icons";

interface DatePickerProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  includeTime?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "input-sm",
  md: "",
  lg: "input-lg",
};

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      includeTime = false,
      className,
      size = "md",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;

    return (
      <div className={cn("form-control w-full", className)}>
        {label && (
          <label className="label" htmlFor={inputId}>
            <span className="label-text font-medium">
              {label}
              {required && <span className="text-error ml-1">*</span>}
            </span>
          </label>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none">
            <Calendar className="w-5 h-5" />
          </span>
          <input
            ref={ref}
            id={inputId}
            type={includeTime ? "datetime-local" : "date"}
            className={cn(
              "input input-bordered w-full pl-10",
              sizeClasses[size],
              error && "input-error"
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {(error || helperText) && (
          <label className="label">
            {error ? (
              <span
                id={`${inputId}-error`}
                className="label-text-alt text-error"
              >
                {error}
              </span>
            ) : (
              <span className="label-text-alt text-base-content/60">
                {helperText}
              </span>
            )}
          </label>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

// Date range picker
interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  includeTime?: boolean;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label,
  error,
  required,
  includeTime = false,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("form-control w-full", className)}>
      {label && (
        <label className="label">
          <span className="label-text font-medium">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none">
            <Calendar className="w-5 h-5" />
          </span>
          <input
            type={includeTime ? "datetime-local" : "date"}
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={cn(
              "input input-bordered w-full pl-10",
              error && "input-error"
            )}
            placeholder="Start date"
          />
        </div>
        <span className="text-base-content/50">to</span>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none">
            <Calendar className="w-5 h-5" />
          </span>
          <input
            type={includeTime ? "datetime-local" : "date"}
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={startDate}
            className={cn(
              "input input-bordered w-full pl-10",
              error && "input-error"
            )}
            placeholder="End date"
          />
        </div>
      </div>
      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
}
