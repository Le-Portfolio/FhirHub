"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Pill, AlertCircle } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { usePatientService } from "@/services";
import type { CreateMedicationRequest } from "@/types";

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

interface MedicationFormData {
  name: string;
  dosage: string;
  unit: string;
  route: string;
  frequency: string;
  startDate: string;
  instructions: string;
}

interface FieldError {
  field: keyof MedicationFormData;
  message: string;
}

const initialFormData: MedicationFormData = {
  name: "",
  dosage: "",
  unit: "mg",
  route: "oral",
  frequency: "daily",
  startDate: "",
  instructions: "",
};

const routeOptions = [
  { value: "oral", label: "Oral" },
  { value: "sublingual", label: "Sublingual" },
  { value: "topical", label: "Topical" },
  { value: "inhalation", label: "Inhalation" },
  { value: "iv", label: "Intravenous (IV)" },
  { value: "im", label: "Intramuscular (IM)" },
  { value: "sc", label: "Subcutaneous" },
  { value: "rectal", label: "Rectal" },
];

const frequencyOptions = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Once daily" },
  { value: "bid", label: "Twice daily (BID)" },
  { value: "tid", label: "Three times daily (TID)" },
  { value: "qid", label: "Four times daily (QID)" },
  { value: "prn", label: "As needed (PRN)" },
  { value: "weekly", label: "Weekly" },
];

const unitOptions = [
  "mg",
  "mcg",
  "g",
  "mL",
  "units",
  "tablets",
  "capsules",
  "puffs",
];

function validateForm(data: MedicationFormData): FieldError[] {
  const errors: FieldError[] = [];

  // Name validation
  if (!data.name.trim()) {
    errors.push({ field: "name", message: "Medication name is required" });
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

  // Dosage validation (must be positive number if provided)
  if (data.dosage) {
    const dosageNum = parseFloat(data.dosage);
    if (isNaN(dosageNum)) {
      errors.push({
        field: "dosage",
        message: "Dosage must be a valid number",
      });
    } else if (dosageNum <= 0) {
      errors.push({
        field: "dosage",
        message: "Dosage must be a positive number",
      });
    }
  }

  // Start date validation (cannot be in the future)
  if (data.startDate) {
    const startDate = new Date(data.startDate);
    if (startDate > new Date()) {
      errors.push({
        field: "startDate",
        message: "Start date cannot be in the future",
      });
    }
  }

  // Instructions length validation
  if (data.instructions && data.instructions.length > 1000) {
    errors.push({
      field: "instructions",
      message: "Instructions cannot exceed 1000 characters",
    });
  }

  return errors;
}

export function AddMedicationModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess,
}: AddMedicationModalProps) {
  const [formData, setFormData] = useState<MedicationFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<keyof MedicationFormData>>(
    new Set()
  );
  const { success, error } = useToast();
  const patientService = usePatientService();

  const errors = useMemo(() => validateForm(formData), [formData]);
  const errorMap = useMemo(() => {
    const map: Partial<Record<keyof MedicationFormData, string>> = {};
    errors.forEach((e) => {
      map[e.field] = e.message;
    });
    return map;
  }, [errors]);

  const handleChange = (field: keyof MedicationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof MedicationFormData) => {
    setTouched((prev) => new Set(prev).add(field));
  };

  const showError = (field: keyof MedicationFormData) => {
    return touched.has(field) && errorMap[field];
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    setTouched(new Set(Object.keys(formData) as (keyof MedicationFormData)[]));

    if (errors.length > 0) {
      error(errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const request: CreateMedicationRequest = {
        name: formData.name.trim(),
        dosage: formData.dosage || undefined,
        unit: formData.unit || undefined,
        route: formData.route || undefined,
        frequency: formData.frequency,
        startDate: formData.startDate || undefined,
        instructions: formData.instructions.trim() || undefined,
      };

      await patientService.createMedication(patientId, request);
      success(`Medication "${formData.name}" added successfully`);
      setFormData(initialFormData);
      setTouched(new Set());
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to add medication");
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
      title="Add Medication"
      description={`Add a new medication for ${patientName}`}
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
              <Pill className="w-4 h-4" />
            )}
            {isSubmitting ? "Adding..." : "Add Medication"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Medication name */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Medication Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Metformin"
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

        {/* Dosage */}
        <div>
          <label className="text-sm font-medium mb-2 block">Dosage</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount"
              value={formData.dosage}
              onChange={(e) => handleChange("dosage", e.target.value)}
              onBlur={() => handleBlur("dosage")}
              min="0"
              step="0.01"
              className={`input input-bordered flex-1 ${showError("dosage") ? "input-error" : ""}`}
              disabled={isSubmitting}
            />
            <select
              value={formData.unit}
              onChange={(e) => handleChange("unit", e.target.value)}
              className="select select-bordered w-28"
              disabled={isSubmitting}
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          {showError("dosage") && (
            <div className="flex items-center gap-1 mt-1 text-xs text-error">
              <AlertCircle className="w-3 h-3" />
              <span>{errorMap.dosage}</span>
            </div>
          )}
        </div>

        {/* Route and Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Route</label>
            <select
              value={formData.route}
              onChange={(e) => handleChange("route", e.target.value)}
              className="select select-bordered w-full"
              disabled={isSubmitting}
            >
              {routeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Frequency</label>
            <select
              value={formData.frequency}
              onChange={(e) => handleChange("frequency", e.target.value)}
              className="select select-bordered w-full"
              disabled={isSubmitting}
            >
              {frequencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start date */}
        <div>
          <label className="text-sm font-medium mb-2 block">Start Date</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            onBlur={() => handleBlur("startDate")}
            max={getTodayString()}
            className={`input input-bordered w-full md:w-1/2 ${showError("startDate") ? "input-error" : ""}`}
            disabled={isSubmitting}
          />
          {showError("startDate") && (
            <div className="flex items-center gap-1 mt-1 text-xs text-error">
              <AlertCircle className="w-3 h-3" />
              <span>{errorMap.startDate}</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Instructions (Optional)
          </label>
          <textarea
            placeholder="e.g., Take with food, avoid alcohol..."
            value={formData.instructions}
            onChange={(e) => handleChange("instructions", e.target.value)}
            onBlur={() => handleBlur("instructions")}
            className={`textarea textarea-bordered w-full h-24 ${showError("instructions") ? "textarea-error" : ""}`}
            disabled={isSubmitting}
            maxLength={1000}
          />
          <div className="flex justify-between mt-1">
            <div>
              {showError("instructions") && (
                <div className="flex items-center gap-1 text-xs text-error">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errorMap.instructions}</span>
                </div>
              )}
            </div>
            <span className="text-xs text-base-content/50">
              {formData.instructions.length}/1000
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
