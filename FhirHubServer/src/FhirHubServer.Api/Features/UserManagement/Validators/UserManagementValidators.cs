using FluentValidation;
using FhirHubServer.Api.Features.UserManagement.DTOs;

namespace FhirHubServer.Api.Features.UserManagement.Validators;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    private static readonly string[] ValidRoles = ["admin", "practitioner", "nurse", "front_desk", "patient", "api_client"];

    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("A valid email address is required")
            .MaximumLength(254).WithMessage("Email must not exceed 254 characters");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters");

        RuleForEach(x => x.Roles)
            .Must(role => ValidRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Invalid role specified. Valid roles: " + string.Join(", ", ValidRoles));
    }
}

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters")
            .When(x => x.FirstName is not null);

        RuleFor(x => x.LastName)
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters")
            .When(x => x.LastName is not null);

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("A valid email address is required")
            .MaximumLength(254).WithMessage("Email must not exceed 254 characters")
            .When(x => x.Email is not null);
    }
}
