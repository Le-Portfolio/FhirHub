/**
 * FHIR R4 to DTO Mappers
 *
 * Functions to convert FHIR R4 resources to application DTOs.
 * These mappers transform complex FHIR structures into simplified,
 * UI-friendly data transfer objects.
 */

import type {
  Patient,
  Observation,
  ObservationComponent,
  Condition,
  MedicationRequest,
  Dosage,
  HumanName,
  ContactPoint,
  Address,
  CodeableConcept,
  Quantity,
  Reference,
  Identifier,
  ObservationReferenceRange,
} from "@/types/fhir";
import type {
  PatientListDTO,
  PatientDetailDTO,
  PatientSummaryDTO,
  VitalSignDTO,
  LabResultDTO,
  LabPanelDTO,
  ConditionDTO,
  MedicationDTO,
  InterpretationDTO,
  InterpretationCode,
  ReferenceRangeDTO,
  CodeableConceptDTO,
  QuantityDTO,
} from "@/types/dto";
import {
  computeInterpretation,
  interpretationToStatus,
  interpretationToFlag,
} from "./fhir-utils";
import { computeBPInterpretationFromString } from "./clinical-rules";

// ============================================================
// PRIMITIVE MAPPERS
// ============================================================

/**
 * Format a FHIR HumanName to a display string
 */
export function formatHumanName(name?: HumanName): string {
  if (!name) return "Unknown";

  if (name.text) return name.text;

  const parts: string[] = [];

  if (name.prefix) parts.push(...name.prefix);
  if (name.given) parts.push(...name.given);
  if (name.family) parts.push(name.family);
  if (name.suffix) parts.push(...name.suffix);

  return parts.join(" ") || "Unknown";
}

/**
 * Get the primary/official name from a list of HumanNames
 */
export function getPrimaryName(names?: HumanName[]): HumanName | undefined {
  if (!names || names.length === 0) return undefined;

  // Prefer official name
  const official = names.find((n) => n.use === "official");
  if (official) return official;

  // Fall back to usual name
  const usual = names.find((n) => n.use === "usual");
  if (usual) return usual;

  // Fall back to first name
  return names[0];
}

/**
 * Format a FHIR Address to a display string
 */
export function formatAddress(address?: Address): string {
  if (!address) return "";

  if (address.text) return address.text;

  const parts: string[] = [];

  if (address.line) parts.push(...address.line);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);

  return parts.join(", ");
}

/**
 * Get the primary/home address from a list of Addresses
 */
export function getPrimaryAddress(addresses?: Address[]): Address | undefined {
  if (!addresses || addresses.length === 0) return undefined;

  const home = addresses.find((a) => a.use === "home");
  if (home) return home;

  return addresses[0];
}

/**
 * Get a specific type of contact point
 */
export function getContactPoint(
  telecoms?: ContactPoint[],
  system?: "phone" | "email"
): string | undefined {
  if (!telecoms) return undefined;

  const contact = telecoms.find((t) => t.system === system);
  return contact?.value;
}

/**
 * Get MRN from a list of identifiers
 */
export function getMRN(identifiers?: Identifier[]): string {
  if (!identifiers) return "N/A";

  // Look for MRN identifier type
  const mrn = identifiers.find((id) =>
    id.type?.coding?.some((c) => c.code === "MR")
  );
  if (mrn?.value) return mrn.value;

  // Fall back to first identifier
  return identifiers[0]?.value || "N/A";
}

/**
 * Extract display text from a CodeableConcept
 */
export function getCodeableConceptText(concept?: CodeableConcept): string {
  if (!concept) return "";

  if (concept.text) return concept.text;

  if (concept.coding && concept.coding.length > 0) {
    return concept.coding[0].display || concept.coding[0].code || "";
  }

  return "";
}

/**
 * Extract code from a CodeableConcept
 */
export function getCodeableConceptCode(concept?: CodeableConcept): string {
  if (!concept?.coding || concept.coding.length === 0) return "";

  return concept.coding[0].code || "";
}

/**
 * Extract reference ID from a FHIR Reference
 */
export function getReferenceId(ref?: Reference): string | undefined {
  if (!ref?.reference) return undefined;

  // Reference format: "ResourceType/id"
  const parts = ref.reference.split("/");
  return parts.length === 2 ? parts[1] : ref.reference;
}

/**
 * Extract display from a FHIR Reference
 */
export function getReferenceDisplay(ref?: Reference): string {
  return ref?.display || "";
}

