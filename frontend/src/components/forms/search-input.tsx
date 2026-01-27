"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Search, X, Loader2 } from "@/components/ui/icons";

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  autoFocus?: boolean;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = "Search...",
  debounceMs = 300,
  loading = false,
  className,
  size = "md",
  autoFocus = false,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || "");
  const [prevControlledValue, setPrevControlledValue] =
    useState(controlledValue);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with controlled value (render-time adjustment)
  if (controlledValue !== prevControlledValue) {
    setPrevControlledValue(controlledValue);
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);

      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new timeout for debounced callback
      debounceRef.current = setTimeout(() => {
        onChange(newValue);
        onSearch?.(newValue);
      }, debounceMs);
    },
    [onChange, onSearch, debounceMs]
  );

  const handleClear = useCallback(() => {
    setInternalValue("");
    onChange("");
    onSearch?.("");
    inputRef.current?.focus();
  }, [onChange, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        // Clear debounce and search immediately
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        onChange(internalValue);
        onSearch?.(internalValue);
      }
      if (e.key === "Escape") {
        handleClear();
      }
    },
    [internalValue, onChange, onSearch, handleClear]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const sizeClasses = {
    sm: "input-sm",
    md: "",
    lg: "input-lg",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className={cn("relative", className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">
        {loading ? (
          <Loader2 className={cn(iconSizes[size], "animate-spin")} />
        ) : (
          <Search className={iconSizes[size]} />
        )}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "input input-bordered w-full pl-10 pr-10",
          sizeClasses[size]
        )}
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
          aria-label="Clear search"
        >
          <X className={iconSizes[size]} />
        </button>
      )}
    </div>
  );
}
