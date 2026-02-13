using System.Text.Json;
using System.Text.Json.Serialization;

namespace FhirHubServer.Api.Features.MirthConnect.Models;

internal record MirthChannelListResponse
{
    [JsonPropertyName("list")]
    public List<MirthInternalChannel>? List { get; init; }
}

internal record MirthInternalChannel
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = "";
    [JsonPropertyName("name")]
    public string Name { get; init; } = "";
    [JsonPropertyName("description")]
    public string? Description { get; init; }
    [JsonPropertyName("enabled")]
    public bool Enabled { get; init; }
    [JsonPropertyName("revision")]
    public int Revision { get; init; }
}

internal record MirthDashboardStatusListResponse
{
    [JsonPropertyName("list")]
    public List<MirthDashboardStatus>? List { get; init; }
}

internal record MirthDashboardStatus
{
    [JsonPropertyName("channelId")]
    public string ChannelId { get; init; } = "";
    [JsonPropertyName("name")]
    public string Name { get; init; } = "";
    [JsonPropertyName("state")]
    public string State { get; init; } = "";
    [JsonPropertyName("statistics")]
    public JsonElement? Statistics { get; init; }
    [JsonPropertyName("queued")]
    public long Queued { get; init; }
}

internal record MirthChannelStatistics
{
    [JsonPropertyName("received")]
    public long Received { get; init; }
    [JsonPropertyName("sent")]
    public long Sent { get; init; }
    [JsonPropertyName("error")]
    public long Error { get; init; }
    [JsonPropertyName("filtered")]
    public long Filtered { get; init; }
    [JsonPropertyName("queued")]
    public long Queued { get; init; }
}

internal record MirthMessageListWrapper
{
    [JsonPropertyName("list")]
    public MirthMessageListResponse? List { get; init; }
}

internal record MirthMessageListResponse
{
    [JsonPropertyName("message")]
    [JsonConverter(typeof(SingleOrArrayConverter<MirthInternalMessage>))]
    public List<MirthInternalMessage>? Message { get; init; }
    [JsonPropertyName("total")]
    public int Total { get; init; }
}

internal record MirthInternalMessage
{
    [JsonPropertyName("messageId")]
    public long MessageId { get; init; }
    [JsonPropertyName("serverId")]
    public string? ServerId { get; init; }
    [JsonPropertyName("receivedDate")]
    public MirthDate? ReceivedDate { get; init; }
    [JsonPropertyName("processed")]
    public bool Processed { get; init; }
    [JsonPropertyName("connectorMessages")]
    public MirthConnectorMessagesWrapper? ConnectorMessages { get; init; }
}

internal record MirthConnectorMessagesWrapper
{
    [JsonPropertyName("entry")]
    [JsonConverter(typeof(SingleOrArrayConverter<MirthConnectorMessageEntry>))]
    public List<MirthConnectorMessageEntry>? Entry { get; init; }
}

/// <summary>
/// Handles Mirth's polymorphic JSON where a field is an object when there is a single item
/// and an array when there are multiple items.
/// </summary>
internal class SingleOrArrayConverter<T> : JsonConverter<List<T>?>
{
    public override List<T>? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.StartArray)
            return JsonSerializer.Deserialize<List<T>>(ref reader, options);

        if (reader.TokenType == JsonTokenType.StartObject)
        {
            var item = JsonSerializer.Deserialize<T>(ref reader, options);
            return item is null ? [] : [item];
        }

        return null;
    }

    public override void Write(Utf8JsonWriter writer, List<T>? value, JsonSerializerOptions options) =>
        JsonSerializer.Serialize(writer, value, options);
}

internal record MirthConnectorMessageEntry
{
    [JsonPropertyName("connectorMessage")]
    public MirthInternalConnectorMessage? ConnectorMessage { get; init; }
}

internal record MirthInternalConnectorMessage
{
    [JsonPropertyName("metaDataId")]
    public int MetaDataId { get; init; }
    [JsonPropertyName("connectorName")]
    public string? ConnectorName { get; init; }
    [JsonPropertyName("status")]
    public string Status { get; init; } = "";
    [JsonPropertyName("receivedDate")]
    public MirthDate? ReceivedDate { get; init; }
    [JsonPropertyName("responseDate")]
    public MirthDate? ResponseDate { get; init; }
    [JsonPropertyName("raw")]
    public MirthInternalContent? Raw { get; init; }
    [JsonPropertyName("encoded")]
    public MirthInternalContent? Encoded { get; init; }
    [JsonPropertyName("sent")]
    public MirthInternalContent? Sent { get; init; }
    [JsonPropertyName("response")]
    public MirthInternalContent? Response { get; init; }
    [JsonPropertyName("processingErrorContent")]
    public MirthInternalContent? ProcessingErrorContent { get; init; }
}

internal record MirthInternalContent
{
    [JsonPropertyName("contentType")]
    public string? ContentType { get; init; }
    [JsonPropertyName("content")]
    public string? Content { get; init; }
}

internal record MirthDate
{
    [JsonPropertyName("time")]
    public long Time { get; init; }
}
