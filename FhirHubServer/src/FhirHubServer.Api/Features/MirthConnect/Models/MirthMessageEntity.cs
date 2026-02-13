namespace FhirHubServer.Api.Features.MirthConnect.Models;

public class MirthMessageEntity
{
    public long Id { get; set; }
    public string? ServerId { get; set; }
    public DateTime ReceivedDate { get; set; }
    public bool Processed { get; set; }
}

public class MirthConnectorMetadataEntity
{
    public int MetadataId { get; set; }
    public long MessageId { get; set; }
    public string Status { get; set; } = "";
    public string? ConnectorName { get; set; }
    public DateTime ReceivedDate { get; set; }
    public DateTime? ResponseDate { get; set; }

    public string StatusString => Status switch
    {
        "R" => "RECEIVED",
        "S" => "SENT",
        "E" => "ERROR",
        "F" => "FILTERED",
        "Q" => "QUEUED",
        "T" => "TRANSFORMED",
        "P" => "PENDING",
        _ => Status
    };
}

public class MirthContentEntity
{
    public long MessageId { get; set; }
    public int MetadataId { get; set; }
    public int ContentType { get; set; }
    public string? Content { get; set; }
    public string? DataType { get; set; }

    /// <summary>
    /// Maps Mirth content_type integers:
    /// 1=RAW, 3=ENCODED, 4=SENT, 5=RESPONSE, 9=PROCESSING_ERROR
    /// </summary>
    public string ContentTypeName => ContentType switch
    {
        1 => "RAW",
        3 => "ENCODED",
        4 => "SENT",
        5 => "RESPONSE",
        9 => "PROCESSING_ERROR",
        _ => $"UNKNOWN({ContentType})"
    };
}
