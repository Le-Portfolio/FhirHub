namespace FhirHubServer.Api.Common.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.Headers.Remove("Server");
        context.Response.Headers.Remove("X-Powered-By");

        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-XSS-Protection"] = "0";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";

        var path = context.Request.Path.Value ?? "";
        if (path.StartsWith("/swagger"))
        {
            // Swagger UI needs its own styles and scripts
            context.Response.Headers["Content-Security-Policy"] =
                "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; frame-ancestors 'none'";
            context.Response.Headers["X-Frame-Options"] = "DENY";
        }
        else
        {
            // API endpoints — restrictive CSP for JSON responses
            context.Response.Headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
            context.Response.Headers["X-Frame-Options"] = "DENY";
        }

        await _next(context);
    }
}
