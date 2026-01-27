"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { HeartPulse, AlertCircle } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { usePatientService } from "@/services";
import type { CreateConditionRequest } from "@/types";

interface AddConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

interface ConditionFormData {
  name: string;
  icdCode: string;
  onsetDate: string;
  severity: string;
  clinicalStatus: string;
  notes: string;
}

interface FieldError {
  field: keyof ConditionFormData;
  message: string;
}

const initialFormData: ConditionFormData = {
  name: "",
  icdCode: "",
  onsetDate: "",
  severity: "moderate",
  clinicalStatus: "active",
  notes: "",
};

const severityOptions = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "recurrence", label: "Recurrence" },
  { value: "relapse", label: "Relapse" },
  { value: "remission", label: "Remission" },
];

const ICD10_PATTERN = /^[A-Z]\d{2}(\.\d{1,4})?$/;

function validateForm(data: ConditionFormData): FieldError[] {
  const errors: FieldError[] = [];

  // Name validation
  if (!data.name.trim()) {
    errors.push({ field: "name", message: "Condition name is required" });
  } else if (data.name.length < 2) {
    errors.push({
      field: "name",
      message: "Name must be at least 2 characters",
    });
  } else if (data.name.length > 200) {
    errors.push({
      field: "name",
      message: "Name cannot exceed 200 characters",
    });
  }

  // ICD-10 code validation (optional but must be valid format if provided)
  if (data.icdCode && !ICD10_PATTERN.test(data.icdCode.toUpperCase())) {
    errors.push({
      field: "icdCode",
      message: "ICD-10 code must be in format like A00 or A00.0",
    });
  }

  // Onset date validation (cannot be in the future)
  if (data.onsetDate) {
    const onset = new Date(data.onsetDate);
    if (onset > new Date()) {
      errors.push({
        field: "onsetDate",
        message: "Onset date cannot be in the future",
      });
    }
  }

  // Notes length validation
  if (data.notes && data.notes.length > 2000) {
    errors.push({
      field: "notes",
      message: "Notes cannot exceed 2000 characters",
    });
  }

  return errors;
}

function formatIcdCode(value: string): string {
  // Auto-format ICD-10 code as user types
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9.]/g, "");

  // Ensure it starts with a letter
  if (cleaned.length > 0 && !/[A-Z]/.test(cleaned[0])) {
    return "";
  }

  return cleaned;
}

export function AddConditionModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess,
}: AddConditionModalProps) {
  const [formData, setFormData] = useState<ConditionFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<keyof ConditionFormData>>(
    new Set()
  );
  const { success, error } = useToast();
  const patientService = usePatientService();

  const errors = useMemo(() => validateForm(formData), [formData]);
  const errorMap = useMemo(() => {
    const map: Partial<Record<keyof ConditionFormData, string>> = {};
    errors.forEach((e) => {
      map[e.field] = e.message;
    });
    return map;
  }, [errors]);

  const handleChange = (field: keyof ConditionFormData, value: string) => {
    let processedValue = value;

    // Auto-format ICD code
    if (field === "icdCode") {
      processedValue = formatIcdCode(value);
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));
  };

  const handleBlur = (field: keyof ConditionFormData) => {
    setTouched((prev) => new Set(prev).add(field));
  };

  const showError = (field: keyof ConditionFormData) => {
    return touched.has(field) && errorMap[field];
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    setTouched(new Set(Object.keys(formData) as (keyof ConditionFormData)[]));

    if (errors.length > 0) {
      error(errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const request: CreateConditionRequest = {
        name: formData.name.trim(),
        icdCode: formData.icdCode.toUpperCase() || undefined,
        onsetDate: formData.onsetDate || undefined,
        severity: formData.severity,
        clinicalStatus: formData.clinicalStatus,
        notes: formData.notes.trim() || undefined,
      };

      await patientService.createCondition(patientId, request);
      success(`Condition "${formData.name}" added successfully`);
      setFormData(initialFormData);
      setTouched(new Set());
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to add condition");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormData);
      setTouched(new Set());
      onClose();
    }
  };

  const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Condition"
      description={`Add a new condition for ${patientName}`}
      size="lg"
      footer={
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
            disabled={!formData.name || isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <HeartPulse className="w-4 h-4" />
            )}
            {isSubmitting ? "Adding..." : "Add Condition"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Condition name */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Condition Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Type 2 Diabetes Mellitus"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            className={`input input-bordered w-full ${showError("name") ? "input-error" : ""}`}
            disabled={isSubmitting}
            maxLength={200}
          />
          {showError("name") && (
            <div className="flex items-center gap-1 mt-1 text-xs text-error">
              <AlertCircle className="w-3 h-3" />
              <span>{errorMap.name}</span>
            </div>
          )}
        </div>

        {/* ICD-10 Code and Onset Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              ICD-10 Code
            </label>
            <input
              type="text"
              placeholder="e.g., E11.9"
              value={formData.icdCode}
              onChange={(e) => handleChange("icdCode", e.target.value)}
              onBlur={() => handleBlur("icdCode")}
              className={`input input-bordered w-full ${showError("icdCode") ? "input-error" : ""}`}
              disabled={isSubmitting}
              maxLength={10}
            />
            <p className="text-xs text-base-content/50 mt-1">
              Format: Letter + 2 digits, optional decimal (e.g., A00 or A00.0)
            </p>
            {showError("icdCode") && (
              <div className="flex items-center gap-1 mt-1 text-xs text-error">
                <AlertCircle className="w-3 h-3" />
                <span>{errorMap.icdCode}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Onset Date</label>
            <input
              type="date"
              value={formData.onsetDate}
              onChange={(e) => handleChange("onsetDate", e.target.value)}
              onBlur={() => handleBlur("onsetDate")}
              max={getTodayString()}
              className={`input input-bordered w-full ${showError("onsetDate") ? "input-error" : ""}`}
              disabled={isSubmitting}
            />
            {showError("onsetDate") && (
              <div className="flex items-center gap-1 mt-1 text-xs text-error">
                <AlertCircle className="w-3 h-3" />
                <span>{errorMap.onsetDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Severity and Clinical Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => handleChange("severity", e.target.value)}
              className="select select-bordered w-full"
              disabled={isSubmitting}
            >
              {severityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Clinical Status
            </label>
            <select
              value={formData.clinicalStatus}
              onChange={(e) => handleChange("clinicalStatus", e.target.value)}
              className="select select-bordered w-full"
              disabled={isSubmitting}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Clinical Notes (Optional)
          </label>
          <textarea
            placeholder="Additional details about the condition..."
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            onBlur={() => handleBlur("notes")}
            className={`textarea textarea-bordered w-full h-24 ${showError("notes") ? "textarea-error" : ""}`}
            disabled={isSubmitting}
            maxLength={2000}
          />
          <div className="flex justify-between mt-1">
            <div>
              {showError("notes") && (
                <div className="flex items-center gap-1 text-xs text-error">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errorMap.notes}</span>
                </div>
              )}
            </div>
            <span className="text-xs text-base-content/50">
              {formData.notes.length}/2000
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
