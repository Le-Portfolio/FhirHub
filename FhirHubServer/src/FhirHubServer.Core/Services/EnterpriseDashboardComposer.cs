using FhirHubServer.Core.DTOs.Dashboard;

namespace FhirHubServer.Core.Services;

public static class EnterpriseDashboardComposer
{
    public static DashboardOverviewDto Compose(DashboardOverviewSeed seed, string? window)
    {
        var normalizedWindow = NormalizeWindow(window);
        var windowMultiplier = normalizedWindow switch
        {
            "24h" => 1m,
            "30d" => 30m,
            _ => 7m
        };

        var highRiskPatients = Math.Max(1, (int)Math.Ceiling(seed.PatientCount * 0.12m));
        var pendingResultsRate = seed.PatientCount > 0
            ? (decimal)seed.PendingResultsCount / seed.PatientCount
            : 0m;

        var criticalLabP50 = Clamp(18m + pendingResultsRate * 45m, 10m, 90m);
        var criticalLabP95 = Clamp(criticalLabP50 * 1.9m, 20m, 180m);
        var alertAckP50 = Clamp(9m + (seed.AlertCount * 0.75m), 5m, 75m);
        var alertAckP95 = Clamp(alertAckP50 * 2.1m, 10m, 220m);

        var p50Latency = (int)Clamp(95m + seed.ObservationCount / 20m, 70m, 450m);
        var p95Latency = (int)Clamp(p50Latency * 1.85m, 120m, 850m);
        var p99Latency = (int)Clamp(p95Latency * 1.45m, 180m, 1200m);

        var availability = Clamp(99.92m - (seed.AlertCount * 0.015m), 98.5m, 99.99m);
        var errorRate = Clamp(0.18m + pendingResultsRate * 0.9m, 0.05m, 2.5m);

        var auditEvents = Math.Max(0, seed.AuditEventCount);
        var privilegedActions = Math.Max(3, auditEvents / 8 + seed.AlertCount / 2);
        var failedLogins = Math.Max(1, (int)Math.Ceiling(seed.AlertCount * 0.8m));
        var mfaEnrollment = Clamp(88m + (seed.PatientCount / 500m), 88m, 99.4m);
        var auditCoverage = Clamp(90m + (auditEvents / 80m), 90m, 99.8m);

        var smartLaunches = Math.Max(12, (int)Math.Ceiling(seed.PatientCount / 5m));
        var smartSuccessRate = Clamp(96.4m - (errorRate * 0.8m), 92m, 99.6m);
        var bulkExports = Math.Max(3, (int)Math.Ceiling(seed.PendingResultsCount / 15m));
        var bulkExportSuccess = Clamp(97.2m - (errorRate * 0.65m), 93m, 99.5m);

        var summaryKpis = new List<DashboardMetricDto>
        {
            new(
                "Total Active Patients",
                seed.PatientCount.ToString("N0"),
                "users",
                new TrendDto(
                    Value: Math.Round(1.4m * windowMultiplier, 1),
                    Label: $"vs previous {normalizedWindow}",
                    IsPositive: true
                )
            ),
            new(
                "Critical Alerts Open",
                seed.AlertCount,
                "alert-triangle",
                new TrendDto(
                    Value: Math.Round(seed.AlertCount > 0 ? Math.Min(12m, seed.AlertCount * 0.6m) : 0m, 1),
                    Label: $"in last {normalizedWindow}",
                    IsPositive: false
                )
            ),
            new(
                "Median API Latency",
                $"{p50Latency} ms",
                "activity",
                new TrendDto(
                    Value: Math.Round(Math.Min(8.5m, pendingResultsRate * 100m / 8m), 1),
                    Label: $"p95 {p95Latency} ms",
                    IsPositive: p95Latency <= 300
                )
            ),
            new(
                "Export SLA Success",
                $"{bulkExportSuccess:0.0}%",
                "filetext",
                new TrendDto(
                    Value: Math.Round(Math.Max(0.2m, bulkExportSuccess - 95m), 1),
                    Label: $"target 95% in {normalizedWindow}",
                    IsPositive: true
                )
            ),
        };

        return new DashboardOverviewDto(
            SummaryKpis: summaryKpis,
            ClinicalOperations: new ClinicalOperationsDto(
                CriticalLabTurnaroundMinutesP50: Math.Round(criticalLabP50, 1),
                CriticalLabTurnaroundMinutesP95: Math.Round(criticalLabP95, 1),
                AlertAcknowledgeMinutesP50: Math.Round(alertAckP50, 1),
                AlertAcknowledgeMinutesP95: Math.Round(alertAckP95, 1),
                HighRiskPatients: highRiskPatients,
                HighRiskTrend: new TrendDto(
                    Value: Math.Round(Math.Min(6.2m, highRiskPatients / 60m), 1),
                    Label: $"last {normalizedWindow}",
                    IsPositive: false
                )
            ),
            PlatformSlo: new PlatformSloDto(
                ApiAvailabilityPercent30d: Math.Round(availability, 2),
                ApiLatencyP50Ms: p50Latency,
                ApiLatencyP95Ms: p95Latency,
                ApiLatencyP99Ms: p99Latency,
                ErrorRatePercent: Math.Round(errorRate, 2),
                ExportSuccessRatePercent: Math.Round(bulkExportSuccess, 2)
            ),
            SecurityPosture: new SecurityPostureDto(
                MfaEnrollmentPercent: Math.Round(mfaEnrollment, 1),
                PrivilegedActions24h: privilegedActions,
                FailedLogins24h: failedLogins,
                AuditEvents24h: auditEvents,
                AuditCoveragePercent: Math.Round(auditCoverage, 1)
            ),
            Interoperability: new InteroperabilityStatusDto(
                SmartLaunches24h: smartLaunches,
                SmartLaunchSuccessRatePercent: Math.Round(smartSuccessRate, 1),
                BulkExports24h: bulkExports,
                BulkExportSuccessRatePercent: Math.Round(bulkExportSuccess, 1),
                FhirResourceTypesServed: seed.FhirResourceTypesServed
            ),
            SystemStatus: BuildSystemStatus(p50Latency, availability),
            WindowLabel: normalizedWindow,
            GeneratedAt: DateTime.UtcNow.ToString("o")
        );
    }

    private static IEnumerable<SystemServiceStatusDto> BuildSystemStatus(int p50Latency, decimal availability)
    {
        var degraded = p50Latency > 250;
        return
        [
            new("FHIR API", degraded ? "degraded" : "healthy", p50Latency, Math.Round(availability, 2)),
            new("HAPI FHIR", "healthy", Math.Max(40, p50Latency - 20), Math.Round(availability - 0.03m, 2)),
            new("Keycloak", "healthy", Math.Max(25, p50Latency - 35), Math.Round(availability - 0.05m, 2)),
            new("PostgreSQL", "healthy", Math.Max(12, p50Latency - 55), Math.Round(availability - 0.02m, 2)),
        ];
    }

    private static decimal Clamp(decimal value, decimal min, decimal max)
        => Math.Min(max, Math.Max(min, value));

    private static string NormalizeWindow(string? window)
    {
        return window?.ToLowerInvariant() switch
        {
            "24h" => "24h",
            "30d" => "30d",
            _ => "7d"
        };
    }
}

public record DashboardOverviewSeed(
    int PatientCount,
    int AlertCount,
    int PendingResultsCount,
    int ObservationCount,
    int AuditEventCount,
    int FhirResourceTypesServed
);
