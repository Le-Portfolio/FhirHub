using System.Collections.Concurrent;
using FhirHubServer.Api.Common.DependencyInjection;
using FhirHubServer.Api.Common.Infrastructure;
using FhirHubServer.Api.Features.BulkExport.DTOs;
using Hl7.Fhir.Model;
using Hl7.Fhir.Rest;
using Hl7.Fhir.Serialization;
using Task = System.Threading.Tasks.Task;

namespace FhirHubServer.Api.Features.BulkExport.Repositories;

public class HapiFhirExportRepository : IExportRepository, IScopedService
{
    private readonly IFhirClientFactory _clientFactory;
    private readonly ILogger<HapiFhirExportRepository> _logger;

    // In-memory storage for export jobs (in production, use a persistent store)
    private static readonly ConcurrentDictionary<string, ExportJobState> _jobs = new();

    private static readonly string[] SupportedResourceTypes =
    [
        "Patient", "Observation", "Condition", "MedicationRequest",
        "DiagnosticReport", "Encounter", "Procedure", "Immunization",
        "AllergyIntolerance", "DocumentReference"
    ];

    public HapiFhirExportRepository(IFhirClientFactory clientFactory, ILogger<HapiFhirExportRepository> logger)
    {
        _clientFactory = clientFactory;
        _logger = logger;
    }

    public Task<IEnumerable<ExportJobDto>> GetJobsAsync(CancellationToken ct = default)
    {
        var jobs = _jobs.Values
            .Select(ToDto)
            .OrderByDescending(j => j.CreatedAt)
            .ToList();

        return Task.FromResult<IEnumerable<ExportJobDto>>(jobs);
    }

    public Task<ExportJobDto?> GetJobAsync(string id, CancellationToken ct = default)
    {
        if (_jobs.TryGetValue(id, out var job))
        {
            return Task.FromResult<ExportJobDto?>(ToDto(job));
        }
        return Task.FromResult<ExportJobDto?>(null);
    }

    public async Task<ExportJobDto> CreateJobAsync(ExportConfigDto config, CancellationToken ct = default)
    {
        var jobId = $"export-{Guid.NewGuid():N}";
        var job = new ExportJobState
        {
            Id = jobId,
            Status = "pending",
            ResourceTypes = config.ResourceTypes.ToList(),
            Format = config.Format,
            IncludeReferences = config.IncludeReferences,
            DateRange = config.DateRange,
            CreatedAt = DateTime.UtcNow,
            Progress = 0
        };

        _jobs[jobId] = job;

        // Start export in background
        _ = Task.Run(() => ProcessExportAsync(jobId, ct), ct);

        return ToDto(job);
    }

    public Task CancelJobAsync(string id, CancellationToken ct = default)
    {
        if (!_jobs.TryGetValue(id, out var job))
            throw new KeyNotFoundException($"Export job with id {id} not found");

        if (job.Status is "completed" or "failed" or "cancelled")
            throw new InvalidOperationException($"Cannot cancel job with status {job.Status}");

        job.Status = "cancelled";
        job.CancellationRequested = true;

        return Task.CompletedTask;
    }

    public Task DeleteJobAsync(string id, CancellationToken ct = default)
    {
        if (!_jobs.TryRemove(id, out _))
            throw new KeyNotFoundException($"Export job with id {id} not found");

        // Clean up any associated files
        var exportDir = Path.Combine(Path.GetTempPath(), "fhirhub-exports", id);
        if (Directory.Exists(exportDir))
        {
            try
            {
                Directory.Delete(exportDir, recursive: true);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete export directory for job {JobId}", id);
            }
        }

        return Task.CompletedTask;
    }

    public Task<ExportJobDto> RetryJobAsync(string id, CancellationToken ct = default)
    {
        if (!_jobs.TryGetValue(id, out var job))
            throw new KeyNotFoundException($"Export job with id {id} not found");

        if (job.Status != "failed")
            throw new InvalidOperationException($"Can only retry failed jobs, current status: {job.Status}");

        // Create a new job based on the failed one
        var newJobId = $"export-{Guid.NewGuid():N}";
        var newJob = new ExportJobState
        {
            Id = newJobId,
            Status = "pending",
            ResourceTypes = job.ResourceTypes,
            Format = job.Format,
            IncludeReferences = job.IncludeReferences,
            DateRange = job.DateRange,
            CreatedAt = DateTime.UtcNow,
            Progress = 0
        };

        _jobs[newJobId] = newJob;

        // Start export in background
        _ = Task.Run(() => ProcessExportAsync(newJobId, ct), ct);

        return Task.FromResult(ToDto(newJob));
    }

