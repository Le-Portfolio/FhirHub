using System.Data;
using Dapper;
using FhirHubServer.Api.Common.DependencyInjection;
using FhirHubServer.Api.Common.Infrastructure;
using FhirHubServer.Api.Features.MirthConnect.DTOs;
using FhirHubServer.Api.Features.MirthConnect.Models;

namespace FhirHubServer.Api.Features.MirthConnect.Repositories;

public class MirthMessageRepository : IMirthMessageRepository, IScopedService
{
    private readonly IMirthDbConnectionFactory _connectionFactory;
    private readonly IMirthChannelRepository _channelRepository;
    private readonly ILogger<MirthMessageRepository> _logger;

    private static readonly Dictionary<string, string> StatusFilterMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["RECEIVED"] = "R",
        ["SENT"] = "S",
        ["ERROR"] = "E",
        ["FILTERED"] = "F",
        ["QUEUED"] = "Q",
        ["TRANSFORMED"] = "T",
        ["PENDING"] = "P",
    };

    public MirthMessageRepository(
        IMirthDbConnectionFactory connectionFactory,
        IMirthChannelRepository channelRepository,
        ILogger<MirthMessageRepository> logger)
    {
        _connectionFactory = connectionFactory;
        _channelRepository = channelRepository;
        _logger = logger;
    }

    public async Task<MirthMessageListDto> GetMessagesAsync(string channelId, MirthMessageSearchParams searchParams, CancellationToken ct = default)
    {
        var localId = await _channelRepository.GetLocalChannelIdAsync(channelId, ct);
        if (localId is null) return new MirthMessageListDto([], 0);

        using var conn = await _connectionFactory.CreateOpenConnectionAsync(ct);

        var mTable = $"d_m{localId}";
        var mmTable = $"d_mm{localId}";
        var mcTable = $"d_mc{localId}";

        if (!await TableExistsAsync(conn, mTable, ct))
            return new MirthMessageListDto([], 0);

        // Build WHERE clause for messages
        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        if (!string.IsNullOrEmpty(searchParams.StartDate) && DateTime.TryParse(searchParams.StartDate, out var startDate))
        {
            whereClauses.Add("m.received_date >= @StartDate");
            parameters.Add("StartDate", startDate);
        }

        if (!string.IsNullOrEmpty(searchParams.EndDate) && DateTime.TryParse(searchParams.EndDate, out var endDate))
        {
            whereClauses.Add("m.received_date <= @EndDate");
            parameters.Add("EndDate", endDate);
        }

        // Status filter requires a join to connector metadata
        string? statusChar = null;
        if (!string.IsNullOrEmpty(searchParams.Status) && StatusFilterMap.TryGetValue(searchParams.Status, out var sc))
        {
            statusChar = sc;
        }

        var whereClause = whereClauses.Count > 0 ? "WHERE " + string.Join(" AND ", whereClauses) : "";

        string countSql;
        string messageSql;
        if (statusChar is not null)
        {
            parameters.Add("StatusChar", statusChar);
            var statusFilter = whereClause.Length > 0 ? " AND mm.status = @StatusChar" : " WHERE mm.status = @StatusChar";
            countSql = $"SELECT COUNT(DISTINCT m.id) FROM {mTable} m INNER JOIN {mmTable} mm ON m.id = mm.message_id {whereClause}{statusFilter}";
            messageSql = $"SELECT DISTINCT m.id AS Id, m.server_id AS ServerId, m.received_date AS ReceivedDate, m.processed AS Processed FROM {mTable} m INNER JOIN {mmTable} mm ON m.id = mm.message_id {whereClause}{statusFilter} ORDER BY m.id DESC LIMIT @Limit OFFSET @Offset";
        }
        else
        {
            countSql = $"SELECT COUNT(*) FROM {mTable} m {whereClause}";
            messageSql = $"SELECT m.id AS Id, m.server_id AS ServerId, m.received_date AS ReceivedDate, m.processed AS Processed FROM {mTable} m {whereClause} ORDER BY m.id DESC LIMIT @Limit OFFSET @Offset";
        }

        parameters.Add("Limit", searchParams.Limit);
        parameters.Add("Offset", searchParams.Offset);

        var total = await conn.ExecuteScalarAsync<int>(new CommandDefinition(countSql, parameters, cancellationToken: ct));
        var messages = (await conn.QueryAsync<MirthMessageEntity>(new CommandDefinition(messageSql, parameters, cancellationToken: ct))).ToList();

        if (messages.Count == 0)
            return new MirthMessageListDto([], total);

        var messageIds = messages.Select(m => m.Id).ToList();

        // Load connector metadata and content for all messages
        var connectorMessages = await LoadConnectorMetadataAsync(conn, mmTable, messageIds, ct);
        var contents = await LoadContentAsync(conn, mcTable, messageIds, ct);

        var dtos = messages.Select(m => MapToDto(m, channelId, connectorMessages, contents)).ToList();
        return new MirthMessageListDto(dtos, total);
    }

    public async Task<MirthMessageDto?> GetMessageByIdAsync(string channelId, long messageId, CancellationToken ct = default)
    {
        var localId = await _channelRepository.GetLocalChannelIdAsync(channelId, ct);
        if (localId is null) return null;

        using var conn = await _connectionFactory.CreateOpenConnectionAsync(ct);

        var mTable = $"d_m{localId}";
        var mmTable = $"d_mm{localId}";
        var mcTable = $"d_mc{localId}";

        if (!await TableExistsAsync(conn, mTable, ct))
            return null;

        var message = await conn.QuerySingleOrDefaultAsync<MirthMessageEntity>(new CommandDefinition(
            $"SELECT id AS Id, server_id AS ServerId, received_date AS ReceivedDate, processed AS Processed FROM {mTable} WHERE id = @MessageId",
            new { MessageId = messageId },
            cancellationToken: ct));

        if (message is null) return null;

        var messageIds = new List<long> { messageId };
        var connectorMessages = await LoadConnectorMetadataAsync(conn, mmTable, messageIds, ct);
        var contents = await LoadContentAsync(conn, mcTable, messageIds, ct);

        return MapToDto(message, channelId, connectorMessages, contents);
    }

    private static async Task<List<MirthConnectorMetadataEntity>> LoadConnectorMetadataAsync(
        IDbConnection conn, string mmTable, List<long> messageIds, CancellationToken ct)
    {
        if (!await TableExistsAsync(conn, mmTable, ct))
            return [];

        var results = await conn.QueryAsync<MirthConnectorMetadataEntity>(new CommandDefinition(
            $"SELECT id AS MetadataId, message_id AS MessageId, status AS Status, " +
            $"connector_name AS ConnectorName, received_date AS ReceivedDate, response_date AS ResponseDate " +
            $"FROM {mmTable} WHERE message_id = ANY(@MessageIds) ORDER BY id",
            new { MessageIds = messageIds.ToArray() },
            cancellationToken: ct));

        return results.ToList();
    }

    private static async Task<List<MirthContentEntity>> LoadContentAsync(
        IDbConnection conn, string mcTable, List<long> messageIds, CancellationToken ct)
    {
        if (!await TableExistsAsync(conn, mcTable, ct))
            return [];

        var results = await conn.QueryAsync<MirthContentEntity>(new CommandDefinition(
            $"SELECT message_id AS MessageId, metadata_id AS MetadataId, content_type AS ContentType, " +
            $"content AS Content, data_type AS DataType " +
            $"FROM {mcTable} WHERE message_id = ANY(@MessageIds)",
            new { MessageIds = messageIds.ToArray() },
            cancellationToken: ct));

        return results.ToList();
    }

    private static MirthMessageDto MapToDto(
        MirthMessageEntity message,
        string channelId,
        List<MirthConnectorMetadataEntity> allConnectorMessages,
        List<MirthContentEntity> allContents)
    {
        var connectors = allConnectorMessages
            .Where(cm => cm.MessageId == message.Id)
            .Select(cm =>
            {
                var msgContents = allContents
                    .Where(c => c.MessageId == message.Id && c.MetadataId == cm.MetadataId)
                    .ToList();

                return new MirthConnectorMessageDto(
                    cm.MetadataId,
                    cm.ConnectorName,
                    cm.StatusString,
                    cm.ReceivedDate,
                    cm.ResponseDate,
                    MapContent(msgContents, 1),   // RAW
                    MapContent(msgContents, 3),   // ENCODED
                    MapContent(msgContents, 4),   // SENT
                    MapContent(msgContents, 6),   // RESPONSE
                    MapContent(msgContents, 12));  // PROCESSING_ERROR
            })
            .ToList();

        return new MirthMessageDto(
            message.Id,
            channelId,
            message.ServerId,
            message.ReceivedDate,
            message.Processed,
            connectors);
    }

    private static MirthMessageContentDto? MapContent(List<MirthContentEntity> contents, int contentType)
    {
        var content = contents.FirstOrDefault(c => c.ContentType == contentType);
        return content is null ? null : new MirthMessageContentDto(content.DataType, content.Content);
    }

    private static async Task<bool> TableExistsAsync(IDbConnection conn, string tableName, CancellationToken ct)
    {
        return await conn.ExecuteScalarAsync<bool>(new CommandDefinition(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = @TableName)",
            new { TableName = tableName },
            cancellationToken: ct));
    }
}
