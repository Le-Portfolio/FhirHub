using FhirHubServer.Api.Common.DependencyInjection;
using FhirHubServer.Api.Common.DTOs;
using FhirHubServer.Api.Features.PatientManagement.DTOs;
using FhirHubServer.Api.Features.PatientManagement.Repositories;

namespace FhirHubServer.Api.Features.PatientManagement.Services;

public class PatientService : IPatientService, IScopedService
{
    private readonly IPatientRepository _repository;

    public PatientService(IPatientRepository repository)
    {
        _repository = repository;
    }

    public Task<PaginatedResponse<PatientListDto>> GetAllAsync(PatientSearchParams searchParams, CancellationToken ct = default)
        => _repository.GetAllAsync(searchParams, ct);

    public Task<PatientDetailDto?> GetByIdAsync(string id, CancellationToken ct = default)
        => _repository.GetByIdAsync(id, ct);

    public Task<IEnumerable<PatientSummaryDto>> GetSummariesAsync(int limit, CancellationToken ct = default)
        => _repository.GetSummariesAsync(limit, ct);

    public Task<IEnumerable<VitalSignDto>> GetVitalsAsync(string patientId, CancellationToken ct = default)
        => _repository.GetVitalsAsync(patientId, ct);

    public Task<IEnumerable<VitalChartDataDto>> GetVitalsChartAsync(string patientId, CancellationToken ct = default)
        => _repository.GetVitalsChartAsync(patientId, ct);

    public Task<IEnumerable<ConditionDto>> GetConditionsAsync(string patientId, bool includeResolved, CancellationToken ct = default)
        => _repository.GetConditionsAsync(patientId, includeResolved, ct);

    public Task<IEnumerable<MedicationDto>> GetMedicationsAsync(string patientId, bool includeDiscontinued, CancellationToken ct = default)
        => _repository.GetMedicationsAsync(patientId, includeDiscontinued, ct);

    public Task<IEnumerable<LabPanelDto>> GetLabPanelsAsync(string patientId, CancellationToken ct = default)
        => _repository.GetLabPanelsAsync(patientId, ct);

    public Task<IEnumerable<TimelineEventDto>> GetTimelineAsync(string patientId, CancellationToken ct = default)
        => _repository.GetTimelineAsync(patientId, ct);

    // Write operations
    public Task<PatientDetailDto> CreatePatientAsync(CreatePatientRequest request, CancellationToken ct = default)
        => _repository.CreatePatientAsync(request, ct);

    public Task<ConditionDto> CreateConditionAsync(string patientId, CreateConditionRequest request, CancellationToken ct = default)
        => _repository.CreateConditionAsync(patientId, request, ct);

    public Task<MedicationDto> CreateMedicationAsync(string patientId, CreateMedicationRequest request, CancellationToken ct = default)
        => _repository.CreateMedicationAsync(patientId, request, ct);

    public Task<RecordVitalsResponse> RecordVitalsAsync(string patientId, RecordVitalsRequest request, CancellationToken ct = default)
        => _repository.RecordVitalsAsync(patientId, request, ct);

    public Task<LabOrderDto> OrderLabsAsync(string patientId, OrderLabsRequest request, CancellationToken ct = default)
        => _repository.OrderLabsAsync(patientId, request, ct);

    // Cross-patient queries
    public Task<PaginatedResponse<ObservationListDto>> GetAllObservationsAsync(ObservationSearchParams searchParams, CancellationToken ct = default)
        => _repository.GetAllObservationsAsync(searchParams, ct);

    public Task<PaginatedResponse<ConditionListDto>> GetAllConditionsAsync(ConditionSearchParams searchParams, CancellationToken ct = default)
        => _repository.GetAllConditionsAsync(searchParams, ct);

    public Task<PaginatedResponse<MedicationListDto>> GetAllMedicationsAsync(MedicationSearchParams searchParams, CancellationToken ct = default)
        => _repository.GetAllMedicationsAsync(searchParams, ct);
}
