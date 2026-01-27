/**
 * FHIR R4 Encounter Resource
 * Spec: https://hl7.org/fhir/R4/encounter.html
 */

import type {
  DomainResource,
  Identifier,
  CodeableConcept,
  Coding,
  Reference,
  Period,
  Duration,
} from "./primitives";

/**
 * Encounter Resource
 *
 * An interaction between a patient and healthcare provider(s) for the purpose
 * of providing healthcare service(s) or assessing the health status of a patient.
 */
export interface Encounter extends DomainResource {
  resourceType: "Encounter";

  /** Identifier(s) by which this encounter is known */
  identifier?: Identifier[];

  /** planned | arrived | triaged | in-progress | onleave | finished | cancelled | entered-in-error | unknown */
  status: EncounterStatus;

  /** List of past encounter statuses */
  statusHistory?: EncounterStatusHistory[];

  /** Classification of patient encounter */
  class: Coding;

  /** List of past encounter classes */
  classHistory?: EncounterClassHistory[];

  /** Specific type of encounter */
  type?: CodeableConcept[];

  /** Specific type of service */
  serviceType?: CodeableConcept;

  /** Indicates the urgency of the encounter */
  priority?: CodeableConcept;

  /** The patient or group present at the encounter */
  subject?: Reference;

  /** Episode(s) of care that this encounter should be recorded against */
  episodeOfCare?: Reference[];

  /** The ServiceRequest that initiated this encounter */
  basedOn?: Reference[];

  /** List of participants involved in the encounter */
  participant?: EncounterParticipant[];

  /** The appointment that scheduled this encounter */
  appointment?: Reference[];

  /** The start and end time of the encounter */
  period?: Period;

  /** Quantity of time the encounter lasted (less time absent) */
  length?: Duration;

  /** Coded reason the encounter takes place */
  reasonCode?: CodeableConcept[];

  /** Reason the encounter takes place (reference) */
  reasonReference?: Reference[];

  /** The list of diagnosis relevant to this encounter */
  diagnosis?: EncounterDiagnosis[];

  /** The set of accounts that may be used for billing for this Encounter */
  account?: Reference[];

  /** Details about the admission to a healthcare service */
  hospitalization?: EncounterHospitalization;

  /** List of locations where the patient has been */
  location?: EncounterLocation[];

  /** The organization (facility) responsible for this encounter */
  serviceProvider?: Reference;

  /** Another Encounter this encounter is part of */
  partOf?: Reference;
}

/**
 * Encounter status codes
 */
export type EncounterStatus =
  | "planned"
  | "arrived"
  | "triaged"
  | "in-progress"
  | "onleave"
  | "finished"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

/**
 * List of past encounter statuses
 */
export interface EncounterStatusHistory {
  /** planned | arrived | triaged | in-progress | onleave | finished | cancelled | entered-in-error | unknown */
  status: EncounterStatus;

  /** The time that the episode was in the specified status */
  period: Period;
}

/**
 * List of past encounter classes
 */
export interface EncounterClassHistory {
  /** inpatient | outpatient | ambulatory | emergency + */
  class: Coding;

  /** The time that the episode was in the specified class */
  period: Period;
}

/**
 * List of participants involved in the encounter
 */
export interface EncounterParticipant {
  /** Role of participant in encounter */
  type?: CodeableConcept[];

  /** Period of time during the encounter that the participant participated */
  period?: Period;

  /** Persons involved in the encounter other than the patient */
  individual?: Reference;
}

/**
 * The list of diagnosis relevant to this encounter
 */
export interface EncounterDiagnosis {
  /** The diagnosis or procedure relevant to the encounter */
  condition: Reference;

  /** Role that this diagnosis has within the encounter */
  use?: CodeableConcept;

  /** Ranking of the diagnosis (for each role type) */
  rank?: number;
}

/**
 * Details about the admission to a healthcare service
 */
export interface EncounterHospitalization {
  /** Pre-admission identifier */
  preAdmissionIdentifier?: Identifier;

  /** The location/organization from which the patient came before admission */
  origin?: Reference;

  /** From where patient was admitted (physician referral, transfer) */
  admitSource?: CodeableConcept;

  /** The type of hospital re-admission that has occurred (if any) */
  reAdmission?: CodeableConcept;

  /** Diet preferences reported by the patient */
  dietPreference?: CodeableConcept[];

  /** Special courtesies (VIP, board member) */
  specialCourtesy?: CodeableConcept[];

  /** Wheelchair, stretcher, etc. */
  specialArrangement?: CodeableConcept[];

  /** Location/organization to which the patient is discharged */
  destination?: Reference;

  /** Category or kind of location after discharge */
  dischargeDisposition?: CodeableConcept;
}

/**
 * List of locations where the patient has been
 */
export interface EncounterLocation {
  /** Location the encounter takes place */
  location: Reference;

  /** planned | active | reserved | completed */
  status?: "planned" | "active" | "reserved" | "completed";

  /** The physical type of the location */
  physicalType?: CodeableConcept;

  /** Time period during which the patient was present at the location */
  period?: Period;
}
