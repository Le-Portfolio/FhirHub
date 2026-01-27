"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputClassName?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      leftIcon,
      rightIcon,
      className,
      inputClassName,
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
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input input-bordered w-full",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "input-error",
              inputClassName
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50">
              {rightIcon}
            </span>
          )}
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

FormField.displayName = "FormField";

// Textarea variant
interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const TextareaField = forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
>(({ label, error, helperText, required, className, id, ...props }, ref) => {
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
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "textarea textarea-bordered w-full",
          error && "textarea-error"
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {(error || helperText) && (
        <label className="label">
          {error ? (
            <span id={`${inputId}-error`} className="label-text-alt text-error">
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
});

TextareaField.displayName = "TextareaField";
