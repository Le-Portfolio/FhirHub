/**
 * DTO Module Index
 *
 * Re-exports all DTOs organized by domain.
 */

// FHIR Primitive types (base types used by other DTOs)
export type {
  InterpretationCode,
  InterpretationDTO,
  QuantityDTO,
  ReferenceRangeDTO,
  CodingDTO,
  CodeableConceptDTO,
  DateRangeDTO,
} from "./fhir-primitives.dto";

// Patient DTOs
export type {
  PatientListDTO,
  PatientDetailDTO,
  PatientSummaryDTO,
  PatientSearchParams,
  CreatePatientRequest,
} from "./patient.dto";

// Observation DTOs (Vitals and Labs)
export type {
  VitalSignDTO,
  VitalChartDataDTO,
  LabResultDTO,
  LabPanelDTO,
} from "./observation.dto";

// Clinical DTOs (Conditions and Medications)
export type {
  ConditionDTO,
  MedicationDTO,
  CreateConditionRequest,
  CreateMedicationRequest,
  RecordVitalsRequest,
  OrderLabsRequest,
  LabOrderDTO,
  WarningLevel,
  ClinicalWarning,
  RecordVitalsResponse,
  ObservationSearchParams,
  ConditionSearchParams,
  MedicationSearchParams,
  ObservationListDTO,
  ConditionListDTO,
  MedicationListDTO,
} from "./clinical.dto";

// Timeline DTOs
export type { TimelineResourceType, TimelineEventDTO } from "./timeline.dto";

// Dashboard DTOs
export type {
  DashboardMetricDTO,
  DashboardMetricsDTO,
  AlertPriority,
  AlertStatus,
  AlertDTO,
  ActivityType,
  ActivityDTO,
  AlertSearchParams,
  ActivitySearchParams,
} from "./dashboard.dto";

// Export DTOs
export type {
  ExportStatus,
  ExportFormat,
  ExportJobDTO,
  ExportConfigDTO,
  ResourceCountDTO,
} from "./export.dto";

// User Management DTOs
export type {
  KeycloakUserDTO,
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  UserSearchParamsDTO,
  AssignRolesRequestDTO,
  KeycloakSessionDTO,
  KeycloakRoleDTO,
  PaginatedUsersResponse,
} from "./user-management.dto";