    public async Task<IEnumerable<ResourceCountDto>> GetResourceCountsAsync(CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();

        var tasks = SupportedResourceTypes.Select(async resourceType =>
        {
            var count = await GetResourceCountAsync(client, resourceType, ct);
            return new ResourceCountDto(resourceType, count);
        });

        var results = await Task.WhenAll(tasks);
        return results;
    }

    public Task<(string FilePath, string ContentType, string FileName)?> GetExportFileAsync(string id, CancellationToken ct = default)
    {
        if (!_jobs.TryGetValue(id, out var job))
            return Task.FromResult<(string, string, string)?>(null);

        if (job.Status != "completed" || string.IsNullOrEmpty(job.OutputPath))
            return Task.FromResult<(string, string, string)?>(null);

        if (!File.Exists(job.OutputPath))
            return Task.FromResult<(string, string, string)?>(null);

        var contentType = job.Format == "ndjson" ? "application/x-ndjson" : "application/json";
        var fileName = Path.GetFileName(job.OutputPath);

        return Task.FromResult<(string, string, string)?>((job.OutputPath, contentType, fileName));
    }

    private async Task ProcessExportAsync(string jobId, CancellationToken ct)
    {
        if (!_jobs.TryGetValue(jobId, out var job))
            return;

        job.Status = "in-progress";

        try
        {
            var client = _clientFactory.CreateClient();
            var exportDir = Path.Combine(Path.GetTempPath(), "fhirhub-exports", jobId);
            Directory.CreateDirectory(exportDir);

            var totalTypes = job.ResourceTypes.Count;
            var processedTypes = 0;
            var allResources = new List<Resource>();

            foreach (var resourceType in job.ResourceTypes)
            {
                if (job.CancellationRequested)
                {
                    job.Status = "cancelled";
                    return;
                }

                try
                {
                    var resources = await FetchResourcesAsync(client, resourceType, job.DateRange, ct);
                    allResources.AddRange(resources);

                    processedTypes++;
                    job.Progress = (int)((processedTypes / (double)totalTypes) * 90); // Reserve 10% for writing
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fetch {ResourceType} resources", resourceType);
                }
            }

            // Write output
            var outputPath = await WriteExportAsync(exportDir, allResources, job.Format, ct);

            // Calculate file size
            var fileInfo = new FileInfo(outputPath);
            job.FileSize = fileInfo.Length;
            job.ExpiresAt = DateTime.UtcNow.AddHours(24);

            job.Progress = 100;
            job.Status = "completed";
            job.CompletedAt = DateTime.UtcNow;
            job.DownloadUrl = $"/api/exports/{jobId}/download";
            job.OutputPath = outputPath;

            _logger.LogInformation("Export job {JobId} completed with {ResourceCount} resources", jobId, allResources.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Export job {JobId} failed", jobId);
            job.Status = "failed";
            job.Error = ex.Message;
        }
    }

    private async Task<List<Resource>> FetchResourcesAsync(FhirClient client, string resourceType, DateRangeDto? dateRange, CancellationToken ct)
    {
        var resources = new List<Resource>();
        var searchParams = new SearchParams().LimitTo(100);

        if (dateRange != null)
        {
            if (!string.IsNullOrEmpty(dateRange.Start))
                searchParams.Add("_lastUpdated", $"ge{dateRange.Start}");
            if (!string.IsNullOrEmpty(dateRange.End))
                searchParams.Add("_lastUpdated", $"le{dateRange.End}");
        }

        Bundle? bundle = resourceType switch
        {
            "Patient" => await client.SearchAsync<Patient>(searchParams),
            "Observation" => await client.SearchAsync<Observation>(searchParams),
            "Condition" => await client.SearchAsync<Condition>(searchParams),
            "MedicationRequest" => await client.SearchAsync<MedicationRequest>(searchParams),
            "DiagnosticReport" => await client.SearchAsync<DiagnosticReport>(searchParams),
            "Encounter" => await client.SearchAsync<Encounter>(searchParams),
            "Procedure" => await client.SearchAsync<Procedure>(searchParams),
            "Immunization" => await client.SearchAsync<Immunization>(searchParams),
            "AllergyIntolerance" => await client.SearchAsync<AllergyIntolerance>(searchParams),
            "DocumentReference" => await client.SearchAsync<DocumentReference>(searchParams),
            _ => null
        };

        while (bundle != null)
        {
            if (bundle.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource != null)
                    {
                        resources.Add(entry.Resource);
                    }
                }
            }

            // Continue to next page if available
            if (bundle.NextLink != null && resources.Count < 1000)
            {
                bundle = await client.ContinueAsync(bundle);
            }
            else
            {
                break;
            }
        }

