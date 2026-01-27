using FhirHubServer.Api.Authorization;
using FhirHubServer.Core.DTOs.Clinical;
using FhirHubServer.Core.DTOs.Patient;
using FhirHubServer.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FhirHubServer.Api.Controllers;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly PatientService _patientService;

    public PatientsController(PatientService patientService)
    {
        _patientService = patientService;
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.CanReadPatients)]
    public async Task<IActionResult> GetAll([FromQuery] PatientSearchParams searchParams, CancellationToken ct)
    {
        var result = await _patientService.GetAllAsync(searchParams, ct);
        return Ok(result);
    }

    [HttpGet("summaries")]
    [Authorize(Policy = AuthorizationPolicies.CanReadPatients)]
    public async Task<IActionResult> GetSummaries([FromQuery] int limit = 5, CancellationToken ct = default)
    {
        var result = await _patientService.GetSummariesAsync(limit, ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.CanWritePatients)]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> Create([FromBody] CreatePatientRequest request, CancellationToken ct)
    {
        var result = await _patientService.CreatePatientAsync(request, ct);
        return Created($"/api/patients/{result.Id}", result);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = AuthorizationPolicies.CanReadPatients)]
    [Authorize(Policy = AuthorizationPolicies.PatientDataAccess)]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
    {
        var result = await _patientService.GetByIdAsync(id, ct);
        if (result is null)
            return NotFound();
        return Ok(result);
    }

    [HttpGet("{id}/vitals")]
    [Authorize(Policy = AuthorizationPolicies.CanReadVitals)]
    [Authorize(Policy = AuthorizationPolicies.PatientDataAccess)]
    public async Task<IActionResult> GetVitals(string id, CancellationToken ct)
    {
        var result = await _patientService.GetVitalsAsync(id, ct);
        return Ok(result);
    }

    [HttpGet("{id}/vitals/chart")]
    [Authorize(Policy = AuthorizationPolicies.CanReadVitals)]
    [Authorize(Policy = AuthorizationPolicies.PatientDataAccess)]
    public async Task<IActionResult> GetVitalsChart(string id, CancellationToken ct)
    {
        var result = await _patientService.GetVitalsChartAsync(id, ct);
        return Ok(result);
    }

    [HttpGet("{id}/conditions")]
    [Authorize(Policy = AuthorizationPolicies.CanReadConditions)]
    [Authorize(Policy = AuthorizationPolicies.PatientDataAccess)]
    public async Task<IActionResult> GetConditions(string id, [FromQuery] bool includeResolved = false, CancellationToken ct = default)
    {
        var result = await _patientService.GetConditionsAsync(id, includeResolved, ct);
        return Ok(result);
    }

    [HttpGet("{id}/medications")]
    [Authorize(Policy = AuthorizationPolicies.CanReadMedications)]
    [Authorize(Policy = AuthorizationPolicies.PatientDataAccess)]
    public async Task<IActionResult> GetMedications(string id, [FromQuery] bool includeDiscontinued = false, CancellationToken ct = default)
    {
        var result = await _patientService.GetMedicationsAsync(id, includeDiscontinued, ct);
        return Ok(result);
    }

    [HttpGet("{id}/labs")]
    [Authorize(Policy = AuthorizationPolicies.CanReadLabs)]
    [Authorize(Policy = AuthorizationPolicies.PatientDataAccess)]
    public async Task<IActionResult> GetLabs(string id, CancellationToken ct)
    {
        var result = await _patientService.GetLabPanelsAsync(id, ct);
        return Ok(result);
    }

    [HttpGet("{id}/timeline")]
    [Authorize(Policy = AuthorizationPolicies.CanReadPatients)]
    [Authorize(Policy = AuthorizationPolicies.PatientDataAccess)]
    public async Task<IActionResult> GetTimeline(string id, CancellationToken ct)
    {
        var result = await _patientService.GetTimelineAsync(id, ct);
        return Ok(result);
    }

    [HttpPost("{id}/conditions")]
    [Authorize(Policy = AuthorizationPolicies.CanWriteConditions)]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> CreateCondition(string id, [FromBody] CreateConditionRequest request, CancellationToken ct)
    {
        var result = await _patientService.CreateConditionAsync(id, request, ct);
        return Created($"/api/patients/{id}/conditions/{result.Id}", result);
    }

    [HttpPost("{id}/medications")]
    [Authorize(Policy = AuthorizationPolicies.CanWriteMedications)]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> CreateMedication(string id, [FromBody] CreateMedicationRequest request, CancellationToken ct)
    {
        var result = await _patientService.CreateMedicationAsync(id, request, ct);
        return Created($"/api/patients/{id}/medications/{result.Id}", result);
    }

    [HttpPost("{id}/vitals")]
    [Authorize(Policy = AuthorizationPolicies.CanWriteVitals)]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> RecordVitals(string id, [FromBody] RecordVitalsRequest request, CancellationToken ct)
    {
        var result = await _patientService.RecordVitalsAsync(id, request, ct);
        return Created($"/api/patients/{id}/vitals", result);
    }

    [HttpPost("{id}/labs/orders")]
    [Authorize(Policy = AuthorizationPolicies.CanOrderLabs)]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> OrderLabs(string id, [FromBody] OrderLabsRequest request, CancellationToken ct)
    {
        var result = await _patientService.OrderLabsAsync(id, request, ct);
        return Created($"/api/patients/{id}/labs/orders/{result.Id}", result);
    }
}
