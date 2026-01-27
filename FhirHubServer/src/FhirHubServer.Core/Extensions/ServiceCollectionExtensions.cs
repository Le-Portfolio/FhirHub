using FhirHubServer.Core.Services;
using Microsoft.Extensions.DependencyInjection;

namespace FhirHubServer.Core.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCoreServices(this IServiceCollection services)
    {
        services.AddScoped<PatientService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<ExportService>();

        return services;
    }
}
