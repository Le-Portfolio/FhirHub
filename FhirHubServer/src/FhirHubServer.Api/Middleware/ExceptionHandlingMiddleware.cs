using System.Net;
using System.Text.Json;
using FhirHubServer.Core.DTOs.Common;

namespace FhirHubServer.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, error) = exception switch
        {
            KeyNotFoundException => (HttpStatusCode.NotFound, new ApiError("NOT_FOUND", exception.Message, 404)),
            ArgumentException => (HttpStatusCode.BadRequest, new ApiError("BAD_REQUEST", exception.Message, 400)),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, new ApiError("UNAUTHORIZED", exception.Message, 401)),
            _ => (HttpStatusCode.InternalServerError, new ApiError("INTERNAL_ERROR", "An unexpected error occurred", 500))
        };

        context.Response.StatusCode = (int)statusCode;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(error, options));
    }
}
