/**
 * FHIR R4 DiagnosticReport Resource
 * Spec: https://hl7.org/fhir/R4/diagnosticreport.html
 */

import type {
  DomainResource,
  Identifier,
  CodeableConcept,
  Reference,
  Period,
  Attachment,
} from "./primitives";

/**
 * DiagnosticReport Resource
 *
 * The findings and interpretation of diagnostic tests performed on patients,
 * groups of patients, devices, and locations, and/or specimens derived from these.
 */
export interface DiagnosticReport extends DomainResource {
  resourceType: "DiagnosticReport";

  /** Business identifier for report */
  identifier?: Identifier[];

  /** What was requested */
  basedOn?: Reference[];

  /** registered | partial | preliminary | final | amended | corrected | appended | cancelled | entered-in-error | unknown */
  status: DiagnosticReportStatus;

  /** Service category */
  category?: CodeableConcept[];

  /** Name/Code for this diagnostic report */
  code: CodeableConcept;

  /** The subject of the report - usually, but not always, the patient */
  subject?: Reference;

  /** Health care event when test ordered */
  encounter?: Reference;

  /** Clinically relevant time/time-period for report (dateTime) */
  effectiveDateTime?: string;

  /** Clinically relevant time/time-period for report (Period) */
  effectivePeriod?: Period;

  /** DateTime this version was made */
  issued?: string;

  /** Responsible Diagnostic Service */
  performer?: Reference[];

  /** Primary result interpreter */
  resultsInterpreter?: Reference[];

  /** Specimens this report is based on */
  specimen?: Reference[];

  /** Observations - simple, or complex nested groups */
  result?: Reference[];

  /** Reference to full details of imaging associated with the diagnostic report */
  imagingStudy?: Reference[];

  /** Key images associated with this report */
  media?: DiagnosticReportMedia[];

  /** Clinical conclusion (interpretation) of test results */
  conclusion?: string;

  /** Codes for the clinical conclusion of test results */
  conclusionCode?: CodeableConcept[];

  /** Entire report as issued */
  presentedForm?: Attachment[];
}

/**
 * DiagnosticReport status codes
 */
export type DiagnosticReportStatus =
  | "registered"
  | "partial"
  | "preliminary"
  | "final"
  | "amended"
  | "corrected"
  | "appended"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

/**
 * Key images associated with this report
 */
export interface DiagnosticReportMedia {
  /** Comment about the image (e.g. explanation) */
  comment?: string;

  /** Reference to the image source */
  link: Reference;
}
