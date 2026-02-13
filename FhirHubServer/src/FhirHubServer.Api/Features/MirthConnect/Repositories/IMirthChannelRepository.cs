using FhirHubServer.Api.Features.MirthConnect.Models;

namespace FhirHubServer.Api.Features.MirthConnect.Repositories;

public interface IMirthChannelRepository
{
    Task<List<MirthChannelEntity>> GetAllChannelsAsync(CancellationToken ct = default);
    Task<MirthChannelEntity?> GetChannelByIdAsync(string channelId, CancellationToken ct = default);
    Task<int?> GetLocalChannelIdAsync(string channelId, CancellationToken ct = default);
    Task<List<ChannelIdMapping>> GetAllChannelMappingsAsync(CancellationToken ct = default);
}
