/**
 * Clinical Reference Ranges and Rules
 *
 * This file contains standard reference ranges for vital signs and laboratory tests
 * based on clinical guidelines (AHA, ADA, KDIGO, etc.)
 *
 * Reference ranges can be used to dynamically compute FHIR interpretation codes.
 */

import type {
  ReferenceRangeDTO,
  InterpretationDTO,
  CodeableConceptDTO,
} from "@/types";
import {
  computeInterpretation,
  createInterpretation,
  parseBloodPressure,
} from "./fhir-utils";

/**
 * LOINC system identifier
 */
export const LOINC_SYSTEM = "http://loinc.org";

/**
 * UCUM system identifier (Unified Code for Units of Measure)
 */
export const UCUM_SYSTEM = "http://unitsofmeasure.org";

/**
 * LOINC codes for common vital signs
 */
export const LOINC_CODES = {
  SYSTOLIC_BP: "8480-6",
  DIASTOLIC_BP: "8462-4",
  BLOOD_PRESSURE: "85354-9", // Blood pressure panel
  HEART_RATE: "8867-4",
  BODY_TEMPERATURE: "8310-5",
  BODY_WEIGHT: "29463-7",
  RESPIRATORY_RATE: "9279-1",
  OXYGEN_SATURATION: "2708-6",
} as const;

/**
 * Range definition type for clinical thresholds
 */
interface RangeDefinition {
  low?: number;
  high?: number;
}

/**
 * Vital sign reference ranges by LOINC code
 */
interface VitalRanges {
  normal: RangeDefinition;
  critical?: RangeDefinition;
  unit: string;
}

/**
 * Standard vital signs reference ranges
 * Based on clinical guidelines (AHA, etc.)
 */
export const VITAL_REFERENCE_RANGES: Record<string, VitalRanges | null> = {
  // Blood Pressure (mmHg) - AHA Guidelines
  [LOINC_CODES.SYSTOLIC_BP]: {
    normal: { low: 90, high: 120 },
    critical: { low: 70, high: 180 },
    unit: "mmHg",
  },
  [LOINC_CODES.DIASTOLIC_BP]: {
    normal: { low: 60, high: 80 },
    critical: { low: 40, high: 120 },
    unit: "mmHg",
  },
  // Heart Rate (bpm)
  [LOINC_CODES.HEART_RATE]: {
    normal: { low: 60, high: 100 },
    critical: { low: 40, high: 150 },
    unit: "bpm",
  },
  // Body Temperature (F)
  [LOINC_CODES.BODY_TEMPERATURE]: {
    normal: { low: 97.8, high: 99.1 },
    critical: { low: 95, high: 104 },
    unit: "degF",
  },
  // Respiratory Rate (breaths/min)
  [LOINC_CODES.RESPIRATORY_RATE]: {
    normal: { low: 12, high: 20 },
    critical: { low: 8, high: 30 },
    unit: "/min",
  },
  // Oxygen Saturation (%)
  [LOINC_CODES.OXYGEN_SATURATION]: {
    normal: { low: 95, high: 100 },
    critical: { low: 85 },
    unit: "%",
  },
  // Body Weight - no standard range (varies by individual)
  [LOINC_CODES.BODY_WEIGHT]: null,
} as const;

/**
 * Common lab test reference ranges
 */
