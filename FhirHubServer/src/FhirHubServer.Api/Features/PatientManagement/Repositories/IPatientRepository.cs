using FhirHubServer.Api.Common.DTOs;
using FhirHubServer.Api.Features.PatientManagement.DTOs;

namespace FhirHubServer.Api.Features.PatientManagement.Repositories;

public interface IPatientRepository
{
    Task<PaginatedResponse<PatientListDto>> GetAllAsync(PatientSearchParams searchParams, CancellationToken ct = default);
    Task<PatientDetailDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<IEnumerable<PatientSummaryDto>> GetSummariesAsync(int limit, CancellationToken ct = default);
    Task<IEnumerable<VitalSignDto>> GetVitalsAsync(string patientId, CancellationToken ct = default);
    Task<IEnumerable<VitalChartDataDto>> GetVitalsChartAsync(string patientId, CancellationToken ct = default);
    Task<IEnumerable<ConditionDto>> GetConditionsAsync(string patientId, bool includeResolved, CancellationToken ct = default);
    Task<IEnumerable<MedicationDto>> GetMedicationsAsync(string patientId, bool includeDiscontinued, CancellationToken ct = default);
    Task<IEnumerable<LabPanelDto>> GetLabPanelsAsync(string patientId, CancellationToken ct = default);
    Task<IEnumerable<TimelineEventDto>> GetTimelineAsync(string patientId, CancellationToken ct = default);

    // Write operations
    Task<PatientDetailDto> CreatePatientAsync(CreatePatientRequest request, CancellationToken ct = default);
    Task<ConditionDto> CreateConditionAsync(string patientId, CreateConditionRequest request, CancellationToken ct = default);
    Task<MedicationDto> CreateMedicationAsync(string patientId, CreateMedicationRequest request, CancellationToken ct = default);
    Task<RecordVitalsResponse> RecordVitalsAsync(string patientId, RecordVitalsRequest request, CancellationToken ct = default);
    Task<LabOrderDto> OrderLabsAsync(string patientId, OrderLabsRequest request, CancellationToken ct = default);

    // Cross-patient queries
    Task<PaginatedResponse<ObservationListDto>> GetAllObservationsAsync(ObservationSearchParams searchParams, CancellationToken ct = default);
    Task<PaginatedResponse<ConditionListDto>> GetAllConditionsAsync(ConditionSearchParams searchParams, CancellationToken ct = default);
    Task<PaginatedResponse<MedicationListDto>> GetAllMedicationsAsync(MedicationSearchParams searchParams, CancellationToken ct = default);
}
