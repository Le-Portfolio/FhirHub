using FhirHubServer.Api.Infrastructure;
using FhirHubServer.Api.Mappers;
using FhirHubServer.Core.DTOs.Common;
using FhirHubServer.Core.DTOs.Dashboard;
using FhirHubServer.Core.Interfaces;
using Hl7.Fhir.Model;
using Hl7.Fhir.Rest;
using Task = System.Threading.Tasks.Task;

namespace FhirHubServer.Api.Repositories;

public class HapiFhirDashboardRepository : IDashboardRepository
{
    private readonly IFhirClientFactory _clientFactory;
    private readonly ILogger<HapiFhirDashboardRepository> _logger;

    public HapiFhirDashboardRepository(IFhirClientFactory clientFactory, ILogger<HapiFhirDashboardRepository> logger)
    {
        _clientFactory = clientFactory;
        _logger = logger;
    }

    public async Task<IEnumerable<DashboardMetricDto>> GetMetricsAsync(CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var metrics = new List<DashboardMetricDto>();

        try
        {
            // Total Patients
            var patientCount = await GetResourceCountAsync(client, "Patient", ct);
            metrics.Add(new DashboardMetricDto(
                Title: "Total Patients",
                Value: patientCount,
                Icon: "users",
                Trend: null // Would need historical data to calculate
            ));

            // Active Alerts (Flags count - status filter not supported by HAPI)
            var alertCount = await GetResourceCountAsync(client, "Flag", ct);
            metrics.Add(new DashboardMetricDto(
                Title: "Active Alerts",
                Value: alertCount,
                Icon: "alert-triangle",
                Trend: null
            ));

            // Pending Results (DiagnosticReports with preliminary status)
            var pendingCount = await GetResourceCountAsync(client, "DiagnosticReport", "status=preliminary,registered,partial", ct);
            metrics.Add(new DashboardMetricDto(
                Title: "Pending Results",
                Value: pendingCount,
                Icon: "flask",
                Trend: null
            ));

            // Recent Observations (today's count as proxy for activity)
            var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
            var todayObsCount = await GetResourceCountAsync(client, "Observation", $"date=ge{today}", ct);
            metrics.Add(new DashboardMetricDto(
                Title: "Today's Observations",
                Value: todayObsCount,
                Icon: "activity",
                Trend: null
            ));

            return metrics;
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching metrics");
            // Return empty metrics rather than failing
            return new List<DashboardMetricDto>
            {
                new("Total Patients", 0, "users", null),
                new("Active Alerts", 0, "alert-triangle", null),
                new("Pending Results", 0, "flask", null),
                new("Today's Observations", 0, "activity", null)
            };
        }
    }

