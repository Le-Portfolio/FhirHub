/**
 * FHIR R4 MedicationRequest Resource
 * Spec: https://hl7.org/fhir/R4/medicationrequest.html
 */

import type {
  DomainResource,
  Identifier,
  CodeableConcept,
  Reference,
  Period,
  Quantity,
  Ratio,
  Range,
  Duration,
  Timing,
  Annotation,
} from "./primitives";

/**
 * MedicationRequest Resource
 *
 * An order or request for both supply of the medication and the instructions
 * for administration of the medication to a patient.
 */
export interface MedicationRequest extends DomainResource {
  resourceType: "MedicationRequest";

  /** External ids for this request */
  identifier?: Identifier[];

  /** active | on-hold | cancelled | completed | entered-in-error | stopped | draft | unknown */
  status: MedicationRequestStatus;

  /** Reason for current status */
  statusReason?: CodeableConcept;

  /** proposal | plan | order | original-order | reflex-order | filler-order | instance-order | option */
  intent: MedicationRequestIntent;

  /** Type of medication usage */
  category?: CodeableConcept[];

  /** routine | urgent | asap | stat */
  priority?: MedicationRequestPriority;

  /** True if request is prohibiting action */
  doNotPerform?: boolean;

  /** True if request was reported rather than a direct order */
  reportedBoolean?: boolean;

  /** True if request was reported rather than a direct order */
  reportedReference?: Reference;

  /** Medication to be taken (CodeableConcept) */
  medicationCodeableConcept?: CodeableConcept;

  /** Medication to be taken (Reference) */
  medicationReference?: Reference;

  /** Who or group medication request is for */
  subject: Reference;

  /** Encounter created as part of encounter/admission/stay */
  encounter?: Reference;

  /** Information to support ordering of the medication */
  supportingInformation?: Reference[];

  /** When request was initially authored */
  authoredOn?: string;

  /** Who/What requested the Request */
  requester?: Reference;

  /** Intended performer of administration */
  performer?: Reference;

  /** Desired kind of performer of the medication administration */
  performerType?: CodeableConcept;

  /** Person who entered the request */
  recorder?: Reference;

  /** Reason or indication for ordering or not ordering the medication */
  reasonCode?: CodeableConcept[];

  /** Condition or observation that supports why the prescription is being written */
  reasonReference?: Reference[];

  /** Instantiates FHIR protocol or definition */
  instantiatesCanonical?: string[];

  /** Instantiates external protocol or definition */
  instantiatesUri?: string[];

  /** What request fulfills */
  basedOn?: Reference[];

  /** Composite request this is part of */
  groupIdentifier?: Identifier;

  /** Overall pattern of medication administration */
  courseOfTherapyType?: CodeableConcept;

  /** Associated insurance coverage */
  insurance?: Reference[];

  /** Information about the prescription */
  note?: Annotation[];

  /** How the medication should be taken */
  dosageInstruction?: Dosage[];

  /** Medication supply authorization */
  dispenseRequest?: MedicationRequestDispenseRequest;

  /** Any restrictions on medication substitution */
  substitution?: MedicationRequestSubstitution;

  /** An order/prescription that is being replaced */
  priorPrescription?: Reference;

  /** Clinical Issue with action */
  detectedIssue?: Reference[];

  /** A list of events of interest in the lifecycle */
  eventHistory?: Reference[];
}

/**
 * MedicationRequest status codes
 */
export type MedicationRequestStatus =
  | "active"
  | "on-hold"
  | "cancelled"
  | "completed"
  | "entered-in-error"
  | "stopped"
  | "draft"
  | "unknown";

/**
 * MedicationRequest intent codes
 */
export type MedicationRequestIntent =
  | "proposal"
  | "plan"
  | "order"
  | "original-order"
  | "reflex-order"
  | "filler-order"
  | "instance-order"
  | "option";

/**
 * MedicationRequest priority codes
 */
export type MedicationRequestPriority = "routine" | "urgent" | "asap" | "stat";

/**
 * How medication should be taken
 * Spec: https://hl7.org/fhir/R4/dosage.html
 */
export interface Dosage {
  /** The order of the dosage instructions */
  sequence?: number;

  /** Free text dosage instructions */
  text?: string;

  /** Supplemental instruction or warnings */
  additionalInstruction?: CodeableConcept[];

  /** Patient or consumer oriented instructions */
  patientInstruction?: string;

  /** When medication should be administered */
  timing?: Timing;

  /** Take "as needed" (boolean) */
  asNeededBoolean?: boolean;

  /** Take "as needed" (CodeableConcept) */
  asNeededCodeableConcept?: CodeableConcept;

  /** Body site to administer to */
  site?: CodeableConcept;

  /** How drug should enter body */
  route?: CodeableConcept;

  /** Technique for administering medication */
  method?: CodeableConcept;

  /** Amount of medication administered */
  doseAndRate?: DosageDoseAndRate[];

  /** Upper limit on medication per unit of time */
  maxDosePerPeriod?: Ratio;

  /** Upper limit on medication per administration */
  maxDosePerAdministration?: Quantity;

  /** Upper limit on medication per lifetime of the patient */
  maxDosePerLifetime?: Quantity;
}

/**
 * Amount of medication administered
 */
export interface DosageDoseAndRate {
  /** The kind of dose or rate specified */
  type?: CodeableConcept;

  /** Amount of medication per dose (Range) */
  doseRange?: Range;

  /** Amount of medication per dose (Quantity) */
  doseQuantity?: Quantity;

  /** Amount of medication per unit of time (Ratio) */
  rateRatio?: Ratio;

  /** Amount of medication per unit of time (Range) */
  rateRange?: Range;

  /** Amount of medication per unit of time (Quantity) */
  rateQuantity?: Quantity;
}

/**
 * Medication supply authorization
 */
export interface MedicationRequestDispenseRequest {
  /** First fill details */
  initialFill?: MedicationRequestDispenseRequestInitialFill;

  /** Minimum period of time between dispenses */
  dispenseInterval?: Duration;

  /** Time period supply is authorized for */
  validityPeriod?: Period;

  /** Number of refills authorized */
  numberOfRepeatsAllowed?: number;

  /** Amount of medication to supply per dispense */
  quantity?: Quantity;

  /** Number of days supply per dispense */
  expectedSupplyDuration?: Duration;

  /** Intended dispenser */
  performer?: Reference;
}

/**
 * First fill details
 */
export interface MedicationRequestDispenseRequestInitialFill {
  /** First fill quantity */
  quantity?: Quantity;

  /** First fill duration */
  duration?: Duration;
}

/**
 * Any restrictions on medication substitution
 */
export interface MedicationRequestSubstitution {
  /** Whether substitution is allowed or not (boolean) */
  allowedBoolean?: boolean;

  /** Whether substitution is allowed or not (CodeableConcept) */
  allowedCodeableConcept?: CodeableConcept;

  /** Why should (not) substitution be made */
  reason?: CodeableConcept;
}
