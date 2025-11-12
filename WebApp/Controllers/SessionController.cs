using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models.DbModels;
using WebApp.Models.Dto;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SessionController : ControllerBase
    {
        private static readonly Dictionary<Guid, ChatSession> _sessions = new();

        [HttpPost("new")]
        public IActionResult NewSession([FromBody] NewChatSessionRequest request)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized("Неверный формат идентификатора пользователя");
            }

            var sessionId = Guid.NewGuid();
            var session = new ChatSession
            {
                SessionId = sessionId.ToString(),
                UserId = userId,
                BusinessType = request.BusinessType ?? "Малый бизнес",
                SelectedCategory = "Общее",
                StartedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            };

            _sessions[sessionId] = session;
            return Ok(new { sessionId = session.SessionId, message = "Новая сессия создана" });
        }

        [HttpGet("list")]
        public IActionResult GetSessions()
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized("Неверный формат идентификатора пользователя");
            }

            var userSessions = _sessions.Values
                .Where(s => s.UserId == userId)
                .Select(s => new
                {
                    s.SessionId,
                    s.BusinessType,
                    s.SelectedCategory,
                    s.StartedAt,
                    s.LastActivity
                })
                .ToList();

            return Ok(userSessions);
        }
    }
}