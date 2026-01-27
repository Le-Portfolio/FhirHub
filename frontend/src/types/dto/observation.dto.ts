/**
 * Observation DTOs (Vitals and Lab Results)
 *
 * FHIR R4 aligned data transfer objects for observations.
 * Includes vital signs and laboratory results.
 */

import type {
  CodeableConceptDTO,
  InterpretationDTO,
  QuantityDTO,
  ReferenceRangeDTO,
} from "./fhir-primitives.dto";

/**
 * Vital Sign DTO - FHIR R4 aligned
 *
 * Represents a single vital sign observation (blood pressure, heart rate, etc.)
 */
export interface VitalSignDTO {
  id?: string;
  code: CodeableConceptDTO;
  value: number | string; // Can be composite like "138/88" for BP
  unit: string;
  effectiveDateTime: string;
  referenceRange?: ReferenceRangeDTO;
  interpretation?: InterpretationDTO; // Computed from referenceRange

  // Legacy fields for backward compatibility (computed from above)
  type: string; // Derived from code.text
  date: string; // Derived from effectiveDateTime
  status: "normal" | "high" | "low" | "critical"; // Derived from interpretation
}

/**
 * Vital Chart Data for trending/visualization
 */
export interface VitalChartDataDTO {
  date: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  weight?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

/**
 * Lab Result DTO - FHIR R4 aligned
 *
 * Represents a single laboratory test result.
 */
export interface LabResultDTO {
  id: string;
  code: CodeableConceptDTO;
  valueQuantity: QuantityDTO;
  effectiveDateTime: string;
  referenceRange?: ReferenceRangeDTO;
  interpretation?: InterpretationDTO; // Computed from referenceRange
  history?: Array<{
    effectiveDateTime: string;
    value: number;
  }>;

  // Legacy fields for backward compatibility (computed from above)
  testName: string; // Derived from code.text
  value: number; // Derived from valueQuantity.value
  unit: string; // Derived from valueQuantity.unit
  date: string; // Derived from effectiveDateTime
  flag?: "high" | "low" | "critical" | "abnormal"; // Derived from interpretation
}

/**
 * Lab Panel DTO
 *
 * A group of related lab results (e.g., "Basic Metabolic Panel")
 */
export interface LabPanelDTO {
  id: string;
  name: string;
  date: string;
  orderedBy?: string;
  results: LabResultDTO[];
}
