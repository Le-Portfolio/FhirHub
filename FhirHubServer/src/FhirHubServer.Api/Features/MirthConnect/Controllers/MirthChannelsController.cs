using FhirHubServer.Api.Common.Authorization;
using FhirHubServer.Api.Features.MirthConnect.DTOs;
using FhirHubServer.Api.Features.MirthConnect.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FhirHubServer.Api.Features.MirthConnect.Controllers;

[ApiController]
[Route("api/mirth/channels")]
[Authorize(Policy = AuthorizationPolicies.CanManageMirth)]
public class MirthChannelsController : ControllerBase
{
    private readonly IMirthConnectService _mirthService;

    public MirthChannelsController(IMirthConnectService mirthService)
    {
        _mirthService = mirthService;
    }

    [HttpGet]
    public async Task<IActionResult> GetChannels(CancellationToken ct)
    {
        var channels = await _mirthService.GetChannelsAsync(ct);
        return Ok(channels);
    }

    [HttpGet("statuses")]
    public async Task<IActionResult> GetStatuses(CancellationToken ct)
    {
        var statuses = await _mirthService.GetChannelStatusesAsync(ct);
        return Ok(statuses);
    }

    [HttpGet("{id}/status")]
    public async Task<IActionResult> GetStatus(string id, CancellationToken ct)
    {
        var status = await _mirthService.GetChannelStatusAsync(id, ct);
        if (status is null) return NotFound();
        return Ok(status);
    }

    [HttpPost("{id}/start")]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> Start(string id, CancellationToken ct)
    {
        await _mirthService.StartChannelAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id}/stop")]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> Stop(string id, CancellationToken ct)
    {
        await _mirthService.StopChannelAsync(id, ct);
        return NoContent();
    }

    [HttpGet("{id}/statistics")]
    public async Task<IActionResult> GetStatistics(string id, CancellationToken ct)
    {
        var stats = await _mirthService.GetChannelStatisticsAsync(id, ct);
        if (stats is null) return NotFound();
        return Ok(stats);
    }

    [HttpPost]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> Create([FromBody] CreateChannelRequest request, CancellationToken ct)
    {
        var channelId = await _mirthService.CreateChannelAsync(request, ct);
        return Created($"/api/mirth/channels/{channelId}", new { id = channelId });
    }

    [HttpPut("{id}")]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateChannelRequest request, CancellationToken ct)
    {
        await _mirthService.UpdateChannelAsync(id, request, ct);
        return NoContent();
    }
}
