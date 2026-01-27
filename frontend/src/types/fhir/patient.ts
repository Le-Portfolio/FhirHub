/**
 * FHIR R4 Patient Resource
 * Spec: https://hl7.org/fhir/R4/patient.html
 */

import type {
  DomainResource,
  Identifier,
  HumanName,
  ContactPoint,
  Address,
  CodeableConcept,
  Attachment,
  Reference,
  Period,
} from "./primitives";

/**
 * Patient Resource
 *
 * Demographics and other administrative information about an individual
 * receiving care or other health-related services.
 */
export interface Patient extends DomainResource {
  resourceType: "Patient";

  /** An identifier for this patient */
  identifier?: Identifier[];

  /** Whether this patient's record is in active use */
  active?: boolean;

  /** A name associated with the patient */
  name?: HumanName[];

  /** A contact detail for the individual */
  telecom?: ContactPoint[];

  /** male | female | other | unknown */
  gender?: PatientGender;

  /** The date of birth for the individual */
  birthDate?: string;

  /** Indicates if the individual is deceased or not (boolean) */
  deceasedBoolean?: boolean;

  /** Indicates if the individual is deceased or not (dateTime) */
  deceasedDateTime?: string;

  /** An address for the individual */
  address?: Address[];

  /** Marital (civil) status of a patient */
  maritalStatus?: CodeableConcept;

  /** Whether patient is part of a multiple birth (boolean) */
  multipleBirthBoolean?: boolean;

  /** Whether patient is part of a multiple birth (integer - birth order) */
  multipleBirthInteger?: number;

  /** Image of the patient */
  photo?: Attachment[];

  /** A contact party (e.g. guardian, partner, friend) for the patient */
  contact?: PatientContact[];

  /** A language which may be used to communicate with the patient */
  communication?: PatientCommunication[];

  /** Patient's nominated primary care provider */
  generalPractitioner?: Reference[];

  /** Organization that is the custodian of the patient record */
  managingOrganization?: Reference;

  /** Link to another patient resource that concerns the same actual patient */
  link?: PatientLink[];
}

/**
 * Patient gender
 */
export type PatientGender = "male" | "female" | "other" | "unknown";

/**
 * A contact party for the patient
 */
export interface PatientContact {
  /** The kind of relationship */
  relationship?: CodeableConcept[];

  /** A name associated with the contact person */
  name?: HumanName;

  /** A contact detail for the person */
  telecom?: ContactPoint[];

  /** Address for the contact person */
  address?: Address;

  /** male | female | other | unknown */
  gender?: PatientGender;

  /** Organization that is associated with the contact */
  organization?: Reference;

  /** The period during which this contact person is valid */
  period?: Period;
}

/**
 * A language which may be used to communicate with the patient
 */
export interface PatientCommunication {
  /** The language which can be used to communicate with the patient */
  language: CodeableConcept;

  /** Language preference indicator */
  preferred?: boolean;
}

/**
 * Link to another patient resource
 */
export interface PatientLink {
  /** The other patient resource that the link refers to */
  other: Reference;

  /** replaced-by | replaces | refer | seealso */
  type: "replaced-by" | "replaces" | "refer" | "seealso";
}
