"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { TestTube, AlertCircle, CheckCircle2 } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { usePatientService } from "@/services";
import type { OrderLabsRequest } from "@/types";

interface OrderLabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

const labPanels = [
  {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    description: "RBC, WBC, Hemoglobin, Platelets",
  },
  {
    id: "bmp",
    name: "Basic Metabolic Panel (BMP)",
    description: "Glucose, Electrolytes, Kidney function",
  },
  {
    id: "cmp",
    name: "Comprehensive Metabolic Panel (CMP)",
    description: "BMP + Liver function tests",
  },
  {
    id: "lipid",
    name: "Lipid Panel",
    description: "Cholesterol, Triglycerides, HDL, LDL",
  },
  {
    id: "tsh",
    name: "Thyroid Panel (TSH)",
    description: "Thyroid stimulating hormone",
  },
  {
    id: "hba1c",
    name: "Hemoglobin A1C",
    description: "Blood sugar average over 2-3 months",
  },
  {
    id: "ua",
    name: "Urinalysis",
    description: "Urine analysis for infection, kidney function",
  },
  {
    id: "pt",
    name: "PT/INR",
    description: "Coagulation, blood clotting time",
  },
];

const priorities = [
  {
    value: "routine",
    label: "Routine",
    description: "Standard processing time",
  },
  { value: "asap", label: "ASAP", description: "Prioritized processing" },
  { value: "stat", label: "STAT", description: "Immediate, urgent processing" },
];

export function OrderLabsModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess,
}: OrderLabsModalProps) {
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [priority, setPriority] = useState("routine");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const { success, error } = useToast();
  const patientService = usePatientService();

  const togglePanel = (panelId: string) => {
    setSelectedPanels((prev) =>
      prev.includes(panelId)
        ? prev.filter((id) => id !== panelId)
        : [...prev, panelId]
    );
    setShowValidation(false);
  };

  const hasValidSelection = selectedPanels.length > 0;
  const notesExceedsLimit = notes.length > 1000;

  const handleSubmit = async () => {
    setShowValidation(true);

    if (!hasValidSelection) {
      error("Please select at least one lab panel");
      return;
    }

    if (notesExceedsLimit) {
      error("Notes cannot exceed 1000 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const request: OrderLabsRequest = {
        panelIds: selectedPanels,
        priority,
        notes: notes.trim() || undefined,
      };

      await patientService.orderLabs(patientId, request);
      const panelNames = selectedPanels.map(
        (id) => labPanels.find((p) => p.id === id)?.name || id
      );
      success(`Lab order placed: ${panelNames.join(", ")}`);
      setSelectedPanels([]);
      setPriority("routine");
      setNotes("");
      setShowValidation(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to order labs");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedPanels([]);
      setPriority("routine");
      setNotes("");
      setShowValidation(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Order Labs"
      description={`Order laboratory tests for ${patientName}`}
      size="lg"
      footer={
        <div className="flex flex-col gap-3">
          {selectedPanels.length > 0 && (
            <div className="bg-base-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">
                  {selectedPanels.length} panel
                  {selectedPanels.length !== 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedPanels.map((id) => {
                  const panel = labPanels.find((p) => p.id === id);
                  return (
                    <span
                      key={id}
                      className="badge badge-primary badge-sm px-2.5"
                    >
                      {panel?.name.split(" (")[0] || id}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary gap-2"
              onClick={handleSubmit}
              disabled={!hasValidSelection || isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              {isSubmitting ? "Ordering..." : "Order Labs"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Lab panels */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Select Lab Panels <span className="text-error">*</span>
          </label>
          {showValidation && !hasValidSelection && (
            <div className="flex items-center gap-1 mb-2 text-xs text-error">
              <AlertCircle className="w-3 h-3" />
              <span>Please select at least one lab panel</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {labPanels.map((panel) => (
              <label
                key={panel.id}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPanels.includes(panel.id)
                    ? "border-primary bg-primary/5"
                    : "border-base-300 hover:border-base-content/30"
                } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selectedPanels.includes(panel.id)}
                  onChange={() => togglePanel(panel.id)}
                  className="checkbox checkbox-sm checkbox-primary mt-0.5"
                  disabled={isSubmitting}
                />
                <div>
                  <p className="font-medium text-sm">{panel.name}</p>
                  <p className="text-xs text-base-content/60">
                    {panel.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-sm font-medium mb-3 block">Priority</label>
          <div className="flex gap-2">
            {priorities.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                disabled={isSubmitting}
                className={`btn btn-sm flex-1 ${
                  priority === p.value
                    ? p.value === "stat"
                      ? "btn-error"
                      : p.value === "asap"
                        ? "btn-warning"
                        : "btn-primary"
                    : "btn-ghost"
                }`}
                title={p.description}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-base-content/50 mt-1">
            {priorities.find((p) => p.value === priority)?.description}
          </p>
        </div>

        {/* Clinical notes */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Clinical Notes (Optional)
          </label>
          <textarea
            placeholder="Reason for ordering, relevant clinical context..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`textarea textarea-bordered w-full h-24 ${notesExceedsLimit ? "textarea-error" : ""}`}
            disabled={isSubmitting}
            maxLength={1000}
          />
          <div className="flex justify-between mt-1">
            <div>
              {notesExceedsLimit && (
                <div className="flex items-center gap-1 text-xs text-error">
                  <AlertCircle className="w-3 h-3" />
                  <span>Notes cannot exceed 1000 characters</span>
                </div>
              )}
            </div>
            <span
              className={`text-xs ${notesExceedsLimit ? "text-error" : "text-base-content/50"}`}
            >
              {notes.length}/1000
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
