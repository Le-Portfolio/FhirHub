using FhirHubServer.Api.Common.DTOs;
using FhirHubServer.Api.Features.PatientManagement.DTOs;
using Hl7.Fhir.Model;

namespace FhirHubServer.Api.Common.Infrastructure;

public static class FhirResourceMapper
{
    #region Patient Mappings

    public static PatientListDto ToPatientListDto(Patient patient, int? alertCount = null, IEnumerable<string>? conditions = null)
    {
        var name = patient.Name.FirstOrDefault();
        var telecom = patient.Telecom;
        var address = patient.Address.FirstOrDefault();

        return new PatientListDto(
            Id: patient.Id,
            Name: FormatHumanName(name),
            BirthDate: patient.BirthDate ?? "",
            Gender: patient.Gender?.ToString().ToLowerInvariant() ?? "unknown",
            Mrn: GetIdentifierValue(patient.Identifier, "MR") ?? patient.Id,
            Phone: GetTelecomValue(telecom, ContactPoint.ContactPointSystem.Phone),
            Email: GetTelecomValue(telecom, ContactPoint.ContactPointSystem.Email),
            Address: FormatAddress(address),
            Status: patient.Active == true ? "active" : "inactive",
            AlertCount: alertCount,
            Conditions: conditions ?? Enumerable.Empty<string>()
        );
    }

    public static PatientDetailDto ToPatientDetailDto(
        Patient patient,
        int? alertCount = null,
        IEnumerable<string>? conditions = null,
        string? lastVisit = null,
        string? primaryPhysician = null)
    {
        var name = patient.Name.FirstOrDefault();
        var telecom = patient.Telecom;
        var address = patient.Address.FirstOrDefault();

        return new PatientDetailDto(
            Id: patient.Id,
            Name: FormatHumanName(name),
            BirthDate: patient.BirthDate ?? "",
            Gender: patient.Gender?.ToString().ToLowerInvariant() ?? "unknown",
            Mrn: GetIdentifierValue(patient.Identifier, "MR") ?? patient.Id,
            Phone: GetTelecomValue(telecom, ContactPoint.ContactPointSystem.Phone),
            Email: GetTelecomValue(telecom, ContactPoint.ContactPointSystem.Email),
            Address: FormatAddress(address),
            Status: patient.Active == true ? "active" : "inactive",
            AlertCount: alertCount,
            Conditions: conditions ?? Enumerable.Empty<string>(),
            LastVisit: lastVisit,
            PrimaryPhysician: primaryPhysician
        );
    }

    public static PatientSummaryDto ToPatientSummaryDto(Patient patient, int? alertCount = null)
    {
        var name = patient.Name.FirstOrDefault();

        return new PatientSummaryDto(
            Id: patient.Id,
            Name: FormatHumanName(name),
            BirthDate: patient.BirthDate ?? "",
            Gender: patient.Gender?.ToString().ToLowerInvariant() ?? "unknown",
            Mrn: GetIdentifierValue(patient.Identifier, "MR") ?? patient.Id,
            AlertCount: alertCount
        );
    }

    #endregion

    #region Vital Signs Mappings

    public static VitalSignDto ToVitalSignDto(Observation observation)
    {
        var code = ToCodeableConceptDto(observation.Code);
        var (value, unit) = ExtractValueAndUnit(observation);
        var effectiveDateTime = ExtractEffectiveDateTime(observation);

        return new VitalSignDto(
            Id: observation.Id,
            Code: code,
            Value: value,
            Unit: unit,
            EffectiveDateTime: effectiveDateTime,
            ReferenceRange: observation.ReferenceRange.FirstOrDefault() is { } range
                ? ToReferenceRangeDto(range)
                : null,
            Interpretation: observation.Interpretation.FirstOrDefault() is { } interp
                ? ToInterpretationDto(interp)
                : null,
            Type: DetermineVitalType(observation.Code),
            Date: effectiveDateTime.Split('T').FirstOrDefault() ?? effectiveDateTime,
            Status: observation.Status?.ToString().ToLowerInvariant() ?? "unknown"
        );
    }

