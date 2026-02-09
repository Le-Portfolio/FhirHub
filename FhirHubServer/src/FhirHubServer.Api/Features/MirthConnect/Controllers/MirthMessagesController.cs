using FhirHubServer.Api.Common.Authorization;
using FhirHubServer.Api.Features.MirthConnect.DTOs;
using FhirHubServer.Api.Features.MirthConnect.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FhirHubServer.Api.Features.MirthConnect.Controllers;

[ApiController]
[Route("api/mirth/channels/{channelId}/messages")]
[Authorize(Policy = AuthorizationPolicies.CanManageMirth)]
public class MirthMessagesController : ControllerBase
{
    private readonly IMirthConnectService _mirthService;

    public MirthMessagesController(IMirthConnectService mirthService)
    {
        _mirthService = mirthService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMessages(string channelId, [FromQuery] MirthMessageSearchParams searchParams, CancellationToken ct)
    {
        var result = await _mirthService.GetMessagesAsync(channelId, searchParams, ct);
        return Ok(result);
    }

    [HttpGet("{messageId:long}")]
    public async Task<IActionResult> GetMessage(string channelId, long messageId, CancellationToken ct)
    {
        var message = await _mirthService.GetMessageAsync(channelId, messageId, ct);
        if (message is null) return NotFound();
        return Ok(message);
    }
}