export const LAB_REFERENCE_RANGES = {
  // Glucose (mg/dL) - Fasting
  glucose: {
    normal: { low: 70, high: 100 },
    critical: { low: 50, high: 400 },
    unit: "mg/dL",
  },
  // HbA1c (%)
  hba1c: {
    normal: { low: 4.0, high: 5.6 },
    unit: "%",
  },
  // BUN (mg/dL)
  bun: {
    normal: { low: 7, high: 20 },
    critical: { low: 2, high: 100 },
    unit: "mg/dL",
  },
  // Creatinine (mg/dL) - Adult male
  creatinine: {
    normal: { low: 0.7, high: 1.3 },
    critical: { high: 10 },
    unit: "mg/dL",
  },
  // eGFR (mL/min/1.73m2)
  egfr: {
    normal: { low: 60, high: 120 },
    critical: { low: 15 },
    unit: "mL/min/1.73m2",
  },
  // Sodium (mEq/L)
  sodium: {
    normal: { low: 136, high: 145 },
    critical: { low: 120, high: 160 },
    unit: "mEq/L",
  },
  // Potassium (mEq/L)
  potassium: {
    normal: { low: 3.5, high: 5.0 },
    critical: { low: 2.5, high: 6.5 },
    unit: "mEq/L",
  },
  // Total Cholesterol (mg/dL)
  totalCholesterol: {
    normal: { high: 200 },
    unit: "mg/dL",
  },
  // LDL Cholesterol (mg/dL)
  ldlCholesterol: {
    normal: { high: 100 },
    unit: "mg/dL",
  },
  // HDL Cholesterol (mg/dL)
  hdlCholesterol: {
    normal: { low: 40 },
    unit: "mg/dL",
  },
  // Triglycerides (mg/dL)
  triglycerides: {
    normal: { high: 150 },
    unit: "mg/dL",
  },
  // Troponin I (ng/mL)
  troponinI: {
    normal: { high: 0.04 },
    unit: "ng/mL",
  },
  // BNP (pg/mL)
  bnp: {
    normal: { high: 100 },
    unit: "pg/mL",
  },
  // INR (therapeutic range for anticoagulation)
  inr: {
    normal: { low: 2.0, high: 3.0 },
    unit: "",
  },
  inrTherapeutic: {
    normal: { low: 2.0, high: 3.0 },
    critical: { low: 1.5, high: 4.0 },
    unit: "",
  },
  inrBaseline: {
    normal: { low: 0.9, high: 1.1 },
    unit: "",
  },
  // PT (seconds)
  pt: {
    normal: { low: 11, high: 13.5 },
    unit: "s",
  },
} as const;

/**
 * Get reference range DTO for a vital sign by LOINC code
 */
export function getVitalReferenceRange(
  loincCode: string
): ReferenceRangeDTO | undefined {
  const ranges = VITAL_REFERENCE_RANGES[loincCode];
  if (!ranges) return undefined;

  return {
    low:
      ranges.normal.low !== undefined
        ? { value: ranges.normal.low, unit: ranges.unit, system: UCUM_SYSTEM }
        : undefined,
    high:
      ranges.normal.high !== undefined
        ? { value: ranges.normal.high, unit: ranges.unit, system: UCUM_SYSTEM }
        : undefined,
    type: "normal",
  };
}

/**
 * Get critical range DTO for a vital sign by LOINC code
 */
export function getVitalCriticalRange(
  loincCode: string
): ReferenceRangeDTO | undefined {
  const ranges = VITAL_REFERENCE_RANGES[loincCode];
  if (!ranges?.critical) return undefined;

  return {
    low:
      ranges.critical.low !== undefined
        ? { value: ranges.critical.low, unit: ranges.unit, system: UCUM_SYSTEM }
        : undefined,
    high:
      ranges.critical.high !== undefined
        ? {
            value: ranges.critical.high,
            unit: ranges.unit,
            system: UCUM_SYSTEM,
          }
        : undefined,
    type: "critical",
  };
}

/**
 * Get reference range DTO for a lab test
 */
export function getLabReferenceRange(
  testKey: keyof typeof LAB_REFERENCE_RANGES
): ReferenceRangeDTO {
  const ranges = LAB_REFERENCE_RANGES[testKey];
  const normal = ranges.normal as RangeDefinition;

  return {
    low:
      normal.low !== undefined
        ? { value: normal.low, unit: ranges.unit, system: UCUM_SYSTEM }
        : undefined,
    high:
      normal.high !== undefined
        ? { value: normal.high, unit: ranges.unit, system: UCUM_SYSTEM }
        : undefined,
    type: "normal",
  };
}

/**
 * Get critical range DTO for a lab test
 */
