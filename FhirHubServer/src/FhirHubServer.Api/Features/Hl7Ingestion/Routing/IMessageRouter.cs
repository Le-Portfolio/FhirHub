using FhirHubServer.Api.Features.Hl7Ingestion.Handlers;
using NHapi.Base.Model;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Routing;

public interface IMessageRouter
{
    IHl7MessageHandler? Route(IMessage message);
}
