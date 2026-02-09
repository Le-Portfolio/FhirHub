namespace FhirHubServer.Api.Common.Authorization;

public static class AuthorizationPolicies
{
    public const string CanReadPatients = nameof(CanReadPatients);
    public const string CanWritePatients = nameof(CanWritePatients);
    public const string CanReadVitals = nameof(CanReadVitals);
    public const string CanWriteVitals = nameof(CanWriteVitals);
    public const string CanReadConditions = nameof(CanReadConditions);
    public const string CanWriteConditions = nameof(CanWriteConditions);
    public const string CanReadMedications = nameof(CanReadMedications);
    public const string CanWriteMedications = nameof(CanWriteMedications);
    public const string CanReadLabs = nameof(CanReadLabs);
    public const string CanOrderLabs = nameof(CanOrderLabs);
    public const string CanReadClinicalOverviews = nameof(CanReadClinicalOverviews);
    public const string CanManageExports = nameof(CanManageExports);
    public const string CanDeleteExports = nameof(CanDeleteExports);
    public const string CanManageUsers = nameof(CanManageUsers);
    public const string CanViewAuditLogs = nameof(CanViewAuditLogs);
    public const string CanManageMirth = nameof(CanManageMirth);
    public const string PatientDataAccess = nameof(PatientDataAccess);

    public static readonly Dictionary<string, string[]> PolicyRoles = new()
    {
        [CanReadPatients] = ["admin", "practitioner", "nurse", "front_desk", "patient"],
        [CanWritePatients] = ["admin", "practitioner"],
        [CanReadVitals] = ["admin", "practitioner", "nurse", "patient"],
        [CanWriteVitals] = ["admin", "practitioner", "nurse"],
        [CanReadConditions] = ["admin", "practitioner", "nurse", "patient"],
        [CanWriteConditions] = ["admin", "practitioner"],
        [CanReadMedications] = ["admin", "practitioner", "nurse", "patient"],
        [CanWriteMedications] = ["admin", "practitioner"],
        [CanReadLabs] = ["admin", "practitioner", "nurse", "patient"],
        [CanOrderLabs] = ["admin", "practitioner"],
        [CanReadClinicalOverviews] = ["admin", "practitioner", "nurse"],
        [CanManageExports] = ["admin", "practitioner"],
        [CanDeleteExports] = ["admin"],
        [CanManageUsers] = ["admin"],
        [CanViewAuditLogs] = ["admin"],
        [CanManageMirth] = ["admin"],
    };
}
