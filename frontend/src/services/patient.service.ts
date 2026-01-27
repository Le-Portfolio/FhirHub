// Patient Service
// Acts as a proxy layer between components and repositories

import type { IPatientRepository } from "@/repositories";
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

export class PatientService {
  constructor(private repository: IPatientRepository) {}

  /**
   * Get paginated list of patients with optional filters
   */
  async getPatients(
    params: PatientSearchParams = {}
  ): Promise<PaginatedResponse<PatientListDTO>> {
    return this.repository.getAll(params);
  }

  /**
   * Get detailed patient information by ID
   */
  async getPatient(id: string): Promise<PatientDetailDTO> {
    return this.repository.getById(id);
  }

  /**
   * Get patient summaries for dashboard/quick lists
   */
  async getPatientSummaries(limit?: number): Promise<PatientSummaryDTO[]> {
    return this.repository.getSummaries(limit);
  }

  /**
   * Get patient vital signs
   */
  async getVitals(patientId: string): Promise<VitalSignDTO[]> {
    return this.repository.getVitals(patientId);
  }

  /**
   * Get patient vitals chart data
   */
  async getVitalsChart(patientId: string): Promise<VitalChartDataDTO[]> {
    return this.repository.getVitalsChart(patientId);
  }

  /**
   * Get patient conditions
   */
  async getConditions(
    patientId: string,
    includeResolved: boolean = false
  ): Promise<ConditionDTO[]> {
    return this.repository.getConditions(patientId, includeResolved);
  }

  /**
   * Get patient medications
   */
  async getMedications(
    patientId: string,
    includeDiscontinued: boolean = false
  ): Promise<MedicationDTO[]> {
    return this.repository.getMedications(patientId, includeDiscontinued);
  }

  /**
   * Get patient lab results
   */
  async getLabPanels(patientId: string): Promise<LabPanelDTO[]> {
    return this.repository.getLabPanels(patientId);
  }

  /**
   * Get patient timeline events
   */
  async getTimeline(patientId: string): Promise<TimelineEventDTO[]> {
    return this.repository.getTimeline(patientId);
  }

  /**
   * Create a new condition for a patient
   */
  async createCondition(
    patientId: string,
    request: CreateConditionRequest
  ): Promise<ConditionDTO> {
    return this.repository.createCondition(patientId, request);
  }

  /**
   * Create a new medication for a patient
   */
  async createMedication(
    patientId: string,
    request: CreateMedicationRequest
  ): Promise<MedicationDTO> {
    return this.repository.createMedication(patientId, request);
  }

  /**
   * Record vital signs for a patient
   */
  async recordVitals(
    patientId: string,
    request: RecordVitalsRequest
  ): Promise<RecordVitalsResponse> {
    return this.repository.recordVitals(patientId, request);
  }

  /**
   * Order labs for a patient
   */
  async orderLabs(
    patientId: string,
    request: OrderLabsRequest
  ): Promise<LabOrderDTO> {
    return this.repository.orderLabs(patientId, request);
  }

  /**
   * Create a new patient
   */
  async createPatient(
    request: CreatePatientRequest
  ): Promise<PatientDetailDTO> {
    return this.repository.createPatient(request);
  }

  /**
   * Get cross-patient observations list
   */
  async getAllObservations(
    params: ObservationSearchParams
  ): Promise<PaginatedResponse<ObservationListDTO>> {
    return this.repository.getAllObservations(params);
  }

  /**
   * Get cross-patient conditions list
   */
  async getAllConditions(
    params: ConditionSearchParams
  ): Promise<PaginatedResponse<ConditionListDTO>> {
    return this.repository.getAllConditions(params);
  }

  /**
   * Get cross-patient medications list
   */
  async getAllMedications(
    params: MedicationSearchParams
  ): Promise<PaginatedResponse<MedicationListDTO>> {
    return this.repository.getAllMedications(params);
  }
}
