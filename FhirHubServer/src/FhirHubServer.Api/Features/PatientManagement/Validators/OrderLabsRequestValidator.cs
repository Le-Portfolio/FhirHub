using FluentValidation;
using FhirHubServer.Api.Features.PatientManagement.DTOs;

namespace FhirHubServer.Api.Features.PatientManagement.Validators;

public class OrderLabsRequestValidator : AbstractValidator<OrderLabsRequest>
{
    private static readonly string[] ValidPanelIds = { "cbc", "bmp", "cmp", "lipid", "tsh", "hba1c", "ua", "pt" };
    private static readonly string[] ValidPriorities = { "routine", "asap", "stat" };

    public OrderLabsRequestValidator()
    {
        // At least one panel is required
        RuleFor(x => x.PanelIds)
            .NotNull()
            .WithMessage("Panel IDs are required")
            .Must(ids => ids != null && ids.Any())
            .WithMessage("At least one lab panel must be selected");

        // All panel IDs must be valid
        RuleForEach(x => x.PanelIds)
            .Must(id => ValidPanelIds.Contains(id.ToLowerInvariant()))
            .WithMessage(id => $"Invalid panel ID: {id}. Valid panels: {string.Join(", ", ValidPanelIds)}");

        // Priority must be valid
        RuleFor(x => x.Priority)
            .NotEmpty()
            .WithMessage("Priority is required")
            .Must(p => ValidPriorities.Contains(p.ToLowerInvariant()))
            .WithMessage($"Priority must be one of: {string.Join(", ", ValidPriorities)}");

        // Notes length (optional)
        When(x => !string.IsNullOrEmpty(x.Notes), () =>
        {
            RuleFor(x => x.Notes)
                .MaximumLength(1000)
                .WithMessage("Notes cannot exceed 1000 characters");
        });
    }
}
