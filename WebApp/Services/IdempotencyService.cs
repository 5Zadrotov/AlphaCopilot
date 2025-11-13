using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WebApp.Data;
using WebApp.Interfaces;
using WebApp.Models.DbModels;

namespace WebApp.Services;

public class IdempotencyService(ApplicationDbContext db, ILogger<IdempotencyService> logger) : IIdempotencyService
{
    private readonly ApplicationDbContext _db = db;
    private readonly ILogger<IdempotencyService> _logger = logger;
    private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task<(bool Found, int StatusCode, string ResponseJson)> TryGetAsync(string key, Guid userId)
    {
        if (string.IsNullOrWhiteSpace(key)) return (false, 0, string.Empty);

        var rec = await _db.IdempotencyRecords.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Key == key && r.UserId == userId && r.ExpiresAt > DateTime.UtcNow);

        if (rec == null) return (false, 0, string.Empty);
        return (true, rec.StatusCode, rec.ResponseBody ?? string.Empty);
    }

    public async Task SaveAsync(string key, Guid userId, string method, string path, int statusCode, string responseJson, TimeSpan? ttl = null)
    {
        if (string.IsNullOrWhiteSpace(key)) return;

        try
        {
            var maxLen = 10000;
            if (responseJson?.Length > maxLen)
                responseJson = string.Concat(responseJson.AsSpan(0, maxLen), "...");

            var record = new IdempotencyRecord
            {
                Id = Guid.NewGuid(),
                Key = key,
                UserId = userId,
                Method = method ?? string.Empty,
                Path = path ?? string.Empty,
                StatusCode = statusCode,
                ResponseBody = responseJson ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.Add(ttl ?? TimeSpan.FromDays(7))
            };

            _db.IdempotencyRecords.Add(record);
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException dbex)
        {
            // race condition: another request saved same key concurrently
            _logger.LogInformation(dbex, "Idempotency record write race for key {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to save idempotency record for key {Key}", key);
        }
    }
}