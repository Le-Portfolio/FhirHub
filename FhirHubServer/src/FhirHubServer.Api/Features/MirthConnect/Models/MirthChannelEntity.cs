using System.Xml.Linq;
using FhirHubServer.Api.Features.MirthConnect.DTOs;

namespace FhirHubServer.Api.Features.MirthConnect.Models;

public class MirthChannelEntity
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public int Revision { get; set; }
    public string? ChannelXml { get; set; }

    private string? _description;
    private bool? _enabled;
    private MirthConnectorDto? _sourceConnector;
    private List<MirthConnectorDto>? _destinationConnectors;
    private bool _parsed;

    public string? Description
    {
        get
        {
            EnsureParsed();
            return _description;
        }
    }

    public bool Enabled
    {
        get
        {
            EnsureParsed();
            return _enabled ?? false;
        }
    }

    public MirthConnectorDto? SourceConnector
    {
        get
        {
            EnsureParsed();
            return _sourceConnector;
        }
    }

    public List<MirthConnectorDto> DestinationConnectors
    {
        get
        {
            EnsureParsed();
            return _destinationConnectors ?? [];
        }
    }

    private void EnsureParsed()
    {
        if (_parsed) return;
        _parsed = true;

        if (string.IsNullOrEmpty(ChannelXml)) return;

        try
        {
            var doc = XDocument.Parse(ChannelXml);
            _description = doc.Root?.Element("description")?.Value;
            var enabledStr = doc.Root?.Element("enabled")?.Value;
            _enabled = string.Equals(enabledStr, "true", StringComparison.OrdinalIgnoreCase);

            _sourceConnector = ParseSourceConnector(doc.Root?.Element("sourceConnector"));
            _destinationConnectors = ParseDestinationConnectors(doc.Root?.Element("destinationConnectors"));
        }
        catch
        {
            // If XML parsing fails, leave defaults
        }
    }

    private static MirthConnectorDto? ParseSourceConnector(XElement? el)
    {
        if (el is null) return null;

        var transportName = el.Element("transportName")?.Value ?? "";
        var connectorEnabled = string.Equals(el.Element("enabled")?.Value, "true", StringComparison.OrdinalIgnoreCase);
        var props = el.Element("properties");
        var transformer = el.Element("transformer");

        var listenerProps = props; // properties element itself contains host/port for listeners
        var host = listenerProps?.Element("listenerConnectorProperties")?.Element("host")?.Value
                   ?? props?.Element("host")?.Value;
        var port = listenerProps?.Element("listenerConnectorProperties")?.Element("port")?.Value
                   ?? props?.Element("port")?.Value;

        var properties = new MirthConnectorPropertiesDto(
            Host: host,
            Port: port,
            ContextPath: CleanPath(props?.Element("contextPath")?.Value),
            Method: null,
            Charset: props?.Element("charset")?.Value,
            Timeout: ParseInt(props?.Element("timeout")?.Value),
            ResponseContentType: props?.Element("responseContentType")?.Value,
            InboundDataType: transformer?.Element("inboundDataType")?.Value,
            OutboundDataType: transformer?.Element("outboundDataType")?.Value,
            QueueEnabled: null,
            RetryCount: null,
            RetryIntervalMs: null);

        return new MirthConnectorDto(
            MetaDataId: 0,
            Name: "Source",
            TransportName: transportName,
            Mode: "SOURCE",
            Enabled: connectorEnabled,
            Properties: properties);
    }

    private static List<MirthConnectorDto> ParseDestinationConnectors(XElement? container)
    {
        if (container is null) return [];

        var result = new List<MirthConnectorDto>();
        foreach (var el in container.Elements("connector"))
        {
            var metaDataId = ParseInt(el.Element("metaDataId")?.Value) ?? result.Count + 1;
            var name = el.Element("name")?.Value ?? $"Destination {metaDataId}";
            var transportName = el.Element("transportName")?.Value ?? "";
            var connectorEnabled = string.Equals(el.Element("enabled")?.Value, "true", StringComparison.OrdinalIgnoreCase);
            var props = el.Element("properties");
            var transformer = el.Element("transformer");
            var destProps = props?.Element("destinationConnectorProperties");

            var host = props?.Element("host")?.Value;
            var port = props?.Element("port")?.Value;
            var method = props?.Element("method")?.Value;

            bool? queueEnabled = null;
            if (destProps?.Element("queueEnabled")?.Value is string qe)
                queueEnabled = string.Equals(qe, "true", StringComparison.OrdinalIgnoreCase);

            var properties = new MirthConnectorPropertiesDto(
                Host: host,
                Port: port,
                ContextPath: null,
                Method: method,
                Charset: props?.Element("charset")?.Value,
                Timeout: ParseInt(props?.Element("socketTimeout")?.Value),
                ResponseContentType: null,
                InboundDataType: transformer?.Element("inboundDataType")?.Value,
                OutboundDataType: transformer?.Element("outboundDataType")?.Value,
                QueueEnabled: queueEnabled,
                RetryCount: ParseInt(destProps?.Element("retryCount")?.Value),
                RetryIntervalMs: ParseInt(destProps?.Element("retryIntervalMillis")?.Value));

            result.Add(new MirthConnectorDto(
                MetaDataId: metaDataId,
                Name: name,
                TransportName: transportName,
                Mode: "DESTINATION",
                Enabled: connectorEnabled,
                Properties: properties));
        }
        return result;
    }

    private static int? ParseInt(string? value)
    {
        if (int.TryParse(value, out var result)) return result;
        return null;
    }

    private static string? CleanPath(string? value)
    {
        if (value is null) return null;
        // Strip non-ASCII characters that may appear as encoding artifacts in Mirth XML
        var cleaned = new string(value.Where(c => c < 128).ToArray()).Trim();
        return cleaned.Length > 0 ? cleaned : null;
    }
}

public class ChannelIdMapping
{
    public string ChannelId { get; set; } = "";
    public int LocalChannelId { get; set; }
}
