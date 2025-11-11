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
            var authResponse = _authService.Authenticate(request.Username, request.Password);

            if (authResponse == null)
                return Unauthorized(new { message = "Неверное имя пользователя или пароль" });

            return Ok(authResponse);
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] UserRegistrationRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var success = _authService.RegisterUser(request.Username, request.Password, request.Email);

            if (!success)
                return BadRequest(new { message = "Пользователь с таким именем уже существует" });

            return Ok(new { message = "Регистрация прошла успешно" });
        }
    }
}