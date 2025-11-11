using WebApp.Models;

namespace WebApp.Interfaces
{
    public interface IAuthService
    {
        AuthResponse? Authenticate(string username, string password);
        bool RegisterUser(string username, string password, string email, out string message);
    }
}
