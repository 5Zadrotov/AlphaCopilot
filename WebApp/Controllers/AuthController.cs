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
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Username и пароль обязательны" });

            var authResponse = await _authService.AuthenticateAsync(request.Username, request.Password);
            if (authResponse == null)
                return Unauthorized(new { message = "Неверные данные" });

            return Ok(new { token = authResponse.Token, userId = authResponse.UserId });
        }
        
        // POST api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegistrationRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Username и пароль обязательны" });

            var success = _authService.RegisterUser(request.Username, request.Password, request.Username, out string message);
            if (!success)
                return BadRequest(new { message });

            var authResponse = await _authService.AuthenticateAsync(request.Username, request.Password);
            return Ok(new { token = authResponse?.Token, userId = authResponse?.UserId });
        }

        // POST api/auth/refresh
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest(new { message = "RefreshToken пуст" });

            var authResponse = await _authService.RefreshTokenAsync(request.RefreshToken);
            if (authResponse == null)
                return Unauthorized(new { message = "Ошибка refresh token" });

            return Ok(authResponse);
        }

        // POST api/auth/logout
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest(new { message = "RefreshToken отсутсвует" });

            var ok = await _authService.RevokeRefreshTokenAsync(request.RefreshToken);
            if (!ok)
                return NotFound(new { message = "Ошибка refresh token" });

            return NoContent();
        }
    }
}