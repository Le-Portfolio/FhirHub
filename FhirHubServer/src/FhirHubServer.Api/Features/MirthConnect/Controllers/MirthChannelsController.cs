using System.Diagnostics;
using System.Text;
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
    private readonly IHttpClientFactory _httpClientFactory;

    public MirthChannelsController(IMirthConnectService mirthService, IHttpClientFactory httpClientFactory)
    {
        _mirthService = mirthService;
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet]
    public async Task<IActionResult> GetChannels(CancellationToken ct)
    {
        var channels = await _mirthService.GetChannelsAsync(ct);
        return Ok(channels);
    }

    [HttpGet("idsAndNames")]
    public async Task<IActionResult> GetIdsAndNames(CancellationToken ct)
    {
        var idsAndNames = await _mirthService.GetChannelIdsAndNamesAsync(ct);
        return Ok(idsAndNames);
    }

    [HttpGet("statuses")]
    public async Task<IActionResult> GetStatuses(CancellationToken ct)
    {
        var statuses = await _mirthService.GetChannelStatusesAsync(ct);
        return Ok(statuses);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetChannel(string id, CancellationToken ct)
    {
        var channel = await _mirthService.GetChannelAsync(id, ct);
        if (channel is null) return NotFound();
        return Ok(channel);
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

    [HttpPost("{id}/deploy")]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> Deploy(string id, CancellationToken ct)
    {
        await _mirthService.DeployChannelAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id}/undeploy")]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> Undeploy(string id, CancellationToken ct)
    {
        await _mirthService.UndeployChannelAsync(id, ct);
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

    [HttpPost("test-connection")]
    [EnableRateLimiting("WriteOperations")]
    public async Task<IActionResult> TestConnection([FromBody] TestConnectionRequest request, CancellationToken ct)
    {
        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uri)
            || (uri.Scheme != "http" && uri.Scheme != "https"))
        {
            return BadRequest(new TestConnectionResponse(0, null, 0, "Invalid URL"));
        }

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromMilliseconds(Math.Clamp(request.TimeoutMs, 1_000, 30_000));

        var sw = Stopwatch.StartNew();
        try
        {
            var httpMethod = new HttpMethod(request.Method.ToUpperInvariant());
            using var msg = new HttpRequestMessage(httpMethod, uri);

            if (request.Body is not null && httpMethod != HttpMethod.Get)
            {
                msg.Content = new StringContent(request.Body, Encoding.UTF8, request.ContentType);
            }

            using var response = await client.SendAsync(msg, ct);
            sw.Stop();

            var body = await response.Content.ReadAsStringAsync(ct);
            const int maxBodyLen = 10_000;
            if (body.Length > maxBodyLen)
                body = body[..maxBodyLen] + $"\n... truncated ({body.Length} chars total)";

            return Ok(new TestConnectionResponse((int)response.StatusCode, body, sw.ElapsedMilliseconds, null));
        }
        catch (TaskCanceledException)
        {
            sw.Stop();
            return Ok(new TestConnectionResponse(0, null, sw.ElapsedMilliseconds, "Request timed out"));
        }
        catch (HttpRequestException ex)
        {
            sw.Stop();
            return Ok(new TestConnectionResponse(0, null, sw.ElapsedMilliseconds, ex.Message));
        }
    }
}
