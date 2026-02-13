namespace FhirHubServer.Api.Features.MirthConnect.Models;

public class MirthStatisticsEntity
{
    public string ChannelId { get; set; } = "";
    public long Received { get; set; }
    public long Sent { get; set; }
    public long Error { get; set; }
    public long Filtered { get; set; }
    public long Queued { get; set; }
}
