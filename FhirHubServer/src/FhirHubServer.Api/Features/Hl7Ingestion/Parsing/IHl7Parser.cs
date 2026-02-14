using NHapi.Base.Model;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Parsing;

public interface IHl7Parser
{
    IMessage Parse(string rawHl7);
}
