import { z } from "zod";
import { clinicalRanges } from "./clinical-ranges";

/**
 * Validation schema for recording vital signs.
 */
export const recordVitalsSchema = z
  .object({
    systolic: z.coerce
      .number()
      .min(
        clinicalRanges.systolic.min,
        `Systolic must be at least ${clinicalRanges.systolic.min}`
      )
      .max(
        clinicalRanges.systolic.max,
        `Systolic cannot exceed ${clinicalRanges.systolic.max}`
      )
      .optional()
      .or(z.literal("")),
    diastolic: z.coerce
      .number()
      .min(
        clinicalRanges.diastolic.min,
        `Diastolic must be at least ${clinicalRanges.diastolic.min}`
      )
      .max(
        clinicalRanges.diastolic.max,
        `Diastolic cannot exceed ${clinicalRanges.diastolic.max}`
      )
      .optional()
      .or(z.literal("")),
    heartRate: z.coerce
      .number()
      .min(
        clinicalRanges.heartRate.min,
        `Heart rate must be at least ${clinicalRanges.heartRate.min}`
      )
      .max(
        clinicalRanges.heartRate.max,
        `Heart rate cannot exceed ${clinicalRanges.heartRate.max}`
      )
      .optional()
      .or(z.literal("")),
    temperature: z.coerce
      .number()
      .min(
        clinicalRanges.temperature.min,
        `Temperature must be at least ${clinicalRanges.temperature.min}`
      )
      .max(
        clinicalRanges.temperature.max,
        `Temperature cannot exceed ${clinicalRanges.temperature.max}`
      )
      .optional()
      .or(z.literal("")),
    respiratoryRate: z.coerce
      .number()
      .min(
        clinicalRanges.respiratoryRate.min,
        `Respiratory rate must be at least ${clinicalRanges.respiratoryRate.min}`
      )
      .max(
        clinicalRanges.respiratoryRate.max,
        `Respiratory rate cannot exceed ${clinicalRanges.respiratoryRate.max}`
      )
      .optional()
      .or(z.literal("")),
    oxygenSaturation: z.coerce
      .number()
      .min(
        clinicalRanges.oxygenSaturation.min,
        `O2 saturation must be at least ${clinicalRanges.oxygenSaturation.min}`
      )
      .max(
        clinicalRanges.oxygenSaturation.max,
        `O2 saturation cannot exceed ${clinicalRanges.oxygenSaturation.max}`
      )
      .optional()
      .or(z.literal("")),
    weight: z.coerce
      .number()
      .min(
        clinicalRanges.weight.min,
        `Weight must be at least ${clinicalRanges.weight.min}`
      )
      .max(
        clinicalRanges.weight.max,
        `Weight cannot exceed ${clinicalRanges.weight.max}`
      )
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      return (
        data.systolic ||
        data.diastolic ||
        data.heartRate ||
        data.temperature ||
        data.respiratoryRate ||
        data.oxygenSaturation ||
        data.weight
      );
    },
    { message: "At least one vital sign must be provided" }
  );

export type RecordVitalsFormData = z.infer<typeof recordVitalsSchema>;

/**
 * ICD-10 code pattern: Letter followed by 2 digits, optional decimal with up to 4 digits
 * Examples: A00, A00.0, E11.9, Z23.000
 */
const icd10Pattern = /^[A-Z]\d{2}(\.\d{1,4})?$/;

/**
 * Validation schema for creating a condition.
 */
export const createConditionSchema = z.object({
  name: z
    .string()
    .min(2, "Condition name must be at least 2 characters")
    .max(200, "Condition name cannot exceed 200 characters"),
  icdCode: z
    .string()
    .regex(icd10Pattern, "ICD-10 code must be in format like A00 or A00.0")
    .optional()
    .or(z.literal("")),
  onsetDate: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return date <= new Date();
      },
      { message: "Onset date cannot be in the future" }
    )
    .optional()
    .or(z.literal("")),
  severity: z.enum(["mild", "moderate", "severe"], {
    errorMap: () => ({ message: "Severity must be mild, moderate, or severe" }),
  }),
  clinicalStatus: z.enum(["active", "recurrence", "relapse", "remission"], {
    errorMap: () => ({
      message:
        "Clinical status must be active, recurrence, relapse, or remission",
    }),
  }),
  notes: z
    .string()
    .max(2000, "Notes cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateConditionFormData = z.infer<typeof createConditionSchema>;

/**
 * Validation schema for creating a medication.
 */
export const createMedicationSchema = z.object({
  name: z
    .string()
    .min(2, "Medication name must be at least 2 characters")
    .max(200, "Medication name cannot exceed 200 characters"),
  dosage: z.coerce
    .number()
    .positive("Dosage must be a positive number")
    .optional()
    .or(z.literal("")),
  unit: z
    .enum(["mg", "mcg", "g", "mL", "units", "tablets", "capsules", "puffs"])
    .optional(),
  route: z
    .enum([
      "oral",
      "sublingual",
      "topical",
      "inhalation",
      "iv",
      "im",
      "sc",
      "rectal",
    ])
    .optional(),
  frequency: z.enum(["once", "daily", "bid", "tid", "qid", "prn", "weekly"], {
    errorMap: () => ({ message: "Please select a valid frequency" }),
  }),
  startDate: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return date <= new Date();
      },
      { message: "Start date cannot be in the future" }
    )
    .optional()
    .or(z.literal("")),
  instructions: z
    .string()
    .max(1000, "Instructions cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateMedicationFormData = z.infer<typeof createMedicationSchema>;

/**
 * Valid lab panel IDs.
 */
const validPanelIds = [
  "cbc",
  "bmp",
  "cmp",
  "lipid",
  "tsh",
  "hba1c",
  "ua",
  "pt",
] as const;

/**
 * Validation schema for ordering labs.
 */
export const orderLabsSchema = z.object({
  panelIds: z
    .array(z.enum(validPanelIds))
    .min(1, "At least one lab panel must be selected"),
  priority: z.enum(["routine", "asap", "stat"], {
    errorMap: () => ({ message: "Priority must be routine, asap, or stat" }),
  }),
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type OrderLabsFormData = z.infer<typeof orderLabsSchema>;