    public static VitalChartDataDto ToVitalChartDataDto(string date, IEnumerable<Observation> observations)
    {
        decimal? systolic = null, diastolic = null, heartRate = null, temperature = null;
        decimal? respiratoryRate = null, oxygenSaturation = null, weight = null, height = null;

        foreach (var obs in observations)
        {
            var loincCode = obs.Code.Coding.FirstOrDefault(c => c.System == "http://loinc.org")?.Code;

            switch (loincCode)
            {
                case "8480-6": // Systolic BP
                    systolic = ExtractDecimalValue(obs);
                    break;
                case "8462-4": // Diastolic BP
                    diastolic = ExtractDecimalValue(obs);
                    break;
                case "85354-9": // Blood pressure panel
                    var components = obs.Component;
                    systolic = GetComponentValue(components, "8480-6");
                    diastolic = GetComponentValue(components, "8462-4");
                    break;
                case "8867-4": // Heart rate
                    heartRate = ExtractDecimalValue(obs);
                    break;
                case "8310-5": // Body temperature
                    temperature = ExtractDecimalValue(obs);
                    break;
                case "9279-1": // Respiratory rate
                    respiratoryRate = ExtractDecimalValue(obs);
                    break;
                case "2708-6": // Oxygen saturation
                case "59408-5": // Oxygen saturation (pulse ox)
                    oxygenSaturation = ExtractDecimalValue(obs);
                    break;
                case "29463-7": // Body weight
                    weight = ExtractDecimalValue(obs);
                    break;
                case "8302-2": // Body height
                    height = ExtractDecimalValue(obs);
                    break;
            }
        }

        return new VitalChartDataDto(
            Date: date,
            Systolic: systolic,
            Diastolic: diastolic,
            HeartRate: heartRate,
            Temperature: temperature,
            RespiratoryRate: respiratoryRate,
            OxygenSaturation: oxygenSaturation,
            Weight: weight,
            Height: height
        );
    }

    #endregion

    #region Condition Mappings

    public static ConditionDto ToConditionDto(Condition condition)
    {
        var code = condition.Code.Coding.FirstOrDefault();

        return new ConditionDto(
            Id: condition.Id,
            Name: condition.Code.Text ?? code?.Display ?? "Unknown Condition",
            Code: code?.Code ?? "",
            Status: condition.ClinicalStatus?.Coding.FirstOrDefault()?.Code ?? "unknown",
            Onset: ExtractOnsetDate(condition),
            Abatement: ExtractAbatementDate(condition),
            Severity: condition.Severity?.Coding.FirstOrDefault()?.Display ?? "unknown",
            Notes: condition.Note.FirstOrDefault()?.Text
        );
    }

    #endregion

    #region Medication Mappings

    public static MedicationDto ToMedicationDto(MedicationRequest request, string? medicationName = null)
    {
        var dosage = request.DosageInstruction.FirstOrDefault();
        var timing = dosage?.Timing;

        return new MedicationDto(
            Id: request.Id,
            Name: medicationName ?? ExtractMedicationName(request),
            Dosage: dosage?.DoseAndRate.FirstOrDefault()?.Dose switch
            {
                Quantity q => $"{q.Value} {q.Unit}",
                _ => ""
            },
            Frequency: FormatTiming(timing),
            Prescriber: ExtractRequesterName(request),
            Status: request.Status?.ToString().ToLowerInvariant() ?? "unknown",
            StartDate: ExtractAuthoredOn(request),
            EndDate: ExtractDispenseValidityEnd(request),
            Instructions: dosage?.PatientInstruction,
            Reason: request.ReasonCode.FirstOrDefault()?.Text
        );
    }

    #endregion

    #region Lab Results Mappings

    public static LabResultDto ToLabResultDto(Observation observation)
    {
        var code = ToCodeableConceptDto(observation.Code);
        var valueQuantity = observation.Value is Quantity q ? ToQuantityDto(q) : null;
        var effectiveDateTime = ExtractEffectiveDateTime(observation);

        return new LabResultDto(
            Id: observation.Id,
            Code: code,
            ValueQuantity: valueQuantity,
            ValueString: observation.Value is FhirString s ? s.Value : null,
            ReferenceRange: observation.ReferenceRange.FirstOrDefault() is { } range
                ? ToReferenceRangeDto(range)
                : null,
            Interpretation: observation.Interpretation.FirstOrDefault() is { } interp
                ? ToInterpretationDto(interp)
                : null,
            EffectiveDateTime: effectiveDateTime,
            Status: observation.Status?.ToString().ToLowerInvariant() ?? "unknown",
            // Legacy fields for frontend compatibility
            TestName: code.Text ?? code.Coding.FirstOrDefault()?.Display ?? "Unknown Test",
            Value: valueQuantity?.Value ?? 0,
            Unit: valueQuantity?.Unit ?? "",
            Date: effectiveDateTime.Split('T').FirstOrDefault() ?? ""
        );
    }

