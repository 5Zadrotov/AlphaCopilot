using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WebApp.Interfaces;
using WebApp.Models;

namespace WebApp.Services
{
    public class AuthService : IAuthService
    {
        private readonly List<User> _users = [];
        private readonly IConfiguration _configuration;

        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;

            //для тестирования
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
            var user = _users.FirstOrDefault(u => u.Username == username);

            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return null;

            var token = GenerateJwtToken(user);
            return new AuthResponse
            {
                Token = token,
                Username = user.Username
            };
        }

        public bool RegisterUser(string username, string password, string email)
        {
            if (_users.Any(u => u.Username == username))
                return false;

            var newUser = new User
            {
                Id = _users.Count + 1,
                Username = username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Email = email
            };

            _users.Add(newUser);
            return true;
        }

        private string GenerateJwtToken(User user)
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
    }
}