/**
 * Convert FHIR CodeableConcept to CodeableConceptDTO
 */
export function mapCodeableConcept(
  concept?: CodeableConcept
): CodeableConceptDTO {
  return {
    coding:
      concept?.coding?.map((c) => ({
        system: c.system || "",
        code: c.code || "",
        display: c.display || "",
      })) || [],
    text: concept?.text || getCodeableConceptText(concept),
  };
}

/**
 * Convert FHIR Quantity to QuantityDTO
 */
export function mapQuantity(quantity?: Quantity): QuantityDTO | undefined {
  if (!quantity?.value) return undefined;

  return {
    value: quantity.value,
    unit: quantity.unit || "",
    system: quantity.system,
    code: quantity.code,
  };
}

/**
 * Convert FHIR ObservationReferenceRange to ReferenceRangeDTO
 */
export function mapReferenceRange(
  range?: ObservationReferenceRange
): ReferenceRangeDTO | undefined {
  if (!range) return undefined;

  return {
    low: range.low
      ? {
          value: range.low.value!,
          unit: range.low.unit || "",
          system: range.low.system,
          code: range.low.code,
        }
      : undefined,
    high: range.high
      ? {
          value: range.high.value!,
          unit: range.high.unit || "",
          system: range.high.system,
          code: range.high.code,
        }
      : undefined,
    type: getCodeableConceptText(range.type) || "normal",
    text: range.text,
  };
}

/**
 * Convert FHIR interpretation CodeableConcept[] to InterpretationDTO
 */
export function mapInterpretation(
  interpretation?: CodeableConcept[]
): InterpretationDTO | undefined {
  if (!interpretation || interpretation.length === 0) return undefined;

  const coding = interpretation[0]?.coding?.[0];
  if (!coding) return undefined;

  return {
    code: (coding.code as InterpretationCode) || null,
    display: coding.display || "",
    system: coding.system,
  };
}

// ============================================================
// PATIENT MAPPERS
// ============================================================

/**
 * Convert FHIR Patient to PatientListDTO
 */
export function mapPatientToListDTO(patient: Patient): PatientListDTO {
  const primaryName = getPrimaryName(patient.name);
  const primaryAddress = getPrimaryAddress(patient.address);

  return {
    id: patient.id || "",
    name: formatHumanName(primaryName),
    birthDate: patient.birthDate || "",
    gender: patient.gender || "unknown",
    mrn: getMRN(patient.identifier),
    phone: getContactPoint(patient.telecom, "phone"),
    email: getContactPoint(patient.telecom, "email"),
    address: formatAddress(primaryAddress),
    status: patient.active !== false ? "active" : "inactive",
    alertCount: 0, // Would need separate query
    conditions: [], // Would need separate query
  };
}

/**
 * Convert FHIR Patient to PatientDetailDTO
 */
export function mapPatientToDetailDTO(
  patient: Patient,
  options?: {
    lastVisit?: string;
    primaryPhysician?: string;
    insuranceInfo?: string;
  }
): PatientDetailDTO {
  return {
    ...mapPatientToListDTO(patient),
    lastVisit: options?.lastVisit,
    primaryPhysician: options?.primaryPhysician,
    insuranceInfo: options?.insuranceInfo,
  };
}

/**
 * Convert FHIR Patient to PatientSummaryDTO
 */
export function mapPatientToSummaryDTO(patient: Patient): PatientSummaryDTO {
  const primaryName = getPrimaryName(patient.name);

  return {
    id: patient.id || "",
    name: formatHumanName(primaryName),
    birthDate: patient.birthDate || "",
    gender: patient.gender || "unknown",
    mrn: getMRN(patient.identifier),
  };
}

// ============================================================
// OBSERVATION MAPPERS (VITALS & LABS)
// ============================================================

/**
 * Convert FHIR Observation to VitalSignDTO
 */
