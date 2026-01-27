using FluentValidation;
using FhirHubServer.Core.DTOs.Clinical;

namespace FhirHubServer.Api.Validators;

public class CreateConditionRequestValidator : AbstractValidator<CreateConditionRequest>
{
    private static readonly string[] ValidSeverities = { "mild", "moderate", "severe" };
    private static readonly string[] ValidClinicalStatuses = { "active", "recurrence", "relapse", "remission" };

    public CreateConditionRequestValidator()
    {
        // Name is required
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Condition name is required")
            .Length(2, 200)
            .WithMessage("Condition name must be between 2 and 200 characters");

        // ICD code format (optional)
        When(x => !string.IsNullOrEmpty(x.IcdCode), () =>
        {
            RuleFor(x => x.IcdCode)
                .Matches(@"^[A-Z]\d{2}(\.\d{1,4})?$")
                .WithMessage("ICD-10 code must be in format like A00 or A00.0 (letter followed by 2 digits, optional decimal with up to 4 digits)");
        });

        // Onset date cannot be in the future
        When(x => !string.IsNullOrEmpty(x.OnsetDate), () =>
        {
            RuleFor(x => x.OnsetDate)
                .Must(BeValidPastOrPresentDate)
                .WithMessage("Onset date cannot be in the future");
        });

        // Severity must be valid
        RuleFor(x => x.Severity)
            .NotEmpty()
            .WithMessage("Severity is required")
            .Must(s => ValidSeverities.Contains(s.ToLowerInvariant()))
            .WithMessage($"Severity must be one of: {string.Join(", ", ValidSeverities)}");

        // Clinical status must be valid
        RuleFor(x => x.ClinicalStatus)
            .NotEmpty()
            .WithMessage("Clinical status is required")
            .Must(s => ValidClinicalStatuses.Contains(s.ToLowerInvariant()))
            .WithMessage($"Clinical status must be one of: {string.Join(", ", ValidClinicalStatuses)}");

        // Notes length (optional)
        When(x => !string.IsNullOrEmpty(x.Notes), () =>
        {
            RuleFor(x => x.Notes)
                .MaximumLength(2000)
                .WithMessage("Notes cannot exceed 2000 characters");
        });
    }

    private static bool BeValidPastOrPresentDate(string? dateString)
    {
        if (string.IsNullOrEmpty(dateString))
            return true;

        if (DateTime.TryParse(dateString, out var date))
        {
            return date.Date <= DateTime.Today;
        }
        return false;
    }
}
