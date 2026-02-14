using FhirHubServer.Api.Common.DependencyInjection;
using FhirHubServer.Api.Features.Hl7Ingestion.Handlers;
using NHapi.Base.Model;
using NHapi.Model.V251.Segment;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Routing;

public class MessageRouter : IMessageRouter, IScopedService
{
    private readonly IEnumerable<IHl7MessageHandler> _handlers;

    public MessageRouter(IEnumerable<IHl7MessageHandler> handlers)
    {
        _handlers = handlers;
    }

    public IHl7MessageHandler? Route(IMessage message)
    {
        var msh = (MSH)message.GetStructure("MSH");
        var messageType = msh.MessageType.MessageCode.Value ?? "";
        var triggerEvent = msh.MessageType.TriggerEvent.Value ?? "";

        return _handlers.FirstOrDefault(h => h.CanHandle(messageType, triggerEvent));
    }
}