export function mapObservationToVitalDTO(
  observation: Observation
): VitalSignDTO {
  const code = mapCodeableConcept(observation.code);
  const effectiveDateTime =
    observation.effectiveDateTime || observation.effectivePeriod?.start || "";

  // Get value - could be quantity, string, or from components
  let value: number | string = "";
  let unit = "";

  if (observation.valueQuantity) {
    value = observation.valueQuantity.value ?? "";
    unit = observation.valueQuantity.unit || "";
  } else if (observation.valueString) {
    value = observation.valueString;
  } else if (observation.component && observation.component.length > 0) {
    // Handle composite observations like BP
    value = formatComponentValue(observation.component);
    unit = observation.component[0]?.valueQuantity?.unit || "";
  }

  // Get reference range
  const referenceRange = mapReferenceRange(observation.referenceRange?.[0]);

  // Get or compute interpretation
  let interpretation = mapInterpretation(observation.interpretation);

  if (!interpretation && typeof value === "number" && referenceRange) {
    interpretation = computeInterpretation(value, referenceRange);
  } else if (!interpretation && typeof value === "string") {
    // Try to compute BP interpretation from string like "138/88"
    interpretation = computeBPInterpretationFromString(value);
  }

  return {
    id: observation.id,
    code,
    value,
    unit,
    effectiveDateTime,
    referenceRange,
    interpretation,
    // Legacy fields
    type: code.text,
    date: effectiveDateTime,
    status: interpretationToStatus(interpretation),
  };
}

/**
 * Format component values (e.g., BP systolic/diastolic) into a string
 */
function formatComponentValue(components: ObservationComponent[]): string {
  if (components.length === 0) return "";

  // For blood pressure, format as "systolic/diastolic"
  const systolic = components.find((c) =>
    c.code.coding?.some((coding) => coding.code === "8480-6")
  );
  const diastolic = components.find((c) =>
    c.code.coding?.some((coding) => coding.code === "8462-4")
  );

  if (systolic?.valueQuantity && diastolic?.valueQuantity) {
    return `${systolic.valueQuantity.value}/${diastolic.valueQuantity.value}`;
  }

  // Generic fallback - join all values
  return components
    .map((c) => c.valueQuantity?.value || c.valueString || "")
    .filter(Boolean)
    .join("/");
}

/**
 * Convert FHIR Observation to LabResultDTO
 */
export function mapObservationToLabResultDTO(
  observation: Observation
): LabResultDTO {
  const code = mapCodeableConcept(observation.code);
  const effectiveDateTime =
    observation.effectiveDateTime || observation.effectivePeriod?.start || "";

  // Get value
  const value = observation.valueQuantity?.value ?? 0;
  const unit = observation.valueQuantity?.unit || "";

  // Get reference range
  const referenceRange = mapReferenceRange(observation.referenceRange?.[0]);

  // Get or compute interpretation
  let interpretation = mapInterpretation(observation.interpretation);

  if (!interpretation && referenceRange) {
    interpretation = computeInterpretation(value, referenceRange);
  }

  return {
    id: observation.id || "",
    code,
    valueQuantity: {
      value,
      unit,
      system: observation.valueQuantity?.system,
      code: observation.valueQuantity?.code,
    },
    effectiveDateTime,
    referenceRange,
    interpretation,
    // Legacy fields
    testName: code.text,
    value,
    unit,
    date: effectiveDateTime,
    flag: interpretationToFlag(interpretation),
  };
}

/**
 * Group lab observations into panels by date or category
 */
export function groupLabObservationsIntoPanels(
  observations: Observation[],
  panelName: string = "Lab Results"
): LabPanelDTO {
  return {
    id: `panel-${Date.now()}`,
    name: panelName,
    date:
      observations[0]?.effectiveDateTime ||
      observations[0]?.effectivePeriod?.start ||
      "",
    results: observations.map(mapObservationToLabResultDTO),
  };
}

// ============================================================
// CONDITION MAPPERS
// ============================================================

/**
 * Convert FHIR Condition to ConditionDTO
 */
export function mapConditionToDTO(condition: Condition): ConditionDTO {
  const clinicalStatus = getCodeableConceptCode(condition.clinicalStatus);

  // Map FHIR clinical status to DTO status
  let status: "active" | "resolved" | "inactive" = "active";
  if (clinicalStatus === "resolved" || clinicalStatus === "remission") {
    status = "resolved";
  } else if (clinicalStatus === "inactive") {
    status = "inactive";
  }

  return {
    id: condition.id || "",
    name: getCodeableConceptText(condition.code),
    code: getCodeableConceptCode(condition.code),
    codeSystem: condition.code?.coding?.[0]?.system,
    status,
    onset:
      condition.onsetDateTime ||
      condition.onsetPeriod?.start ||
      condition.onsetString ||
      "",
    severity: getCodeableConceptText(condition.severity),
    recordedDate: condition.recordedDate,
    recorder: getReferenceDisplay(condition.recorder),
  };
}

