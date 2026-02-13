using System.Data;

namespace FhirHubServer.Api.Common.Infrastructure;

public interface IMirthDbConnectionFactory
{
    IDbConnection CreateConnection();
    Task<IDbConnection> CreateOpenConnectionAsync(CancellationToken ct = default);
}