    public async Task<IEnumerable<AlertDto>> GetAlertsAsync(int limit, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var alerts = new List<AlertDto>();

        try
        {
            // Get flags (status filter not available on Flag resource)
            var searchParams = new SearchParams()
                .OrderBy("-_lastUpdated")
                .LimitTo(limit);

            var bundle = await client.SearchAsync<Flag>(searchParams);

            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is Flag flag)
                    {
                        // Try to get patient name
                        string? patientName = null;
                        if (flag.Subject?.Reference != null)
                        {
                            patientName = await GetPatientNameAsync(client, flag.Subject.Reference, ct);
                        }

                        alerts.Add(FhirResourceMapper.ToAlertDto(flag, patientName));
                    }
                }
            }

            // If no flags exist, generate alerts from abnormal observations
            if (!alerts.Any())
            {
                alerts.AddRange(await GetAbnormalObservationAlertsAsync(client, limit, ct));
            }

            return alerts.Take(limit);
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching alerts");
            return Enumerable.Empty<AlertDto>();
        }
    }

    public async Task<IEnumerable<ActivityDto>> GetActivitiesAsync(int limit, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var activities = new List<ActivityDto>();

        try
        {
            // Try to get audit events first
            var auditParams = new SearchParams()
                .OrderBy("-date")
                .LimitTo(limit);

            try
            {
                var auditBundle = await client.SearchAsync<AuditEvent>(auditParams);
                if (auditBundle?.Entry != null)
                {
                    foreach (var entry in auditBundle.Entry)
                    {
                        if (entry.Resource is AuditEvent auditEvent)
                        {
                            activities.Add(FhirResourceMapper.ToActivityDto(auditEvent));
                        }
                    }
                }
            }
            catch (FhirOperationException)
            {
                // AuditEvent might not be supported, continue with synthetic activities
            }

            // If no audit events, create synthetic activities from recent resources
            if (!activities.Any())
            {
                activities.AddRange(await GetRecentResourceActivitiesAsync(client, limit, ct));
            }

            return activities.Take(limit);
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching activities");
            return Enumerable.Empty<ActivityDto>();
        }
    }

    public async Task AcknowledgeAlertAsync(string id, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();

        try
        {
            var flag = await client.ReadAsync<Flag>($"Flag/{id}");
            if (flag == null)
                throw new KeyNotFoundException($"Alert with id {id} not found");

            // Update flag status - HAPI FHIR Flag doesn't have "acknowledged" so we use inactive
            // but preserve the resource for history
            flag.Status = Flag.FlagStatus.Inactive;

            await client.UpdateAsync(flag);
        }
        catch (FhirOperationException ex) when (ex.Status == System.Net.HttpStatusCode.NotFound)
        {
            throw new KeyNotFoundException($"Alert with id {id} not found");
        }
    }

    public async Task ResolveAlertAsync(string id, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();

        try
        {
            var flag = await client.ReadAsync<Flag>($"Flag/{id}");
            if (flag == null)
                throw new KeyNotFoundException($"Alert with id {id} not found");

            // Set status to entered-in-error or inactive to mark as resolved
            flag.Status = Flag.FlagStatus.EnteredInError;

            await client.UpdateAsync(flag);
        }
        catch (FhirOperationException ex) when (ex.Status == System.Net.HttpStatusCode.NotFound)
        {
            throw new KeyNotFoundException($"Alert with id {id} not found");
        }
    }

    #region Paginated Queries

    public async Task<PaginatedResponse<AlertDto>> GetAlertsPaginatedAsync(AlertSearchParams searchParams, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();

        try
        {
            var fhirParams = new SearchParams()
                .OrderBy("-_lastUpdated")
                .LimitTo(searchParams.PageSize);

            var countParams = new SearchParams();
            countParams.Add("_summary", "count");
            var countBundle = await client.SearchAsync<Flag>(countParams);
            var total = countBundle?.Total ?? 0;

            var bundle = await client.SearchAsync<Flag>(fhirParams);

            if (searchParams.Page > 1)
            {
                for (int i = 1; i < searchParams.Page && bundle != null; i++)
                    bundle = await client.ContinueAsync(bundle);
            }

            var alerts = new List<AlertDto>();
            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is Flag flag)
                    {
                        string? patientName = null;
                        if (flag.Subject?.Reference != null)
                            patientName = await GetPatientNameAsync(client, flag.Subject.Reference, ct);

                        var alert = FhirResourceMapper.ToAlertDto(flag, patientName);

                        // Apply filters
                        if (!string.IsNullOrEmpty(searchParams.Priority) &&
                            !alert.Priority.Equals(searchParams.Priority, StringComparison.OrdinalIgnoreCase))
                            continue;
                        if (!string.IsNullOrEmpty(searchParams.Status) &&
                            !alert.Status.Equals(searchParams.Status, StringComparison.OrdinalIgnoreCase))
                            continue;
                        if (!string.IsNullOrEmpty(searchParams.PatientName) &&
                            !(patientName?.Contains(searchParams.PatientName, StringComparison.OrdinalIgnoreCase) ?? false))
                            continue;

                        alerts.Add(alert);
                    }
                }
            }

            // If no flags exist, generate alerts from abnormal observations
            if (!alerts.Any())
            {
                var obsAlerts = (await GetAbnormalObservationAlertsAsync(client, 50, ct)).ToList();

                // Apply filters
                foreach (var alert in obsAlerts)
                {
                    if (!string.IsNullOrEmpty(searchParams.Priority) &&
                        !alert.Priority.Equals(searchParams.Priority, StringComparison.OrdinalIgnoreCase))
                        continue;
                    if (!string.IsNullOrEmpty(searchParams.Status) &&
                        !alert.Status.Equals(searchParams.Status, StringComparison.OrdinalIgnoreCase))
                        continue;
                    if (!string.IsNullOrEmpty(searchParams.PatientName) &&
                        !(alert.PatientName?.Contains(searchParams.PatientName, StringComparison.OrdinalIgnoreCase) ?? false))
                        continue;
                    alerts.Add(alert);
                }

                total = alerts.Count;
            }

            var totalPages = total > 0 ? (int)Math.Ceiling(total / (double)searchParams.PageSize) : 1;
            return new PaginatedResponse<AlertDto>(alerts, total, searchParams.Page, searchParams.PageSize, totalPages);
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching paginated alerts");
            return new PaginatedResponse<AlertDto>(Enumerable.Empty<AlertDto>(), 0, searchParams.Page, searchParams.PageSize, 1);
        }
    }

    public async Task<PaginatedResponse<ActivityDto>> GetActivitiesPaginatedAsync(ActivitySearchParams searchParams, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();

        try
        {
            var allActivities = (await GetRecentResourceActivitiesAsync(client, 100, ct)).ToList();

            // Apply filters
            var filtered = allActivities.AsEnumerable();
            if (!string.IsNullOrEmpty(searchParams.Type))
                filtered = filtered.Where(a => a.Type.Equals(searchParams.Type, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(searchParams.ResourceType))
                filtered = filtered.Where(a => a.ResourceType.Equals(searchParams.ResourceType, StringComparison.OrdinalIgnoreCase));

            var filteredList = filtered.ToList();
            var total = filteredList.Count;
            var skip = (searchParams.Page - 1) * searchParams.PageSize;
            var paged = filteredList.Skip(skip).Take(searchParams.PageSize).ToList();

            var totalPages = total > 0 ? (int)Math.Ceiling(total / (double)searchParams.PageSize) : 1;
            return new PaginatedResponse<ActivityDto>(paged, total, searchParams.Page, searchParams.PageSize, totalPages);
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching paginated activities");
            return new PaginatedResponse<ActivityDto>(Enumerable.Empty<ActivityDto>(), 0, searchParams.Page, searchParams.PageSize, 1);
        }
    }

    #endregion

    #region Helper Methods

    private async Task<int> GetResourceCountAsync(FhirClient client, string resourceType, CancellationToken ct)
    {
        return await GetResourceCountAsync(client, resourceType, null, ct);
    }

    private async Task<int> GetResourceCountAsync(FhirClient client, string resourceType, string? additionalParams, CancellationToken ct)
    {
        try
        {
            var searchParams = new SearchParams();
            searchParams.Add("_summary", "count");

            if (!string.IsNullOrEmpty(additionalParams))
            {
                foreach (var param in additionalParams.Split('&'))
                {
                    var parts = param.Split('=');
                    if (parts.Length == 2)
                    {
                        searchParams.Add(parts[0], parts[1]);
                    }
                }
            }

            Bundle? bundle = resourceType switch
            {
                "Patient" => await client.SearchAsync<Patient>(searchParams),
                "Flag" => await client.SearchAsync<Flag>(searchParams),
                "DiagnosticReport" => await client.SearchAsync<DiagnosticReport>(searchParams),
                "Observation" => await client.SearchAsync<Observation>(searchParams),
                _ => null
            };

            return bundle?.Total ?? 0;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get count for {ResourceType}", resourceType);
            return 0;
        }
    }

    private async Task<string?> GetPatientNameAsync(FhirClient client, string reference, CancellationToken ct)
    {
        try
        {
            var patient = await client.ReadAsync<Patient>(reference);
            var name = patient?.Name.FirstOrDefault();
            if (name == null) return null;

            var given = string.Join(" ", name.Given ?? Enumerable.Empty<string>());
            return $"{given} {name.Family}".Trim();
        }
        catch
        {
            return null;
        }
    }

    private async Task<IEnumerable<AlertDto>> GetAbnormalObservationAlertsAsync(FhirClient client, int limit, CancellationToken ct)
    {
        var alerts = new List<AlertDto>();

        try
        {
            // Search for observations with abnormal interpretations
            var searchParams = new SearchParams()
                .OrderBy("-date")
                .LimitTo(50);

            var bundle = await client.SearchAsync<Observation>(searchParams);

            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is Observation obs &&
                        obs.Interpretation.Any(i => i.Coding.Any(c =>
                            c.Code == "H" || c.Code == "HH" ||
                            c.Code == "L" || c.Code == "LL" ||
                            c.Code == "A" || c.Code == "AA")))
                    {
                        var patientRef = (obs.Subject as ResourceReference)?.Reference;
                        string? patientName = null;
                        string? patientId = null;

                        if (!string.IsNullOrEmpty(patientRef))
                        {
                            patientId = patientRef.Replace("Patient/", "");
                            patientName = await GetPatientNameAsync(client, patientRef, ct);
                        }

                        var interpretation = obs.Interpretation.FirstOrDefault()?.Coding.FirstOrDefault();
                        var priority = interpretation?.Code switch
                        {
                            "HH" or "LL" or "AA" => "critical",
                            "H" or "L" or "A" => "high",
                            _ => "medium"
                        };

                        var obsName = obs.Code?.Text ?? obs.Code?.Coding.FirstOrDefault()?.Display ?? "Observation";
                        var value = obs.Value switch
                        {
                            Quantity q => $"{q.Value} {q.Unit}",
                            _ => "abnormal"
                        };

                        alerts.Add(new AlertDto(
                            Id: $"obs-alert-{obs.Id}",
                            Title: $"Abnormal {obsName}",
                            Description: $"Value: {value} ({interpretation?.Display ?? "abnormal"})",
                            Priority: priority,
                            Status: "active",
                            PatientId: patientId,
                            PatientName: patientName,
                            Timestamp: ExtractDateTime(obs)
                        ));

                        if (alerts.Count >= limit) break;
                    }
                }
            }
        }
        catch (FhirOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to fetch abnormal observations for alerts");
        }

        return alerts;
    }

    private async Task<IEnumerable<ActivityDto>> GetRecentResourceActivitiesAsync(FhirClient client, int limit, CancellationToken ct)
    {
        var activities = new List<ActivityDto>();

        try
        {
            // Get recent observations as activity
            var obsParams = new SearchParams()
                .OrderBy("-_lastUpdated")
                .LimitTo(limit / 2);

            var obsBundle = await client.SearchAsync<Observation>(obsParams);
            if (obsBundle?.Entry != null)
            {
                foreach (var entry in obsBundle.Entry)
                {
                    if (entry.Resource is Observation obs)
                    {
                        var patientRef = (obs.Subject as ResourceReference)?.Reference;
                        var patientName = !string.IsNullOrEmpty(patientRef)
                            ? await GetPatientNameAsync(client, patientRef, ct)
                            : null;

                        activities.Add(new ActivityDto(
                            Id: $"activity-obs-{obs.Id}",
                            Type: "create",
                            ResourceType: "Observation",
                            Description: $"{obs.Code?.Text ?? "Observation"} recorded{(patientName != null ? $" for {patientName}" : "")}",
                            User: "System",
                            Timestamp: obs.Meta?.LastUpdated?.ToString("o") ?? DateTime.UtcNow.ToString("o")
                        ));
                    }
                }
            }

            // Get recent encounters
            var encParams = new SearchParams()
                .OrderBy("-_lastUpdated")
                .LimitTo(limit / 2);

            var encBundle = await client.SearchAsync<Encounter>(encParams);
            if (encBundle?.Entry != null)
            {
                foreach (var entry in encBundle.Entry)
                {
                    if (entry.Resource is Encounter enc)
                    {
                        activities.Add(new ActivityDto(
                            Id: $"activity-enc-{enc.Id}",
                            Type: "create",
                            ResourceType: "Encounter",
                            Description: $"{enc.Type.FirstOrDefault()?.Text ?? "Encounter"} - {enc.Status}",
                            User: "System",
                            Timestamp: enc.Meta?.LastUpdated?.ToString("o") ?? DateTime.UtcNow.ToString("o")
                        ));
                    }
                }
            }
        }
        catch (FhirOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to fetch recent resources for activities");
        }

        return activities
            .OrderByDescending(a => a.Timestamp)
            .Take(limit);
    }

    private static string ExtractDateTime(Observation observation)
    {
        return observation.Effective switch
        {
            FhirDateTime dt => dt.Value ?? DateTime.UtcNow.ToString("o"),
            Period p => p.Start ?? DateTime.UtcNow.ToString("o"),
            _ => observation.Meta?.LastUpdated?.ToString("o") ?? DateTime.UtcNow.ToString("o")
        };
    }

    #endregion
}
