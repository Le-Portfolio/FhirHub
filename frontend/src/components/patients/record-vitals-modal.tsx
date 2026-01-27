"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Activity, AlertTriangle, AlertCircle } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { usePatientService } from "@/services";
import type { RecordVitalsRequest } from "@/types";
import {
  clinicalRanges,
  evaluateVital,
  getWarningClasses,
  getWarningMessage,
  type VitalType,
  type WarningLevel,
} from "@/lib/validation/clinical-ranges";

interface RecordVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

interface VitalsFormData {
  systolic: string;
  diastolic: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
}

const initialFormData: VitalsFormData = {
  systolic: "",
  diastolic: "",
  heartRate: "",
  temperature: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  weight: "",
};

interface VitalInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  vitalType: VitalType;
  step?: string;
  showRange?: boolean;
}

function VitalInput({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  vitalType,
  step,
  showRange = true,
}: VitalInputProps) {
  const range = clinicalRanges[vitalType];
  const numValue = value ? Number(value) : null;
  const warningLevel: WarningLevel =
    numValue !== null && !isNaN(numValue)
      ? evaluateVital(vitalType, numValue)
      : "normal";
  const warningClasses = getWarningClasses(warningLevel);
  const warningMessage =
    numValue !== null && !isNaN(numValue)
      ? getWarningMessage(vitalType, numValue, warningLevel)
      : null;

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <input
        type="number"
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={range.min}
        max={range.max}
        className={`input input-bordered w-full ${warningClasses}`}
        disabled={disabled}
      />
      {showRange && range.normalRange !== "N/A" && (
        <p className="text-xs text-base-content/50 mt-1">
          Normal: {range.normalRange}
        </p>
      )}
      {warningMessage && (
        <div
          className={`flex items-start gap-1 mt-1 text-xs ${warningLevel === "critical" ? "text-error" : "text-warning"}`}
        >
          {warningLevel === "critical" ? (
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          )}
          <span>{warningMessage}</span>
        </div>
      )}
    </div>
  );
}

