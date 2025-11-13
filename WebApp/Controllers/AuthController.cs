using Microsoft.AspNetCore.Mvc;
using WebApp.Interfaces;
using WebApp.Models.Dto;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(IAuthService authService) : ControllerBase
    {
        private readonly IAuthService _authService = authService;
        // POST api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Email и пароль обязательны" });

            var authResponse = await _authService.AuthenticateAsync(request.Email, request.Password);
            if (authResponse == null)
                return Unauthorized(new { message = "Неверный email или пароль" });

            return Ok(authResponse);
        }
        // POST api/auth/register
        [HttpPost("register")]
        public IActionResult Register([FromBody] UserRegistrationRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new
                {
                    message = "Ошибка валидации",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });

            var success = _authService.RegisterUser(request.Email, request.Password, request.FullName, out string message);
            if (!success)
            {
                if (message.Contains("уже существует") || message.Contains("already exists"))
                    return Conflict(new { message });
                if (message.Contains("пароль") || message.Contains("email") || message.Contains("валидация"))
                    return BadRequest(new { message });
                return StatusCode(500, new { message = $"Ошибка сервера: {message}" });
            }

            return CreatedAtAction(nameof(Login), new { email = request.Email },
                new { message = "Пользователь успешно зарегистрирован", email = request.Email });
        }

        // POST api/auth/refresh
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest(new { message = "RefreshToken ����������" });

            var authResponse = await _authService.RefreshTokenAsync(request.RefreshToken);
            if (authResponse == null)
                return Unauthorized(new { message = "Refresh token ������� ��� ����" });

            return Ok(authResponse);
        }

        // POST api/auth/logout
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest(new { message = "RefreshToken ����������" });

            var ok = await _authService.RevokeRefreshTokenAsync(request.RefreshToken);
            if (!ok)
                return NotFound(new { message = "Refresh token �� ������" });

            return NoContent();
        }
    }
}