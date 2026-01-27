/**
 * Clinical DTOs (Conditions and Medications)
 *
 * Data transfer objects for clinical data like conditions and medications.
 */

/**
 * Condition DTO
 *
 * Represents a clinical condition, problem, or diagnosis.
 */
export interface ConditionDTO {
  id: string;
  name: string;
  code: string;
  codeSystem?: string;
  status: "active" | "resolved" | "inactive";
  onset: string;
  severity?: string;
  recordedDate?: string;
  recorder?: string;
}

/**
 * Medication DTO
 *
 * Represents a medication request/prescription.
 */
export interface MedicationDTO {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route?: string;
  prescriber: string;
  status: "active" | "discontinued" | "on-hold";
  startDate: string;
  endDate?: string;
  instructions?: string;
}

// Request DTOs for creating clinical data

export interface CreateConditionRequest {
  name: string;
  icdCode?: string;
  onsetDate?: string;
  severity: string;
  clinicalStatus: string;
  notes?: string;
}

export interface CreateMedicationRequest {
  name: string;
  dosage?: string;
  unit?: string;
  route?: string;
  frequency: string;
  startDate?: string;
  instructions?: string;
}

export interface RecordVitalsRequest {
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
}

export interface OrderLabsRequest {
  panelIds: string[];
  priority: string;
  notes?: string;
}

export interface LabOrderDTO {
  id: string;
  status: string;
  panelNames: string[];
  priority: string;
  orderedAt: string;
}

// Validation response types

export type WarningLevel = "Normal" | "Warning" | "Critical";

export interface ClinicalWarning {
  field: string;
  level: WarningLevel;
  message: string;
  normalRange?: string;
}

export interface RecordVitalsResponse {
  vitals: VitalSignDTO[];
  warnings: ClinicalWarning[];
  alertsCreated: string[];
}

// Cross-patient search params and list DTOs

export interface ObservationSearchParams {
  patientName?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ConditionSearchParams {
  patientName?: string;
  clinicalStatus?: string;
  severity?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface MedicationSearchParams {
  patientName?: string;
  status?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface ObservationListDTO {
  id: string;
  patientId?: string;
  patientName: string;
  type: string;
  value: string;
  unit: string;
  date: string;
  status: string;
  interpretation?: string;
}

export interface ConditionListDTO {
  id: string;
  patientId?: string;
  patientName: string;
  name: string;
  code: string;
  status: string;
  onset: string;
  severity: string;
}

export interface MedicationListDTO {
  id: string;
  patientId?: string;
  patientName: string;
  name: string;
  dosage: string;
  frequency: string;
  status: string;
  startDate: string;
}

// VitalSignDTO for the response
export interface VitalSignDTO {
  id?: string;
  code: {
    coding: Array<{ system?: string; code?: string; display?: string }>;
    text?: string;
  };
  value: unknown;
  unit: string;
  effectiveDateTime: string;
  referenceRange?: {
    low?: { value?: number; unit?: string };
    high?: { value?: number; unit?: string };
    text?: string;
  };
  interpretation?: {
    coding: Array<{ system?: string; code?: string; display?: string }>;
    text?: string;
  };
  type: string;
  date: string;
  status: string;
}