export function RecordVitalsModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess,
}: RecordVitalsModalProps) {
  const [formData, setFormData] = useState<VitalsFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error, warning } = useToast();
  const patientService = usePatientService();

  const handleChange = (field: keyof VitalsFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const hasAnyVitals = () => {
    return Object.values(formData).some((v) => v !== "");
  };

  // Calculate all current warnings
  const currentWarnings = useMemo(() => {
    const warnings: Array<{
      field: string;
      level: WarningLevel;
      message: string;
    }> = [];

    const checkVital = (field: VitalType, value: string) => {
      if (!value) return;
      const num = Number(value);
      if (isNaN(num)) return;
      const level = evaluateVital(field, num);
      if (level !== "normal") {
        const msg = getWarningMessage(field, num, level);
        if (msg) warnings.push({ field, level, message: msg });
      }
    };

    checkVital("systolic", formData.systolic);
    checkVital("diastolic", formData.diastolic);
    checkVital("heartRate", formData.heartRate);
    checkVital("temperature", formData.temperature);
    checkVital("respiratoryRate", formData.respiratoryRate);
    checkVital("oxygenSaturation", formData.oxygenSaturation);

    return warnings;
  }, [formData]);

  const hasCriticalWarnings = currentWarnings.some(
    (w) => w.level === "critical"
  );
  const hasWarnings = currentWarnings.length > 0;

  const handleSubmit = async () => {
    if (!hasAnyVitals()) return;

    setIsSubmitting(true);
    try {
      const request: RecordVitalsRequest = {
        systolic: formData.systolic ? Number(formData.systolic) : undefined,
        diastolic: formData.diastolic ? Number(formData.diastolic) : undefined,
        heartRate: formData.heartRate ? Number(formData.heartRate) : undefined,
        temperature: formData.temperature
          ? Number(formData.temperature)
          : undefined,
        respiratoryRate: formData.respiratoryRate
          ? Number(formData.respiratoryRate)
          : undefined,
        oxygenSaturation: formData.oxygenSaturation
          ? Number(formData.oxygenSaturation)
          : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
      };

      const response = await patientService.recordVitals(patientId, request);

      // Handle server-side warnings
      if (response.warnings && response.warnings.length > 0) {
        const criticalCount = response.warnings.filter(
          (w) => w.level === "Critical"
        ).length;
        if (criticalCount > 0) {
          warning(
            `Vitals recorded with ${criticalCount} critical alert(s) created`
          );
        } else {
          warning(
            `Vitals recorded with ${response.warnings.length} warning(s)`
          );
        }
      } else {
        success("Vital signs recorded successfully");
      }

      if (response.alertsCreated && response.alertsCreated.length > 0) {
        warning(
          `${response.alertsCreated.length} clinical alert(s) created for critical values`
        );
      }

      setFormData(initialFormData);
      onSuccess?.();
      onClose();
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to record vitals");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormData);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Vitals"
      description={`Recording vitals for ${patientName}`}
      size="lg"
      footer={
        <div className="flex flex-col gap-3">
          {hasWarnings && (
            <div
              className={`p-3 rounded-lg ${hasCriticalWarnings ? "bg-error/10 border border-error/30" : "bg-warning/10 border border-warning/30"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {hasCriticalWarnings ? (
                  <AlertCircle className="w-4 h-4 text-error" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                )}
                <span
                  className={`text-sm font-medium ${hasCriticalWarnings ? "text-error" : "text-warning"}`}
                >
                  {hasCriticalWarnings
                    ? "Critical values detected - alerts will be created"
                    : "Values outside normal range"}
                </span>
              </div>
              <p className="text-xs text-base-content/70">
                Values will still be recorded. Clinical staff will be notified.
              </p>
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
              className={`btn gap-2 ${hasCriticalWarnings ? "btn-error" : hasWarnings ? "btn-warning" : "btn-primary"}`}
              onClick={handleSubmit}
              disabled={!hasAnyVitals() || isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              {isSubmitting
                ? "Recording..."
                : hasCriticalWarnings
                  ? "Record (Critical)"
                  : hasWarnings
                    ? "Record (Warning)"
                    : "Record Vitals"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Blood Pressure */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Blood Pressure (mmHg)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Systolic"
                value={formData.systolic}
                onChange={(e) => handleChange("systolic", e.target.value)}
                min={clinicalRanges.systolic.min}
                max={clinicalRanges.systolic.max}
                className={`input input-bordered w-full ${
                  formData.systolic
                    ? getWarningClasses(
                        evaluateVital("systolic", Number(formData.systolic))
                      )
                    : ""
                }`}
                disabled={isSubmitting}
              />
            </div>
            <span className="text-base-content/60">/</span>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Diastolic"
                value={formData.diastolic}
                onChange={(e) => handleChange("diastolic", e.target.value)}
                min={clinicalRanges.diastolic.min}
                max={clinicalRanges.diastolic.max}
                className={`input input-bordered w-full ${
                  formData.diastolic
                    ? getWarningClasses(
                        evaluateVital("diastolic", Number(formData.diastolic))
                      )
                    : ""
                }`}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <p className="text-xs text-base-content/50 mt-1">
            Normal: {clinicalRanges.systolic.normalRange} /{" "}
            {clinicalRanges.diastolic.normalRange}
          </p>
          {formData.systolic &&
            evaluateVital("systolic", Number(formData.systolic)) !==
              "normal" && (
              <div
                className={`flex items-start gap-1 mt-1 text-xs ${
                  evaluateVital("systolic", Number(formData.systolic)) ===
                  "critical"
                    ? "text-error"
                    : "text-warning"
                }`}
              >
                {evaluateVital("systolic", Number(formData.systolic)) ===
                "critical" ? (
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                )}
                <span>
                  {getWarningMessage(
                    "systolic",
                    Number(formData.systolic),
                    evaluateVital("systolic", Number(formData.systolic))
                  )}
                </span>
              </div>
            )}
          {formData.diastolic &&
            evaluateVital("diastolic", Number(formData.diastolic)) !==
              "normal" && (
              <div
                className={`flex items-start gap-1 mt-1 text-xs ${
                  evaluateVital("diastolic", Number(formData.diastolic)) ===
                  "critical"
                    ? "text-error"
                    : "text-warning"
                }`}
              >
                {evaluateVital("diastolic", Number(formData.diastolic)) ===
                "critical" ? (
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                )}
                <span>
                  {getWarningMessage(
                    "diastolic",
                    Number(formData.diastolic),
                    evaluateVital("diastolic", Number(formData.diastolic))
                  )}
                </span>
              </div>
            )}
        </div>

        {/* Other vitals in grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VitalInput
            label="Heart Rate (bpm)"
            placeholder="e.g., 72"
            value={formData.heartRate}
            onChange={(value) => handleChange("heartRate", value)}
            disabled={isSubmitting}
            vitalType="heartRate"
          />

          <VitalInput
            label="Temperature (°F)"
            placeholder="e.g., 98.6"
            value={formData.temperature}
            onChange={(value) => handleChange("temperature", value)}
            disabled={isSubmitting}
            vitalType="temperature"
            step="0.1"
          />

          <VitalInput
            label="Respiratory Rate (breaths/min)"
            placeholder="e.g., 16"
            value={formData.respiratoryRate}
            onChange={(value) => handleChange("respiratoryRate", value)}
            disabled={isSubmitting}
            vitalType="respiratoryRate"
          />

          <VitalInput
            label="Oxygen Saturation (%)"
            placeholder="e.g., 98"
            value={formData.oxygenSaturation}
            onChange={(value) => handleChange("oxygenSaturation", value)}
            disabled={isSubmitting}
            vitalType="oxygenSaturation"
          />

          <VitalInput
            label="Weight (lbs)"
            placeholder="e.g., 165"
            value={formData.weight}
            onChange={(value) => handleChange("weight", value)}
            disabled={isSubmitting}
            vitalType="weight"
            step="0.1"
            showRange={false}
          />
        </div>
      </div>
    </Modal>
  );
}