export function getLabCriticalRange(
  testKey: keyof typeof LAB_REFERENCE_RANGES
): ReferenceRangeDTO | undefined {
  const ranges = LAB_REFERENCE_RANGES[testKey];
  if (!("critical" in ranges) || !ranges.critical) return undefined;

  const critical = ranges.critical as RangeDefinition;
  return {
    low:
      critical.low !== undefined
        ? { value: critical.low, unit: ranges.unit, system: UCUM_SYSTEM }
        : undefined,
    high:
      critical.high !== undefined
        ? { value: critical.high, unit: ranges.unit, system: UCUM_SYSTEM }
        : undefined,
    type: "critical",
  };
}

/**
 * Compute vital sign interpretation for a given LOINC code and value
 */
export function computeVitalInterpretation(
  loincCode: string,
  value: number
): InterpretationDTO {
  const referenceRange = getVitalReferenceRange(loincCode);
  const criticalRange = getVitalCriticalRange(loincCode);

  return computeInterpretation(value, referenceRange, criticalRange);
}

/**
 * Compute blood pressure interpretation based on AHA guidelines
 *
 * Categories:
 * - Normal: systolic < 120 AND diastolic < 80
 * - Elevated: systolic 120-129 AND diastolic < 80
 * - Stage 1 Hypertension: systolic 130-139 OR diastolic 80-89
 * - Stage 2 Hypertension: systolic >= 140 OR diastolic >= 90
 * - Hypertensive Crisis: systolic >= 180 OR diastolic >= 120
 * - Hypotension: systolic < 90 OR diastolic < 60
 */
export function computeBPInterpretation(
  systolic: number,
  diastolic: number
): { category: string; interpretation: InterpretationDTO } {
  // Hypertensive Crisis (Critical high)
  if (systolic >= 180 || diastolic >= 120) {
    return {
      category: "Hypertensive Crisis",
      interpretation: createInterpretation("HH"),
    };
  }

  // Hypotension (Critical low)
  if (systolic < 70 || diastolic < 40) {
    return {
      category: "Severe Hypotension",
      interpretation: createInterpretation("LL"),
    };
  }

  // Stage 2 Hypertension
  if (systolic >= 140 || diastolic >= 90) {
    return {
      category: "Stage 2 Hypertension",
      interpretation: createInterpretation("H"),
    };
  }

  // Stage 1 Hypertension
  if (systolic >= 130 || diastolic >= 80) {
    return {
      category: "Stage 1 Hypertension",
      interpretation: createInterpretation("H"),
    };
  }

  // Elevated
  if (systolic >= 120 && diastolic < 80) {
    return {
      category: "Elevated",
      interpretation: createInterpretation("H"),
    };
  }

  // Hypotension
  if (systolic < 90 || diastolic < 60) {
    return {
      category: "Hypotension",
      interpretation: createInterpretation("L"),
    };
  }

  // Normal
  return {
    category: "Normal",
    interpretation: createInterpretation("N"),
  };
}

/**
 * Compute interpretation for a blood pressure value string like "138/88"
 */
export function computeBPInterpretationFromString(
  bpValue: string | number
): InterpretationDTO {
  const parsed = parseBloodPressure(bpValue);
  if (!parsed) {
    return createInterpretation(null);
  }

  return computeBPInterpretation(parsed.systolic, parsed.diastolic)
    .interpretation;
}

/**
 * Create a CodeableConcept for a vital sign
 */
export function createVitalCode(
  loincCode: string,
  displayName: string
): CodeableConceptDTO {
  return {
    coding: [
      {
        system: LOINC_SYSTEM,
        code: loincCode,
        display: displayName,
      },
    ],
    text: displayName,
  };
}

/**
 * Create a CodeableConcept for a lab test
 */
export function createLabCode(
  loincCode: string,
  displayName: string
): CodeableConceptDTO {
  return {
    coding: [
      {
        system: LOINC_SYSTEM,
        code: loincCode,
        display: displayName,
      },
    ],
    text: displayName,
  };
}