        return resources;
    }

    private async Task<string> WriteExportAsync(string exportDir, List<Resource> resources, string format, CancellationToken ct)
    {
        var serializer = new FhirJsonSerializer();

        if (format == "ndjson")
        {
            // NDJSON format - one resource per line
            var outputPath = Path.Combine(exportDir, "export.ndjson");
            await using var writer = new StreamWriter(outputPath);

            foreach (var resource in resources)
            {
                var json = serializer.SerializeToString(resource);
                // Ensure single line for NDJSON
                json = json.Replace("\r\n", "").Replace("\n", "");
                await writer.WriteLineAsync(json);
            }

            return outputPath;
        }
        else
        {
            // JSON Bundle format
            var bundle = new Bundle
            {
                Type = Bundle.BundleType.Collection,
                Total = resources.Count,
                Entry = resources.Select(r => new Bundle.EntryComponent
                {
                    Resource = r,
                    FullUrl = $"urn:uuid:{r.Id}"
                }).ToList()
            };

            var outputPath = Path.Combine(exportDir, "export.json");
            var json = serializer.SerializeToString(bundle);
            await File.WriteAllTextAsync(outputPath, json, ct);

            return outputPath;
        }
    }

    private async Task<int> GetResourceCountAsync(FhirClient client, string resourceType, CancellationToken ct)
    {
        try
        {
            var searchParams = new SearchParams();
            searchParams.Add("_summary", "count");

            Bundle? bundle = resourceType switch
            {
                "Patient" => await client.SearchAsync<Patient>(searchParams),
                "Observation" => await client.SearchAsync<Observation>(searchParams),
                "Condition" => await client.SearchAsync<Condition>(searchParams),
                "MedicationRequest" => await client.SearchAsync<MedicationRequest>(searchParams),
                "DiagnosticReport" => await client.SearchAsync<DiagnosticReport>(searchParams),
                "Encounter" => await client.SearchAsync<Encounter>(searchParams),
                "Procedure" => await client.SearchAsync<Procedure>(searchParams),
                "Immunization" => await client.SearchAsync<Immunization>(searchParams),
                "AllergyIntolerance" => await client.SearchAsync<AllergyIntolerance>(searchParams),
                "DocumentReference" => await client.SearchAsync<DocumentReference>(searchParams),
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

    private static ExportJobDto ToDto(ExportJobState job)
    {
        return new ExportJobDto(
            Id: job.Id,
            Status: job.Status,
            ResourceTypes: job.ResourceTypes,
            Format: job.Format,
            CreatedAt: job.CreatedAt.ToString("o"),
            CompletedAt: job.CompletedAt?.ToString("o"),
            Progress: job.Progress,
            DownloadUrl: job.DownloadUrl,
            Error: job.Error,
            FileSize: job.FileSize,
            ExpiresAt: job.ExpiresAt?.ToString("o")
        );
    }

    private class ExportJobState
    {
        public string Id { get; set; } = "";
        public string Status { get; set; } = "pending";
        public List<string> ResourceTypes { get; set; } = new();
        public string Format { get; set; } = "json";
        public bool IncludeReferences { get; set; }
        public DateRangeDto? DateRange { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int Progress { get; set; }
        public string? DownloadUrl { get; set; }
        public string? Error { get; set; }
        public string? OutputPath { get; set; }
        public bool CancellationRequested { get; set; }
        public long? FileSize { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}
