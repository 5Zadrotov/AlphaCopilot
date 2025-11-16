using WebApp.Models.Dto;

namespace WebApp.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse?> AuthenticateAsync(string email, string password);
        bool RegisterUser(string email, string password, string fullName, out string message);

        Task<AuthResponse?> RefreshTokenAsync(string refreshToken);
        Task<bool> RevokeRefreshTokenAsync(string refreshToken);
    }
}