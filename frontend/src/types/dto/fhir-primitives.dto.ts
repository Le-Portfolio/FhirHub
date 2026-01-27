/**
 * FHIR R4 Primitive Types and Base Structures
 *
 * These are fundamental FHIR data types used across all resources.
 * Aligned with FHIR R4 specification.
 */

/**
 * FHIR R4 Interpretation Codes
 * From http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation
 *
 * @see https://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation
 */
export type InterpretationCode = "N" | "H" | "L" | "HH" | "LL" | "A" | null;

/**
 * Interpretation with code and display text
 */
export interface InterpretationDTO {
  code: InterpretationCode;
  display: string;
  system?: string;
}

/**
 * FHIR Quantity type
 *
 * A measured amount (or an amount that can potentially be measured).
 * @see https://www.hl7.org/fhir/datatypes.html#Quantity
 */
export interface QuantityDTO {
  value: number;
  unit: string;
  system?: string; // e.g., "http://unitsofmeasure.org"
  code?: string; // UCUM code
}

/**
 * FHIR R4 Reference Range
 *
 * Provides guide for interpretation of component result.
 * @see https://www.hl7.org/fhir/observation-definitions.html#Observation.referenceRange
 */
export interface ReferenceRangeDTO {
  low?: QuantityDTO;
  high?: QuantityDTO;
  type?: string; // e.g., "normal", "therapeutic", "critical"
  text?: string; // Human-readable description
}

/**
 * FHIR Coding structure
 *
 * A reference to a code defined by a terminology system.
 * @see https://www.hl7.org/fhir/datatypes.html#Coding
 */
export interface CodingDTO {
  system: string; // e.g., "http://loinc.org"
  code: string; // The code value
  display: string; // Human-readable representation
}

/**
 * FHIR CodeableConcept structure
 *
 * A concept that may be defined by one or more coding systems.
 * @see https://www.hl7.org/fhir/datatypes.html#CodeableConcept
 */
export interface CodeableConceptDTO {
  coding: CodingDTO[];
  text: string;
}

/**
 * Simple date range
 */
export interface DateRangeDTO {
  start: string;
  end: string;
}
