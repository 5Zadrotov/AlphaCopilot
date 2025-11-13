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

        [HttpPost("login")]
        public IActionResult Login([FromBody] AuthRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Email и пароль обязательны" });

            var authResponse = _authService.Authenticate(request.Email, request.Password);
            if (authResponse == null)
                return Unauthorized(new { message = "Неверный email или пароль" });

            return Ok(new
            {
                authResponse.Token,
                authResponse.Email,
                authResponse.DisplayName
            });
        }

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
    }
}