using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FhirHubServer.Api.Common.Configuration;
using FhirHubServer.Api.Features.MirthConnect.DTOs;
using FhirHubServer.Api.Features.MirthConnect.Models;
using Microsoft.Extensions.Options;

namespace FhirHubServer.Api.Features.MirthConnect.Services;

public class MirthConnectApiService : IMirthConnectApiService
{
    private readonly HttpClient _httpClient;
    private readonly MirthConnectOptions _options;
    private readonly ILogger<MirthConnectApiService> _logger;
    private string? _sessionCookie;
    private DateTime _sessionExpiry = DateTime.MinValue;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
    };

    public MirthConnectApiService(
        HttpClient httpClient,
        IOptions<MirthConnectOptions> options,
        ILogger<MirthConnectApiService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    private async Task EnsureSessionAsync(CancellationToken ct)
    {
        if (_sessionCookie is not null && DateTime.UtcNow < _sessionExpiry)
            return;

        var loginUrl = $"{_options.BaseUrl}/users/_login";
        var loginRequest = new HttpRequestMessage(HttpMethod.Post, loginUrl)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["username"] = _options.Username,
                ["password"] = _options.Password,
            })
        };
        loginRequest.Headers.Add("X-Requested-With", "XMLHttpRequest");
        loginRequest.Headers.Add("Accept", "application/json");

        var response = await _httpClient.SendAsync(loginRequest, ct);
        response.EnsureSuccessStatusCode();

        if (response.Headers.TryGetValues("Set-Cookie", out var cookies))
        {
            foreach (var cookie in cookies)
            {
                if (cookie.StartsWith("JSESSIONID=", StringComparison.OrdinalIgnoreCase))
                {
                    _sessionCookie = cookie.Split(';')[0].Split('=')[1];
                    break;
                }
            }
        }

        if (_sessionCookie is null)
        {
            throw new InvalidOperationException("Failed to obtain JSESSIONID from Mirth Connect login");
        }

        _sessionExpiry = DateTime.UtcNow.AddMinutes(25);
        _logger.LogDebug("Mirth Connect session established");
    }

    private async Task<HttpRequestMessage> CreateRequestAsync(HttpMethod method, string url, CancellationToken ct)
    {
        await EnsureSessionAsync(ct);
        var request = new HttpRequestMessage(method, url);
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Headers.Add("Accept", "application/json");
        request.Headers.Add("Cookie", $"JSESSIONID={_sessionCookie}");
        return request;
    }

    private static HttpRequestMessage CloneRequest(HttpRequestMessage original, byte[]? bodyBytes)
    {
        var clone = new HttpRequestMessage(original.Method, original.RequestUri);
        foreach (var header in original.Headers)
            clone.Headers.TryAddWithoutValidation(header.Key, header.Value);

        if (bodyBytes is not null && original.Content is not null)
        {
            clone.Content = new ByteArrayContent(bodyBytes);
            foreach (var header in original.Content.Headers)
                clone.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        return clone;
    }

    private async Task<HttpResponseMessage> SendRawAsync(HttpRequestMessage request, CancellationToken ct)
    {
        byte[]? bodyBytes = null;
        if (request.Content is not null)
            bodyBytes = await request.Content.ReadAsByteArrayAsync(ct);

        var response = await _httpClient.SendAsync(request, ct);

        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            _logger.LogWarning("Mirth Connect session expired, re-authenticating");
            _sessionCookie = null;
            _sessionExpiry = DateTime.MinValue;

            var retry = CloneRequest(request, bodyBytes);
            await EnsureSessionAsync(ct);
            retry.Headers.Remove("Cookie");
            retry.Headers.Add("Cookie", $"JSESSIONID={_sessionCookie}");

            response = await _httpClient.SendAsync(retry, ct);
        }

        return response;
    }

    private async Task<HttpResponseMessage> SendCoreAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var response = await SendRawAsync(request, ct);
        response.EnsureSuccessStatusCode();
        return response;
    }

    private async Task SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        await SendCoreAsync(request, ct);
    }

    private async Task<string> SendForStringAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var response = await SendCoreAsync(request, ct);
        return await response.Content.ReadAsStringAsync(ct);
    }

    public async Task<MirthServerStatusDto> GetServerStatusAsync(CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get, $"{_options.BaseUrl}/server/status", ct);
        var json = await SendForStringAsync(request, ct);
        var statusMap = new Dictionary<string, string>
        {
            ["0"] = "RUNNING",
            ["1"] = "PAUSED",
            ["2"] = "ERROR",
        };
        try
        {
            var doc = JsonDocument.Parse(json);
            var code = doc.RootElement.GetProperty("int").ToString();
            return new MirthServerStatusDto(statusMap.GetValueOrDefault(code, $"UNKNOWN({code})"));
        }
        catch
        {
            return new MirthServerStatusDto(json.Trim());
        }
    }

    public async Task<MirthServerVersionDto> GetServerVersionAsync(CancellationToken ct)
    {
        await EnsureSessionAsync(ct);
        var request = new HttpRequestMessage(HttpMethod.Get, $"{_options.BaseUrl}/server/version");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Headers.Add("Accept", "text/plain");
        request.Headers.Add("Cookie", $"JSESSIONID={_sessionCookie}");
        var version = await SendForStringAsync(request, ct);
        return new MirthServerVersionDto(version.Trim());
    }

    public async Task StartChannelAsync(string channelId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Post, $"{_options.BaseUrl}/channels/{channelId}/_start", ct);
        await SendAsync(request, ct);
    }

    public async Task StopChannelAsync(string channelId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Post, $"{_options.BaseUrl}/channels/{channelId}/_stop", ct);
        await SendAsync(request, ct);
    }

    public async Task DeployChannelAsync(string channelId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Post, $"{_options.BaseUrl}/channels/{channelId}/_deploy", ct);
        await SendAsync(request, ct);
    }

    public async Task UndeployChannelAsync(string channelId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Post, $"{_options.BaseUrl}/channels/{channelId}/_undeploy", ct);
        await SendAsync(request, ct);
    }

    public async Task<string> CreateChannelAsync(CreateChannelRequest channelRequest, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Post, $"{_options.BaseUrl}/channels", ct);
        request.Content = new StringContent(channelRequest.ChannelXml, Encoding.UTF8, "application/xml");
        var channelId = await SendForStringAsync(request, ct);
        return channelId.Trim().Trim('"');
    }

    public async Task UpdateChannelAsync(string channelId, UpdateChannelRequest channelRequest, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Put, $"{_options.BaseUrl}/channels/{channelId}", ct);
        request.Content = new StringContent(channelRequest.ChannelXml, Encoding.UTF8, "application/xml");
        await SendAsync(request, ct);
    }

    public async Task<string?> GetChannelRuntimeStateAsync(string channelId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get, $"{_options.BaseUrl}/channels/{channelId}/status", ct);
        var response = await SendRawAsync(request, ct);
        if (response.StatusCode == HttpStatusCode.NotFound)
            return null;
        response.EnsureSuccessStatusCode();
        var status = await response.Content.ReadFromJsonAsync<MirthDashboardStatus>(JsonOptions, ct);
        return status?.State;
    }

    public async Task<Dictionary<string, string>> GetAllChannelRuntimeStatesAsync(CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get, $"{_options.BaseUrl}/channels/statuses", ct);
        var json = await SendForStringAsync(request, ct);
        if (string.IsNullOrWhiteSpace(json))
            return new Dictionary<string, string>();

        var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("list", out var listEl))
            return new Dictionary<string, string>();
        if (!listEl.TryGetProperty("dashboardStatus", out var statusEl))
            return new Dictionary<string, string>();

        var result = new Dictionary<string, string>();

        if (statusEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in statusEl.EnumerateArray())
            {
                var s = item.Deserialize<MirthDashboardStatus>(JsonOptions);
                if (s is not null)
                    result[s.ChannelId] = s.State;
            }
        }
        else if (statusEl.ValueKind == JsonValueKind.Object)
        {
            var s = statusEl.Deserialize<MirthDashboardStatus>(JsonOptions);
            if (s is not null)
                result[s.ChannelId] = s.State;
        }

        return result;
    }
}
