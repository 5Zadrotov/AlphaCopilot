using Microsoft.AspNetCore.Mvc;
using WebApp.Interfaces;
using WebApp.Models;

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
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Имя пользователя и пароль обязательны для заполнения." });

            var authResponse = _authService.Authenticate(request.Username, request.Password);

            if (authResponse == null)
                return Unauthorized(new { message = "Неверное имя пользователя или пароль" });

            return Ok(authResponse);
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] UserRegistrationRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new
                {
                    message = "Некорректные данные запроса",
                    errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                });

            var success = _authService.RegisterUser(request.Username, request.Password, request.Email, out string message);

            if (!success)
            {
                if (message.Contains("занято") || message.Contains("уже существует"))
                    return Conflict(new { message });

                if (message.Contains("некорректный") || message.Contains("невалидный") || message.Contains("короткий"))
                    return BadRequest(new { message });

                return StatusCode(500, new { message = $"Ошибка сервера: {message}" });
            }

            return CreatedAtAction(nameof(Login), new { username = request.Username },
                new { message = "Регистрация прошла успешно", username = request.Username });
        }
    }
}