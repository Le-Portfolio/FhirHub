/**
 * FHIR R4 Condition Resource
 * Spec: https://hl7.org/fhir/R4/condition.html
 */

import type {
  DomainResource,
  Identifier,
  CodeableConcept,
  Reference,
  Period,
  Range,
  Quantity,
  Annotation,
} from "./primitives";

/**
 * Condition Resource
 *
 * A clinical condition, problem, diagnosis, or other event, situation,
 * issue, or clinical concept that has risen to a level of concern.
 */
export interface Condition extends DomainResource {
  resourceType: "Condition";

  /** External Ids for this condition */
  identifier?: Identifier[];

  /** active | recurrence | relapse | inactive | remission | resolved */
  clinicalStatus?: CodeableConcept;

  /** unconfirmed | provisional | differential | confirmed | refuted | entered-in-error */
  verificationStatus?: CodeableConcept;

  /** problem-list-item | encounter-diagnosis */
  category?: CodeableConcept[];

  /** Subjective severity of condition */
  severity?: CodeableConcept;

  /** Identification of the condition, problem or diagnosis */
  code?: CodeableConcept;

  /** Anatomical location, if relevant */
  bodySite?: CodeableConcept[];

  /** Who has the condition? */
  subject: Reference;

  /** Encounter when condition first asserted */
  encounter?: Reference;

  /** Estimated or actual date, date-time, or age (dateTime) */
  onsetDateTime?: string;

  /** Estimated or actual date, date-time, or age (Age) */
  onsetAge?: Quantity;

  /** Estimated or actual date, date-time, or age (Period) */
  onsetPeriod?: Period;

  /** Estimated or actual date, date-time, or age (Range) */
  onsetRange?: Range;

  /** Estimated or actual date, date-time, or age (string) */
  onsetString?: string;

  /** When in resolution/remission (dateTime) */
  abatementDateTime?: string;

  /** When in resolution/remission (Age) */
  abatementAge?: Quantity;

  /** When in resolution/remission (Period) */
  abatementPeriod?: Period;

  /** When in resolution/remission (Range) */
  abatementRange?: Range;

  /** When in resolution/remission (string) */
  abatementString?: string;

  /** Date record was first recorded */
  recordedDate?: string;

  /** Who recorded the condition */
  recorder?: Reference;

  /** Person who asserts this condition */
  asserter?: Reference;

  /** Stage/grade, usually assessed formally */
  stage?: ConditionStage[];

  /** Supporting evidence */
  evidence?: ConditionEvidence[];

  /** Additional information about the Condition */
  note?: Annotation[];
}

/**
 * Stage/grade, usually assessed formally
 */
export interface ConditionStage {
  /** Simple summary (disease specific) */
  summary?: CodeableConcept;

  /** Formal record of assessment */
  assessment?: Reference[];

  /** Kind of staging */
  type?: CodeableConcept;
}

/**
 * Supporting evidence
 */
export interface ConditionEvidence {
  /** Manifestation/symptom */
  code?: CodeableConcept[];

  /** Supporting information found elsewhere */
  detail?: Reference[];
}

/**
 * Condition clinical status codes
 * Spec: http://terminology.hl7.org/CodeSystem/condition-clinical
 */
export const CONDITION_CLINICAL_STATUS_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/condition-clinical";

export type ConditionClinicalStatusCode =
  | "active"
  | "recurrence"
  | "relapse"
  | "inactive"
  | "remission"
  | "resolved";

/**
 * Condition verification status codes
 * Spec: http://terminology.hl7.org/CodeSystem/condition-ver-status
 */
export const CONDITION_VERIFICATION_STATUS_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/condition-ver-status";

export type ConditionVerificationStatusCode =
  | "unconfirmed"
  | "provisional"
  | "differential"
  | "confirmed"
  | "refuted"
  | "entered-in-error";

/**
 * Condition category codes
 * Spec: http://terminology.hl7.org/CodeSystem/condition-category
 */
export const CONDITION_CATEGORY_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/condition-category";

export type ConditionCategoryCode = "problem-list-item" | "encounter-diagnosis";