    public static LabPanelDto ToLabPanelDto(DiagnosticReport report, IEnumerable<LabResultDto> results)
    {
        return new LabPanelDto(
            Id: report.Id,
            Name: report.Code.Text ?? report.Code.Coding.FirstOrDefault()?.Display ?? "Unknown Panel",
            Date: ExtractReportDate(report),
            Status: report.Status?.ToString().ToLowerInvariant() ?? "unknown",
            Results: results
        );
    }

    #endregion

    #region Timeline Mappings

    public static TimelineEventDto ToTimelineEventDto(Encounter encounter)
    {
        return new TimelineEventDto(
            Id: encounter.Id,
            ResourceType: "Encounter",
            Title: encounter.Type.FirstOrDefault()?.Text ?? "Visit",
            Description: encounter.ReasonCode.FirstOrDefault()?.Text ?? "",
            Date: ExtractEncounterDate(encounter),
            Status: encounter.Status?.ToString().ToLowerInvariant() ?? "unknown",
            Details: new Dictionary<string, string>
            {
                { "type", encounter.Class?.Display ?? encounter.Class?.Code ?? "" },
                { "location", encounter.Location.FirstOrDefault()?.Location?.Display ?? "" }
            }
        );
    }

    public static TimelineEventDto ToTimelineEventDto(DiagnosticReport report)
    {
        return new TimelineEventDto(
            Id: report.Id,
            ResourceType: "DiagnosticReport",
            Title: "Lab Results Available",
            Description: report.Code.Text ?? report.Code.Coding.FirstOrDefault()?.Display ?? "",
            Date: ExtractReportDate(report),
            Status: report.Status?.ToString().ToLowerInvariant() ?? "unknown",
            Details: new Dictionary<string, string>
            {
                { "panels", report.Code.Text ?? "" }
            }
        );
    }

    public static TimelineEventDto ToTimelineEventDto(MedicationRequest request, string? medicationName = null)
    {
        return new TimelineEventDto(
            Id: request.Id,
            ResourceType: "MedicationRequest",
            Title: "Medication Prescribed",
            Description: $"{medicationName ?? ExtractMedicationName(request)} prescribed",
            Date: ExtractAuthoredOn(request),
            Status: request.Status?.ToString().ToLowerInvariant() ?? "unknown",
            Details: new Dictionary<string, string>
            {
                { "medication", medicationName ?? ExtractMedicationName(request) },
                { "prescriber", ExtractRequesterName(request) }
            }
        );
    }

    #endregion

    #region Cross-Patient List Mappings

    public static ObservationListDto ToObservationListDto(Observation observation, string patientName)
    {
        var (value, unit) = ExtractValueAndUnit(observation);
        var effectiveDateTime = ExtractEffectiveDateTime(observation);
        var interpretation = observation.Interpretation.FirstOrDefault()?.Coding.FirstOrDefault();

        return new ObservationListDto(
            Id: observation.Id,
            PatientId: (observation.Subject as ResourceReference)?.Reference?.Replace("Patient/", ""),
            PatientName: patientName,
            Type: observation.Code?.Text ?? observation.Code?.Coding.FirstOrDefault()?.Display ?? "Unknown",
            Value: value?.ToString() ?? "",
            Unit: unit,
            Date: effectiveDateTime.Split('T').FirstOrDefault() ?? effectiveDateTime,
            Status: observation.Status?.ToString().ToLowerInvariant() ?? "unknown",
            Interpretation: interpretation?.Display
        );
    }

