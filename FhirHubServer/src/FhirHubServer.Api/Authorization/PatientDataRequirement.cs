using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace FhirHubServer.Api.Authorization;

public class PatientDataRequirement : IAuthorizationRequirement { }

public class PatientDataAuthorizationHandler : AuthorizationHandler<PatientDataRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PatientDataAuthorizationHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PatientDataRequirement requirement)
    {
        // Admin, practitioner, nurse, and front_desk can access any patient data
        var bypassRoles = new[] { "admin", "practitioner", "nurse", "front_desk" };
        foreach (var role in bypassRoles)
        {
            if (context.User.IsInRole(role))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }
        }

        // For patient role: check that the requested patient ID matches their own
        if (context.User.IsInRole("patient"))
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var routePatientId = httpContext?.Request.RouteValues["id"]?.ToString();
            var userPatientId = context.User.FindFirstValue("fhir_patient_id");

            if (!string.IsNullOrEmpty(routePatientId)
                && !string.IsNullOrEmpty(userPatientId)
                && routePatientId == userPatientId)
            {
                context.Succeed(requirement);
            }
        }

        return Task.CompletedTask;
    }
}
