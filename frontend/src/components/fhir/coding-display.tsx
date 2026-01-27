"use client";

import { cn } from "@/lib/utils";
import { Info } from "@/components/ui/icons";

interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
}

interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

interface CodingDisplayProps {
  value: Coding | CodeableConcept | undefined | null;
  showCode?: boolean;
  showSystem?: boolean;
  showTooltip?: boolean;
  fallback?: string;
  className?: string;
}

// System display name mapping
const systemNames: Record<string, string> = {
  "http://snomed.info/sct": "SNOMED CT",
  "http://loinc.org": "LOINC",
  "http://hl7.org/fhir/sid/icd-10": "ICD-10",
  "http://hl7.org/fhir/sid/icd-10-cm": "ICD-10-CM",
  "http://www.nlm.nih.gov/research/umls/rxnorm": "RxNorm",
  "http://hl7.org/fhir/sid/cvx": "CVX",
  "http://hl7.org/fhir/sid/ndc": "NDC",
  "http://terminology.hl7.org/CodeSystem/v3-ActCode": "HL7 ActCode",
  "http://terminology.hl7.org/CodeSystem/condition-clinical":
    "Condition Clinical",
  "http://terminology.hl7.org/CodeSystem/condition-ver-status":
    "Verification Status",
};

function getSystemName(system: string): string {
  return systemNames[system] || system.split("/").pop() || system;
}

export function CodingDisplay({
  value,
  showCode = false,
  showSystem = false,
  showTooltip = true,
  fallback = "-",
  className,
}: CodingDisplayProps) {
  if (!value) {
    return (
      <span className={cn("text-base-content/50", className)}>{fallback}</span>
    );
  }

  // Handle CodeableConcept
  if ("text" in value || "coding" in value) {
    const concept = value as CodeableConcept;
    const primaryCoding = concept.coding?.[0];

    // Prefer text, then coding display
    const displayText =
      concept.text || primaryCoding?.display || primaryCoding?.code;

    if (!displayText) {
      return (
        <span className={cn("text-base-content/50", className)}>
          {fallback}
        </span>
      );
    }

    return (
      <CodingDisplayInner
        display={displayText}
        code={primaryCoding?.code}
        system={primaryCoding?.system}
        showCode={showCode}
        showSystem={showSystem}
        showTooltip={showTooltip}
        className={className}
      />
    );
  }

  // Handle Coding
  const coding = value as Coding;
  const displayText = coding.display || coding.code;

  if (!displayText) {
    return (
      <span className={cn("text-base-content/50", className)}>{fallback}</span>
    );
  }

  return (
    <CodingDisplayInner
      display={displayText}
      code={coding.code}
      system={coding.system}
      showCode={showCode}
      showSystem={showSystem}
      showTooltip={showTooltip}
      className={className}
    />
  );
}

interface CodingDisplayInnerProps {
  display: string;
  code?: string;
  system?: string;
  showCode: boolean;
  showSystem: boolean;
  showTooltip: boolean;
  className?: string;
}

function CodingDisplayInner({
  display,
  code,
  system,
  showCode,
  showSystem,
  showTooltip,
  className,
}: CodingDisplayInnerProps) {
  const tooltipContent = [
    system && `System: ${getSystemName(system)}`,
    code && `Code: ${code}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      title={showTooltip ? tooltipContent : undefined}
    >
      <span>{display}</span>
      {showCode && code && code !== display && (
        <code className="text-xs text-base-content/50 bg-base-200 px-1 rounded">
          {code}
        </code>
      )}
      {showSystem && system && (
        <span className="text-xs text-base-content/40">
          [{getSystemName(system)}]
        </span>
      )}
      {showTooltip && (system || code) && (
        <span className="tooltip tooltip-top" data-tip={tooltipContent}>
          <Info className="w-3.5 h-3.5 text-base-content/30 cursor-help" />
        </span>
      )}
    </span>
  );
}

// Display multiple codings (e.g., from CodeableConcept with multiple codings)
interface CodingListProps {
  codings: Coding[] | undefined | null;
  className?: string;
}

export function CodingList({ codings, className }: CodingListProps) {
  if (!codings?.length) {
    return <span className="text-base-content/50">-</span>;
  }

  return (
    <div className={cn("space-y-1", className)}>
      {codings.map((coding, index) => (
        <div key={index} className="flex items-center gap-2">
          <CodingDisplay value={coding} showCode showSystem={false} />
        </div>
      ))}
    </div>
  );
}
