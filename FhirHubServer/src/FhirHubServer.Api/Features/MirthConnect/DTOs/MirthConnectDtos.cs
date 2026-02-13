namespace FhirHubServer.Api.Features.MirthConnect.DTOs;

public record MirthServerStatusDto(string Status);

public record MirthServerVersionDto(string Version);

public record MirthChannelDto(
    string Id,
    string Name,
    string? Description,
    bool Enabled,
    int Revision);

public record MirthChannelStatusDto(
    string ChannelId,
    string Name,
    string State,
    long Received,
    long Sent,
    long Errored,
    long Filtered,
    long Queued);

public record MirthChannelStatisticsDto(
    string ChannelId,
    long Received,
    long Sent,
    long Errored,
    long Filtered,
    long Queued);

public record MirthMessageDto(
    long MessageId,
    string ChannelId,
    string? ServerId,
    DateTime ReceivedDate,
    bool Processed,
    List<MirthConnectorMessageDto> ConnectorMessages);

public record MirthConnectorMessageDto(
    int MetaDataId,
    string? ConnectorName,
    string Status,
    DateTime ReceivedDate,
    DateTime? ResponseDate,
    MirthMessageContentDto? Raw,
    MirthMessageContentDto? Encoded,
    MirthMessageContentDto? Sent,
    MirthMessageContentDto? Response,
    MirthMessageContentDto? ProcessingError);

public record MirthMessageContentDto(
    string? ContentType,
    string? Content);

public record MirthMessageListDto(
    List<MirthMessageDto> Messages,
    int Total);

public record MirthMessageSearchParams
{
    public int Limit { get; init; } = 20;
    public int Offset { get; init; } = 0;
    public string? StartDate { get; init; }
    public string? EndDate { get; init; }
    public string? Status { get; init; }
}

public record MirthChannelIdNameDto(string Id, string Name);

public record CreateChannelRequest(string ChannelXml);

public record UpdateChannelRequest(string ChannelXml);
