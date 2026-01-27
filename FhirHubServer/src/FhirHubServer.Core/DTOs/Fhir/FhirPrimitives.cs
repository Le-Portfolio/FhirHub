namespace FhirHubServer.Core.DTOs.Fhir;

public record CodingDto(
    string System,
    string Code,
    string Display
);

public record CodeableConceptDto(
    IEnumerable<CodingDto> Coding,
    string Text
);

public record QuantityDto(
    decimal Value,
    string Unit,
    string? System = null
);

public record ReferenceRangeDto(
    QuantityDto? Low,
    QuantityDto? High,
    string? Type = null
);

public record InterpretationDto(
    string? Code,
    string Display
);
