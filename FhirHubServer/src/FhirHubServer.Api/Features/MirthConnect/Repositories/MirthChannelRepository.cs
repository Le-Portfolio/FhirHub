using Dapper;
using FhirHubServer.Api.Common.DependencyInjection;
using FhirHubServer.Api.Common.Infrastructure;
using FhirHubServer.Api.Features.MirthConnect.Models;

namespace FhirHubServer.Api.Features.MirthConnect.Repositories;

public class MirthChannelRepository : IMirthChannelRepository, IScopedService
{
    private readonly IMirthDbConnectionFactory _connectionFactory;
    private readonly ILogger<MirthChannelRepository> _logger;

    public MirthChannelRepository(
        IMirthDbConnectionFactory connectionFactory,
        ILogger<MirthChannelRepository> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task<List<MirthChannelEntity>> GetAllChannelsAsync(CancellationToken ct = default)
    {
        using var conn = await _connectionFactory.CreateOpenConnectionAsync(ct);
        var results = await conn.QueryAsync<MirthChannelEntity>(new CommandDefinition(
            "SELECT id AS Id, name AS Name, revision AS Revision, channel AS ChannelXml FROM channel",
            cancellationToken: ct));
        return results.ToList();
    }

    public async Task<MirthChannelEntity?> GetChannelByIdAsync(string channelId, CancellationToken ct = default)
    {
        using var conn = await _connectionFactory.CreateOpenConnectionAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<MirthChannelEntity>(new CommandDefinition(
            "SELECT id AS Id, name AS Name, revision AS Revision, channel AS ChannelXml FROM channel WHERE id = @ChannelId",
            new { ChannelId = channelId },
            cancellationToken: ct));
    }

    public async Task<int?> GetLocalChannelIdAsync(string channelId, CancellationToken ct = default)
    {
        using var conn = await _connectionFactory.CreateOpenConnectionAsync(ct);
        return await conn.QuerySingleOrDefaultAsync<int?>(new CommandDefinition(
            "SELECT local_channel_id FROM d_channels WHERE channel_id = @ChannelId",
            new { ChannelId = channelId },
            cancellationToken: ct));
    }

    public async Task<List<ChannelIdMapping>> GetAllChannelMappingsAsync(CancellationToken ct = default)
    {
        using var conn = await _connectionFactory.CreateOpenConnectionAsync(ct);
        var results = await conn.QueryAsync<ChannelIdMapping>(new CommandDefinition(
            "SELECT channel_id AS ChannelId, local_channel_id AS LocalChannelId FROM d_channels",
            cancellationToken: ct));
        return results.ToList();
    }
}
