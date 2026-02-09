using System.Security.Claims;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using FhirHubServer.Api.Common.Authorization;
using FhirHubServer.Api.Common.Configuration;
using FhirHubServer.Api.Common.DependencyInjection;
using FhirHubServer.Api.Common.Infrastructure;
using FhirHubServer.Api.Common.Middleware;
using FhirHubServer.Api.Features.PatientManagement.Validators;
using FhirHubServer.Api.Features.SmartConfiguration;
using FhirHubServer.Api.Features.MirthConnect.Services;
using FhirHubServer.Api.Features.UserManagement.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Prometheus;
using Serilog;

// Configure Serilog early for startup logging
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting FhirHub API");

    var builder = WebApplication.CreateBuilder(args);

    // Serilog configuration from appsettings
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());

    // CORS
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? ["http://localhost:7002"];

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", policy =>
            policy.WithOrigins(allowedOrigins)
                  .WithHeaders("Authorization", "Content-Type", "Accept", "X-Requested-With")
                  .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                  .SetPreflightMaxAge(TimeSpan.FromMinutes(10))
                  .AllowCredentials());
    });

    // Rate Limiting
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.OnRejected = async (context, cancellationToken) =>
        {
            context.HttpContext.Response.Headers["Retry-After"] = "60";
            await context.HttpContext.Response.WriteAsync(
                "Too many requests. Please try again later.", cancellationToken);
        };

        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 100,
                    Window = TimeSpan.FromMinutes(1)
                }));

        options.AddSlidingWindowLimiter("WriteOperations", limiterOptions =>
        {
            limiterOptions.PermitLimit = 20;
            limiterOptions.Window = TimeSpan.FromMinutes(1);
            limiterOptions.SegmentsPerWindow = 4;
        });
    });

    // Keycloak OIDC Authentication
    var keycloakSettings = builder.Configuration.GetSection("Keycloak");

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.Authority = keycloakSettings["Authority"];
        options.Audience = keycloakSettings["Audience"];
        options.RequireHttpsMetadata = keycloakSettings.GetValue<bool>("RequireHttpsMetadata", true);

        // Build set of accepted issuers - both internal Docker URL and public HTTPS URL
        var acceptedIssuers = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var authority = keycloakSettings["Authority"];
        if (!string.IsNullOrEmpty(authority))
            acceptedIssuers.Add(authority);
        var publicIssuer = keycloakSettings["PublicIssuer"];
        if (!string.IsNullOrEmpty(publicIssuer))
            acceptedIssuers.Add(publicIssuer);

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            IssuerValidator = (issuer, token, parameters) =>
            {
                if (acceptedIssuers.Contains(issuer))
                    return issuer;
                // Also accept the issuer from OIDC discovery metadata
                if (parameters.ValidIssuers?.Contains(issuer) == true)
                    return issuer;
                throw new SecurityTokenInvalidIssuerException(
                    $"IDX10205: Issuer '{issuer}' not in accepted issuers: [{string.Join(", ", acceptedIssuers)}]");
            },
            ValidateAudience = true,
            ValidateLifetime = true,
            NameClaimType = "preferred_username",
            RoleClaimType = ClaimTypes.Role
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Log.Warning("Authentication failed: {Error}", context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Log.Debug("Token validated for {User}", context.Principal?.Identity?.Name);
                return Task.CompletedTask;
            }
        };
    });

    // Keycloak role mapping
    builder.Services.AddTransient<Microsoft.AspNetCore.Authentication.IClaimsTransformation, KeycloakClaimsTransformer>();

    builder.Services.AddHttpContextAccessor();
    builder.Services.AddSingleton<IAuthorizationHandler, PatientDataAuthorizationHandler>();

    builder.Services.AddAuthorization(options =>
    {
        // Register role-based policies from the policy matrix
        foreach (var (policyName, roles) in AuthorizationPolicies.PolicyRoles)
        {
            options.AddPolicy(policyName, policy => policy.RequireRole(roles));
        }

        // Register custom patient data access policy
        options.AddPolicy(AuthorizationPolicies.PatientDataAccess, policy =>
            policy.Requirements.Add(new PatientDataRequirement()));
    });

    // Controllers with FluentValidation
    builder.Services.AddControllers();
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddValidatorsFromAssemblyContaining<RecordVitalsRequestValidator>();

    // Swagger with JWT support
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "Enter your JWT token"
        });

        options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    // Auto-discover and register all services/repositories via marker interfaces
    builder.Services.AddApplicationServices();

    // Options configuration
    builder.Services.Configure<HapiFhirOptions>(builder.Configuration.GetSection("HapiFhir"));
    builder.Services.Configure<KeycloakAdminOptions>(options =>
    {
        options.AdminApiBaseUrl = builder.Configuration["Keycloak:AdminApiBaseUrl"] ?? "http://localhost:8180";
        options.Realm = builder.Configuration["Keycloak:Realm"] ?? "fhirhub";
        options.BackendClientId = builder.Configuration["Keycloak:BackendClientId"] ?? "fhirhub-backend";
        options.BackendClientSecret = builder.Configuration["Keycloak:BackendClientSecret"] ?? "";
    });
    builder.Services.Configure<SmartConfigOptions>(options =>
    {
        options.PublicIssuer = builder.Configuration["Keycloak:PublicIssuer"]
            ?? builder.Configuration["Keycloak:Authority"]
            ?? "http://localhost:8180/realms/fhirhub";
    });

    // Mirth Connect configuration
    builder.Services.Configure<MirthConnectOptions>(builder.Configuration.GetSection("MirthConnect"));

    // Special registrations (HttpClient factory, framework interfaces)
    builder.Services.AddHttpClient<IKeycloakAdminService, KeycloakAdminService>();

    builder.Services.AddHttpClient<IMirthConnectService, MirthConnectService>()
        .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator,
            UseCookies = false
        })
        .ConfigureHttpClient((sp, client) =>
        {
            var options = sp.GetRequiredService<IOptions<MirthConnectOptions>>().Value;
            client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
        });

    var app = builder.Build();

    // Serilog request logging
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    });

    // Exception handling middleware
    app.UseMiddleware<ExceptionHandlingMiddleware>();

    // Security headers
    app.UseMiddleware<SecurityHeadersMiddleware>();

    // Rate limiting
    app.UseRateLimiter();

    // Swagger (always enabled for now)
    app.UseSwagger();
    app.UseSwaggerUI();

    // CORS
    app.UseCors("Frontend");

    // Avoid noisy redirect warnings in local/container dev where only HTTP is bound.
    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    // Authentication & Authorization
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    // Prometheus metrics
    app.UseHttpMetrics();
    app.MapMetrics();

    Log.Information("FhirHub API started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
