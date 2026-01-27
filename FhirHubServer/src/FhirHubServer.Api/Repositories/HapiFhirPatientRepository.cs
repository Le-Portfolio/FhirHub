using FhirHubServer.Api.Infrastructure;
using FhirHubServer.Api.Mappers;
using FhirHubServer.Core.DTOs.Clinical;
using FhirHubServer.Core.DTOs.Common;
using FhirHubServer.Core.DTOs.Patient;
using FhirHubServer.Core.DTOs.Timeline;
using FhirHubServer.Core.Interfaces;
using Hl7.Fhir.Model;
using Hl7.Fhir.Rest;

namespace FhirHubServer.Api.Repositories;

public class HapiFhirPatientRepository : IPatientRepository
{
    private readonly IFhirClientFactory _clientFactory;
    private readonly ILogger<HapiFhirPatientRepository> _logger;

    public HapiFhirPatientRepository(IFhirClientFactory clientFactory, ILogger<HapiFhirPatientRepository> logger)
    {
        _clientFactory = clientFactory;
        _logger = logger;
    }

    public async Task<PaginatedResponse<PatientListDto>> GetAllAsync(PatientSearchParams searchParams, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var searchParams_ = new SearchParams();

        // Add search criteria
        if (!string.IsNullOrEmpty(searchParams.Query))
        {
            // Search by name or identifier
            searchParams_.Add("name", searchParams.Query);
        }

        if (!string.IsNullOrEmpty(searchParams.Gender))
        {
            searchParams_.Add("gender", searchParams.Gender.ToLowerInvariant());
        }

        if (!string.IsNullOrEmpty(searchParams.Status))
        {
            searchParams_.Add("active", searchParams.Status.ToLowerInvariant() == "active" ? "true" : "false");
        }

        // Pagination
        searchParams_.Count = searchParams.PageSize;

        // Sort
        if (!string.IsNullOrEmpty(searchParams.SortBy))
        {
            var sortParam = searchParams.SortBy.ToLowerInvariant() switch
            {
                "name" => "name",
                "birthdate" => "birthdate",
                "gender" => "gender",
                _ => "name"
            };
            if (searchParams.SortOrder?.ToLowerInvariant() == "desc")
                sortParam = "-" + sortParam;
            searchParams_.Add("_sort", sortParam);
        }

        try
        {
            // First get total count
            var countParams = new SearchParams();
            countParams.Add("_summary", "count");
            if (!string.IsNullOrEmpty(searchParams.Query))
                countParams.Add("name", searchParams.Query);
            if (!string.IsNullOrEmpty(searchParams.Gender))
                countParams.Add("gender", searchParams.Gender.ToLowerInvariant());
            if (!string.IsNullOrEmpty(searchParams.Status))
                countParams.Add("active", searchParams.Status.ToLowerInvariant() == "active" ? "true" : "false");

            var countBundle = await client.SearchAsync<Patient>(countParams);
            var total = countBundle?.Total ?? 0;

            var bundle = await client.SearchAsync<Patient>(searchParams_);
            var patients = new List<PatientListDto>();

            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is Patient patient)
                    {
                        // Get conditions for this patient
                        var conditions = await GetConditionNamesAsync(client, patient.Id, ct);
                        // Get alert count from flags
                        var alertCount = await GetAlertCountAsync(client, patient.Id, ct);

                        patients.Add(FhirResourceMapper.ToPatientListDto(patient, alertCount, conditions));
                    }
                }
            }

            // Handle pagination by skipping to the right page
            // HAPI FHIR uses page links, but for simplicity we request more and skip
            if (searchParams.Page > 1)
            {
                // Navigate through pages
                for (int i = 1; i < searchParams.Page && bundle != null; i++)
                {
                    bundle = await client.ContinueAsync(bundle);
                }

                patients.Clear();
                if (bundle?.Entry != null)
                {
                    foreach (var entry in bundle.Entry)
                    {
                        if (entry.Resource is Patient patient)
                        {
                            var conditions = await GetConditionNamesAsync(client, patient.Id, ct);
                            var alertCount = await GetAlertCountAsync(client, patient.Id, ct);
                            patients.Add(FhirResourceMapper.ToPatientListDto(patient, alertCount, conditions));
                        }
                    }
                }
            }

            var totalPages = total > 0 ? (int)Math.Ceiling(total / (double)searchParams.PageSize) : 1;

            return new PaginatedResponse<PatientListDto>(
                Data: patients,
                Total: total,
                Page: searchParams.Page,
                PageSize: searchParams.PageSize,
                TotalPages: totalPages
            );
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching patients");
            throw;
        }
    }

    public async Task<PatientDetailDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();

        try
        {
            var patient = await client.ReadAsync<Patient>($"Patient/{id}");
            if (patient == null) return null;

            // Get additional details
            var conditions = await GetConditionNamesAsync(client, id, ct);
            var alertCount = await GetAlertCountAsync(client, id, ct);
            var lastVisit = await GetLastVisitDateAsync(client, id, ct);
            var primaryPhysician = await GetPrimaryPhysicianAsync(client, id, ct);

            return FhirResourceMapper.ToPatientDetailDto(
                patient,
                alertCount,
                conditions,
                lastVisit,
                primaryPhysician
            );
        }
        catch (FhirOperationException ex) when (ex.Status == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<IEnumerable<PatientSummaryDto>> GetSummariesAsync(int limit, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var searchParams = new SearchParams().LimitTo(limit);

        try
        {
            var bundle = await client.SearchAsync<Patient>(searchParams);
            var summaries = new List<PatientSummaryDto>();

            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is Patient patient)
                    {
                        var alertCount = await GetAlertCountAsync(client, patient.Id, ct);
                        summaries.Add(FhirResourceMapper.ToPatientSummaryDto(patient, alertCount));
                    }
                }
            }

            return summaries;
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching patient summaries");
            throw;
        }
    }

    public async Task<IEnumerable<VitalSignDto>> GetVitalsAsync(string patientId, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var searchParams = new SearchParams()
            .Where("patient=Patient/" + patientId)
            .Where("category=vital-signs")
            .OrderBy("-date")
            .LimitTo(50);

        try
        {
            var bundle = await client.SearchAsync<Observation>(searchParams);
            var vitals = new List<VitalSignDto>();

            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is Observation observation)
                    {
                        vitals.Add(FhirResourceMapper.ToVitalSignDto(observation));
                    }
                }
            }

            return vitals;
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching vitals for patient {PatientId}", patientId);
            throw;
        }
    }

    public async Task<IEnumerable<VitalChartDataDto>> GetVitalsChartAsync(string patientId, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var searchParams = new SearchParams()
            .Where("patient=Patient/" + patientId)
            .Where("category=vital-signs")
            .OrderBy("-date")
            .LimitTo(200);

        try
        {
            var bundle = await client.SearchAsync<Observation>(searchParams);

            // Group observations by date
            var observationsByDate = new Dictionary<string, List<Observation>>();

            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is Observation observation)
                    {
                        var date = ExtractDate(observation);
                        if (!string.IsNullOrEmpty(date))
                        {
                            if (!observationsByDate.ContainsKey(date))
                                observationsByDate[date] = new List<Observation>();
                            observationsByDate[date].Add(observation);
                        }
                    }
                }
            }

            // Convert to chart data
            return observationsByDate
                .OrderByDescending(kvp => kvp.Key)
                .Take(30)
                .Select(kvp => FhirResourceMapper.ToVitalChartDataDto(kvp.Key, kvp.Value))
                .Reverse()
                .ToList();
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching vitals chart for patient {PatientId}", patientId);
            throw;
        }
    }

    public async Task<IEnumerable<ConditionDto>> GetConditionsAsync(string patientId, bool includeResolved, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var searchParams = new SearchParams()
            .Where("patient=Patient/" + patientId);

        if (!includeResolved)
        {
            searchParams.Where("clinical-status=active,recurrence,relapse");
        }

        try
        {
            var bundle = await client.SearchAsync<Condition>(searchParams);
            var conditions = new List<ConditionDto>();

            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is Condition condition)
                    {
                        conditions.Add(FhirResourceMapper.ToConditionDto(condition));
                    }
                }
            }

            return conditions;
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching conditions for patient {PatientId}", patientId);
            throw;
        }
    }

    public async Task<IEnumerable<MedicationDto>> GetMedicationsAsync(string patientId, bool includeDiscontinued, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var searchParams = new SearchParams()
            .Where("patient=Patient/" + patientId);

        if (!includeDiscontinued)
        {
            searchParams.Where("status=active,on-hold");
        }

        try
        {
            var bundle = await client.SearchAsync<MedicationRequest>(searchParams);
            var medications = new List<MedicationDto>();

            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is MedicationRequest request)
                    {
                        // Try to resolve medication name if it's a reference
                        string? medicationName = null;
                        if (request.Medication is ResourceReference medRef && !string.IsNullOrEmpty(medRef.Reference))
                        {
                            medicationName = await GetMedicationNameAsync(client, medRef.Reference, ct);
                        }

                        medications.Add(FhirResourceMapper.ToMedicationDto(request, medicationName));
                    }
                }
            }

            return medications;
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching medications for patient {PatientId}", patientId);
            throw;
        }
    }

    public async Task<IEnumerable<LabPanelDto>> GetLabPanelsAsync(string patientId, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();

        try
        {
            // Get diagnostic reports (lab panels)
            var reportParams = new SearchParams()
                .Where("patient=Patient/" + patientId)
                .Where("category=LAB")
                .OrderBy("-date")
                .LimitTo(20);

            var reportBundle = await client.SearchAsync<DiagnosticReport>(reportParams);
            var panels = new List<LabPanelDto>();

            if (reportBundle?.Entry != null)
            {
                foreach (var entry in reportBundle.Entry)
                {
                    if (entry.Resource is DiagnosticReport report)
                    {
                        // Get the lab results referenced by this report
                        var results = new List<LabResultDto>();
                        foreach (var resultRef in report.Result)
                        {
                            if (!string.IsNullOrEmpty(resultRef.Reference))
                            {
                                try
                                {
                                    var observation = await client.ReadAsync<Observation>(resultRef.Reference);
                                    if (observation != null)
                                    {
                                        results.Add(FhirResourceMapper.ToLabResultDto(observation));
                                    }
                                }
                                catch (FhirOperationException)
                                {
                                    // Skip if observation not found
                                }
                            }
                        }

                        panels.Add(FhirResourceMapper.ToLabPanelDto(report, results));
                    }
                }
            }

            // If no DiagnosticReports, try to get lab observations directly
            if (!panels.Any())
            {
                var labParams = new SearchParams()
                    .Where("patient=Patient/" + patientId)
                    .Where("category=laboratory")
                    .OrderBy("-date")
                    .LimitTo(50);

                var labBundle = await client.SearchAsync<Observation>(labParams);

                if (labBundle?.Entry != null)
                {
                    // Group by date as synthetic panels
                    var resultsByDate = labBundle.Entry
                        .Where(e => e.Resource is Observation)
                        .Cast<Bundle.EntryComponent>()
                        .Select(e => (Observation)e.Resource!)
                        .GroupBy(o => ExtractDate(o))
                        .Take(10);

                    foreach (var group in resultsByDate)
                    {
                        var results = group.Select(o => FhirResourceMapper.ToLabResultDto(o)).ToList();
                        panels.Add(new LabPanelDto(
                            Id: $"panel-{group.Key}",
                            Name: "Laboratory Results",
                            Date: group.Key,
                            Status: "final",
                            Results: results
                        ));
                    }
                }
            }

            return panels;
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching lab panels for patient {PatientId}", patientId);
            throw;
        }
    }

    public async Task<IEnumerable<TimelineEventDto>> GetTimelineAsync(string patientId, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var events = new List<TimelineEventDto>();

        try
        {
            // Get encounters
            var encounterParams = new SearchParams()
                .Where("patient=Patient/" + patientId)
                .OrderBy("-date")
                .LimitTo(20);

            var encounterBundle = await client.SearchAsync<Encounter>(encounterParams);
            if (encounterBundle?.Entry != null)
            {
                foreach (var entry in encounterBundle.Entry)
                {
                    if (entry.Resource is Encounter encounter)
                    {
                        events.Add(FhirResourceMapper.ToTimelineEventDto(encounter));
                    }
                }
            }

            // Get diagnostic reports
            var reportParams = new SearchParams()
                .Where("patient=Patient/" + patientId)
                .OrderBy("-date")
                .LimitTo(20);

            var reportBundle = await client.SearchAsync<DiagnosticReport>(reportParams);
            if (reportBundle?.Entry != null)
            {
                foreach (var entry in reportBundle.Entry)
                {
                    if (entry.Resource is DiagnosticReport report)
                    {
                        events.Add(FhirResourceMapper.ToTimelineEventDto(report));
                    }
                }
            }

            // Get medication requests
            var medParams = new SearchParams()
                .Where("patient=Patient/" + patientId)
                .OrderBy("-authoredon")
                .LimitTo(20);

            var medBundle = await client.SearchAsync<MedicationRequest>(medParams);
            if (medBundle?.Entry != null)
            {
                foreach (var entry in medBundle.Entry)
                {
                    if (entry.Resource is MedicationRequest request)
                    {
                        string? medicationName = null;
                        if (request.Medication is ResourceReference medRef && !string.IsNullOrEmpty(medRef.Reference))
                        {
                            medicationName = await GetMedicationNameAsync(client, medRef.Reference, ct);
                        }
                        events.Add(FhirResourceMapper.ToTimelineEventDto(request, medicationName));
                    }
                }
            }

            // Sort all events by date descending
            return events
                .OrderByDescending(e => e.Date)
                .Take(50)
                .ToList();
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching timeline for patient {PatientId}", patientId);
            throw;
        }
    }

    #region Write Operations

    public async Task<PatientDetailDto> CreatePatientAsync(CreatePatientRequest request, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();

        var patient = new Patient
        {
            Active = true,
            Name = new List<HumanName>
            {
                new HumanName
                {
                    Given = new[] { request.FirstName },
                    Family = request.LastName
                }
            },
            Gender = request.Gender.ToLowerInvariant() switch
            {
                "male" => AdministrativeGender.Male,
                "female" => AdministrativeGender.Female,
                "other" => AdministrativeGender.Other,
                _ => AdministrativeGender.Unknown
            },
            BirthDate = request.BirthDate
        };

        // Telecom
        var telecom = new List<ContactPoint>();
        if (!string.IsNullOrEmpty(request.Phone))
        {
            telecom.Add(new ContactPoint
            {
                System = ContactPoint.ContactPointSystem.Phone,
                Value = request.Phone
            });
        }
        if (!string.IsNullOrEmpty(request.Email))
        {
            telecom.Add(new ContactPoint
            {
                System = ContactPoint.ContactPointSystem.Email,
                Value = request.Email
            });
        }
        if (telecom.Any()) patient.Telecom = telecom;

        // Address
        if (!string.IsNullOrEmpty(request.AddressLine) || !string.IsNullOrEmpty(request.City) ||
            !string.IsNullOrEmpty(request.State) || !string.IsNullOrEmpty(request.PostalCode))
        {
            patient.Address = new List<Address>
            {
                new Address
                {
                    Line = string.IsNullOrEmpty(request.AddressLine) ? null : new[] { request.AddressLine },
                    City = request.City,
                    State = request.State,
                    PostalCode = request.PostalCode
                }
            };
        }

        // MRN identifier
        if (!string.IsNullOrEmpty(request.Mrn))
        {
            patient.Identifier = new List<Identifier>
            {
                new Identifier
                {
                    Type = new CodeableConcept
                    {
                        Coding = new List<Coding>
                        {
                            new Coding("http://terminology.hl7.org/CodeSystem/v2-0203", "MR", "Medical Record Number")
                        }
                    },
                    Value = request.Mrn
                }
            };
        }

        try
        {
            var created = await client.CreateAsync(patient);
            return FhirResourceMapper.ToPatientDetailDto(created);
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while creating patient");
            throw;
        }
    }

    public async Task<ConditionDto> CreateConditionAsync(string patientId, CreateConditionRequest request, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();

        var condition = new Condition
        {
            Subject = new ResourceReference($"Patient/{patientId}"),
            Code = new CodeableConcept
            {
                Text = request.Name,
                Coding = string.IsNullOrEmpty(request.IcdCode) ? null : new List<Coding>
                {
                    new Coding("http://hl7.org/fhir/sid/icd-10", request.IcdCode, request.Name)
                }
            },
            ClinicalStatus = new CodeableConcept
            {
                Coding = new List<Coding>
                {
                    new Coding("http://terminology.hl7.org/CodeSystem/condition-clinical", request.ClinicalStatus)
                }
            },
            Severity = new CodeableConcept
            {
                Coding = new List<Coding>
                {
                    new Coding("http://snomed.info/sct", MapSeverityToSnomed(request.Severity), request.Severity)
                },
                Text = request.Severity
            },
            RecordedDate = DateTime.UtcNow.ToString("yyyy-MM-dd")
        };

        if (!string.IsNullOrEmpty(request.OnsetDate))
        {
            condition.Onset = new FhirDateTime(request.OnsetDate);
        }

        if (!string.IsNullOrEmpty(request.Notes))
        {
            condition.Note = new List<Annotation>
            {
                new Annotation { Text = new Markdown(request.Notes) }
            };
        }

        try
        {
            var created = await client.CreateAsync(condition);
            return FhirResourceMapper.ToConditionDto(created);
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while creating condition for patient {PatientId}", patientId);
            throw;
        }
    }

    public async Task<MedicationDto> CreateMedicationAsync(string patientId, CreateMedicationRequest request, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();

        var medicationRequest = new MedicationRequest
        {
            Status = MedicationRequest.MedicationrequestStatus.Active,
            Intent = MedicationRequest.MedicationRequestIntent.Order,
            Subject = new ResourceReference($"Patient/{patientId}"),
            Medication = new CodeableConcept
            {
                Text = request.Name
            },
            AuthoredOn = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            DosageInstruction = new List<Dosage>
            {
                new Dosage
                {
                    Text = BuildDosageText(request),
                    Timing = new Timing
                    {
                        Code = new CodeableConcept { Text = MapFrequencyToDisplay(request.Frequency) }
                    },
                    Route = string.IsNullOrEmpty(request.Route) ? null : new CodeableConcept
                    {
                        Text = MapRouteToDisplay(request.Route)
                    },
                    DoseAndRate = string.IsNullOrEmpty(request.Dosage) ? null : new List<Dosage.DoseAndRateComponent>
                    {
                        new Dosage.DoseAndRateComponent
                        {
                            Dose = new Quantity
                            {
                                Value = decimal.TryParse(request.Dosage, out var d) ? d : 0,
                                Unit = request.Unit ?? "mg"
                            }
                        }
                    }
                }
            }
        };

        if (!string.IsNullOrEmpty(request.Instructions))
        {
            medicationRequest.DosageInstruction[0].PatientInstruction = request.Instructions;
        }

        try
        {
            var created = await client.CreateAsync(medicationRequest);
            return FhirResourceMapper.ToMedicationDto(created, null);
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while creating medication for patient {PatientId}", patientId);
            throw;
        }
    }

    public async Task<RecordVitalsResponse> RecordVitalsAsync(string patientId, RecordVitalsRequest request, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var createdVitals = new List<VitalSignDto>();
        var warnings = new List<ClinicalWarning>();
        var alertsCreated = new List<string>();
        var now = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

        try
        {
            // Blood pressure (combined systolic/diastolic)
            if (request.Systolic.HasValue && request.Diastolic.HasValue)
            {
                var bp = CreateBloodPressureObservation(patientId, request.Systolic.Value, request.Diastolic.Value, now);

                // Evaluate systolic
                var systolicLevel = ClinicalRanges.EvaluateVital("systolic", request.Systolic.Value);
                if (systolicLevel != WarningLevel.Normal)
                {
                    var message = systolicLevel == WarningLevel.Critical
                        ? $"Systolic BP {request.Systolic.Value} mmHg is critically abnormal"
                        : $"Systolic BP {request.Systolic.Value} mmHg is outside normal range";
                    warnings.Add(new ClinicalWarning("systolic", systolicLevel, message, ClinicalRanges.Systolic.NormalRange));
                    SetComponentInterpretation(bp.Component[0], systolicLevel, request.Systolic.Value, ClinicalRanges.Systolic.WarningLow, ClinicalRanges.Systolic.CriticalLow);
                }

                // Evaluate diastolic
                var diastolicLevel = ClinicalRanges.EvaluateVital("diastolic", request.Diastolic.Value);
                if (diastolicLevel != WarningLevel.Normal)
                {
                    var message = diastolicLevel == WarningLevel.Critical
                        ? $"Diastolic BP {request.Diastolic.Value} mmHg is critically abnormal"
                        : $"Diastolic BP {request.Diastolic.Value} mmHg is outside normal range";
                    warnings.Add(new ClinicalWarning("diastolic", diastolicLevel, message, ClinicalRanges.Diastolic.NormalRange));
                    SetComponentInterpretation(bp.Component[1], diastolicLevel, request.Diastolic.Value, ClinicalRanges.Diastolic.WarningLow, ClinicalRanges.Diastolic.CriticalLow);
                }

                var created = await client.CreateAsync(bp);
                createdVitals.Add(FhirResourceMapper.ToVitalSignDto(created));

                // Create alert if BP is critical
                if (systolicLevel == WarningLevel.Critical || diastolicLevel == WarningLevel.Critical)
                {
                    var alertId = await CreateCriticalVitalAlertAsync(client, patientId, $"Critical blood pressure: {request.Systolic.Value}/{request.Diastolic.Value} mmHg", created.Id);
                    if (alertId != null) alertsCreated.Add(alertId);
                }
            }

            // Heart rate
            if (request.HeartRate.HasValue)
            {
                var hr = CreateVitalObservation(patientId, "8867-4", "Heart rate", request.HeartRate.Value, "/min", now);

                var level = ClinicalRanges.EvaluateVital("heartrate", request.HeartRate.Value);
                if (level != WarningLevel.Normal)
                {
                    SetInterpretation(hr, level, request.HeartRate.Value, ClinicalRanges.HeartRate.WarningLow, ClinicalRanges.HeartRate.CriticalLow);
                    var message = level == WarningLevel.Critical
                        ? $"Heart rate {request.HeartRate.Value} bpm is critically abnormal"
                        : $"Heart rate {request.HeartRate.Value} bpm is outside normal range";
                    warnings.Add(new ClinicalWarning("heartRate", level, message, ClinicalRanges.HeartRate.NormalRange));
                }

                var created = await client.CreateAsync(hr);
                createdVitals.Add(FhirResourceMapper.ToVitalSignDto(created));

                if (level == WarningLevel.Critical)
                {
                    var alertId = await CreateCriticalVitalAlertAsync(client, patientId, $"Critical heart rate: {request.HeartRate.Value} bpm", created.Id);
                    if (alertId != null) alertsCreated.Add(alertId);
                }
            }

            // Temperature
            if (request.Temperature.HasValue)
            {
                var temp = CreateVitalObservation(patientId, "8310-5", "Body temperature", request.Temperature.Value, "[degF]", now);

                var level = ClinicalRanges.EvaluateVital("temperature", request.Temperature.Value);
                if (level != WarningLevel.Normal)
                {
                    SetInterpretation(temp, level, request.Temperature.Value, ClinicalRanges.Temperature.WarningLow, ClinicalRanges.Temperature.CriticalLow);
                    var message = level == WarningLevel.Critical
                        ? $"Temperature {request.Temperature.Value}°F is critically abnormal"
                        : $"Temperature {request.Temperature.Value}°F is outside normal range";
                    warnings.Add(new ClinicalWarning("temperature", level, message, ClinicalRanges.Temperature.NormalRange));
                }

                var created = await client.CreateAsync(temp);
                createdVitals.Add(FhirResourceMapper.ToVitalSignDto(created));

                if (level == WarningLevel.Critical)
                {
                    var alertId = await CreateCriticalVitalAlertAsync(client, patientId, $"Critical temperature: {request.Temperature.Value}°F", created.Id);
                    if (alertId != null) alertsCreated.Add(alertId);
                }
            }

            // Respiratory rate
            if (request.RespiratoryRate.HasValue)
            {
                var rr = CreateVitalObservation(patientId, "9279-1", "Respiratory rate", request.RespiratoryRate.Value, "/min", now);

                var level = ClinicalRanges.EvaluateVital("respiratoryrate", request.RespiratoryRate.Value);
                if (level != WarningLevel.Normal)
                {
                    SetInterpretation(rr, level, request.RespiratoryRate.Value, ClinicalRanges.RespiratoryRate.WarningLow, ClinicalRanges.RespiratoryRate.CriticalLow);
                    var message = level == WarningLevel.Critical
                        ? $"Respiratory rate {request.RespiratoryRate.Value}/min is critically abnormal"
                        : $"Respiratory rate {request.RespiratoryRate.Value}/min is outside normal range";
                    warnings.Add(new ClinicalWarning("respiratoryRate", level, message, ClinicalRanges.RespiratoryRate.NormalRange));
                }

                var created = await client.CreateAsync(rr);
                createdVitals.Add(FhirResourceMapper.ToVitalSignDto(created));

                if (level == WarningLevel.Critical)
                {
                    var alertId = await CreateCriticalVitalAlertAsync(client, patientId, $"Critical respiratory rate: {request.RespiratoryRate.Value}/min", created.Id);
                    if (alertId != null) alertsCreated.Add(alertId);
                }
            }

            // Oxygen saturation
            if (request.OxygenSaturation.HasValue)
            {
                var spo2 = CreateVitalObservation(patientId, "2708-6", "Oxygen saturation", request.OxygenSaturation.Value, "%", now);

                var level = ClinicalRanges.EvaluateVital("oxygensaturation", request.OxygenSaturation.Value);
                if (level != WarningLevel.Normal)
                {
                    SetInterpretation(spo2, level, request.OxygenSaturation.Value, ClinicalRanges.OxygenSaturation.WarningLow, ClinicalRanges.OxygenSaturation.CriticalLow);
                    var message = level == WarningLevel.Critical
                        ? $"Oxygen saturation {request.OxygenSaturation.Value}% is critically low"
                        : $"Oxygen saturation {request.OxygenSaturation.Value}% is below normal";
                    warnings.Add(new ClinicalWarning("oxygenSaturation", level, message, ClinicalRanges.OxygenSaturation.NormalRange));
                }

                var created = await client.CreateAsync(spo2);
                createdVitals.Add(FhirResourceMapper.ToVitalSignDto(created));

                if (level == WarningLevel.Critical)
                {
                    var alertId = await CreateCriticalVitalAlertAsync(client, patientId, $"Critical oxygen saturation: {request.OxygenSaturation.Value}%", created.Id);
                    if (alertId != null) alertsCreated.Add(alertId);
                }
            }

            // Weight
            if (request.Weight.HasValue)
            {
                var weight = CreateVitalObservation(patientId, "29463-7", "Body weight", request.Weight.Value, "[lb_av]", now);
                var created = await client.CreateAsync(weight);
                createdVitals.Add(FhirResourceMapper.ToVitalSignDto(created));
            }

            return new RecordVitalsResponse(createdVitals, warnings, alertsCreated);
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while recording vitals for patient {PatientId}", patientId);
            throw;
        }
    }

    private async Task<string?> CreateCriticalVitalAlertAsync(FhirClient client, string patientId, string message, string? observationId)
    {
        try
        {
            var flag = new Flag
            {
                Status = Flag.FlagStatus.Active,
                Category = new List<CodeableConcept>
                {
                    new CodeableConcept
                    {
                        Coding = new List<Coding>
                        {
                            new Coding("http://terminology.hl7.org/CodeSystem/flag-category", "clinical", "Clinical")
                        }
                    }
                },
                Code = new CodeableConcept
                {
                    Coding = new List<Coding>
                    {
                        new Coding("http://snomed.info/sct", "75478009", "Abnormal vital signs")
                    },
                    Text = message
                },
                Subject = new ResourceReference($"Patient/{patientId}"),
                Period = new Period { Start = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ") }
            };

            var created = await client.CreateAsync(flag);
            _logger.LogInformation("Created critical vital alert {AlertId} for patient {PatientId}: {Message}", created.Id, patientId, message);
            return created.Id;
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "Failed to create alert Flag for patient {PatientId}: {Message}", patientId, message);
            return null;
        }
    }

    public async Task<LabOrderDto> OrderLabsAsync(string patientId, OrderLabsRequest request, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();

        var panelNames = request.PanelIds.Select(MapPanelIdToName).ToList();

        var serviceRequest = new ServiceRequest
        {
            Status = RequestStatus.Active,
            Intent = RequestIntent.Order,
            Priority = MapPriorityToFhir(request.Priority),
            Subject = new ResourceReference($"Patient/{patientId}"),
            Code = new CodeableConcept
            {
                Text = string.Join(", ", panelNames)
            },
            AuthoredOn = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            Category = new List<CodeableConcept>
            {
                new CodeableConcept
                {
                    Coding = new List<Coding>
                    {
                        new Coding("http://snomed.info/sct", "108252007", "Laboratory procedure")
                    }
                }
            }
        };

        if (!string.IsNullOrEmpty(request.Notes))
        {
            serviceRequest.Note = new List<Annotation>
            {
                new Annotation { Text = new Markdown(request.Notes) }
            };
        }

        try
        {
            var created = await client.CreateAsync(serviceRequest);
            return new LabOrderDto(
                Id: created.Id,
                Status: created.Status?.ToString() ?? "active",
                PanelNames: panelNames,
                Priority: request.Priority,
                OrderedAt: created.AuthoredOn ?? DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
            );
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while ordering labs for patient {PatientId}", patientId);
            throw;
        }
    }

    private static Observation CreateVitalObservation(string patientId, string loincCode, string display, decimal value, string unit, string dateTime)
    {
        return new Observation
        {
            Status = ObservationStatus.Final,
            Category = new List<CodeableConcept>
            {
                new CodeableConcept
                {
                    Coding = new List<Coding>
                    {
                        new Coding("http://terminology.hl7.org/CodeSystem/observation-category", "vital-signs", "Vital Signs")
                    }
                }
            },
            Code = new CodeableConcept
            {
                Coding = new List<Coding>
                {
                    new Coding("http://loinc.org", loincCode, display)
                },
                Text = display
            },
            Subject = new ResourceReference($"Patient/{patientId}"),
            Effective = new FhirDateTime(dateTime),
            Value = new Quantity
            {
                Value = value,
                Unit = unit,
                System = "http://unitsofmeasure.org",
                Code = unit
            }
        };
    }

    private static Observation CreateBloodPressureObservation(string patientId, decimal systolic, decimal diastolic, string dateTime)
    {
        return new Observation
        {
            Status = ObservationStatus.Final,
            Category = new List<CodeableConcept>
            {
                new CodeableConcept
                {
                    Coding = new List<Coding>
                    {
                        new Coding("http://terminology.hl7.org/CodeSystem/observation-category", "vital-signs", "Vital Signs")
                    }
                }
            },
            Code = new CodeableConcept
            {
                Coding = new List<Coding>
                {
                    new Coding("http://loinc.org", "85354-9", "Blood pressure panel with all children optional")
                },
                Text = "Blood Pressure"
            },
            Subject = new ResourceReference($"Patient/{patientId}"),
            Effective = new FhirDateTime(dateTime),
            Component = new List<Observation.ComponentComponent>
            {
                new Observation.ComponentComponent
                {
                    Code = new CodeableConcept
                    {
                        Coding = new List<Coding>
                        {
                            new Coding("http://loinc.org", "8480-6", "Systolic blood pressure")
                        }
                    },
                    Value = new Quantity
                    {
                        Value = systolic,
                        Unit = "mmHg",
                        System = "http://unitsofmeasure.org",
                        Code = "mm[Hg]"
                    }
                },
                new Observation.ComponentComponent
                {
                    Code = new CodeableConcept
                    {
                        Coding = new List<Coding>
                        {
                            new Coding("http://loinc.org", "8462-4", "Diastolic blood pressure")
                        }
                    },
                    Value = new Quantity
                    {
                        Value = diastolic,
                        Unit = "mmHg",
                        System = "http://unitsofmeasure.org",
                        Code = "mm[Hg]"
                    }
                }
            }
        };
    }

    private static string MapSeverityToSnomed(string severity) => severity.ToLowerInvariant() switch
    {
        "mild" => "255604002",
        "moderate" => "6736007",
        "severe" => "24484000",
        _ => "6736007"
    };

    private static string BuildDosageText(CreateMedicationRequest request)
    {
        var parts = new List<string>();
        if (!string.IsNullOrEmpty(request.Dosage) && !string.IsNullOrEmpty(request.Unit))
            parts.Add($"{request.Dosage} {request.Unit}");
        if (!string.IsNullOrEmpty(request.Route))
            parts.Add(MapRouteToDisplay(request.Route));
        if (!string.IsNullOrEmpty(request.Frequency))
            parts.Add(MapFrequencyToDisplay(request.Frequency));
        return string.Join(" ", parts);
    }

    private static string MapFrequencyToDisplay(string frequency) => frequency.ToLowerInvariant() switch
    {
        "once" => "once",
        "daily" => "once daily",
        "bid" => "twice daily",
        "tid" => "three times daily",
        "qid" => "four times daily",
        "prn" => "as needed",
        "weekly" => "weekly",
        _ => frequency
    };

    private static string MapRouteToDisplay(string route) => route.ToLowerInvariant() switch
    {
        "oral" => "by mouth",
        "sublingual" => "sublingual",
        "topical" => "topical",
        "inhalation" => "inhalation",
        "iv" => "intravenous",
        "im" => "intramuscular",
        "sc" => "subcutaneous",
        "rectal" => "rectal",
        _ => route
    };

    private static string MapPanelIdToName(string panelId) => panelId.ToLowerInvariant() switch
    {
        "cbc" => "Complete Blood Count (CBC)",
        "bmp" => "Basic Metabolic Panel (BMP)",
        "cmp" => "Comprehensive Metabolic Panel (CMP)",
        "lipid" => "Lipid Panel",
        "tsh" => "Thyroid Panel (TSH)",
        "hba1c" => "Hemoglobin A1C",
        "ua" => "Urinalysis",
        "pt" => "PT/INR",
        _ => panelId
    };

    private static RequestPriority MapPriorityToFhir(string priority) => priority.ToLowerInvariant() switch
    {
        "stat" => RequestPriority.Stat,
        "asap" => RequestPriority.Asap,
        "routine" => RequestPriority.Routine,
        _ => RequestPriority.Routine
    };

    #endregion

    #region Cross-Patient Queries

    public async Task<PaginatedResponse<ObservationListDto>> GetAllObservationsAsync(ObservationSearchParams searchParams, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var fhirParams = new SearchParams()
            .OrderBy("-date")
            .LimitTo(searchParams.PageSize);

        if (!string.IsNullOrEmpty(searchParams.Category))
            fhirParams.Where($"category={searchParams.Category}");
        if (!string.IsNullOrEmpty(searchParams.DateFrom))
            fhirParams.Where($"date=ge{searchParams.DateFrom}");
        if (!string.IsNullOrEmpty(searchParams.DateTo))
            fhirParams.Where($"date=le{searchParams.DateTo}");

        try
        {
            // Get total count
            var countParams = new SearchParams();
            countParams.Add("_summary", "count");
            if (!string.IsNullOrEmpty(searchParams.Category))
                countParams.Add("category", searchParams.Category);
            if (!string.IsNullOrEmpty(searchParams.DateFrom))
                countParams.Add("date", $"ge{searchParams.DateFrom}");
            if (!string.IsNullOrEmpty(searchParams.DateTo))
                countParams.Add("date", $"le{searchParams.DateTo}");

            var countBundle = await client.SearchAsync<Observation>(countParams);
            var total = countBundle?.Total ?? 0;

            var bundle = await client.SearchAsync<Observation>(fhirParams);

            // Navigate to the correct page
            if (searchParams.Page > 1)
            {
                for (int i = 1; i < searchParams.Page && bundle != null; i++)
                    bundle = await client.ContinueAsync(bundle);
            }

            var items = new List<ObservationListDto>();
            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is Observation obs)
                    {
                        var patientRef = (obs.Subject as ResourceReference)?.Reference;
                        var patientName = !string.IsNullOrEmpty(patientRef)
                            ? await GetPatientNameAsync(client, patientRef, ct)
                            : "Unknown";

                        // Filter by patient name if specified
                        if (!string.IsNullOrEmpty(searchParams.PatientName) &&
                            !(patientName?.Contains(searchParams.PatientName, StringComparison.OrdinalIgnoreCase) ?? false))
                            continue;

                        items.Add(FhirResourceMapper.ToObservationListDto(obs, patientName ?? "Unknown"));
                    }
                }
            }

            var totalPages = total > 0 ? (int)Math.Ceiling(total / (double)searchParams.PageSize) : 1;
            return new PaginatedResponse<ObservationListDto>(items, total, searchParams.Page, searchParams.PageSize, totalPages);
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching all observations");
            throw;
        }
    }

    public async Task<PaginatedResponse<ConditionListDto>> GetAllConditionsAsync(ConditionSearchParams searchParams, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var fhirParams = new SearchParams()
            .LimitTo(searchParams.PageSize);

        if (!string.IsNullOrEmpty(searchParams.ClinicalStatus))
            fhirParams.Where($"clinical-status={searchParams.ClinicalStatus}");
        if (!string.IsNullOrEmpty(searchParams.Severity))
            fhirParams.Where($"severity={searchParams.Severity}");

        try
        {
            var countParams = new SearchParams();
            countParams.Add("_summary", "count");
            if (!string.IsNullOrEmpty(searchParams.ClinicalStatus))
                countParams.Add("clinical-status", searchParams.ClinicalStatus);

            var countBundle = await client.SearchAsync<Condition>(countParams);
            var total = countBundle?.Total ?? 0;

            var bundle = await client.SearchAsync<Condition>(fhirParams);

            if (searchParams.Page > 1)
            {
                for (int i = 1; i < searchParams.Page && bundle != null; i++)
                    bundle = await client.ContinueAsync(bundle);
            }

            var items = new List<ConditionListDto>();
            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is Condition condition)
                    {
                        var patientRef = (condition.Subject as ResourceReference)?.Reference;
                        var patientId = patientRef?.Replace("Patient/", "");
                        var patientName = !string.IsNullOrEmpty(patientRef)
                            ? await GetPatientNameAsync(client, patientRef, ct)
                            : "Unknown";

                        if (!string.IsNullOrEmpty(searchParams.PatientName) &&
                            !(patientName?.Contains(searchParams.PatientName, StringComparison.OrdinalIgnoreCase) ?? false))
                            continue;

                        if (!string.IsNullOrEmpty(searchParams.Query))
                        {
                            var condName = condition.Code?.Text ?? condition.Code?.Coding.FirstOrDefault()?.Display ?? "";
                            if (!condName.Contains(searchParams.Query, StringComparison.OrdinalIgnoreCase))
                                continue;
                        }

                        items.Add(FhirResourceMapper.ToConditionListDto(condition, patientId, patientName ?? "Unknown"));
                    }
                }
            }

            var totalPages = total > 0 ? (int)Math.Ceiling(total / (double)searchParams.PageSize) : 1;
            return new PaginatedResponse<ConditionListDto>(items, total, searchParams.Page, searchParams.PageSize, totalPages);
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching all conditions");
            throw;
        }
    }

    public async Task<PaginatedResponse<MedicationListDto>> GetAllMedicationsAsync(MedicationSearchParams searchParams, CancellationToken ct = default)
    {
        var client = _clientFactory.CreateClient();
        var fhirParams = new SearchParams()
            .LimitTo(searchParams.PageSize);

        if (!string.IsNullOrEmpty(searchParams.Status))
            fhirParams.Where($"status={searchParams.Status}");

        try
        {
            var countParams = new SearchParams();
            countParams.Add("_summary", "count");
            if (!string.IsNullOrEmpty(searchParams.Status))
                countParams.Add("status", searchParams.Status);

            var countBundle = await client.SearchAsync<MedicationRequest>(countParams);
            var total = countBundle?.Total ?? 0;

            var bundle = await client.SearchAsync<MedicationRequest>(fhirParams);

            if (searchParams.Page > 1)
            {
                for (int i = 1; i < searchParams.Page && bundle != null; i++)
                    bundle = await client.ContinueAsync(bundle);
            }

            var items = new List<MedicationListDto>();
            if (bundle?.Entry != null)
            {
                foreach (var entry in bundle.Entry)
                {
                    if (entry.Resource is MedicationRequest medReq)
                    {
                        var patientRef = (medReq.Subject as ResourceReference)?.Reference;
                        var patientId = patientRef?.Replace("Patient/", "");
                        var patientName = !string.IsNullOrEmpty(patientRef)
                            ? await GetPatientNameAsync(client, patientRef, ct)
                            : "Unknown";

                        if (!string.IsNullOrEmpty(searchParams.PatientName) &&
                            !(patientName?.Contains(searchParams.PatientName, StringComparison.OrdinalIgnoreCase) ?? false))
                            continue;

                        if (!string.IsNullOrEmpty(searchParams.Query))
                        {
                            var medName = FhirResourceMapper.ToMedicationListDto(medReq, patientId, patientName ?? "Unknown").Name;
                            if (!medName.Contains(searchParams.Query, StringComparison.OrdinalIgnoreCase))
                                continue;
                        }

                        items.Add(FhirResourceMapper.ToMedicationListDto(medReq, patientId, patientName ?? "Unknown"));
                    }
                }
            }

            var totalPages = total > 0 ? (int)Math.Ceiling(total / (double)searchParams.PageSize) : 1;
            return new PaginatedResponse<MedicationListDto>(items, total, searchParams.Page, searchParams.PageSize, totalPages);
        }
        catch (FhirOperationException ex)
        {
            _logger.LogError(ex, "FHIR operation failed while fetching all medications");
            throw;
        }
    }

    #endregion

    #region Helper Methods

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

    private async Task<IEnumerable<string>> GetConditionNamesAsync(FhirClient client, string patientId, CancellationToken ct)
    {
        try
        {
            var searchParams = new SearchParams()
                .Where("patient=Patient/" + patientId)
                .Where("clinical-status=active")
                .LimitTo(10);

            var bundle = await client.SearchAsync<Condition>(searchParams);

            return bundle?.Entry?
                .Where(e => e.Resource is Condition)
                .Select(e => (Condition)e.Resource!)
                .Select(c => c.Code?.Text ?? c.Code?.Coding.FirstOrDefault()?.Display ?? "Unknown")
                .ToList() ?? Enumerable.Empty<string>();
        }
        catch
        {
            return Enumerable.Empty<string>();
        }
    }

    private async Task<int> GetAlertCountAsync(FhirClient client, string patientId, CancellationToken ct)
    {
        try
        {
            var searchParams = new SearchParams()
                .Where("patient=Patient/" + patientId)
                .SummaryOnly();

            var bundle = await client.SearchAsync<Flag>(searchParams);
            return bundle?.Total ?? 0;
        }
        catch
        {
            return 0;
        }
    }

    private async Task<string?> GetLastVisitDateAsync(FhirClient client, string patientId, CancellationToken ct)
    {
        try
        {
            var searchParams = new SearchParams()
                .Where("patient=Patient/" + patientId)
                .OrderBy("-date")
                .LimitTo(1);

            var bundle = await client.SearchAsync<Encounter>(searchParams);
            var encounter = bundle?.Entry?.FirstOrDefault()?.Resource as Encounter;
            return encounter?.Period?.Start?.Split('T').FirstOrDefault();
        }
        catch
        {
            return null;
        }
    }

    private async Task<string?> GetPrimaryPhysicianAsync(FhirClient client, string patientId, CancellationToken ct)
    {
        try
        {
            var patient = await client.ReadAsync<Patient>($"Patient/{patientId}");
            var gpRef = patient?.GeneralPractitioner.FirstOrDefault();
            if (gpRef?.Reference != null)
            {
                var practitioner = await client.ReadAsync<Practitioner>(gpRef.Reference);
                var name = practitioner?.Name.FirstOrDefault();
                if (name != null)
                {
                    var prefix = name.Prefix.FirstOrDefault() ?? "Dr.";
                    var given = string.Join(" ", name.Given);
                    var family = name.Family;
                    return $"{prefix} {given} {family}".Trim();
                }
            }
            return gpRef?.Display;
        }
        catch
        {
            return null;
        }
    }

    private async Task<string?> GetMedicationNameAsync(FhirClient client, string reference, CancellationToken ct)
    {
        try
        {
            var medication = await client.ReadAsync<Medication>(reference);
            return medication?.Code?.Text ?? medication?.Code?.Coding.FirstOrDefault()?.Display;
        }
        catch
        {
            return null;
        }
    }

    private static void SetInterpretation(Observation obs, WarningLevel level, decimal value, decimal warningLow, decimal criticalLow)
    {
        if (level == WarningLevel.Normal) return;

        var isLow = value < warningLow || value < criticalLow;
        var (code, display) = (level, isLow) switch
        {
            (WarningLevel.Critical, true) => ("LL", "Critical low"),
            (WarningLevel.Critical, false) => ("HH", "Critical high"),
            (WarningLevel.Warning, true) => ("L", "Low"),
            (WarningLevel.Warning, false) => ("H", "High"),
            _ => ((string?)null, (string?)null)
        };

        if (code != null)
        {
            obs.Interpretation = new List<CodeableConcept>
            {
                new CodeableConcept("http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code, display)
            };
        }
    }

    private static void SetComponentInterpretation(Observation.ComponentComponent component, WarningLevel level, decimal value, decimal warningLow, decimal criticalLow)
    {
        if (level == WarningLevel.Normal) return;

        var isLow = value < warningLow || value < criticalLow;
        var (code, display) = (level, isLow) switch
        {
            (WarningLevel.Critical, true) => ("LL", "Critical low"),
            (WarningLevel.Critical, false) => ("HH", "Critical high"),
            (WarningLevel.Warning, true) => ("L", "Low"),
            (WarningLevel.Warning, false) => ("H", "High"),
            _ => ((string?)null, (string?)null)
        };

        if (code != null)
        {
            component.Interpretation = new List<CodeableConcept>
            {
                new CodeableConcept("http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code, display)
            };
        }
    }

    private static string ExtractDate(Observation observation)
    {
        var dateTime = observation.Effective switch
        {
            FhirDateTime dt => dt.Value,
            Period p => p.Start,
            _ => null
        };

        return dateTime?.Split('T').FirstOrDefault() ?? "";
    }

    #endregion
}
