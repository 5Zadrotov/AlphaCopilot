using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using WebApp.Interfaces;
using WebApp.Models;
using WebApp.Models.DbModels;

namespace WebApp.Services
{
    public class AuthService : IAuthService
    {
        private readonly List<User> _users = [];
        private readonly IConfiguration _configuration;

        // Демо-пользователь для тестирования
        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;
            _users.Add(new User
            {
                Id = 1,
                Username = "some",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("69696969"),
                Email = "some@example.com"
            });
        }

        public AuthResponse? Authenticate(string username, string password)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                    return null;

                var user = _users.FirstOrDefault(u => u.Username == username);

                if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                    return null;

                var token = GenerateJwtToken(user);
                if (string.IsNullOrEmpty(token))
                    return null;

                return new AuthResponse
                {
                    Token = token,
                    Username = user.Username
                };
            }
            catch
            {
                return null;
            }
        }

        public bool RegisterUser(string username, string password, string email, out string message)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(username) || username.Length < 4)
                {
                    message = "Имя пользователя должно содержать не менее 4 символов.";
                    return false;
                }

                if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
                {
                    message = "Пароль должен содержать не менее 6 символов.";
                    return false;
                }

                if (string.IsNullOrWhiteSpace(email))
                {
                    message = "Email обязателен для заполнения.";
                    return false;
                }

                if (_users.Any(u => u.Username == username))
                {
                    message = "Имя пользователя уже занято.";
                    return false;
                }

                if (_users.Any(u => u.Email == email))
                {
                    message = "Email уже занят.";
                    return false;
                }

                if (!IsValidEmail(email))
                {
                    message = "Некорректный формат email.";
                    return false;
                }

                var newUser = new User
                {
                    Id = _users.Count + 1,
                    Username = username,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                    Email = email
                };

                _users.Add(newUser);
                message = "Пользователь успешно зарегистрирован.";
                return true;
            }
            catch (Exception ex)
            {
                message = $"Внутренняя ошибка сервера: {ex.Message}.";
                return false;
            }
        }

        private string GenerateJwtToken(User user)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_configuration["Jwt:SecretKey"]!);
                var tokenExpirationHours = int.Parse(_configuration["Jwt:TokenExpirationHours"]!);

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(
                    [
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new Claim(ClaimTypes.Name, user.Username)
                    ]),
                    Expires = DateTime.UtcNow.AddHours(tokenExpirationHours),
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);
                return tokenHandler.WriteToken(token);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка генерации токена: {ex.Message}");
                return string.Empty;
            }
        }

        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}