    public static ConditionListDto ToConditionListDto(Condition condition, string? patientId, string patientName)
    {
        var code = condition.Code.Coding.FirstOrDefault();

        return new ConditionListDto(
            Id: condition.Id,
            PatientId: patientId,
            PatientName: patientName,
            Name: condition.Code.Text ?? code?.Display ?? "Unknown Condition",
            Code: code?.Code ?? "",
            Status: condition.ClinicalStatus?.Coding.FirstOrDefault()?.Code ?? "unknown",
            Onset: ExtractOnsetDate(condition),
            Severity: condition.Severity?.Coding.FirstOrDefault()?.Display ?? "unknown"
        );
    }

    public static MedicationListDto ToMedicationListDto(MedicationRequest request, string? patientId, string patientName)
    {
        var dosage = request.DosageInstruction.FirstOrDefault();

        return new MedicationListDto(
            Id: request.Id,
            PatientId: patientId,
            PatientName: patientName,
            Name: ExtractMedicationName(request),
            Dosage: dosage?.DoseAndRate.FirstOrDefault()?.Dose switch
            {
                Quantity q => $"{q.Value} {q.Unit}",
                _ => ""
            },
            Frequency: FormatTiming(dosage?.Timing),
            Status: request.Status?.ToString().ToLowerInvariant() ?? "unknown",
            StartDate: ExtractAuthoredOn(request)
        );
    }

    #endregion

    #region Helper Methods

    private static string FormatHumanName(HumanName? name)
    {
        if (name == null) return "Unknown";
        var given = string.Join(" ", name.Given ?? Enumerable.Empty<string>());
        var family = name.Family ?? "";
        return string.IsNullOrEmpty(given) ? family : $"{given} {family}".Trim();
    }

    private static string? GetIdentifierValue(IEnumerable<Identifier> identifiers, string type)
    {
        return identifiers
            .FirstOrDefault(i => i.Type?.Coding.Any(c => c.Code == type) == true)
            ?.Value;
    }

    private static string? GetTelecomValue(IEnumerable<ContactPoint> telecom, ContactPoint.ContactPointSystem system)
    {
        return telecom.FirstOrDefault(t => t.System == system)?.Value;
    }

    private static string? FormatAddress(Address? address)
    {
        if (address == null) return null;
        var parts = new List<string>();
        if (address.Line.Any()) parts.Add(string.Join(", ", address.Line));
        if (!string.IsNullOrEmpty(address.City)) parts.Add(address.City);
        if (!string.IsNullOrEmpty(address.State)) parts.Add(address.State);
        if (!string.IsNullOrEmpty(address.PostalCode)) parts.Add(address.PostalCode);
        return parts.Any() ? string.Join(", ", parts) : null;
    }

    private static CodeableConceptDto ToCodeableConceptDto(CodeableConcept? concept)
    {
        if (concept == null)
            return new CodeableConceptDto(Enumerable.Empty<CodingDto>(), "");

        return new CodeableConceptDto(
            Coding: concept.Coding.Select(c => new CodingDto(
                System: c.System ?? "",
                Code: c.Code ?? "",
                Display: c.Display ?? ""
            )),
            Text: concept.Text ?? concept.Coding.FirstOrDefault()?.Display ?? ""
        );
    }

    private static QuantityDto ToQuantityDto(Quantity quantity)
    {
        return new QuantityDto(
            Value: quantity.Value ?? 0,
            Unit: quantity.Unit ?? "",
            System: quantity.System
        );
    }

    private static ReferenceRangeDto ToReferenceRangeDto(Observation.ReferenceRangeComponent range)
    {
        return new ReferenceRangeDto(
            Low: range.Low != null ? ToQuantityDto(range.Low) : null,
            High: range.High != null ? ToQuantityDto(range.High) : null,
            Type: range.Type?.Text
        );
    }

    private static InterpretationDto ToInterpretationDto(CodeableConcept interpretation)
    {
        var coding = interpretation.Coding.FirstOrDefault();
        return new InterpretationDto(
            Code: coding?.Code,
            Display: coding?.Display ?? interpretation.Text ?? ""
        );
    }

    private static (object value, string unit) ExtractValueAndUnit(Observation observation)
    {
        return observation.Value switch
        {
            Quantity q => (q.Value ?? 0, q.Unit ?? ""),
            FhirString s => (s.Value ?? "", ""),
            CodeableConcept c => (c.Text ?? c.Coding.FirstOrDefault()?.Display ?? "", ""),
            _ => ExtractBloodPressureValue(observation)
        };
    }

