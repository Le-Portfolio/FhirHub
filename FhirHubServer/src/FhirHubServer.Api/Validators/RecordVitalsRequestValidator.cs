using FluentValidation;
using FhirHubServer.Core.DTOs.Clinical;

namespace FhirHubServer.Api.Validators;

public class RecordVitalsRequestValidator : AbstractValidator<RecordVitalsRequest>
{
    public RecordVitalsRequestValidator()
    {
        // At least one vital must be provided
        RuleFor(x => x)
            .Must(HasAtLeastOneVital)
            .WithMessage("At least one vital sign must be provided");

        // Systolic blood pressure
        RuleFor(x => x.Systolic)
            .Must(v => v!.Value >= ClinicalRanges.Systolic.Min && v!.Value <= ClinicalRanges.Systolic.Max)
            .When(x => x.Systolic.HasValue)
            .WithMessage($"Systolic blood pressure must be between {ClinicalRanges.Systolic.Min} and {ClinicalRanges.Systolic.Max} {ClinicalRanges.Systolic.Unit}");

        // Diastolic blood pressure
        RuleFor(x => x.Diastolic)
            .Must(v => v!.Value >= ClinicalRanges.Diastolic.Min && v!.Value <= ClinicalRanges.Diastolic.Max)
            .When(x => x.Diastolic.HasValue)
            .WithMessage($"Diastolic blood pressure must be between {ClinicalRanges.Diastolic.Min} and {ClinicalRanges.Diastolic.Max} {ClinicalRanges.Diastolic.Unit}");

        // Heart rate
        RuleFor(x => x.HeartRate)
            .Must(v => v!.Value >= ClinicalRanges.HeartRate.Min && v!.Value <= ClinicalRanges.HeartRate.Max)
            .When(x => x.HeartRate.HasValue)
            .WithMessage($"Heart rate must be between {ClinicalRanges.HeartRate.Min} and {ClinicalRanges.HeartRate.Max} {ClinicalRanges.HeartRate.Unit}");

        // Temperature
        RuleFor(x => x.Temperature)
            .Must(v => v!.Value >= ClinicalRanges.Temperature.Min && v!.Value <= ClinicalRanges.Temperature.Max)
            .When(x => x.Temperature.HasValue)
            .WithMessage($"Temperature must be between {ClinicalRanges.Temperature.Min} and {ClinicalRanges.Temperature.Max} {ClinicalRanges.Temperature.Unit}");

        // Respiratory rate
        RuleFor(x => x.RespiratoryRate)
            .Must(v => v!.Value >= ClinicalRanges.RespiratoryRate.Min && v!.Value <= ClinicalRanges.RespiratoryRate.Max)
            .When(x => x.RespiratoryRate.HasValue)
            .WithMessage($"Respiratory rate must be between {ClinicalRanges.RespiratoryRate.Min} and {ClinicalRanges.RespiratoryRate.Max} {ClinicalRanges.RespiratoryRate.Unit}");

        // Oxygen saturation
        RuleFor(x => x.OxygenSaturation)
            .Must(v => v!.Value >= ClinicalRanges.OxygenSaturation.Min && v!.Value <= ClinicalRanges.OxygenSaturation.Max)
            .When(x => x.OxygenSaturation.HasValue)
            .WithMessage($"Oxygen saturation must be between {ClinicalRanges.OxygenSaturation.Min} and {ClinicalRanges.OxygenSaturation.Max}%");

        // Weight
        RuleFor(x => x.Weight)
            .Must(v => v!.Value >= ClinicalRanges.Weight.Min && v!.Value <= ClinicalRanges.Weight.Max)
            .When(x => x.Weight.HasValue)
            .WithMessage($"Weight must be between {ClinicalRanges.Weight.Min} and {ClinicalRanges.Weight.Max} {ClinicalRanges.Weight.Unit}");
    }

    private static bool HasAtLeastOneVital(RecordVitalsRequest request)
    {
        return request.Systolic.HasValue ||
               request.Diastolic.HasValue ||
               request.HeartRate.HasValue ||
               request.Temperature.HasValue ||
               request.RespiratoryRate.HasValue ||
               request.OxygenSaturation.HasValue ||
               request.Weight.HasValue;
    }
}
