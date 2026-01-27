"use client";

import { cn } from "@/lib/utils";
import { formatFhirDate } from "@/lib/fhir-formatters";
import { Clock } from "@/components/ui/icons";

interface FhirDateProps {
  value: string | undefined | null;
  includeTime?: boolean;
  relative?: boolean;
  showIcon?: boolean;
  fallback?: string;
  className?: string;
}

export function FhirDate({
  value,
  includeTime = false,
  relative = false,
  showIcon = false,
  fallback = "-",
  className,
}: FhirDateProps) {
  const formatted = formatFhirDate(value, {
    includeTime,
    relative,
    fallback,
  });

  // Also get the absolute date for tooltip when showing relative
  const absoluteDate = relative
    ? formatFhirDate(value, { includeTime: true, fallback: "" })
    : "";

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      title={absoluteDate || undefined}
    >
      {showIcon && <Clock className="w-3.5 h-3.5 text-base-content/50" />}
      {formatted}
    </span>
  );
}

// Age display from birth date
interface FhirAgeProps {
  birthDate: string | undefined | null;
  className?: string;
}

export function FhirAge({ birthDate, className }: FhirAgeProps) {
  if (!birthDate) {
    return <span className={className}>-</span>;
  }

  const birth = new Date(birthDate);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    years--;
  }

  // For infants, show months
  if (years < 2) {
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months += today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) months--;

    if (months < 1) {
      const days = Math.floor(
        (today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)
      );
      return <span className={className}>{days}d</span>;
    }
    return <span className={className}>{months}mo</span>;
  }

  return <span className={className}>{years}y</span>;
}
