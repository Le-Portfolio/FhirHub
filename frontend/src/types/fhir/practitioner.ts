/**
 * FHIR R4 Practitioner Resource
 * Spec: https://hl7.org/fhir/R4/practitioner.html
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
 * Practitioner Resource
 *
 * A person who is directly or indirectly involved in the provisioning of healthcare.
 */
export interface Practitioner extends DomainResource {
  resourceType: "Practitioner";

  /** An identifier for the person as this agent */
  identifier?: Identifier[];

  /** Whether this practitioner's record is in active use */
  active?: boolean;

  /** The name(s) associated with the practitioner */
  name?: HumanName[];

  /** A contact detail for the practitioner */
  telecom?: ContactPoint[];

  /** Address(es) of the practitioner */
  address?: Address[];

  /** male | female | other | unknown */
  gender?: "male" | "female" | "other" | "unknown";

  /** The date of birth for the practitioner */
  birthDate?: string;

  /** Image of the person */
  photo?: Attachment[];

  /** Certification, licenses, or training pertaining to the provision of care */
  qualification?: PractitionerQualification[];

  /** A language the practitioner can use in patient communication */
  communication?: CodeableConcept[];
}

/**
 * Certification, licenses, or training pertaining to the provision of care
 */
export interface PractitionerQualification {
  /** An identifier for this qualification for the practitioner */
  identifier?: Identifier[];

  /** Coded representation of the qualification */
  code: CodeableConcept;

  /** Period during which the qualification is valid */
  period?: Period;

  /** Organization that regulates and issues the qualification */
  issuer?: Reference;
}

/**
 * PractitionerRole Resource
 * Spec: https://hl7.org/fhir/R4/practitionerrole.html
 */
export interface PractitionerRole extends DomainResource {
  resourceType: "PractitionerRole";

  /** Business Identifiers that are specific to a role/location */
  identifier?: Identifier[];

  /** Whether this practitioner role record is in active use */
  active?: boolean;

  /** The period during which the practitioner is authorized to perform in these role(s) */
  period?: Period;

  /** Practitioner that is able to provide the defined services */
  practitioner?: Reference;

  /** Organization where the roles are available */
  organization?: Reference;

  /** Roles which this practitioner may perform */
  code?: CodeableConcept[];

  /** Specific specialty of the practitioner */
  specialty?: CodeableConcept[];

  /** The location(s) at which this practitioner provides care */
  location?: Reference[];

  /** The list of healthcare services that this worker provides */
  healthcareService?: Reference[];

  /** Contact details that are specific to the role/location/service */
  telecom?: ContactPoint[];

  /** Times the Service Site is available */
  availableTime?: PractitionerRoleAvailableTime[];

  /** Not available during this time due to provided reason */
  notAvailable?: PractitionerRoleNotAvailable[];

  /** Description of availability exceptions */
  availabilityExceptions?: string;

  /** Technical endpoints providing access to services */
  endpoint?: Reference[];
}

/**
 * Times the Service Site is available
 */
export interface PractitionerRoleAvailableTime {
  /** mon | tue | wed | thu | fri | sat | sun */
  daysOfWeek?: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];

  /** Always available? e.g. 24 hour service */
  allDay?: boolean;

  /** Opening time of day (ignored if allDay = true) */
  availableStartTime?: string;

  /** Closing time of day (ignored if allDay = true) */
  availableEndTime?: string;
}

/**
 * Not available during this time due to provided reason
 */
export interface PractitionerRoleNotAvailable {
  /** Reason presented to the user explaining why time not available */
  description: string;

  /** Service not available from this date */
  during?: Period;
}
