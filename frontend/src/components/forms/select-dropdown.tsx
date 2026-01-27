"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectDropdownProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "select-sm",
  md: "",
  lg: "select-lg",
};

export const SelectDropdown = forwardRef<
  HTMLSelectElement,
  SelectDropdownProps
>(
  (
    {
      label,
      error,
      helperText,
      required,
      options,
      placeholder,
      className,
      size = "md",
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name;

    return (
      <div className={cn("form-control w-full", className)}>
        {label && (
          <label className="label" htmlFor={selectId}>
            <span className="label-text font-medium">
              {label}
              {required && <span className="text-error ml-1">*</span>}
            </span>
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "select select-bordered w-full",
            sizeClasses[size],
            error && "select-error"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {(error || helperText) && (
          <label className="label">
            {error ? (
              <span
                id={`${selectId}-error`}
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

SelectDropdown.displayName = "SelectDropdown";
