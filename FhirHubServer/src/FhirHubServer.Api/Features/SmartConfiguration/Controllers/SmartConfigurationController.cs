using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace FhirHubServer.Api.Features.SmartConfiguration.Controllers;

[ApiController]
[AllowAnonymous]
public class SmartConfigurationController : ControllerBase
{
    private readonly SmartConfigOptions _options;

    public SmartConfigurationController(IOptions<SmartConfigOptions> options)
    {
        _options = options.Value;
    }

    [HttpGet("fhir/.well-known/smart-configuration")]
    public IActionResult GetSmartConfiguration()
    {
        var issuer = _options.PublicIssuer.TrimEnd('/');

        return Ok(new
        {
            authorization_endpoint = $"{issuer}/protocol/openid-connect/auth",
            token_endpoint = $"{issuer}/protocol/openid-connect/token",
            scopes_supported = _options.ScopesSupported,
            response_types_supported = new[] { "code" },
            grant_types_supported = new[] { "authorization_code" },
            code_challenge_methods_supported = new[] { "S256" },
            capabilities = new[]
            {
                "launch-standalone",
                "client-public",
                "sso-openid-connect",
                "permission-patient"
            }
        });
    }
}
