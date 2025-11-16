namespace WebApp.Interfaces;

public interface IIdempotencyService
{
    Task<(bool Found, int StatusCode, string ResponseJson)> TryGetAsync(string key, Guid userId);
    Task SaveAsync(string key, Guid userId, string method, string path, int statusCode, string responseJson, TimeSpan? ttl = null);
}