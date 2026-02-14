using FhirHubServer.Api.Features.Hl7Ingestion.Models;
using FhirHubServer.Api.Features.Hl7Ingestion.Parsing;
using FhirHubServer.Api.Features.Hl7Ingestion.Routing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Controllers;

[ApiController]
[Route("api/hl7")]
[AllowAnonymous]
public class Hl7Controller : ControllerBase
{
    private readonly IHl7Parser _parser;
    private readonly IMessageRouter _router;
    private readonly ILogger<Hl7Controller> _logger;

    public Hl7Controller(IHl7Parser parser, IMessageRouter router, ILogger<Hl7Controller> logger)
    {
        _parser = parser;
        _router = router;
        _logger = logger;
    }

    [HttpPost("ingest")]
    public async Task<IActionResult> Ingest(CancellationToken ct)
    {
        // Read raw HL7 body
        using var reader = new StreamReader(Request.Body);
        var rawHl7 = await reader.ReadToEndAsync(ct);

        if (string.IsNullOrWhiteSpace(rawHl7))
            return UnprocessableEntity(new IngestResult(false, "", "", [], "Empty HL7 message body"));

        // Parse
        NHapi.Base.Model.IMessage message;
        try
        {
            message = _parser.Parse(rawHl7);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse HL7 message");
            return UnprocessableEntity(new IngestResult(false, "", "", [], $"HL7 parse error: {ex.Message}"));
        }

        // Route to handler
        var handler = _router.Route(message);
        if (handler is null)
        {
            var msh = (NHapi.Model.V251.Segment.MSH)message.GetStructure("MSH");
            var msgType = $"{msh.MessageType.MessageCode.Value}^{msh.MessageType.TriggerEvent.Value}";
            _logger.LogWarning("No handler for message type {MessageType}", msgType);
            return BadRequest(new IngestResult(false, msh.MessageControlID.Value ?? "", msgType, [],
                $"Unsupported message type: {msgType}"));
        }

        // Handle
        try
        {
            var result = await handler.HandleAsync(message, ct);

            if (result.Success)
            {
                _logger.LogInformation(
                    "HL7 ingestion succeeded: MsgId={MessageControlId} Type={MessageType} Resources={ResourceCount}",
                    result.MessageControlId, result.MessageType, result.ResourcesCreated.Count);
            }
            else
            {
                _logger.LogWarning(
                    "HL7 ingestion failed: MsgId={MessageControlId} Type={MessageType} Error={Error}",
                    result.MessageControlId, result.MessageType, result.Error);
            }

            return result.Success ? Ok(result) : UnprocessableEntity(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "HL7 handler threw an exception");
            return UnprocessableEntity(new IngestResult(false, "", "", [], $"Processing error: {ex.Message}"));
        }
    }
}