    private static (object value, string unit) ExtractBloodPressureValue(Observation observation)
    {
        // Handle blood pressure panel with components
        if (observation.Component.Any())
        {
            var systolic = GetComponentValue(observation.Component, "8480-6");
            var diastolic = GetComponentValue(observation.Component, "8462-4");
            if (systolic.HasValue && diastolic.HasValue)
            {
                return ($"{systolic:0}/{diastolic:0}", "mmHg");
            }
        }
        return ("", "");
    }

    private static decimal? GetComponentValue(IEnumerable<Observation.ComponentComponent> components, string loincCode)
    {
        var component = components.FirstOrDefault(c =>
            c.Code.Coding.Any(coding => coding.Code == loincCode));
        return (component?.Value as Quantity)?.Value;
    }

    private static decimal? ExtractDecimalValue(Observation observation)
    {
        return (observation.Value as Quantity)?.Value;
    }

    private static string ExtractEffectiveDateTime(Observation observation)
    {
        return observation.Effective switch
        {
            FhirDateTime dt => dt.Value ?? "",
            Period p => p.Start ?? "",
            _ => ""
        };
    }

    private static string DetermineVitalType(CodeableConcept code)
    {
        var loincCode = code.Coding.FirstOrDefault(c => c.System == "http://loinc.org")?.Code;
        return loincCode switch
        {
            "85354-9" => "blood-pressure",
            "8480-6" => "blood-pressure",
            "8462-4" => "blood-pressure",
            "8867-4" => "heart-rate",
            "8310-5" => "temperature",
            "9279-1" => "respiratory-rate",
            "2708-6" => "oxygen-saturation",
            "59408-5" => "oxygen-saturation",
            "29463-7" => "weight",
            "8302-2" => "height",
            _ => "unknown"
        };
    }

    private static string ExtractOnsetDate(Condition condition)
    {
        return condition.Onset switch
        {
            FhirDateTime dt => dt.Value ?? "",
            Period p => p.Start ?? "",
            Age a => $"Age {a.Value}",
            _ => ""
        };
    }

    private static string? ExtractAbatementDate(Condition condition)
    {
        return condition.Abatement switch
        {
            FhirDateTime dt => dt.Value,
            Period p => p.End,
            _ => null
        };
    }

    private static string ExtractMedicationName(MedicationRequest request)
    {
        return request.Medication switch
        {
            CodeableConcept c => c.Text ?? c.Coding.FirstOrDefault()?.Display ?? "",
            ResourceReference r => r.Display ?? "",
            _ => ""
        };
    }

    private static string FormatTiming(Timing? timing)
    {
        if (timing?.Repeat == null) return "";

        var repeat = timing.Repeat;
        if (repeat.Frequency.HasValue && repeat.Period.HasValue)
        {
            var freq = repeat.Frequency.Value;
            var period = repeat.Period.Value;
            var unit = repeat.PeriodUnit?.ToString().ToLowerInvariant() ?? "";

            if (freq == 1 && period == 1)
                return $"Once {unit}ly";
            if (freq == 2 && period == 1 && unit == "d")
                return "Twice daily";

            return $"{freq} times per {period} {unit}";
        }

        return timing.Code?.Text ?? "";
    }

    private static string ExtractRequesterName(MedicationRequest request)
    {
        return request.Requester?.Display ?? "";
    }

    private static string ExtractAuthoredOn(MedicationRequest request)
    {
        return request.AuthoredOn ?? "";
    }

    private static string? ExtractDispenseValidityEnd(MedicationRequest request)
    {
        return request.DispenseRequest?.ValidityPeriod?.End;
    }

    private static string ExtractReportDate(DiagnosticReport report)
    {
        return report.Effective switch
        {
            FhirDateTime dt => dt.Value ?? "",
            Period p => p.Start ?? "",
            _ => report.Issued?.ToString("o") ?? ""
        };
    }

    private static string ExtractEncounterDate(Encounter encounter)
    {
        return encounter.Period?.Start ?? "";
    }

    #endregion
}
