/**
 * Patient DTOs
 *
 * Data transfer objects for patient-related data.
 */

/**
 * Patient list item for table/grid views
 */
export interface PatientListDTO {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  mrn: string;
  phone?: string;
  email?: string;
  address?: string;
  status: "active" | "inactive";
  alertCount?: number;
  conditions: string[];
}

/**
 * Detailed patient information
 */
export interface PatientDetailDTO extends PatientListDTO {
  lastVisit?: string;
  primaryPhysician?: string;
  insuranceInfo?: string;
}

/**
 * Minimal patient summary for dashboard/quick access
 */
export interface PatientSummaryDTO {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  mrn: string;
  alertCount?: number;
}

/**
 * Request to create a new patient
 */
export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  mrn?: string;
}

/**
 * Patient search/filter parameters
 */
export interface PatientSearchParams {
  query?: string;
  searchField?: "all" | "name" | "mrn" | "phone" | "email";
  gender?: string;
  birthDateFrom?: string;
  birthDateTo?: string;
  status?: "active" | "inactive";
  hasAlerts?: boolean;
  hasActiveConditions?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
