using FhirHubServer.Api.Authorization;
using FhirHubServer.Core.DTOs.Export;
using FhirHubServer.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FhirHubServer.Api.Controllers;

[ApiController]
[Route("api/exports")]
[Authorize]
public class ExportsController : ControllerBase
{
    private readonly ExportService _exportService;

    public ExportsController(ExportService exportService)
    {
        _exportService = exportService;
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.CanManageExports)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _exportService.GetJobsAsync(ct);
        return Ok(result);
    }

    [HttpGet("resource-counts")]
    [Authorize(Policy = AuthorizationPolicies.CanManageExports)]
    public async Task<IActionResult> GetResourceCounts(CancellationToken ct)
    {
        var result = await _exportService.GetResourceCountsAsync(ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = AuthorizationPolicies.CanManageExports)]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
    {
        var result = await _exportService.GetJobAsync(id, ct);
        if (result is null)
            return NotFound();
        return Ok(result);
    }

    [HttpGet("{id}/download")]
    [Authorize(Policy = AuthorizationPolicies.CanManageExports)]
    public async Task<IActionResult> Download(string id, CancellationToken ct)
    {
        var result = await _exportService.GetExportFileAsync(id, ct);
        if (result is null)
            return NotFound();

        var (filePath, contentType, fileName) = result.Value;
        return PhysicalFile(filePath, contentType, fileName);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.CanManageExports)]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> Create([FromBody] ExportConfigDto config, CancellationToken ct)
    {
        var result = await _exportService.CreateJobAsync(config, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("{id}/cancel")]
    [Authorize(Policy = AuthorizationPolicies.CanManageExports)]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> Cancel(string id, CancellationToken ct)
    {
        await _exportService.CancelJobAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id}/retry")]
    [Authorize(Policy = AuthorizationPolicies.CanManageExports)]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> Retry(string id, CancellationToken ct)
    {
        var result = await _exportService.RetryJobAsync(id, ct);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.CanDeleteExports)]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _exportService.DeleteJobAsync(id, ct);
        return NoContent();
    }
}
