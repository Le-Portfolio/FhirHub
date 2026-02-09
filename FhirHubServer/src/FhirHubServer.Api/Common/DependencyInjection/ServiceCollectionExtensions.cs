using System.Reflection;

namespace FhirHubServer.Api.Common.DependencyInjection;

public static class ServiceCollectionExtensions
{
    private static readonly Type[] MarkerInterfaces =
    [
        typeof(IScopedService),
        typeof(ISingletonService),
        typeof(ITransientService)
    ];

    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        var implementationTypes = assembly.GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false })
            .Where(t => MarkerInterfaces.Any(m => m.IsAssignableFrom(t)));

        foreach (var implementationType in implementationTypes)
        {
            var serviceInterface = implementationType.GetInterfaces()
                .FirstOrDefault(i => !MarkerInterfaces.Contains(i) && i.Namespace?.StartsWith("FhirHubServer") == true);

            if (serviceInterface is null)
                continue;

            if (typeof(IScopedService).IsAssignableFrom(implementationType))
                services.AddScoped(serviceInterface, implementationType);
            else if (typeof(ISingletonService).IsAssignableFrom(implementationType))
                services.AddSingleton(serviceInterface, implementationType);
            else if (typeof(ITransientService).IsAssignableFrom(implementationType))
                services.AddTransient(serviceInterface, implementationType);
        }

        return services;
    }
}
