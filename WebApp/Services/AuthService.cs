using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WebApp.Data;
using WebApp.Interfaces;
using WebApp.Models.DbModels;
using WebApp.Models.Dto;

namespace WebApp.Services
{
    public class AuthService(ApplicationDbContext db, IConfiguration configuration) : IAuthService
    {
        private readonly ApplicationDbContext _db = db;
        private readonly IConfiguration _configuration = configuration;

        public AuthResponse? Authenticate(string email, string password)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                    return null;

                var user = _db.Users.AsNoTracking().FirstOrDefault(u => u.Email == email);
                if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                    return null;

                var token = GenerateJwtToken(user);
                if (string.IsNullOrEmpty(token))
                    return null;

                return new AuthResponse
                {
                    Token = token,
                    Email = user.Email,
                    DisplayName = !string.IsNullOrEmpty(user.FullName) ? user.FullName : user.Email.Split('@')[0]
                };
            }
            catch
            {
                return null;
            }
        }

        public bool RegisterUser(string email, string password, string fullName, out string message)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                {
                    message = "Email обязателен для заполнения.";
                    return false;
                }
                if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
                {
                    message = "Пароль должен содержать не менее 6 символов.";
                    return false;
                }
                if (_db.Users.Any(u => u.Email == email))
                {
                    message = "Пользователь с таким email уже существует.";
                    return false;
                }
                if (!IsValidEmail(email))
                {
                    message = "Некорректный формат email.";
                    return false;
                }

                var newUser = new User
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                    FullName = fullName,
                    CreatedAt = DateTime.UtcNow
                };

                _db.Users.Add(newUser);
                _db.SaveChanges();

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
                        new Claim(ClaimTypes.Name, user.Email),
                        new Claim(ClaimTypes.Email, user.Email)
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