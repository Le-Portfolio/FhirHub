/**
 * FHIR R4 Observation Resource
 * Spec: https://hl7.org/fhir/R4/observation.html
 * Vital Signs Profile: https://hl7.org/fhir/R4/observation-vitalsigns.html
 */

import type {
  DomainResource,
  Identifier,
  CodeableConcept,
  Reference,
  Period,
  Quantity,
  Range,
  Ratio,
  Timing,
  Annotation,
} from "./primitives";

/**
 * Observation Resource
 *
 * Measurements and simple assertions made about a patient.
 * Used for vital signs, laboratory data, imaging data, etc.
 */
export interface Observation extends DomainResource {
  resourceType: "Observation";

  /** Business Identifier for observation */
  identifier?: Identifier[];

  /** Fulfills plan, proposal or order */
  basedOn?: Reference[];

  /** Part of referenced event */
  partOf?: Reference[];

  /** registered | preliminary | final | amended | corrected | cancelled | entered-in-error | unknown */
  status: ObservationStatus;

  /** Classification of type of observation */
  category?: CodeableConcept[];

  /** Type of observation (code / type) */
  code: CodeableConcept;

  /** Who and/or what the observation is about */
  subject?: Reference;

  /** What the observation is about, when it is not about the subject of record */
  focus?: Reference[];

  /** Healthcare event during which this observation is made */
  encounter?: Reference;

  /** Clinically relevant time/time-period for observation (dateTime) */
  effectiveDateTime?: string;

  /** Clinically relevant time/time-period for observation (Period) */
  effectivePeriod?: Period;

  /** Clinically relevant time/time-period for observation (Timing) */
  effectiveTiming?: Timing;

  /** Clinically relevant time/time-period for observation (instant) */
  effectiveInstant?: string;

  /** Date/Time this version was made available */
  issued?: string;

  /** Who is responsible for the observation */
  performer?: Reference[];

  /** Actual result (Quantity) */
  valueQuantity?: Quantity;

  /** Actual result (CodeableConcept) */
  valueCodeableConcept?: CodeableConcept;

  /** Actual result (string) */
  valueString?: string;

  /** Actual result (boolean) */
  valueBoolean?: boolean;

  /** Actual result (integer) */
  valueInteger?: number;

  /** Actual result (Range) */
  valueRange?: Range;

  /** Actual result (Ratio) */
  valueRatio?: Ratio;

  /** Actual result (time) */
  valueTime?: string;

  /** Actual result (dateTime) */
  valueDateTime?: string;

  /** Actual result (Period) */
  valuePeriod?: Period;

  /** Why the result is missing */
  dataAbsentReason?: CodeableConcept;

  /** High, low, normal, etc. */
  interpretation?: CodeableConcept[];

  /** Comments about the observation */
  note?: Annotation[];

  /** Observed body part */
  bodySite?: CodeableConcept;

  /** How it was done */
  method?: CodeableConcept;

  /** Specimen used for this observation */
  specimen?: Reference;

  /** (Measurement) Device */
  device?: Reference;

  /** Provides guide for interpretation */
  referenceRange?: ObservationReferenceRange[];

  /** Related resource that belongs to the Observation group */
  hasMember?: Reference[];

  /** Related measurements the observation is made from */
  derivedFrom?: Reference[];

  /** Component results (e.g., systolic and diastolic for BP) */
  component?: ObservationComponent[];
}

/**
 * Observation status codes
 */
export type ObservationStatus =
  | "registered"
  | "preliminary"
  | "final"
  | "amended"
  | "corrected"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

/**
 * Provides guide for interpretation of observation
 */
export interface ObservationReferenceRange {
  /** Low Range, if relevant */
  low?: Quantity;

  /** High Range, if relevant */
  high?: Quantity;

  /** Reference range qualifier */
  type?: CodeableConcept;

  /** Reference range population */
  appliesTo?: CodeableConcept[];

  /** Applicable age range, if relevant */
  age?: Range;

  /** Text based reference range in an observation */
  text?: string;
}

/**
 * Component results (used for multi-component observations like Blood Pressure)
 */
export interface ObservationComponent {
  /** Type of component observation (code / type) */
  code: CodeableConcept;

  /** Actual component result (Quantity) */
  valueQuantity?: Quantity;

  /** Actual component result (CodeableConcept) */
  valueCodeableConcept?: CodeableConcept;

  /** Actual component result (string) */
  valueString?: string;

  /** Actual component result (boolean) */
  valueBoolean?: boolean;

  /** Actual component result (integer) */
  valueInteger?: number;

  /** Actual component result (Range) */
  valueRange?: Range;

  /** Actual component result (Ratio) */
  valueRatio?: Ratio;

  /** Actual component result (time) */
  valueTime?: string;

  /** Actual component result (dateTime) */
  valueDateTime?: string;

  /** Actual component result (Period) */
  valuePeriod?: Period;

  /** Why the component result is missing */
  dataAbsentReason?: CodeableConcept;

  /** High, low, normal, etc. */
  interpretation?: CodeableConcept[];

  /** Provides guide for interpretation of component result */
  referenceRange?: ObservationReferenceRange[];
}

/**
 * Observation category codes
 * Spec: http://terminology.hl7.org/CodeSystem/observation-category
 */
export const OBSERVATION_CATEGORY_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/observation-category";

export type ObservationCategoryCode =
  | "social-history"
  | "vital-signs"
  | "imaging"
  | "laboratory"
  | "procedure"
  | "survey"
  | "exam"
  | "therapy"
  | "activity";

/**
 * Observation interpretation codes
 * Spec: http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation
 */
export const OBSERVATION_INTERPRETATION_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation";

export type ObservationInterpretationCode =
  | "N" // Normal
  | "H" // High
  | "L" // Low
  | "HH" // Critical high
  | "LL" // Critical low
  | "A" // Abnormal
  | "AA" // Critical abnormal
  | "HU" // Significantly high
  | "LU" // Significantly low
  | "D" // Significant change down
  | "U" // Significant change up
  | "W" // Worse
  | "B" // Better
  | "I" // Intermediate
  | "R" // Resistant
  | "S" // Susceptible
  | "POS" // Positive
  | "NEG" // Negative
  | "IND"; // Indeterminate
