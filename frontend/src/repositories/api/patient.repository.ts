// API Patient Repository Implementation
// Fetches patient data from FhirHubServer backend

import type { IPatientRepository } from "../interfaces";
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
import type { ApiClient } from "@/lib/api-client";

export class PatientRepository implements IPatientRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async getAll(
    params: PatientSearchParams
  ): Promise<PaginatedResponse<PatientListDTO>> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.query) searchParams.set("query", params.query);
    if (params.searchField) searchParams.set("searchField", params.searchField);
    if (params.gender) searchParams.set("gender", params.gender);
    if (params.status) searchParams.set("status", params.status);
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
    if (params.hasAlerts !== undefined)
      searchParams.set("hasAlerts", String(params.hasAlerts));
    if (params.hasActiveConditions !== undefined)
      searchParams.set(
        "hasActiveConditions",
        String(params.hasActiveConditions)
      );

    return this.apiClient.get<PaginatedResponse<PatientListDTO>>(
      "/api/patients",
      searchParams
    );
  }

  async getById(id: string): Promise<PatientDetailDTO> {
    return this.apiClient.get<PatientDetailDTO>(`/api/patients/${id}`);
  }

  async getSummaries(limit: number = 5): Promise<PatientSummaryDTO[]> {
    const params = new URLSearchParams();
    params.set("limit", String(limit));

    return this.apiClient.get<PatientSummaryDTO[]>(
      "/api/patients/summaries",
      params
    );
  }

  async getVitals(patientId: string): Promise<VitalSignDTO[]> {
    return this.apiClient.get<VitalSignDTO[]>(
      `/api/patients/${patientId}/vitals`
    );
  }

  async getVitalsChart(patientId: string): Promise<VitalChartDataDTO[]> {
    return this.apiClient.get<VitalChartDataDTO[]>(
      `/api/patients/${patientId}/vitals/chart`
    );
  }

  async getConditions(
    patientId: string,
    includeResolved: boolean = false
  ): Promise<ConditionDTO[]> {
    const params = new URLSearchParams();
    params.set("includeResolved", String(includeResolved));

    return this.apiClient.get<ConditionDTO[]>(
      `/api/patients/${patientId}/conditions`,
      params
    );
  }

  async getMedications(
    patientId: string,
    includeDiscontinued: boolean = false
  ): Promise<MedicationDTO[]> {
    const params = new URLSearchParams();
    params.set("includeDiscontinued", String(includeDiscontinued));

    return this.apiClient.get<MedicationDTO[]>(
      `/api/patients/${patientId}/medications`,
      params
    );
  }

  async getLabPanels(patientId: string): Promise<LabPanelDTO[]> {
    return this.apiClient.get<LabPanelDTO[]>(`/api/patients/${patientId}/labs`);
  }

  async getTimeline(patientId: string): Promise<TimelineEventDTO[]> {
    return this.apiClient.get<TimelineEventDTO[]>(
      `/api/patients/${patientId}/timeline`
    );
  }

  async createCondition(
    patientId: string,
    request: CreateConditionRequest
  ): Promise<ConditionDTO> {
    return this.apiClient.post<ConditionDTO>(
      `/api/patients/${patientId}/conditions`,
      request
    );
  }

  async createMedication(
    patientId: string,
    request: CreateMedicationRequest
  ): Promise<MedicationDTO> {
    return this.apiClient.post<MedicationDTO>(
      `/api/patients/${patientId}/medications`,
      request
    );
  }

  async recordVitals(
    patientId: string,
    request: RecordVitalsRequest
  ): Promise<RecordVitalsResponse> {
    return this.apiClient.post<RecordVitalsResponse>(
      `/api/patients/${patientId}/vitals`,
      request
    );
  }

  async orderLabs(
    patientId: string,
    request: OrderLabsRequest
  ): Promise<LabOrderDTO> {
    return this.apiClient.post<LabOrderDTO>(
      `/api/patients/${patientId}/labs/orders`,
      request
    );
  }

  async createPatient(request: CreatePatientRequest): Promise<PatientDetailDTO> {
    return this.apiClient.post<PatientDetailDTO>("/api/patients", request);
  }

  async getAllObservations(
    params: ObservationSearchParams
  ): Promise<PaginatedResponse<ObservationListDTO>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.patientName) searchParams.set("patientName", params.patientName);
    if (params.category) searchParams.set("category", params.category);
    if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params.dateTo) searchParams.set("dateTo", params.dateTo);

    return this.apiClient.get<PaginatedResponse<ObservationListDTO>>(
      "/api/observations",
      searchParams
    );
  }

  async getAllConditions(
    params: ConditionSearchParams
  ): Promise<PaginatedResponse<ConditionListDTO>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.patientName) searchParams.set("patientName", params.patientName);
    if (params.clinicalStatus)
      searchParams.set("clinicalStatus", params.clinicalStatus);
    if (params.severity) searchParams.set("severity", params.severity);
    if (params.query) searchParams.set("query", params.query);

    return this.apiClient.get<PaginatedResponse<ConditionListDTO>>(
      "/api/conditions",
      searchParams
    );
  }

  async getAllMedications(
    params: MedicationSearchParams
  ): Promise<PaginatedResponse<MedicationListDTO>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.patientName) searchParams.set("patientName", params.patientName);
    if (params.status) searchParams.set("status", params.status);
    if (params.query) searchParams.set("query", params.query);

    return this.apiClient.get<PaginatedResponse<MedicationListDTO>>(
      "/api/medications",
      searchParams
    );
  }
}
