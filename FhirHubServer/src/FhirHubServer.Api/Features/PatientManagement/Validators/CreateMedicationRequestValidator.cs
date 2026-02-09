using FluentValidation;
using FhirHubServer.Api.Features.PatientManagement.DTOs;

namespace FhirHubServer.Api.Features.PatientManagement.Validators;

public class CreateMedicationRequestValidator : AbstractValidator<CreateMedicationRequest>
{
    private static readonly string[] ValidFrequencies = { "once", "daily", "bid", "tid", "qid", "prn", "weekly" };
    private static readonly string[] ValidRoutes = { "oral", "sublingual", "topical", "inhalation", "iv", "im", "sc", "rectal" };
    private static readonly string[] ValidUnits = { "mg", "mcg", "g", "ml", "units", "tablets", "capsules", "puffs" };

    public CreateMedicationRequestValidator()
    {
        // Name is required
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Medication name is required")
            .Length(2, 200)
            .WithMessage("Medication name must be between 2 and 200 characters");

        // Dosage must be positive if provided
        When(x => !string.IsNullOrEmpty(x.Dosage), () =>
        {
            RuleFor(x => x.Dosage)
                .Must(BePositiveNumber)
                .WithMessage("Dosage must be a positive number");
        });

        // Unit must be valid if provided
        When(x => !string.IsNullOrEmpty(x.Unit), () =>
        {
            RuleFor(x => x.Unit)
                .Must(u => ValidUnits.Contains(u!.ToLowerInvariant()))
                .WithMessage($"Unit must be one of: {string.Join(", ", ValidUnits)}");
        });

        // Route must be valid if provided
        When(x => !string.IsNullOrEmpty(x.Route), () =>
        {
            RuleFor(x => x.Route)
                .Must(r => ValidRoutes.Contains(r!.ToLowerInvariant()))
                .WithMessage($"Route must be one of: {string.Join(", ", ValidRoutes)}");
        });

        // Frequency is required and must be valid
        RuleFor(x => x.Frequency)
            .NotEmpty()
            .WithMessage("Frequency is required")
            .Must(f => ValidFrequencies.Contains(f.ToLowerInvariant()))
            .WithMessage($"Frequency must be one of: {string.Join(", ", ValidFrequencies)}");

        // Start date cannot be in the future
        When(x => !string.IsNullOrEmpty(x.StartDate), () =>
        {
            RuleFor(x => x.StartDate)
                .Must(BeValidPastOrPresentDate)
                .WithMessage("Start date cannot be in the future");
        });

        // Instructions length (optional)
        When(x => !string.IsNullOrEmpty(x.Instructions), () =>
        {
            RuleFor(x => x.Instructions)
                .MaximumLength(1000)
                .WithMessage("Instructions cannot exceed 1000 characters");
        });
    }

    private static bool BePositiveNumber(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return true;

        if (decimal.TryParse(value, out var num))
        {
            return num > 0;
        }
        return false;
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
