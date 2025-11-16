using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using WebApp.Interfaces;
using WebApp.Models.DbModels;
using WebApp.Models.Dto;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController(IAiService aiService, IDataService dataService, ILlmLogService llmLogService, ILogger<ChatController> logger) : ControllerBase
    {
        private readonly IAiService _aiService = aiService;
        private readonly IDataService _dataService = dataService;
        private readonly ILlmLogService _llmLogService = llmLogService;
        private readonly ILogger<ChatController> _logger = logger;
        private static readonly Dictionary<Guid, List<ChatMessage>> _sessions = [];

        [HttpPost("message")]
        [AllowAnonymous]
        public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest request)
        {
            _logger.LogInformation("Incoming chat message (category={Category})", request?.Category ?? "null");

            if (request == null || string.IsNullOrWhiteSpace(request.Content))
            {
                _logger.LogWarning("Empty chat message received.");
                return BadRequest("Сообщение не может быть пустым");
            }

            var userId = Guid.NewGuid();
            if (!string.IsNullOrEmpty(request.SessionId) && Guid.TryParse(request.SessionId, out var sessionUserId))
            {
                userId = sessionUserId;
            }

            if (string.IsNullOrEmpty(request.SessionId) || !Guid.TryParse(request.SessionId, out Guid sessionId))
            {
                sessionId = Guid.NewGuid();
                _sessions[sessionId] = [];
                _logger.LogInformation("Created new chat session {SessionId} for user {UserId}.", sessionId, userId);
            }
            else if (!_sessions.ContainsKey(sessionId))
            {
                _sessions[sessionId] = [];
                _logger.LogInformation("Created missing chat session {SessionId} for user {UserId}.", sessionId, userId);
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
                _logger.LogDebug("Calling IAiService for user {UserId}, session {SessionId}.", userId, sessionId);
                var aiResponse = await _aiService.GetResponseAsync(request.Content, request.Category, userId);
                _logger.LogInformation("AI responded for user {UserId}, session {SessionId}, responseLength={Len}.", userId, sessionId, aiResponse?.Length ?? 0);

                var aiMessage = new ChatMessage
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Content = aiResponse ?? "Ошибка получения ответа",
                    IsFromUser = false,
                    Category = request.Category,
                    Timestamp = DateTime.UtcNow
                };
                _sessions[sessionId].Add(aiMessage);

                try
                {
                    await _llmLogService.CreateLogAsync(new LlmLog
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        RequestText = request.Content.Length > 2000 ? request.Content.Substring(0, 2000) + "..." : request.Content,
                        ResponseText = aiResponse?.Length > 4000 ? aiResponse.Substring(0, 4000) + "..." : aiResponse ?? "Ошибка получения ответа",
                        ModelUsed = null,
                        TokensInput = 0,
                        TokensOutput = 0
                    });
                }
                catch (Exception exLog)
                {
                    _logger.LogWarning(exLog, "Failed to persist LLM log for user {UserId}.", userId);
                }

                return Ok(new
                {
                    message = aiResponse,
                    sessionId = sessionId.ToString(),
                    success = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while processing chat message for user {UserId}.", userId);
                return StatusCode(500, $"Ошибка обработки сообщения AI: {ex.Message}");
            }
        }

        [HttpGet("history")]
        public IActionResult GetHistory([FromQuery] string? sessionId = null)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                _logger.LogWarning("Unauthorized history request or invalid user id in token.");
                return Unauthorized("Неверный токен авторизации");
            }

            if (string.IsNullOrEmpty(sessionId))
            {
                var allSessions = _sessions
                    .Where(s => s.Value.Any(m => m.UserId == userId))
                    .OrderByDescending(s => s.Value.LastOrDefault()?.Timestamp)
                    .FirstOrDefault();

                if (allSessions.Key == Guid.Empty)
                {
                    var newSessionId = Guid.NewGuid();
                    _sessions[newSessionId] = new List<ChatMessage>();
                    _logger.LogInformation("No sessions found for user {UserId}, created new session {SessionId}.", userId, newSessionId);
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

            _logger.LogWarning("Requested history for non-existent session {SessionId} by user {UserId}.", sessionId, userId);
            return NotFound("Сессия не найдена");
        }
    }
}