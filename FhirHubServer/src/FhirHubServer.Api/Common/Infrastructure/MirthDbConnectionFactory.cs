using System.Data;
using FhirHubServer.Api.Common.Configuration;
using FhirHubServer.Api.Common.DependencyInjection;
using Microsoft.Extensions.Options;
using Npgsql;

namespace FhirHubServer.Api.Common.Infrastructure;

public class MirthDbConnectionFactory : IMirthDbConnectionFactory, ISingletonService
{
    private readonly MirthDatabaseOptions _options;

    public MirthDbConnectionFactory(IOptions<MirthDatabaseOptions> options)
    {
        _options = options.Value;
    }

    public IDbConnection CreateConnection()
    {
        return new NpgsqlConnection(_options.ConnectionString);
    }

    public async Task<IDbConnection> CreateOpenConnectionAsync(CancellationToken ct = default)
    {
        var connection = new NpgsqlConnection(_options.ConnectionString);
        await connection.OpenAsync(ct);
        return connection;
    }
}
