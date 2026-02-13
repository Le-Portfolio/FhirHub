using FhirHubServer.Api.Features.MirthConnect.DTOs;

namespace FhirHubServer.Api.Features.MirthConnect.Repositories;

public interface IMirthMessageRepository
{
    Task<MirthMessageListDto> GetMessagesAsync(string channelId, MirthMessageSearchParams searchParams, CancellationToken ct = default);
    Task<MirthMessageDto?> GetMessageByIdAsync(string channelId, long messageId, CancellationToken ct = default);
}
