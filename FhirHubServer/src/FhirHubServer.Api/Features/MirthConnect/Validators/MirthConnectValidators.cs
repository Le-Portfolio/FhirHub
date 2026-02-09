using FluentValidation;
using FhirHubServer.Api.Features.MirthConnect.DTOs;

namespace FhirHubServer.Api.Features.MirthConnect.Validators;

public class CreateChannelRequestValidator : AbstractValidator<CreateChannelRequest>
{
    public CreateChannelRequestValidator()
    {
        RuleFor(x => x.ChannelXml)
            .NotEmpty().WithMessage("Channel XML is required")
            .Must(xml => xml.TrimStart().StartsWith("<"))
            .WithMessage("Channel XML must be valid XML");
    }
}

public class UpdateChannelRequestValidator : AbstractValidator<UpdateChannelRequest>
{
    public UpdateChannelRequestValidator()
    {
        RuleFor(x => x.ChannelXml)
            .NotEmpty().WithMessage("Channel XML is required")
            .Must(xml => xml.TrimStart().StartsWith("<"))
            .WithMessage("Channel XML must be valid XML");
    }
}

public class MirthMessageSearchParamsValidator : AbstractValidator<MirthMessageSearchParams>
{
    public MirthMessageSearchParamsValidator()
    {
        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 100)
            .WithMessage("Limit must be between 1 and 100");

        RuleFor(x => x.Offset)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Offset must be non-negative");

        RuleFor(x => x.Status)
            .Must(s => s is null or "RECEIVED" or "TRANSFORMED" or "FILTERED" or "SENT" or "QUEUED" or "ERROR")
            .WithMessage("Status must be one of: RECEIVED, TRANSFORMED, FILTERED, SENT, QUEUED, ERROR");
    }
}
