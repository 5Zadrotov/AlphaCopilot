using WebApp.Interfaces;
using WebApp.Models.Dto;

namespace WebApp.Services;

public class MockAuthService : IAuthService
{
    private readonly Dictionary<string, string> _users = new()
    {
        { "admin", "admin" },
        { "test", "test" }
    };

    public Task<AuthResponse?> AuthenticateAsync(string username, string password)
    {
        if (_users.TryGetValue(username, out var storedPassword) && storedPassword == password)
        {
            return Task.FromResult<AuthResponse?>(new AuthResponse
            {
                Token = GenerateToken(),
                UserId = Guid.NewGuid().ToString()
            });
        }
        return Task.FromResult<AuthResponse?>(null);
    }

    public bool RegisterUser(string username, string password, string fullName, out string message)
    {
        if (_users.ContainsKey(username))
        {
            message = "Пользователь уже существует";
            return false;
        }

        _users[username] = password;
        message = "Успешно";
        return true;
    }

    public Task<AuthResponse?> RefreshTokenAsync(string refreshToken)
    {
        return Task.FromResult<AuthResponse?>(new AuthResponse
        {
            Token = GenerateToken(),
            UserId = Guid.NewGuid().ToString()
        });
    }

    public Task<bool> RevokeRefreshTokenAsync(string refreshToken)
    {
        return Task.FromResult(true);
    }

    private static string GenerateToken()
    {
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray());
    }
}