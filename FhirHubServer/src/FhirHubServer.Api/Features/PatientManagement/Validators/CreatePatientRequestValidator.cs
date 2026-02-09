using FluentValidation;
using FhirHubServer.Api.Features.PatientManagement.DTOs;

namespace FhirHubServer.Api.Features.PatientManagement.Validators;

public class CreatePatientRequestValidator : AbstractValidator<CreatePatientRequest>
{
    private static readonly string[] ValidGenders = { "male", "female", "other", "unknown" };

    public CreatePatientRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty()
            .WithMessage("First name is required")
            .Length(1, 100)
            .WithMessage("First name must be between 1 and 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty()
            .WithMessage("Last name is required")
            .Length(1, 100)
            .WithMessage("Last name must be between 1 and 100 characters");

        RuleFor(x => x.BirthDate)
            .NotEmpty()
            .WithMessage("Birth date is required")
            .Must(BeValidPastDate)
            .WithMessage("Birth date must be a valid date in the past");

        RuleFor(x => x.Gender)
            .NotEmpty()
            .WithMessage("Gender is required")
            .Must(g => ValidGenders.Contains(g.ToLowerInvariant()))
            .WithMessage($"Gender must be one of: {string.Join(", ", ValidGenders)}");

        When(x => !string.IsNullOrEmpty(x.Phone), () =>
        {
            RuleFor(x => x.Phone)
                .MaximumLength(20)
                .WithMessage("Phone number cannot exceed 20 characters");
        });

        When(x => !string.IsNullOrEmpty(x.Email), () =>
        {
            RuleFor(x => x.Email)
                .EmailAddress()
                .WithMessage("Email must be a valid email address")
                .MaximumLength(254)
                .WithMessage("Email cannot exceed 254 characters");
        });
    }

    private static bool BeValidPastDate(string dateString)
    {
        if (string.IsNullOrEmpty(dateString))
            return false;

        if (DateTime.TryParse(dateString, out var date))
        {
            return date.Date <= DateTime.Today;
        }
        return false;
    }
}
