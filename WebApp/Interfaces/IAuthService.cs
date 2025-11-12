using WebApp.Models.Dto;

namespace WebApp.Interfaces
{
    public interface IAuthService
    {
        AuthResponse? Authenticate(string email, string password);
        bool RegisterUser(string email, string password, string fullName, out string message);
    }
}