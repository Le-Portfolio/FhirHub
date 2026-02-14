using Hl7.Fhir.Model;
using NHapi.Model.V251.Segment;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Converters;

public static class DiagnosticReportConverter
{
    public static DiagnosticReport FromObr(
        OBR obr,
        ResourceReference patientRef,
        IEnumerable<ResourceReference> observationRefs)
    {
        var report = new DiagnosticReport
        {
            Status = DiagnosticReport.DiagnosticReportStatus.Final,
            Subject = patientRef,
            Category = new List<CodeableConcept>
            {
                new()
                {
                    Coding = new List<Coding>
                    {
                        new()
                        {
                            System = "http://terminology.hl7.org/CodeSystem/v2-0074",
                            Code = "LAB",
                            Display = "Laboratory"
                        }
                    }
                }
            }
        };

        // Code from OBR-4 (Universal Service Identifier)
        var serviceId = obr.UniversalServiceIdentifier;
        if (serviceId != null)
        {
            report.Code = new CodeableConcept
            {
                Coding = new List<Coding>
                {
                    new()
                    {
                        System = MapCodingSystem(serviceId.NameOfCodingSystem?.Value),
                        Code = serviceId.Identifier?.Value,
                        Display = serviceId.Text?.Value
                    }
                }
            };
        }

        // Status from OBR-25 (Result Status)
        var resultStatus = obr.ResultStatus?.Value;
        report.Status = resultStatus?.ToUpperInvariant() switch
        {
            "F" => DiagnosticReport.DiagnosticReportStatus.Final,
            "P" => DiagnosticReport.DiagnosticReportStatus.Preliminary,
            "C" => DiagnosticReport.DiagnosticReportStatus.Corrected,
            "X" => DiagnosticReport.DiagnosticReportStatus.Cancelled,
            _ => DiagnosticReport.DiagnosticReportStatus.Final
        };

        // Issued from OBR-22 (Results Rpt/Status Change – Date/Time)
        var resultsDateTime = obr.ResultsRptStatusChngDateTime;
        if (!string.IsNullOrEmpty(resultsDateTime?.Time?.Value))
        {
            report.Issued = ParseHl7DateTimeOffset(resultsDateTime.Time.Value);
        }

        // Effective from OBR-7 (Observation Date/Time)
        var obsDateTime = obr.ObservationDateTime;
        if (!string.IsNullOrEmpty(obsDateTime?.Time?.Value))
        {
            report.Effective = new FhirDateTime(FormatHl7DateTime(obsDateTime.Time.Value));
        }

        // Observation references
        report.Result = observationRefs.ToList();

        return report;
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

    private static DateTimeOffset ParseHl7DateTimeOffset(string hl7DateTime)
    {
        if (hl7DateTime.Length >= 14)
        {
            return new DateTimeOffset(
                int.Parse(hl7DateTime[..4]),
                int.Parse(hl7DateTime[4..6]),
                int.Parse(hl7DateTime[6..8]),
                int.Parse(hl7DateTime[8..10]),
                int.Parse(hl7DateTime[10..12]),
                int.Parse(hl7DateTime[12..14]),
                TimeSpan.Zero);
        }

        if (hl7DateTime.Length >= 8)
        {
            return new DateTimeOffset(
                int.Parse(hl7DateTime[..4]),
                int.Parse(hl7DateTime[4..6]),
                int.Parse(hl7DateTime[6..8]),
                0, 0, 0,
                TimeSpan.Zero);
        }

        return DateTimeOffset.UtcNow;
    }

    private static string FormatHl7DateTime(string hl7DateTime)
    {
        if (hl7DateTime.Length >= 14)
            return $"{hl7DateTime[..4]}-{hl7DateTime[4..6]}-{hl7DateTime[6..8]}T{hl7DateTime[8..10]}:{hl7DateTime[10..12]}:{hl7DateTime[12..14]}+00:00";
        if (hl7DateTime.Length >= 8)
            return $"{hl7DateTime[..4]}-{hl7DateTime[4..6]}-{hl7DateTime[6..8]}";
        return hl7DateTime;
    }
}
