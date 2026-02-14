using System.Text.RegularExpressions;
using FhirHubServer.Api.Common.DependencyInjection;
using NHapi.Base.Model;
using NHapi.Base.Parser;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Parsing;

public partial class Hl7Parser : IHl7Parser, IScopedService
{
    private readonly PipeParser _pipeParser = new();

    public IMessage Parse(string rawHl7)
    {
        // Normalize HL7 version to 2.5.1 so NHapi always creates V251 model types
        rawHl7 = VersionRegex().Replace(rawHl7, "${prefix}2.5.1${suffix}", 1);
        return _pipeParser.Parse(rawHl7);
    }

    // Matches MSH-12 (version field) in the first segment: 11 pipes from MSH start, then version value
    [GeneratedRegex(@"(?<prefix>^MSH\|[^|]*(?:\|[^|]*){9}\|)[\d.]+(?<suffix>\|)", RegexOptions.Multiline)]
    private static partial Regex VersionRegex();
}
