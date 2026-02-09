using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FhirHubServer.Api.Common.Configuration;
using FhirHubServer.Api.Features.MirthConnect.DTOs;
using FhirHubServer.Api.Features.MirthConnect.Models;
using Microsoft.Extensions.Options;

namespace FhirHubServer.Api.Features.MirthConnect.Services;

public class MirthConnectService : IMirthConnectService
{
    private readonly HttpClient _httpClient;
    private readonly MirthConnectOptions _options;
    private readonly ILogger<MirthConnectService> _logger;
    private string? _sessionCookie;
    private DateTime _sessionExpiry = DateTime.MinValue;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
    };

    public MirthConnectService(
        HttpClient httpClient,
        IOptions<MirthConnectOptions> options,
        ILogger<MirthConnectService> logger)
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

        // Extract JSESSIONID from Set-Cookie header
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

        // Mirth default session timeout is 30 min; use 25 min buffer
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

    /// <summary>
    /// Core send with 401-retry logic. Returns the raw HttpResponseMessage
    /// without calling EnsureSuccessStatusCode, so callers can inspect status codes.
    /// </summary>
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

    /// <summary>
    /// Send with 401-retry and EnsureSuccessStatusCode.
    /// </summary>
    private async Task<HttpResponseMessage> SendCoreAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var response = await SendRawAsync(request, ct);
        response.EnsureSuccessStatusCode();
        return response;
    }

    private async Task<T> SendAsync<T>(HttpRequestMessage request, CancellationToken ct)
    {
        var response = await SendCoreAsync(request, ct);
        return (await response.Content.ReadFromJsonAsync<T>(JsonOptions, ct))!;
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
        // Mirth returns {"int":0} where 0=running, 1=paused, etc.
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
        // Mirth version endpoint only accepts text/plain
        await EnsureSessionAsync(ct);
        var request = new HttpRequestMessage(HttpMethod.Get, $"{_options.BaseUrl}/server/version");
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");
        request.Headers.Add("Accept", "text/plain");
        request.Headers.Add("Cookie", $"JSESSIONID={_sessionCookie}");
        var version = await SendForStringAsync(request, ct);
        return new MirthServerVersionDto(version.Trim());
    }

    public async Task<List<MirthChannelDto>> GetChannelsAsync(CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get, $"{_options.BaseUrl}/channels", ct);
        var response = await SendAsync<MirthChannelListResponse>(request, ct);
        return response.List?.Select(MapToChannelDto).ToList() ?? [];
    }

    public async Task<List<MirthChannelStatusDto>> GetChannelStatusesAsync(CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get, $"{_options.BaseUrl}/channels/statuses", ct);
        var json = await SendForStringAsync(request, ct);
        if (string.IsNullOrWhiteSpace(json))
            return [];

        // Mirth wraps statuses as {"list":{"dashboardStatus": ...}}
        // When there's one channel, dashboardStatus is an object; when multiple, it's an array.
        var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("list", out var listEl))
            return [];
        if (!listEl.TryGetProperty("dashboardStatus", out var statusEl))
            return [];

        var statuses = new List<MirthDashboardStatus>();
        if (statusEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in statusEl.EnumerateArray())
            {
                var s = item.Deserialize<MirthDashboardStatus>(JsonOptions);
                if (s is not null) statuses.Add(s);
            }
        }
        else if (statusEl.ValueKind == JsonValueKind.Object)
        {
            var s = statusEl.Deserialize<MirthDashboardStatus>(JsonOptions);
            if (s is not null) statuses.Add(s);
        }

        return statuses.Select(MapToChannelStatusDto).ToList();
    }

    public async Task<MirthChannelStatusDto?> GetChannelStatusAsync(string channelId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get, $"{_options.BaseUrl}/channels/{channelId}/status", ct);
        var response = await SendRawAsync(request, ct);
        if (response.StatusCode == HttpStatusCode.NotFound)
            return null;
        response.EnsureSuccessStatusCode();
        var status = await response.Content.ReadFromJsonAsync<MirthDashboardStatus>(JsonOptions, ct);
        return status is null ? null : MapToChannelStatusDto(status);
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

    public async Task<MirthChannelStatisticsDto?> GetChannelStatisticsAsync(string channelId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get, $"{_options.BaseUrl}/channels/{channelId}/statistics", ct);
        var response = await SendRawAsync(request, ct);
        if (response.StatusCode == HttpStatusCode.NotFound)
            return null;
        response.EnsureSuccessStatusCode();
        var stats = await response.Content.ReadFromJsonAsync<MirthChannelStatistics>(JsonOptions, ct);
        return stats is null ? null : new MirthChannelStatisticsDto(
            channelId,
            stats.Received,
            stats.Sent,
            stats.Error,
            stats.Filtered,
            stats.Queued);
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

    public async Task<MirthMessageListDto> GetMessagesAsync(string channelId, MirthMessageSearchParams searchParams, CancellationToken ct)
    {
        var query = $"?limit={searchParams.Limit}&offset={searchParams.Offset}&includeContent=true";
        if (!string.IsNullOrEmpty(searchParams.StartDate))
            query += $"&startDate={Uri.EscapeDataString(searchParams.StartDate)}";
        if (!string.IsNullOrEmpty(searchParams.EndDate))
            query += $"&endDate={Uri.EscapeDataString(searchParams.EndDate)}";
        if (!string.IsNullOrEmpty(searchParams.Status))
            query += $"&status={Uri.EscapeDataString(searchParams.Status)}";

        var request = await CreateRequestAsync(HttpMethod.Get, $"{_options.BaseUrl}/channels/{channelId}/messages{query}", ct);
        var response = await SendRawAsync(request, ct);
        if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.InternalServerError)
            return new MirthMessageListDto([], 0);

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync(ct);
        if (string.IsNullOrWhiteSpace(json))
            return new MirthMessageListDto([], 0);

        var messageResponse = JsonSerializer.Deserialize<MirthMessageListResponse>(json, JsonOptions);
        var messages = messageResponse?.Message?.Select(m => MapToMessageDto(m, channelId)).ToList() ?? [];
        return new MirthMessageListDto(messages, messageResponse?.Total ?? 0);
    }

    public async Task<MirthMessageDto?> GetMessageAsync(string channelId, long messageId, CancellationToken ct)
    {
        var request = await CreateRequestAsync(HttpMethod.Get,
            $"{_options.BaseUrl}/channels/{channelId}/messages/{messageId}?includeContent=true", ct);
        var response = await SendRawAsync(request, ct);
        if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.InternalServerError)
            return null;
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync(ct);
        if (string.IsNullOrWhiteSpace(json))
            return null;
        var msg = JsonSerializer.Deserialize<MirthInternalMessage>(json, JsonOptions);
        return msg is null ? null : MapToMessageDto(msg, channelId);
    }

    /// <summary>
    /// Parses Mirth's linked-hash-map statistics format into simple counts.
    /// Mirth returns: {"@class":"linked-hash-map","entry":[{"com.mirth.connect.donkey.model.message.Status":"RECEIVED","long":4}, ...]}
    /// </summary>
    private static MirthChannelStatistics ParseStatistics(JsonElement? statsEl)
    {
        if (statsEl is null || statsEl.Value.ValueKind != JsonValueKind.Object)
            return new MirthChannelStatistics();

        var el = statsEl.Value;

        // Try simple format first (received, sent, error, filtered, queued as direct properties)
        if (el.TryGetProperty("received", out _))
            return el.Deserialize<MirthChannelStatistics>(JsonOptions) ?? new MirthChannelStatistics();

        // Mirth linked-hash-map format
        if (!el.TryGetProperty("entry", out var entryEl))
            return new MirthChannelStatistics();

        long received = 0, sent = 0, error = 0, filtered = 0, queued = 0;
        const string statusKey = "com.mirth.connect.donkey.model.message.Status";

        foreach (var entry in entryEl.EnumerateArray())
        {
            if (!entry.TryGetProperty(statusKey, out var statusProp) ||
                !entry.TryGetProperty("long", out var valueProp))
                continue;

            var status = statusProp.GetString();
            var value = valueProp.GetInt64();

            switch (status)
            {
                case "RECEIVED": received = value; break;
                case "SENT": sent = value; break;
                case "ERROR": error = value; break;
                case "FILTERED": filtered = value; break;
                case "QUEUED": queued = value; break;
            }
        }

        return new MirthChannelStatistics
        {
            Received = received,
            Sent = sent,
            Error = error,
            Filtered = filtered,
            Queued = queued,
        };
    }

    private static MirthChannelDto MapToChannelDto(MirthInternalChannel c) => new(
        c.Id, c.Name, c.Description, c.Enabled, c.Revision);

    private static MirthChannelStatusDto MapToChannelStatusDto(MirthDashboardStatus s)
    {
        var stats = ParseStatistics(s.Statistics);
        return new MirthChannelStatusDto(
            s.ChannelId,
            s.Name,
            s.State,
            stats.Received,
            stats.Sent,
            stats.Error,
            stats.Filtered,
            s.Queued);
    }

    private static DateTime FromMirthDate(MirthDate? date) =>
        date is null ? DateTime.MinValue : DateTimeOffset.FromUnixTimeMilliseconds(date.Time).UtcDateTime;

    private static MirthMessageContentDto? MapContent(MirthInternalContent? c) =>
        c is null ? null : new MirthMessageContentDto(c.ContentType, c.Content);

    private static MirthMessageDto MapToMessageDto(MirthInternalMessage m, string channelId) => new(
        m.MessageId,
        channelId,
        m.ServerId,
        FromMirthDate(m.ReceivedDate),
        m.Processed,
        m.ConnectorMessages?.Entry?
            .Where(e => e.ConnectorMessage is not null)
            .Select(e => new MirthConnectorMessageDto(
                e.ConnectorMessage!.MetaDataId,
                e.ConnectorMessage.ConnectorName,
                e.ConnectorMessage.Status,
                FromMirthDate(e.ConnectorMessage.ReceivedDate),
                e.ConnectorMessage.ResponseDate is null ? null : FromMirthDate(e.ConnectorMessage.ResponseDate),
                MapContent(e.ConnectorMessage.Raw),
                MapContent(e.ConnectorMessage.Encoded),
                MapContent(e.ConnectorMessage.Sent),
                MapContent(e.ConnectorMessage.Response)))
            .ToList() ?? []);
}
