// Repository Interfaces
// These define the contracts for data access, enabling easy swapping between mock and real implementations

import type {
  PaginatedResponse,
  PatientListDTO,
  PatientDetailDTO,
  PatientSummaryDTO,
  PatientSearchParams,
  CreatePatientRequest,
  VitalSignDTO,
  VitalChartDataDTO,
  ConditionDTO,
  MedicationDTO,
  LabPanelDTO,
  TimelineEventDTO,
  ExportJobDTO,
  ExportConfigDTO,
  ResourceCountDTO,
  DashboardMetricDTO,
  AlertDTO,
  ActivityDTO,
  AlertSearchParams,
  ActivitySearchParams,
  CreateConditionRequest,
  CreateMedicationRequest,
  RecordVitalsRequest,
  OrderLabsRequest,
  LabOrderDTO,
  RecordVitalsResponse,
  ObservationSearchParams,
  ConditionSearchParams,
  MedicationSearchParams,
  ObservationListDTO,
  ConditionListDTO,
  MedicationListDTO,
} from "@/types";
import type {
  KeycloakUserDTO,
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  UserSearchParamsDTO,
  AssignRolesRequestDTO,
  KeycloakSessionDTO,
  KeycloakRoleDTO,
  PaginatedUsersResponse,
} from "@/types/dto/user-management.dto";

/**
 * Patient Repository Interface
 */
export interface IPatientRepository {
  /**
   * Get paginated list of patients with optional filters
   */
  getAll(
    params: PatientSearchParams
  ): Promise<PaginatedResponse<PatientListDTO>>;

  /**
   * Get detailed patient information by ID
   */
  getById(id: string): Promise<PatientDetailDTO>;

  /**
   * Get simplified patient summaries for dashboard/lists
   */
  getSummaries(limit?: number): Promise<PatientSummaryDTO[]>;

  /**
   * Get patient vital signs
   */
  getVitals(patientId: string): Promise<VitalSignDTO[]>;

  /**
   * Get patient vitals chart data for trending
   */
  getVitalsChart(patientId: string): Promise<VitalChartDataDTO[]>;

  /**
   * Get patient conditions
   */
  getConditions(
    patientId: string,
    includeResolved?: boolean
  ): Promise<ConditionDTO[]>;

  /**
   * Get patient medications
   */
  getMedications(
    patientId: string,
    includeDiscontinued?: boolean
  ): Promise<MedicationDTO[]>;

  /**
   * Get patient lab results grouped by panel
   */
  getLabPanels(patientId: string): Promise<LabPanelDTO[]>;

  /**
   * Get patient timeline events
   */
  getTimeline(patientId: string): Promise<TimelineEventDTO[]>;

  /**
   * Create a new condition for a patient
   */
  createCondition(
    patientId: string,
    request: CreateConditionRequest
  ): Promise<ConditionDTO>;

  /**
   * Create a new medication for a patient
   */
  createMedication(
    patientId: string,
    request: CreateMedicationRequest
  ): Promise<MedicationDTO>;

  /**
   * Record vital signs for a patient
   */
  recordVitals(
    patientId: string,
    request: RecordVitalsRequest
  ): Promise<RecordVitalsResponse>;

  /**
   * Order labs for a patient
   */
  orderLabs(patientId: string, request: OrderLabsRequest): Promise<LabOrderDTO>;

  /**
   * Create a new patient
   */
  createPatient(request: CreatePatientRequest): Promise<PatientDetailDTO>;

  /**
   * Get cross-patient observations list
   */
  getAllObservations(
    params: ObservationSearchParams
  ): Promise<PaginatedResponse<ObservationListDTO>>;

  /**
   * Get cross-patient conditions list
   */
  getAllConditions(
    params: ConditionSearchParams
  ): Promise<PaginatedResponse<ConditionListDTO>>;

  /**
   * Get cross-patient medications list
   */
  getAllMedications(
    params: MedicationSearchParams
  ): Promise<PaginatedResponse<MedicationListDTO>>;
}

/**
 * Export Repository Interface
 */
export interface IExportRepository {
  /**
   * Get all export jobs
   */
  getJobs(): Promise<ExportJobDTO[]>;

  /**
   * Get a specific export job by ID
   */
  getJob(id: string): Promise<ExportJobDTO>;

  /**
   * Create a new export job
   */
  createJob(config: ExportConfigDTO): Promise<ExportJobDTO>;

  /**
   * Cancel an export job
   */
  cancelJob(id: string): Promise<void>;

  /**
   * Delete an export job
   */
  deleteJob(id: string): Promise<void>;

  /**
   * Retry a failed export job
   */
  retryJob(id: string): Promise<ExportJobDTO>;

  /**
   * Subscribe to job progress updates (returns unsubscribe function)
   */
  onJobProgress(
    jobId: string,
    callback: (job: ExportJobDTO) => void
  ): () => void;

  /**
   * Get resource counts for all supported resource types
   */
  getResourceCounts(): Promise<ResourceCountDTO[]>;

  /**
   * Download an export file as a blob
   */
  downloadExport(id: string): Promise<Blob>;
}

/**
 * Dashboard Repository Interface
 */
export interface IDashboardRepository {
  /**
   * Get dashboard metrics
   */
  getMetrics(): Promise<DashboardMetricDTO[]>;

  /**
   * Get active alerts
   */
  getAlerts(limit?: number): Promise<AlertDTO[]>;

  /**
   * Get recent activity feed
   */
  getActivities(limit?: number): Promise<ActivityDTO[]>;

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(id: string): Promise<void>;

  /**
   * Resolve an alert
   */
  resolveAlert(id: string): Promise<void>;

  /**
   * Get paginated alerts with filters
   */
  getAlertsPaginated(
    params: AlertSearchParams
  ): Promise<PaginatedResponse<AlertDTO>>;

  /**
   * Get paginated activities with filters
   */
  getActivitiesPaginated(
    params: ActivitySearchParams
  ): Promise<PaginatedResponse<ActivityDTO>>;
}

/**
 * User Management Repository Interface
 */
export interface IUserManagementRepository {
  getUsers(params?: UserSearchParamsDTO): Promise<PaginatedUsersResponse>;
  getUserById(id: string): Promise<KeycloakUserDTO>;
  createUser(request: CreateUserRequestDTO): Promise<KeycloakUserDTO>;
  updateUser(id: string, request: UpdateUserRequestDTO): Promise<KeycloakUserDTO>;
  deactivateUser(id: string): Promise<void>;
  reactivateUser(id: string): Promise<void>;
  sendPasswordReset(id: string): Promise<void>;
  getUserRoles(id: string): Promise<KeycloakRoleDTO[]>;
  assignRoles(id: string, request: AssignRolesRequestDTO): Promise<KeycloakRoleDTO[]>;
  getUserSessions(id: string): Promise<KeycloakSessionDTO[]>;
  terminateUserSessions(id: string): Promise<void>;
  requireMfa(id: string): Promise<void>;
  getAvailableRoles(): Promise<KeycloakRoleDTO[]>;
  getAuditEvents(params?: { userId?: string; type?: string; page?: number; pageSize?: number }): Promise<unknown[]>;
  getAdminEvents(params?: { page?: number; pageSize?: number }): Promise<unknown[]>;
}

/**
 * Repository configuration
 */
export interface RepositoryConfig {
  /**
   * Simulated network delay in milliseconds (for mock repos)
   */
  delay?: number;

  /**
   * Probability of simulating an error (0-1, for mock repos)
   */
  errorRate?: number;

  /**
   * Base URL for API calls (for real repos)
   */
  baseUrl?: string;
}
