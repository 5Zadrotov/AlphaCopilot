using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using WebApp.Data;
using WebApp.Interfaces;
using WebApp.Models.DbModels;
using WebApp.Models.Dto;

namespace WebApp.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _configuration;

        private readonly int _jwtHours;
        private readonly int _refreshDays;

        public AuthService(ApplicationDbContext db, IConfiguration configuration)
        {
            _db = db;
            _configuration = configuration;
            _jwtHours = int.TryParse(_configuration["Jwt:TokenExpirationHours"], out var h) ? h : 1;
            _refreshDays = int.TryParse(_configuration["Jwt:RefreshTokenDays"], out var d) ? d : 14;
        }

        public async Task<AuthResponse?> AuthenticateAsync(string email, string password)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                    return null;

                var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email);
                if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                    return null;

                var jwt = GenerateJwtToken(user);
                var (refreshTokenPlain, refreshTokenEntity) = CreateRefreshTokenForUser(user.Id);

                await _db.RefreshTokens.AddAsync(refreshTokenEntity);
                await _db.SaveChangesAsync();
                user.LastLogin = DateTime.UtcNow;
                return new AuthResponse
                {
                    Token = jwt,
                    Email = user.Email,
                    DisplayName = !string.IsNullOrEmpty(user.FullName) ? user.FullName : user.Email.Split('@')[0],
                    RefreshToken = refreshTokenPlain,
                    RefreshTokenExpiresAt = refreshTokenEntity.ExpiresAt
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

        public async Task<AuthResponse?> RefreshTokenAsync(string refreshToken)
        {
            try
            {
                var hash = HashToken(refreshToken);
                var tokenEntity = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
                if (tokenEntity == null) return null;
                if (tokenEntity.RevokedAt != null) return null;
                if (tokenEntity.ExpiresAt <= DateTime.UtcNow) return null;

                var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == tokenEntity.UserId);
                if (user == null) return null;

                // rotate: revoke old and create new
                tokenEntity.RevokedAt = DateTime.UtcNow;

                var (newRefreshPlain, newRefreshEntity) = CreateRefreshTokenForUser(user.Id);
                tokenEntity.ReplacedByTokenHash = newRefreshEntity.TokenHash;

                await _db.RefreshTokens.AddAsync(newRefreshEntity);
                _db.RefreshTokens.Update(tokenEntity);
                await _db.SaveChangesAsync();

                var jwt = GenerateJwtToken(user);

                return new AuthResponse
                {
                    Token = jwt,
                    Email = user.Email,
                    DisplayName = !string.IsNullOrEmpty(user.FullName) ? user.FullName : user.Email.Split('@')[0],
                    RefreshToken = newRefreshPlain,
                    RefreshTokenExpiresAt = newRefreshEntity.ExpiresAt
                };
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
        {
            var hash = HashToken(refreshToken);
            var tokenEntity = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
            if (tokenEntity == null) return false;
            if (tokenEntity.RevokedAt is null)
            {
                tokenEntity.RevokedAt = DateTime.UtcNow;
                _db.RefreshTokens.Update(tokenEntity);
                await _db.SaveChangesAsync();
            }
            return true;
        }

        private (string plain, RefreshToken entity) CreateRefreshTokenForUser(Guid userId)
        {
            var bytes = new byte[64];
            RandomNumberGenerator.Fill(bytes);
            var plain = Convert.ToBase64String(bytes);

            var entity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TokenHash = HashToken(plain),
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(_refreshDays)
            };

            return (plain, entity);
        }

        private static string HashToken(string token)
        {
            var data = Encoding.UTF8.GetBytes(token);
            var hash = SHA256.HashData(data);
            return Convert.ToBase64String(hash);
        }

        private string GenerateJwtToken(User user)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_configuration["Jwt:SecretKey"]!);
                var tokenExpirationHours = _jwtHours;

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(
                    [
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new Claim(ClaimTypes.Name, user.Email),
                        new Claim(ClaimTypes.Email, user.Email),
                        new Claim(ClaimTypes.Role, user.Role??"User")
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