"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Search, X, Loader2, ChevronDown, Check } from "@/components/ui/icons";

interface CodeOption {
  code: string;
  display: string;
  system?: string;
}

interface SearchableCodeSelectProps {
  label?: string;
  placeholder?: string;
  value?: CodeOption | null;
  onChange: (value: CodeOption | null) => void;
  onSearch: (query: string) => Promise<CodeOption[]>;
  codeSystem?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchableCodeSelect({
  label,
  placeholder = "Search codes...",
  value,
  onChange,
  onSearch,
  codeSystem,
  error,
  helperText,
  required,
  disabled,
  className,
}: SearchableCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<CodeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search handler with debounce
  const handleSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await onSearch(query);
        setOptions(results);
        setHighlightedIndex(-1);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [onSearch]
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, handleSearch]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        break;
    }
  };

  const handleSelect = (option: CodeOption) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
    inputRef.current?.focus();
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  return (
    <div ref={containerRef} className={cn("form-control w-full", className)}>
      {label && (
        <label className="label">
          <span className="label-text font-medium">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
          {codeSystem && (
            <span className="label-text-alt text-base-content/50">
              {codeSystem}
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {/* Selected value / Input */}
        <div
          className={cn(
            "input input-bordered flex items-center gap-2 cursor-pointer",
            error && "input-error",
            disabled && "input-disabled"
          )}
          onClick={() => !disabled && setIsOpen(true)}
        >
          <Search className="w-4 h-4 text-base-content/50 shrink-0" />

          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none"
              autoFocus
              disabled={disabled}
            />
          ) : value ? (
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="truncate">{value.display}</span>
              <span className="text-xs text-base-content/50 shrink-0">
                ({value.code})
              </span>
            </div>
          ) : (
            <span className="flex-1 text-base-content/50">{placeholder}</span>
          )}

          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : value ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="hover:text-error transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <ChevronDown className="w-4 h-4 text-base-content/50 shrink-0" />
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <ul
            ref={listRef}
            className="absolute z-50 w-full mt-1 bg-base-100 border border-base-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {options.length === 0 ? (
              <li className="p-3 text-center text-base-content/50">
                {loading
                  ? "Searching..."
                  : searchQuery.length < 2
                    ? "Type at least 2 characters to search"
                    : "No results found"}
              </li>
            ) : (
              options.map((option, index) => (
                <li
                  key={`${option.system}-${option.code}`}
                  className={cn(
                    "px-3 py-2 cursor-pointer flex items-start gap-2",
                    index === highlightedIndex && "bg-base-200",
                    value?.code === option.code && "bg-primary/10"
                  )}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{option.display}</div>
                    <div className="text-xs text-base-content/50">
                      {option.code}
                      {option.system && ` • ${option.system}`}
                    </div>
                  </div>
                  {value?.code === option.code && (
                    <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {(error || helperText) && (
        <label className="label">
          {error ? (
            <span className="label-text-alt text-error">{error}</span>
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
