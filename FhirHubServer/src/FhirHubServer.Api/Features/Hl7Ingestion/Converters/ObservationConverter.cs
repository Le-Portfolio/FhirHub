using Hl7.Fhir.Model;
using NHapi.Model.V251.Segment;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Converters;

public static class ObservationConverter
{
    public static Observation FromObx(OBX obx, ResourceReference patientRef, ResourceReference? reportRef = null)
    {
        var observation = new Observation
        {
            Status = ObservationStatus.Final
        };

        // Code from OBX-3 (Observation Identifier)
        var obxIdentifier = obx.ObservationIdentifier;
        if (obxIdentifier != null)
        {
            observation.Code = new CodeableConcept
            {
                Coding = new List<Coding>
                {
                    new()
                    {
                        System = MapCodingSystem(obxIdentifier.NameOfCodingSystem?.Value),
                        Code = obxIdentifier.Identifier?.Value,
                        Display = obxIdentifier.Text?.Value
                    }
                }
            };
        }

        // Value from OBX-5 (Observation Value)
        var valueType = obx.ValueType?.Value;
        var observationValues = obx.GetObservationValue();
        if (observationValues.Length > 0)
        {
            var rawValue = observationValues[0].Data;
            if (valueType == "NM" && rawValue != null)
            {
                // Numeric value with units from OBX-6
                if (decimal.TryParse(rawValue.ToString(), out var numericValue))
                {
                    var units = obx.Units;
                    observation.Value = new Quantity
                    {
                        Value = numericValue,
                        Unit = units?.Text?.Value ?? units?.Identifier?.Value,
                        System = "http://unitsofmeasure.org",
                        Code = units?.Identifier?.Value
                    };
                }
            }
            else if (rawValue != null)
            {
                // String / coded value
                observation.Value = new FhirString(rawValue.ToString());
            }
        }

        // Status from OBX-11 (Observation Result Status)
        var resultStatus = obx.ObservationResultStatus?.Value;
        observation.Status = resultStatus?.ToUpperInvariant() switch
        {
            "F" => ObservationStatus.Final,
            "P" => ObservationStatus.Preliminary,
            "C" => ObservationStatus.Corrected,
            "X" => ObservationStatus.Cancelled,
            _ => ObservationStatus.Final
        };

        // Effective time from OBX-14 (Date/Time of the Observation)
        var obsDateTime = obx.DateTimeOfTheObservation;
        if (!string.IsNullOrEmpty(obsDateTime?.Time?.Value))
        {
            observation.Effective = new FhirDateTime(FormatHl7DateTime(obsDateTime.Time.Value));
        }

        // Subject reference
        observation.Subject = patientRef;

        return observation;
    }

    private static string MapCodingSystem(string? codingSystem)
    {
        return codingSystem?.ToUpperInvariant() switch
        {
            "LN" => "http://loinc.org",
            "SCT" => "http://snomed.info/sct",
            _ => $"http://terminology.hl7.org/CodeSystem/{codingSystem ?? "unknown"}"
        };
    }

    private static string FormatHl7DateTime(string hl7DateTime)
    {
        // Convert HL7 YYYYMMDD[HHmmss] to FHIR instant format
        if (hl7DateTime.Length >= 14)
            return $"{hl7DateTime[..4]}-{hl7DateTime[4..6]}-{hl7DateTime[6..8]}T{hl7DateTime[8..10]}:{hl7DateTime[10..12]}:{hl7DateTime[12..14]}+00:00";
        if (hl7DateTime.Length >= 8)
            return $"{hl7DateTime[..4]}-{hl7DateTime[4..6]}-{hl7DateTime[6..8]}";
        return hl7DateTime;
    }
}
