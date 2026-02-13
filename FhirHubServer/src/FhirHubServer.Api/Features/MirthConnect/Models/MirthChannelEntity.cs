using System.Xml.Linq;

namespace FhirHubServer.Api.Features.MirthConnect.Models;

public class MirthChannelEntity
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public int Revision { get; set; }
    public string? ChannelXml { get; set; }

    private string? _description;
    private bool? _enabled;
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
        }
        catch
        {
            // If XML parsing fails, leave defaults
        }
    }
}

public class ChannelIdMapping
{
    public string ChannelId { get; set; } = "";
    public int LocalChannelId { get; set; }
}
