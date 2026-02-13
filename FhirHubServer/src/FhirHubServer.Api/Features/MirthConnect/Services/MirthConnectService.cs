using FhirHubServer.Api.Common.DependencyInjection;
using FhirHubServer.Api.Features.MirthConnect.DTOs;
using FhirHubServer.Api.Features.MirthConnect.Repositories;

namespace FhirHubServer.Api.Features.MirthConnect.Services;

public class MirthConnectService : IMirthConnectService, IScopedService
{
    private readonly IMirthChannelRepository _channelRepository;
    private readonly IMirthStatisticsRepository _statisticsRepository;
    private readonly IMirthMessageRepository _messageRepository;
    private readonly IMirthConnectApiService _apiService;
    private readonly ILogger<MirthConnectService> _logger;

    public MirthConnectService(
        IMirthChannelRepository channelRepository,
        IMirthStatisticsRepository statisticsRepository,
        IMirthMessageRepository messageRepository,
        IMirthConnectApiService apiService,
        ILogger<MirthConnectService> logger)
    {
        _channelRepository = channelRepository;
        _statisticsRepository = statisticsRepository;
        _messageRepository = messageRepository;
        _apiService = apiService;
        _logger = logger;
    }

    // --- Server operations (API) ---

    public Task<MirthServerStatusDto> GetServerStatusAsync(CancellationToken ct = default)
        => _apiService.GetServerStatusAsync(ct);

    public Task<MirthServerVersionDto> GetServerVersionAsync(CancellationToken ct = default)
        => _apiService.GetServerVersionAsync(ct);

    // --- Channel reads (SQL) ---

    public async Task<List<MirthChannelDto>> GetChannelsAsync(CancellationToken ct = default)
    {
        var entities = await _channelRepository.GetAllChannelsAsync(ct);
        return entities.Select(e => new MirthChannelDto(e.Id, e.Name, e.Description, e.Enabled, e.Revision)).ToList();
    }

    public async Task<MirthChannelDto?> GetChannelAsync(string channelId, CancellationToken ct = default)
    {
        var entity = await _channelRepository.GetChannelByIdAsync(channelId, ct);
        if (entity is null) return null;
        return new MirthChannelDto(entity.Id, entity.Name, entity.Description, entity.Enabled, entity.Revision);
    }

    public async Task<List<MirthChannelIdNameDto>> GetChannelIdsAndNamesAsync(CancellationToken ct = default)
    {
        var entities = await _channelRepository.GetAllChannelsAsync(ct);
        return entities.Select(e => new MirthChannelIdNameDto(e.Id, e.Name)).ToList();
    }

    // --- Channel statuses (Hybrid: SQL + API) ---

    public async Task<List<MirthChannelStatusDto>> GetChannelStatusesAsync(CancellationToken ct = default)
    {
        // Get channel info and stats from SQL in parallel with runtime states from API
        var channelsTask = _channelRepository.GetAllChannelsAsync(ct);
        var statsTask = _statisticsRepository.GetAllChannelStatisticsAsync(ct);

        Dictionary<string, string> runtimeStates;
        try
        {
            runtimeStates = await _apiService.GetAllChannelRuntimeStatesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get runtime states from Mirth API, using UNKNOWN");
            runtimeStates = new Dictionary<string, string>();
        }

        var channels = await channelsTask;
        var stats = await statsTask;
        var statsLookup = stats.ToDictionary(s => s.ChannelId);

        return channels.Select(ch =>
        {
            var s = statsLookup.GetValueOrDefault(ch.Id);
            var state = runtimeStates.GetValueOrDefault(ch.Id, "UNKNOWN");
            return new MirthChannelStatusDto(
                ch.Id,
                ch.Name,
                state,
                s?.Received ?? 0,
                s?.Sent ?? 0,
                s?.Error ?? 0,
                s?.Filtered ?? 0,
                s?.Queued ?? 0);
        }).ToList();
    }

    public async Task<MirthChannelStatusDto?> GetChannelStatusAsync(string channelId, CancellationToken ct = default)
    {
        var channelTask = _channelRepository.GetChannelByIdAsync(channelId, ct);
        var statsTask = _statisticsRepository.GetChannelStatisticsAsync(channelId, ct);

        string? state;
        try
        {
            state = await _apiService.GetChannelRuntimeStateAsync(channelId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get runtime state for channel {ChannelId}", channelId);
            state = "UNKNOWN";
        }

        var channel = await channelTask;
        if (channel is null) return null;

        var stats = await statsTask;

        return new MirthChannelStatusDto(
            channel.Id,
            channel.Name,
            state ?? "UNDEPLOYED",
            stats?.Received ?? 0,
            stats?.Sent ?? 0,
            stats?.Error ?? 0,
            stats?.Filtered ?? 0,
            stats?.Queued ?? 0);
    }

    // --- Statistics (SQL) ---

    public async Task<MirthChannelStatisticsDto?> GetChannelStatisticsAsync(string channelId, CancellationToken ct = default)
    {
        var stats = await _statisticsRepository.GetChannelStatisticsAsync(channelId, ct);
        if (stats is null) return null;
        return new MirthChannelStatisticsDto(
            stats.ChannelId,
            stats.Received,
            stats.Sent,
            stats.Error,
            stats.Filtered,
            stats.Queued);
    }

    // --- Channel control (API) ---

    public Task StartChannelAsync(string channelId, CancellationToken ct = default)
        => _apiService.StartChannelAsync(channelId, ct);

    public Task StopChannelAsync(string channelId, CancellationToken ct = default)
        => _apiService.StopChannelAsync(channelId, ct);

    public Task DeployChannelAsync(string channelId, CancellationToken ct = default)
        => _apiService.DeployChannelAsync(channelId, ct);

    public Task UndeployChannelAsync(string channelId, CancellationToken ct = default)
        => _apiService.UndeployChannelAsync(channelId, ct);

    public Task<string> CreateChannelAsync(CreateChannelRequest request, CancellationToken ct = default)
        => _apiService.CreateChannelAsync(request, ct);

    public Task UpdateChannelAsync(string channelId, UpdateChannelRequest request, CancellationToken ct = default)
        => _apiService.UpdateChannelAsync(channelId, request, ct);

    // --- Messages (SQL) ---

    public Task<MirthMessageListDto> GetMessagesAsync(string channelId, MirthMessageSearchParams searchParams, CancellationToken ct = default)
        => _messageRepository.GetMessagesAsync(channelId, searchParams, ct);

    public Task<MirthMessageDto?> GetMessageAsync(string channelId, long messageId, CancellationToken ct = default)
        => _messageRepository.GetMessageByIdAsync(channelId, messageId, ct);
}
