"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Download,
  FileArchive,
} from "@/components/ui/icons";

interface ExportWizardProps {
  onComplete: (config: ExportConfig) => void;
  onCancel: () => void;
  resourceCounts?: Record<string, number>;
  className?: string;
}

export interface ExportConfig {
  resourceTypes: string[];
  dateRange: { start: string; end: string } | null;
  format: "ndjson" | "json";
  includeReferences: boolean;
}

const steps = [
  {
    id: 1,
    name: "Select Resources",
    description: "Choose FHIR resource types",
  },
  { id: 2, name: "Date Range", description: "Filter by time period" },
  { id: 3, name: "Options", description: "Configure export settings" },
  { id: 4, name: "Review", description: "Confirm and start export" },
];

export function ExportWizard({
  onComplete,
  onCancel,
  resourceCounts,
  className,
}: ExportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<ExportConfig>({
    resourceTypes: [],
    dateRange: null,
    format: "ndjson",
    includeReferences: true,
  });

  const canProceed = () => {
    if (currentStep === 1) return config.resourceTypes.length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(config);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div
      className={cn("bg-base-100 rounded-xl border border-base-200", className)}
    >
      {/* Step indicator */}
      <div className="border-b border-base-200 p-6">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className={cn(
                  "relative",
                  index !== steps.length - 1 && "flex-1"
                )}
              >
                <div className="flex items-center">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold",
                      step.id < currentStep
                        ? "border-primary bg-primary text-primary-content"
                        : step.id === currentStep
                          ? "border-primary text-primary"
                          : "border-base-300 text-base-content/50"
                    )}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </span>
                  <div className="ml-4 hidden sm:block">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        step.id === currentStep
                          ? "text-primary"
                          : "text-base-content/70"
                      )}
                    >
                      {step.name}
                    </p>
                    <p className="text-xs text-base-content/50">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index !== steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-5 left-10 w-full h-0.5 -translate-y-1/2 ml-4 mr-8",
                      step.id < currentStep ? "bg-primary" : "bg-base-300"
                    )}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step content */}
      <div className="p-6 min-h-[300px]">
        {currentStep === 1 && (
          <ResourceTypeStep
            selected={config.resourceTypes}
            onChange={(resourceTypes) =>
              setConfig({ ...config, resourceTypes })
            }
            resourceCounts={resourceCounts}
          />
        )}
        {currentStep === 2 && (
          <DateRangeStep
            dateRange={config.dateRange}
            onChange={(dateRange) => setConfig({ ...config, dateRange })}
          />
        )}
        {currentStep === 3 && (
          <OptionsStep
            format={config.format}
            includeReferences={config.includeReferences}
            onFormatChange={(format) => setConfig({ ...config, format })}
            onReferencesChange={(includeReferences) =>
              setConfig({ ...config, includeReferences })
            }
          />
        )}
        {currentStep === 4 && (
          <ReviewStep config={config} resourceCounts={resourceCounts} />
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-base-200 p-6 flex justify-between">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canProceed()}>
            {currentStep === 4 ? (
              <>
                <Download className="w-4 h-4 mr-2" />
                Start Export
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Step 1: Resource Type Selection
interface ResourceTypeStepProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  resourceCounts?: Record<string, number>;
}

const resourceTypes = [
  {
    id: "Patient",
    label: "Patients",
    description: "Patient demographics and identifiers",
  },
  {
    id: "Observation",
    label: "Observations",
    description: "Vital signs, lab results, assessments",
  },
  {
    id: "Condition",
    label: "Conditions",
    description: "Diagnoses and health conditions",
  },
  {
    id: "MedicationRequest",
    label: "Medications",
    description: "Medication orders and prescriptions",
  },
  {
    id: "DiagnosticReport",
    label: "Diagnostic Reports",
    description: "Lab reports and imaging results",
  },
  {
    id: "Encounter",
    label: "Encounters",
    description: "Patient visits and admissions",
  },
  {
    id: "Procedure",
    label: "Procedures",
    description: "Clinical procedures performed",
  },
  {
    id: "Immunization",
    label: "Immunizations",
    description: "Vaccination records",
  },
  {
    id: "AllergyIntolerance",
    label: "Allergies",
    description: "Allergy and intolerance records",
  },
  {
    id: "DocumentReference",
    label: "Documents",
    description: "Clinical documents and attachments",
  },
];

function ResourceTypeStep({
  selected,
  onChange,
  resourceCounts,
}: ResourceTypeStepProps) {
  const toggleResource = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((r) => r !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => {
    onChange(resourceTypes.map((r) => r.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Select Resource Types</h3>
          <p className="text-sm text-base-content/60">
            Choose which FHIR resource types to include in the export
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {resourceTypes.map((resource) => {
          const count = resourceCounts?.[resource.id];
          return (
            <label
              key={resource.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                selected.includes(resource.id)
                  ? "border-primary bg-primary/5"
                  : "border-base-200 hover:border-base-300"
              )}
            >
              <input
                type="checkbox"
                className="checkbox checkbox-primary mt-0.5"
                checked={selected.includes(resource.id)}
                onChange={() => toggleResource(resource.id)}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{resource.label}</span>
                  <span className="text-xs text-base-content/50">
                    {count != null
                      ? `${count.toLocaleString()} records`
                      : "\u2014"}
                  </span>
                </div>
                <p className="text-sm text-base-content/60">
                  {resource.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-sm text-base-content/70">
          {selected.length} resource type{selected.length !== 1 ? "s" : ""}{" "}
          selected
        </p>
      )}
    </div>
  );
}

// Step 2: Date Range
interface DateRangeStepProps {
  dateRange: { start: string; end: string } | null;
  onChange: (dateRange: { start: string; end: string } | null) => void;
}

function DateRangeStep({ dateRange, onChange }: DateRangeStepProps) {
  const [useFilter, setUseFilter] = useState(dateRange !== null);

  const presets = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
    { label: "Last year", days: 365 },
  ];

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onChange({
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    });
    setUseFilter(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Date Range Filter</h3>
        <p className="text-sm text-base-content/60">
          Optionally filter resources by their last updated date
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={useFilter}
          onChange={(e) => {
            setUseFilter(e.target.checked);
            if (!e.target.checked) onChange(null);
          }}
        />
        <span className="text-sm">Enable date range filter</span>
      </div>

      {useFilter && (
        <>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.days}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset.days)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={dateRange?.start || ""}
                onChange={(e) =>
                  onChange({ start: e.target.value, end: dateRange?.end || "" })
                }
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={dateRange?.end || ""}
                onChange={(e) =>
                  onChange({
                    start: dateRange?.start || "",
                    end: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </>
      )}

      {!useFilter && (
        <div className="p-4 bg-base-200 rounded-lg text-center text-base-content/70">
          <FileArchive className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>All records will be included regardless of date</p>
        </div>
      )}
    </div>
  );
}

// Step 3: Options
interface OptionsStepProps {
  format: "ndjson" | "json";
  includeReferences: boolean;
  onFormatChange: (format: "ndjson" | "json") => void;
  onReferencesChange: (include: boolean) => void;
}

function OptionsStep({
  format,
  includeReferences,
  onFormatChange,
  onReferencesChange,
}: OptionsStepProps) {
  const formats = [
    {
      id: "ndjson" as const,
      label: "NDJSON",
      description: "Newline-delimited JSON (FHIR Bulk Data standard)",
      recommended: true,
    },
    {
      id: "json" as const,
      label: "JSON Bundle",
      description: "Single FHIR Bundle containing all resources",
      recommended: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Export Options</h3>
        <p className="text-sm text-base-content/60">
          Configure the export format and additional settings
        </p>
      </div>

      <div className="space-y-3">
        <label className="label">
          <span className="label-text font-medium">Export Format</span>
        </label>
        {formats.map((fmt) => (
          <label
            key={fmt.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
              format === fmt.id
                ? "border-primary bg-primary/5"
                : "border-base-200 hover:border-base-300"
            )}
          >
            <input
              type="radio"
              name="format"
              className="radio radio-primary mt-0.5"
              checked={format === fmt.id}
              onChange={() => onFormatChange(fmt.id)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{fmt.label}</span>
                {fmt.recommended && (
                  <span className="badge badge-primary badge-sm px-2.5">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-sm text-base-content/60">{fmt.description}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="divider" />

      <div className="space-y-3">
        <label className="label">
          <span className="label-text font-medium">Additional Options</span>
        </label>
        <label className="flex items-start gap-3 p-4 rounded-lg border border-base-200 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-primary mt-0.5"
            checked={includeReferences}
            onChange={(e) => onReferencesChange(e.target.checked)}
          />
          <div>
            <span className="font-medium">Include referenced resources</span>
            <p className="text-sm text-base-content/60">
              Automatically include resources referenced by the selected types
              (e.g., include Practitioner when exporting Encounters)
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

// Step 4: Review
interface ReviewStepProps {
  config: ExportConfig;
  resourceCounts?: Record<string, number>;
}

function ReviewStep({ config, resourceCounts }: ReviewStepProps) {
  const totalResources = resourceCounts
    ? config.resourceTypes.reduce(
        (sum, type) => sum + (resourceCounts[type] ?? 0),
        0
      )
    : null;

  const estimatedSizeKB =
    totalResources != null ? Math.round(totalResources * 3) : null;

  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Review Export Configuration</h3>
        <p className="text-sm text-base-content/60">
          Please review your export settings before starting
        </p>
      </div>

      <div className="bg-base-200 rounded-lg divide-y divide-base-300">
        <div className="p-4">
          <dt className="text-sm text-base-content/60">Resource Types</dt>
          <dd className="mt-1 flex flex-wrap gap-2">
            {config.resourceTypes.map((type) => (
              <span key={type} className="badge badge-primary px-2.5">
                {type}
              </span>
            ))}
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-sm text-base-content/60">Date Range</dt>
          <dd className="mt-1 font-medium">
            {config.dateRange
              ? `${config.dateRange.start} to ${config.dateRange.end}`
              : "All records (no date filter)"}
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-sm text-base-content/60">Format</dt>
          <dd className="mt-1 font-medium">
            {config.format === "ndjson"
              ? "NDJSON (Newline-delimited JSON)"
              : "JSON Bundle"}
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-sm text-base-content/60">Include References</dt>
          <dd className="mt-1 font-medium">
            {config.includeReferences ? "Yes" : "No"}
          </dd>
        </div>
      </div>

      <div className="alert alert-info">
        <div>
          <p className="font-medium">Estimated Export</p>
          <p className="text-sm">
            {totalResources != null && estimatedSizeKB != null
              ? `~${totalResources.toLocaleString()} resources \u2022 ~${formatSize(estimatedSizeKB)}`
              : "Size will be calculated after export"}
          </p>
        </div>
      </div>
    </div>
  );
}
