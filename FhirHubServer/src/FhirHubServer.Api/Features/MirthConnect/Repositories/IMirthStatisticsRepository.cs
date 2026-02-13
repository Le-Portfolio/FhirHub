using FhirHubServer.Api.Features.MirthConnect.Models;

namespace FhirHubServer.Api.Features.MirthConnect.Repositories;

public interface IMirthStatisticsRepository
{
    Task<MirthStatisticsEntity?> GetChannelStatisticsAsync(string channelId, CancellationToken ct = default);
    Task<List<MirthStatisticsEntity>> GetAllChannelStatisticsAsync(CancellationToken ct = default);
}
