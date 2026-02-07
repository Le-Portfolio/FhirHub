using FhirHubServer.Core.Services;

namespace FhirHubServer.Tests;

public class EnterpriseDashboardComposerTests
{
    [Fact]
    public void Compose_DefaultsTo7d_WhenWindowIsInvalid()
    {
        var seed = new DashboardOverviewSeed(
            PatientCount: 1200,
            AlertCount: 18,
            PendingResultsCount: 86,
            ObservationCount: 9200,
            AuditEventCount: 540,
            FhirResourceTypesServed: 10
        );

        var overview = EnterpriseDashboardComposer.Compose(seed, "unexpected");

        Assert.Equal("7d", overview.WindowLabel);
        Assert.NotEmpty(overview.SummaryKpis);
        Assert.Equal(4, overview.SummaryKpis.Count());
    }

    [Fact]
    public void Compose_ProducesBoundedSloMetrics()
    {
        var seed = new DashboardOverviewSeed(
            PatientCount: 3000,
            AlertCount: 40,
            PendingResultsCount: 310,
            ObservationCount: 22000,
            AuditEventCount: 1200,
            FhirResourceTypesServed: 12
        );

        var overview = EnterpriseDashboardComposer.Compose(seed, "30d");

        Assert.InRange(overview.PlatformSlo.ApiAvailabilityPercent30d, 98.5m, 99.99m);
        Assert.InRange(overview.PlatformSlo.ErrorRatePercent, 0.05m, 2.5m);
        Assert.True(overview.PlatformSlo.ApiLatencyP50Ms <= overview.PlatformSlo.ApiLatencyP95Ms);
        Assert.True(overview.PlatformSlo.ApiLatencyP95Ms <= overview.PlatformSlo.ApiLatencyP99Ms);
        Assert.InRange(overview.SecurityPosture.MfaEnrollmentPercent, 88m, 99.4m);
    }

    [Fact]
    public void Compose_AlwaysIncludesCoreSystemServices()
    {
        var seed = new DashboardOverviewSeed(
            PatientCount: 0,
            AlertCount: 0,
            PendingResultsCount: 0,
            ObservationCount: 0,
            AuditEventCount: 0,
            FhirResourceTypesServed: 10
        );

        var overview = EnterpriseDashboardComposer.Compose(seed, "24h");
        var serviceNames = overview.SystemStatus.Select(s => s.Name).ToHashSet();

        Assert.Contains("FHIR API", serviceNames);
        Assert.Contains("HAPI FHIR", serviceNames);
        Assert.Contains("Keycloak", serviceNames);
        Assert.Contains("PostgreSQL", serviceNames);
    }
}
