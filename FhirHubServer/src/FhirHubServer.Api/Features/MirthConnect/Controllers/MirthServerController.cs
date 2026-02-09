using FhirHubServer.Api.Common.Authorization;
using FhirHubServer.Api.Features.MirthConnect.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FhirHubServer.Api.Features.MirthConnect.Controllers;

[ApiController]
[Route("api/mirth/server")]
[Authorize(Policy = AuthorizationPolicies.CanManageMirth)]
public class MirthServerController : ControllerBase
{
    private readonly IMirthConnectService _mirthService;

    public MirthServerController(IMirthConnectService mirthService)
    {
        _mirthService = mirthService;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(CancellationToken ct)
    {
        var status = await _mirthService.GetServerStatusAsync(ct);
        return Ok(status);
    }

    [HttpGet("version")]
    public async Task<IActionResult> GetVersion(CancellationToken ct)
    {
        var version = await _mirthService.GetServerVersionAsync(ct);
        return Ok(version);
    }
}
