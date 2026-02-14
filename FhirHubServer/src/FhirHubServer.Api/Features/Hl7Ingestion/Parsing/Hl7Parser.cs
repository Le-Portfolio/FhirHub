using FhirHubServer.Api.Common.DependencyInjection;
using NHapi.Base.Model;
using NHapi.Base.Parser;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Parsing;

public class Hl7Parser : IHl7Parser, IScopedService
{
    private readonly PipeParser _pipeParser = new();

    public IMessage Parse(string rawHl7)
    {
        return _pipeParser.Parse(rawHl7);
    }
}
