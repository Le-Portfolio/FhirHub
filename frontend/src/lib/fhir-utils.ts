/**
 * FHIR R4 Utility Functions
 * Provides functions for computing interpretations from reference ranges
 */

import type {
  InterpretationDTO,
  InterpretationCode,
  ReferenceRangeDTO,
} from "@/types";

/**
 * FHIR Observation Interpretation Code System
 * From http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation
 */
export const INTERPRETATION_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation";

/**
 * Display text for interpretation codes
 */
export const INTERPRETATION_DISPLAY: Record<
  NonNullable<InterpretationCode>,
  string
> = {
  N: "Normal",
  H: "High",
  L: "Low",
  HH: "Critical high",
  LL: "Critical low",
  A: "Abnormal",
};

/**
 * Create an interpretation DTO from a code
 */
export function createInterpretation(
  code: InterpretationCode
): InterpretationDTO {
  if (code === null) {
    return { code: null, display: "No reference range" };
  }
  return {
    code,
    display: INTERPRETATION_DISPLAY[code],
    system: INTERPRETATION_SYSTEM,
  };
}

/**
 * Compute FHIR interpretation from value and reference range
 *
 * @param value - The observed value
 * @param referenceRange - Normal reference range
 * @param criticalRange - Optional critical thresholds
 * @returns InterpretationDTO with code (N, H, L, HH, LL, A) and display text
 */
export function computeInterpretation(
  value: number,
  referenceRange?: ReferenceRangeDTO,
  criticalRange?: ReferenceRangeDTO
): InterpretationDTO {
  if (!referenceRange) {
    return createInterpretation(null);
  }

  const low = referenceRange.low?.value;
  const high = referenceRange.high?.value;
  const criticalLow = criticalRange?.low?.value;
  const criticalHigh = criticalRange?.high?.value;

  // Check critical ranges first
  if (criticalLow !== undefined && value < criticalLow) {
    return createInterpretation("LL");
  }
  if (criticalHigh !== undefined && value > criticalHigh) {
    return createInterpretation("HH");
  }

  // Check normal ranges
  if (low !== undefined && value < low) {
    return createInterpretation("L");
  }
  if (high !== undefined && value > high) {
    return createInterpretation("H");
  }

  return createInterpretation("N");
}

/**
 * Map interpretation code to legacy status field
 */
export function interpretationToStatus(
  interpretation?: InterpretationDTO
): "normal" | "high" | "low" | "critical" {
  if (!interpretation?.code) {
    return "normal";
  }

  switch (interpretation.code) {
    case "HH":
    case "LL":
      return "critical";
    case "H":
      return "high";
    case "L":
      return "low";
    case "N":
    default:
      return "normal";
  }
}

/**
 * Map interpretation code to legacy flag field for labs
 */
export function interpretationToFlag(
  interpretation?: InterpretationDTO
): "high" | "low" | "critical" | "abnormal" | undefined {
  if (!interpretation?.code || interpretation.code === "N") {
    return undefined;
  }

  switch (interpretation.code) {
    case "HH":
    case "LL":
      return "critical";
    case "H":
      return "high";
    case "L":
      return "low";
    case "A":
      return "abnormal";
    default:
      return undefined;
  }
}

/**
 * Parse a composite blood pressure value like "138/88"
 * @returns Object with systolic and diastolic values, or null if not a BP format
 */
export function parseBloodPressure(
  value: string | number
): { systolic: number; diastolic: number } | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/^(\d+)\/(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    systolic: parseInt(match[1], 10),
    diastolic: parseInt(match[2], 10),
  };
}
