/**
 * FHIR R4 Type Definitions
 *
 * Complete FHIR R4 resource type definitions aligned with the official specification.
 * Spec: https://hl7.org/fhir/R4/
 */

// Primitive and Complex Data Types
export * from "./primitives";

// Resources
export * from "./patient";
export * from "./observation";
export * from "./condition";
export * from "./medication-request";
export * from "./practitioner";
export * from "./encounter";
export * from "./diagnostic-report";
export * from "./bundle";

// Common FHIR terminology systems
export const FHIR_SYSTEMS = {
  // Coding systems
  LOINC: "http://loinc.org",
  SNOMED_CT: "http://snomed.info/sct",
  ICD10_CM: "http://hl7.org/fhir/sid/icd-10-cm",
  RXNORM: "http://www.nlm.nih.gov/research/umls/rxnorm",
  UCUM: "http://unitsofmeasure.org",
  NPI: "http://hl7.org/fhir/sid/us-npi",

  // FHIR terminology systems
  OBSERVATION_CATEGORY:
    "http://terminology.hl7.org/CodeSystem/observation-category",
  OBSERVATION_INTERPRETATION:
    "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
  CONDITION_CLINICAL:
    "http://terminology.hl7.org/CodeSystem/condition-clinical",
  CONDITION_VERIFICATION:
    "http://terminology.hl7.org/CodeSystem/condition-ver-status",
  CONDITION_CATEGORY:
    "http://terminology.hl7.org/CodeSystem/condition-category",
  MEDICATION_REQUEST_CATEGORY:
    "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
  IDENTIFIER_TYPE: "http://terminology.hl7.org/CodeSystem/v2-0203",
  REFERENCE_RANGE_MEANING:
    "http://terminology.hl7.org/CodeSystem/referencerange-meaning",
  CONTACT_RELATIONSHIP: "http://terminology.hl7.org/CodeSystem/v2-0131",
  LANGUAGE: "urn:ietf:bcp:47",
} as const;

// Type alias for common FHIR resource types
export type FHIRResourceType =
  | "Patient"
  | "Observation"
  | "Condition"
  | "MedicationRequest"
  | "Practitioner"
  | "PractitionerRole"
  | "Encounter"
  | "DiagnosticReport"
  | "Bundle"
  | "OperationOutcome"
  | "AuditEvent";
