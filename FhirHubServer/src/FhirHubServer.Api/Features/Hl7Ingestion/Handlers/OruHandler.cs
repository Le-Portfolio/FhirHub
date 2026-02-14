using FhirHubServer.Api.Features.Hl7Ingestion.Converters;
using FhirHubServer.Api.Features.Hl7Ingestion.Models;
using FhirHubServer.Api.Features.Hl7Ingestion.Services;
using Hl7.Fhir.Model;
using Microsoft.Extensions.Logging;
using NHapi.Base.Model;
using NHapi.Model.V251.Group;
using NHapi.Model.V251.Message;
using NHapi.Model.V251.Segment;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Handlers;

public class OruHandler : IHl7MessageHandler
{
    private readonly IFhirBundleService _bundleService;
    private readonly ILogger<OruHandler> _logger;

    public OruHandler(IFhirBundleService bundleService, ILogger<OruHandler> logger)
    {
        _bundleService = bundleService;
        _logger = logger;
    }

    public bool CanHandle(string messageType, string triggerEvent)
        => messageType == "ORU" && triggerEvent == "R01";

    public async Task<IngestResult> HandleAsync(IMessage message, CancellationToken ct = default)
    {
        if (message is not ORU_R01 oru)
            return new IngestResult(false, "", "ORU^R01", [], "Message is not a valid ORU_R01");

        var messageControlId = oru.MSH.MessageControlID.Value ?? "";
        var resources = new List<Resource>();
        var resourceDescriptions = new List<string>();

        // Extract patient from first PATIENT_RESULT group
        var patientResultCount = oru.PATIENT_RESULTRepetitionsUsed;
        if (patientResultCount == 0)
            return new IngestResult(false, messageControlId, "ORU^R01", [], "No PATIENT_RESULT groups found");

        var patientResult = oru.GetPATIENT_RESULT(0);
        var pid = patientResult.PATIENT.PID;

        // Convert PID → FHIR Patient
        var patient = PatientConverter.FromPid(pid);
        var patientUuid = $"urn:uuid:{Guid.NewGuid()}";
        patient.Id = patientUuid;
        resources.Add(patient);

        var patientRef = new ResourceReference(patientUuid);
        var mrn = patient.Identifier.FirstOrDefault()?.Value ?? "unknown";
        resourceDescriptions.Add($"Patient(MRN={mrn})");

        // Process ORDER_OBSERVATION groups
        var orderObsCount = patientResult.ORDER_OBSERVATIONRepetitionsUsed;
        for (var i = 0; i < orderObsCount; i++)
        {
            var orderObs = patientResult.GetORDER_OBSERVATION(i);
            var obr = orderObs.OBR;

            // Convert OBX segments → FHIR Observations
            var observationRefs = new List<ResourceReference>();
            var obsCount = orderObs.OBSERVATIONRepetitionsUsed;

            for (var j = 0; j < obsCount; j++)
            {
                var observation = orderObs.GetOBSERVATION(j);
                var obx = observation.OBX;

                var fhirObs = ObservationConverter.FromObx(obx, patientRef);
                var obsUuid = $"urn:uuid:{Guid.NewGuid()}";
                fhirObs.Id = obsUuid;
                resources.Add(fhirObs);

                observationRefs.Add(new ResourceReference(obsUuid));
                var obsCode = fhirObs.Code?.Coding?.FirstOrDefault()?.Display ?? "unknown";
                resourceDescriptions.Add($"Observation({obsCode})");
            }

            // Convert OBR → FHIR DiagnosticReport
            var report = DiagnosticReportConverter.FromObr(obr, patientRef, observationRefs);
            var reportUuid = $"urn:uuid:{Guid.NewGuid()}";
            report.Id = reportUuid;
            resources.Add(report);

            var reportCode = report.Code?.Coding?.FirstOrDefault()?.Display ?? "unknown";
            resourceDescriptions.Add($"DiagnosticReport({reportCode})");
        }

        // Submit transaction bundle to HAPI FHIR
        _logger.LogInformation(
            "Submitting ORU^R01 bundle for MsgId={MessageControlId} with {ResourceCount} resources",
            messageControlId, resources.Count);

        await _bundleService.SubmitTransactionAsync(resources, ct);

        return new IngestResult(true, messageControlId, "ORU^R01", resourceDescriptions);
    }
}
