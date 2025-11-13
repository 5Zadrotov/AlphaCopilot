using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Interfaces;
using WebApp.Models.DbModels;
using WebApp.Models.Dto;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController(IAiService aiService) : ControllerBase
    {
        private readonly IAiService _aiService = aiService;
        private static readonly Dictionary<Guid, List<ChatMessage>> _sessions = [];

        [HttpPost("message")]
        public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
                return BadRequest("Сообщение не может быть пустым");

            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized("Неверный формат идентификатора пользователя");
            }

            //eсли sessionId не указан или пустой - создаем новую сессию
            if (string.IsNullOrEmpty(request.SessionId) || !Guid.TryParse(request.SessionId, out Guid sessionId))
            {
                sessionId = Guid.NewGuid();
                _sessions[sessionId] = [];
            }
            else if (!_sessions.ContainsKey(sessionId))
            {
                _sessions[sessionId] = [];
            }

            var userMessage = new ChatMessage
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Content = request.Content,
                IsFromUser = true,
                Category = request.Category,
                Timestamp = DateTime.UtcNow
            };
            _sessions[sessionId].Add(userMessage);

            try
            {
                var aiResponse = await _aiService.GetResponseAsync(request.Content, request.Category, userId);

                var aiMessage = new ChatMessage
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Content = aiResponse,
                    IsFromUser = false,
                    Category = request.Category,
                    Timestamp = DateTime.UtcNow
                };
                _sessions[sessionId].Add(aiMessage);

                return Ok(new
                {
                    sessionId = sessionId.ToString(),
                    userMessage,
                    aiMessage
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при получении ответа от AI: {ex.Message}");
            }
        }

        [HttpGet("history")]
        public IActionResult GetHistory([FromQuery] string? sessionId = null)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized("Неверный формат идентификатора пользователя");
            }

            if (string.IsNullOrEmpty(sessionId))
            {
                // Возвращаем последнюю активную сессию или создаем новую
                var allSessions = _sessions
                    .Where(s => s.Value.Any(m => m.UserId == userId))
                    .OrderByDescending(s => s.Value.LastOrDefault()?.Timestamp)
                    .FirstOrDefault();

                if (allSessions.Key == Guid.Empty)
                {
                    var newSessionId = Guid.NewGuid();
                    _sessions[newSessionId] = [];
                    return Ok(new { sessionId = newSessionId.ToString(), messages = new List<ChatMessage>() });
                }

                return Ok(new
                {
                    sessionId = allSessions.Key.ToString(),
                    messages = allSessions.Value.Where(m => m.UserId == userId).OrderBy(m => m.Timestamp).ToList()
                });
            }
            else if (Guid.TryParse(sessionId, out var guid) && _sessions.TryGetValue(guid, out var messages))
            {
                return Ok(new
                {
                    sessionId,
                    messages = messages.Where(m => m.UserId == userId).OrderBy(m => m.Timestamp).ToList()
                });
            }

            return NotFound("Сессия не найдена");
        }
    }
}