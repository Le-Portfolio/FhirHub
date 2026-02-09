using FhirHubServer.Api.Common.Authorization;
using FhirHubServer.Api.Features.PatientManagement.DTOs;
using FhirHubServer.Api.Features.PatientManagement.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FhirHubServer.Api.Features.PatientManagement.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ClinicalController : ControllerBase
{
    private readonly IPatientService _patientService;

    public ClinicalController(IPatientService patientService)
    {
        _patientService = patientService;
    }

    [HttpGet("observations")]
    [Authorize(Policy = AuthorizationPolicies.CanReadClinicalOverviews)]
    public async Task<IActionResult> GetAllObservations([FromQuery] ObservationSearchParams searchParams, CancellationToken ct)
    {
        var result = await _patientService.GetAllObservationsAsync(searchParams, ct);
        return Ok(result);
    }

    [HttpGet("conditions")]
    [Authorize(Policy = AuthorizationPolicies.CanReadClinicalOverviews)]
    public async Task<IActionResult> GetAllConditions([FromQuery] ConditionSearchParams searchParams, CancellationToken ct)
    {
        var result = await _patientService.GetAllConditionsAsync(searchParams, ct);
        return Ok(result);
    }

    [HttpGet("medications")]
    [Authorize(Policy = AuthorizationPolicies.CanReadClinicalOverviews)]
    public async Task<IActionResult> GetAllMedications([FromQuery] MedicationSearchParams searchParams, CancellationToken ct)
    {
        var result = await _patientService.GetAllMedicationsAsync(searchParams, ct);
        return Ok(result);
    }
}
