using FhirHubServer.Api.Features.MirthConnect.DTOs;

namespace FhirHubServer.Api.Features.MirthConnect.Services;

public interface IMirthConnectApiService
{
    Task<MirthServerStatusDto> GetServerStatusAsync(CancellationToken ct = default);
    Task<MirthServerVersionDto> GetServerVersionAsync(CancellationToken ct = default);
    Task StartChannelAsync(string channelId, CancellationToken ct = default);
    Task StopChannelAsync(string channelId, CancellationToken ct = default);
    Task DeployChannelAsync(string channelId, CancellationToken ct = default);
    Task UndeployChannelAsync(string channelId, CancellationToken ct = default);
    Task<string> CreateChannelAsync(CreateChannelRequest request, CancellationToken ct = default);
    Task UpdateChannelAsync(string channelId, UpdateChannelRequest request, CancellationToken ct = default);
    Task<string?> GetChannelRuntimeStateAsync(string channelId, CancellationToken ct = default);
    Task<Dictionary<string, string>> GetAllChannelRuntimeStatesAsync(CancellationToken ct = default);
}
