using FhirHubServer.Api.Common.DependencyInjection;
using FhirHubServer.Api.Features.Hl7Ingestion.Handlers;
using NHapi.Base.Model;
using NHapi.Base.Util;

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
        var terser = new Terser(message);
        var messageType = terser.Get("/MSH-9-1") ?? "";
        var triggerEvent = terser.Get("/MSH-9-2") ?? "";

        return _handlers.FirstOrDefault(h => h.CanHandle(messageType, triggerEvent));
    }
}
