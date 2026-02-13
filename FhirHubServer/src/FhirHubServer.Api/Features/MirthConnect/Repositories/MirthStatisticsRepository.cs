using System.Data;
using Dapper;
using FhirHubServer.Api.Common.DependencyInjection;
using FhirHubServer.Api.Common.Infrastructure;
using FhirHubServer.Api.Features.MirthConnect.Models;

namespace FhirHubServer.Api.Features.MirthConnect.Repositories;

public class MirthStatisticsRepository : IMirthStatisticsRepository, IScopedService
{
    private readonly IMirthDbConnectionFactory _connectionFactory;
    private readonly IMirthChannelRepository _channelRepository;
    private readonly ILogger<MirthStatisticsRepository> _logger;

    public MirthStatisticsRepository(
        IMirthDbConnectionFactory connectionFactory,
        IMirthChannelRepository channelRepository,
        ILogger<MirthStatisticsRepository> logger)
    {
        _connectionFactory = connectionFactory;
        _channelRepository = channelRepository;
        _logger = logger;
    }

    public async Task<MirthStatisticsEntity?> GetChannelStatisticsAsync(string channelId, CancellationToken ct = default)
    {
        var localId = await _channelRepository.GetLocalChannelIdAsync(channelId, ct);
        if (localId is null) return null;

        using var conn = await _connectionFactory.CreateOpenConnectionAsync(ct);

        var tableName = $"d_ms{localId}";
        if (!await TableExistsAsync(conn, tableName, ct))
            return new MirthStatisticsEntity { ChannelId = channelId };

        // metadata_id IS NULL = channel-level aggregate row (avoids double-counting connectors)
        var stats = await conn.QuerySingleOrDefaultAsync<MirthStatisticsEntity>(new CommandDefinition(
            $"SELECT COALESCE(received, 0) AS Received, COALESCE(sent, 0) AS Sent, " +
            $"COALESCE(error, 0) AS Error, COALESCE(filtered, 0) AS Filtered " +
            $"FROM {tableName} WHERE metadata_id IS NULL",
            cancellationToken: ct));

        if (stats is null) return new MirthStatisticsEntity { ChannelId = channelId };

        stats.ChannelId = channelId;

        var mmTable = $"d_mm{localId}";
        if (await TableExistsAsync(conn, mmTable, ct))
        {
            stats.Queued = await conn.ExecuteScalarAsync<long>(new CommandDefinition(
                $"SELECT COUNT(*) FROM {mmTable} WHERE status = 'Q'",
                cancellationToken: ct));
        }

        return stats;
    }

    public async Task<List<MirthStatisticsEntity>> GetAllChannelStatisticsAsync(CancellationToken ct = default)
    {
        var mappings = await _channelRepository.GetAllChannelMappingsAsync(ct);
        var results = new List<MirthStatisticsEntity>();

        using var conn = await _connectionFactory.CreateOpenConnectionAsync(ct);

        foreach (var mapping in mappings)
        {
            var tableName = $"d_ms{mapping.LocalChannelId}";
            if (!await TableExistsAsync(conn, tableName, ct))
            {
                results.Add(new MirthStatisticsEntity { ChannelId = mapping.ChannelId });
                continue;
            }

            try
            {
                var stats = await conn.QuerySingleOrDefaultAsync<MirthStatisticsEntity>(new CommandDefinition(
                    $"SELECT COALESCE(received, 0) AS Received, COALESCE(sent, 0) AS Sent, " +
                    $"COALESCE(error, 0) AS Error, COALESCE(filtered, 0) AS Filtered " +
                    $"FROM {tableName} WHERE metadata_id IS NULL",
                    cancellationToken: ct));

                if (stats is null)
                {
                    results.Add(new MirthStatisticsEntity { ChannelId = mapping.ChannelId });
                    continue;
                }

                stats.ChannelId = mapping.ChannelId;

                var mmTable = $"d_mm{mapping.LocalChannelId}";
                if (await TableExistsAsync(conn, mmTable, ct))
                {
                    stats.Queued = await conn.ExecuteScalarAsync<long>(new CommandDefinition(
                        $"SELECT COUNT(*) FROM {mmTable} WHERE status = 'Q'",
                        cancellationToken: ct));
                }

                results.Add(stats);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get statistics for channel {ChannelId}", mapping.ChannelId);
                results.Add(new MirthStatisticsEntity { ChannelId = mapping.ChannelId });
            }
        }

        return results;
    }

    private static async Task<bool> TableExistsAsync(IDbConnection conn, string tableName, CancellationToken ct)
    {
        return await conn.ExecuteScalarAsync<bool>(new CommandDefinition(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = @TableName)",
            new { TableName = tableName },
            cancellationToken: ct));
    }
}
