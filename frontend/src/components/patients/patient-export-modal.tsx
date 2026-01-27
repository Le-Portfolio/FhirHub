"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Download, FileText, Table } from "@/components/ui/icons";

interface PatientExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
}

type ExportFormat = "fhir-json" | "csv";

interface ExportOptions {
  conditions: boolean;
  medications: boolean;
  vitals: boolean;
  labs: boolean;
}

export function PatientExportModal({
  isOpen,
  onClose,
  patientName,
  patientId,
}: PatientExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("fhir-json");
  const [options, setOptions] = useState<ExportOptions>({
    conditions: true,
    medications: true,
    vitals: true,
    labs: true,
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    // Simulate export delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create export data
    const exportData = {
      resourceType: "Bundle",
      type: "collection",
      meta: {
        lastUpdated: new Date().toISOString(),
      },
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: patientId,
            name: [{ text: patientName }],
          },
        },
      ],
      exportedResources: Object.entries(options)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key),
    };

    // Generate file
    const content =
      format === "fhir-json"
        ? JSON.stringify(exportData, null, 2)
        : generateCSV(exportData);

    const blob = new Blob([content], {
      type: format === "fhir-json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `patient-${patientId}-export.${format === "fhir-json" ? "json" : "csv"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExporting(false);
    onClose();
  };

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasAnySelected = Object.values(options).some(Boolean);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Patient Data"
      description={`Export data for ${patientName}`}
      size="md"
      footer={
        <div className="flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary gap-2"
            onClick={handleExport}
            disabled={exporting || !hasAnySelected}
          >
            {exporting && (
              <span className="loading loading-spinner loading-sm" />
            )}
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Format selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat("fhir-json")}
              className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                format === "fhir-json"
                  ? "border-primary bg-primary/5"
                  : "border-base-300 hover:border-base-content/30"
              }`}
            >
              <FileText className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">FHIR JSON</p>
                <p className="text-xs text-base-content/60">Standard bundle</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                format === "csv"
                  ? "border-primary bg-primary/5"
                  : "border-base-300 hover:border-base-content/30"
              }`}
            >
              <Table className="w-5 h-5 text-success" />
              <div className="text-left">
                <p className="font-medium">CSV</p>
                <p className="text-xs text-base-content/60">Spreadsheet</p>
              </div>
            </button>
          </div>
        </div>

        {/* Resource selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Include Resources
          </label>
          <div className="space-y-2">
            {[
              { key: "conditions" as const, label: "Conditions" },
              { key: "medications" as const, label: "Medications" },
              { key: "vitals" as const, label: "Vital Signs" },
              { key: "labs" as const, label: "Lab Results" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-3 p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => toggleOption(key)}
                  className="checkbox checkbox-sm checkbox-primary"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface ExportBundle {
  entry?: Array<{
    resource?: {
      id?: string;
      name?: Array<{ text?: string }>;
    };
  }>;
}

function generateCSV(data: ExportBundle): string {
  const entry = data.entry?.[0];
  const rows = [
    ["Patient Export"],
    ["Generated", new Date().toISOString()],
    ["Patient ID", entry?.resource?.id || ""],
    ["Patient Name", entry?.resource?.name?.[0]?.text || ""],
    [""],
    ["Note: Full CSV export coming soon"],
  ];
  return rows.map((row) => row.join(",")).join("\n");
}