// ============================================================
// MEDICATION REQUEST MAPPERS
// ============================================================

/**
 * Convert FHIR MedicationRequest to MedicationDTO
 */
export function mapMedicationRequestToDTO(
  medRequest: MedicationRequest
): MedicationDTO {
  // Map FHIR status to DTO status
  let status: "active" | "discontinued" | "on-hold" = "active";
  if (
    medRequest.status === "cancelled" ||
    medRequest.status === "stopped" ||
    medRequest.status === "completed"
  ) {
    status = "discontinued";
  } else if (medRequest.status === "on-hold") {
    status = "on-hold";
  }

  // Extract dosage information
  const dosage = medRequest.dosageInstruction?.[0];
  const doseQuantity = dosage?.doseAndRate?.[0]?.doseQuantity;

  return {
    id: medRequest.id || "",
    name: getCodeableConceptText(medRequest.medicationCodeableConcept),
    dosage: doseQuantity
      ? `${doseQuantity.value} ${doseQuantity.unit}`
      : dosage?.text || "",
    frequency: formatDosageFrequency(dosage),
    route: getCodeableConceptText(dosage?.route),
    prescriber: getReferenceDisplay(medRequest.requester),
    status,
    startDate: medRequest.authoredOn || "",
    endDate: medRequest.dispenseRequest?.validityPeriod?.end,
    instructions: dosage?.patientInstruction || dosage?.text,
  };
}

/**
 * Format dosage frequency from FHIR Dosage
 */
function formatDosageFrequency(dosage?: Dosage): string {
  if (!dosage?.timing?.repeat) {
    return dosage?.text || "";
  }

  const repeat = dosage.timing.repeat;

  if (repeat.frequency && repeat.period && repeat.periodUnit) {
    const freq = repeat.frequency;
    const period = repeat.period;
    const unit = repeat.periodUnit;

    if (freq === 1 && period === 1) {
      switch (unit) {
        case "d":
          return "Once daily";
        case "wk":
          return "Once weekly";
        case "mo":
          return "Once monthly";
        default:
          return `Every ${unit}`;
      }
    }

    if (period === 1) {
      switch (unit) {
        case "d":
          return `${freq} times daily`;
        case "wk":
          return `${freq} times weekly`;
        default:
          return `${freq} times per ${unit}`;
      }
    }

    return `${freq} times every ${period} ${unit}`;
  }

  return dosage.text || "";
}

// ============================================================
// BUNDLE MAPPERS
// ============================================================

/**
 * Extract resources of a specific type from a FHIR Bundle
 */
export function extractResourcesFromBundle<T>(
  bundle: { entry?: Array<{ resource?: unknown }> },
  resourceType: string
): T[] {
  if (!bundle.entry) return [];

  return bundle.entry
    .map((entry) => entry.resource)
    .filter(
      (resource): resource is T =>
        resource !== undefined &&
        (resource as { resourceType?: string }).resourceType === resourceType
    );
}

/**
 * Convert a Bundle of Patients to PatientListDTOs
 */
export function mapPatientBundleToListDTOs(bundle: {
  entry?: Array<{ resource?: Patient }>;
}): PatientListDTO[] {
  const patients = extractResourcesFromBundle<Patient>(bundle, "Patient");
  return patients.map(mapPatientToListDTO);
}

/**
 * Convert a Bundle of Observations to VitalSignDTOs
 */
export function mapObservationBundleToVitalDTOs(bundle: {
  entry?: Array<{ resource?: Observation }>;
}): VitalSignDTO[] {
  const observations = extractResourcesFromBundle<Observation>(
    bundle,
    "Observation"
  );
  return observations.map(mapObservationToVitalDTO);
}

/**
 * Convert a Bundle of Conditions to ConditionDTOs
 */
export function mapConditionBundleToConditionDTOs(bundle: {
  entry?: Array<{ resource?: Condition }>;
}): ConditionDTO[] {
  const conditions = extractResourcesFromBundle<Condition>(bundle, "Condition");
  return conditions.map(mapConditionToDTO);
}

/**
 * Convert a Bundle of MedicationRequests to MedicationDTOs
 */
export function mapMedicationBundleToDTOs(bundle: {
  entry?: Array<{ resource?: MedicationRequest }>;
}): MedicationDTO[] {
  const medRequests = extractResourcesFromBundle<MedicationRequest>(
    bundle,
    "MedicationRequest"
  );
  return medRequests.map(mapMedicationRequestToDTO);
}
