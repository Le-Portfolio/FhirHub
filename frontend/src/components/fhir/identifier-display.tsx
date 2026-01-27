"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check, EyeOff, Eye } from "@/components/ui/icons";

interface IdentifierDisplayProps {
  value: string | undefined | null;
  label?: string;
  type?: string;
  masked?: boolean;
  copyable?: boolean;
  className?: string;
}

export function IdentifierDisplay({
  value,
  label,
  type,
  masked: initialMasked = false,
  copyable = true,
  className,
}: IdentifierDisplayProps) {
  const [isMasked, setIsMasked] = useState(initialMasked);
  const [copied, setCopied] = useState(false);

  if (!value) {
    return <span className={cn("text-base-content/50", className)}>-</span>;
  }

  const displayValue = isMasked
    ? "•".repeat(value.length - 4) + value.slice(-4)
    : value;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {(label || type) && (
        <span className="text-xs text-base-content/50 uppercase tracking-wide">
          {label || type}:
        </span>
      )}
      <code className="font-mono text-sm bg-base-200 px-2 py-0.5 rounded">
        {displayValue}
      </code>

      <div className="flex items-center gap-1">
        {initialMasked && (
          <button
            type="button"
            onClick={() => setIsMasked(!isMasked)}
            className="btn btn-ghost btn-xs btn-circle"
            aria-label={isMasked ? "Show value" : "Hide value"}
          >
            {isMasked ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-ghost btn-xs btn-circle"
            aria-label={copied ? "Copied!" : "Copy to clipboard"}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Multiple identifiers display
interface IdentifierListProps {
  identifiers: Array<{
    system?: string;
    value?: string;
    type?: {
      text?: string;
      coding?: Array<{ display?: string; code?: string }>;
    };
  }>;
  showSystem?: boolean;
  className?: string;
}

export function IdentifierList({
  identifiers,
  showSystem = false,
  className,
}: IdentifierListProps) {
  if (!identifiers?.length) {
    return <span className="text-base-content/50">No identifiers</span>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {identifiers.map((id, index) => {
        const typeLabel =
          id.type?.text ||
          id.type?.coding?.[0]?.display ||
          id.type?.coding?.[0]?.code;

        return (
          <div key={index} className="flex items-center gap-2">
            <IdentifierDisplay
              value={id.value}
              label={typeLabel}
              masked={
                typeLabel?.toLowerCase().includes("ssn") ||
                typeLabel?.toLowerCase().includes("social")
              }
            />
            {showSystem && id.system && (
              <span className="text-xs text-base-content/40 truncate max-w-[200px]">
                ({id.system})
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
