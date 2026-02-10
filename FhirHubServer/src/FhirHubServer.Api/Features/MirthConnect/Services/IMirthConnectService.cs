using FhirHubServer.Api.Features.MirthConnect.DTOs;

namespace FhirHubServer.Api.Features.MirthConnect.Services;

public interface IMirthConnectService
{
    Task<MirthServerStatusDto> GetServerStatusAsync(CancellationToken ct = default);
    Task<MirthServerVersionDto> GetServerVersionAsync(CancellationToken ct = default);
    Task<List<MirthChannelDto>> GetChannelsAsync(CancellationToken ct = default);
    Task<List<MirthChannelStatusDto>> GetChannelStatusesAsync(CancellationToken ct = default);
    Task<MirthChannelStatusDto?> GetChannelStatusAsync(string channelId, CancellationToken ct = default);
    Task StartChannelAsync(string channelId, CancellationToken ct = default);
    Task StopChannelAsync(string channelId, CancellationToken ct = default);
    Task<MirthChannelStatisticsDto?> GetChannelStatisticsAsync(string channelId, CancellationToken ct = default);
    Task<string> CreateChannelAsync(CreateChannelRequest request, CancellationToken ct = default);
    Task UpdateChannelAsync(string channelId, UpdateChannelRequest request, CancellationToken ct = default);
    Task<List<MirthChannelIdNameDto>> GetChannelIdsAndNamesAsync(CancellationToken ct = default);
    Task<MirthChannelDto?> GetChannelAsync(string channelId, CancellationToken ct = default);
    Task DeployChannelAsync(string channelId, CancellationToken ct = default);
    Task UndeployChannelAsync(string channelId, CancellationToken ct = default);
    Task<MirthMessageListDto> GetMessagesAsync(string channelId, MirthMessageSearchParams searchParams, CancellationToken ct = default);
    Task<MirthMessageDto?> GetMessageAsync(string channelId, long messageId, CancellationToken ct = default);
}
