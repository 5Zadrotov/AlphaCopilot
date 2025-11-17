using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using WebApp.Interfaces;
using WebApp.Models.DbModels;
using WebApp.Models.Dto;
using WebApp.Services;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController(IAiService aiService, ILlmLogService llmLogService, IChatSessionService sessionService, ILogger<ChatController> logger) : ControllerBase
    {
        private readonly IAiService _aiService = aiService;
        private readonly ILlmLogService _llmLogService = llmLogService;
        private readonly IChatSessionService _sessionService = sessionService;
        private readonly ILogger<ChatController> _logger = logger;

        [HttpPost("message")]
        public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest request)
        {
            _logger.LogInformation("Incoming chat message (category={Category})", request?.Category ?? "null");

            if (request == null || string.IsNullOrWhiteSpace(request.Content))
            {
                _logger.LogWarning("Empty chat message received.");
                return BadRequest(new { error = "Сообщение не может быть пустым" });
            }

            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                _logger.LogWarning("Unauthorized chat message request or invalid user id in token.");
                return Unauthorized(new { error = "Неверный токен авторизации" });
            }

            try
            {
                var session = await _sessionService.GetOrCreateSessionAsync(userId);
                var sessionId = session.Id;

                var userMessage = new ChatMessage
                {
                    Id = Guid.NewGuid(),
                    SessionId = sessionId,
                    UserId = userId,
                    Content = request.Content,
                    IsFromUser = true,
                    Category = request.Category,
                    Timestamp = DateTime.UtcNow
                };
                await _sessionService.AddMessageAsync(sessionId, userMessage);

                _logger.LogDebug("Calling IAiService for user {UserId}, session {SessionId}.", userId, sessionId);
                var aiResponse = await _aiService.GetResponseAsync(request.Content, request.Category, userId);
                
                if (string.IsNullOrWhiteSpace(aiResponse))
                {
                    _logger.LogWarning("AI returned empty response for user {UserId}.", userId);
                    aiResponse = "Извините, я не смог сформировать ответ на ваш вопрос.";
                }
                
                _logger.LogInformation("AI responded for user {UserId}, session {SessionId}, responseLength={Len}.", userId, sessionId, aiResponse?.Length ?? 0);

                var aiMessage = new ChatMessage
                {
                    Id = Guid.NewGuid(),
                    SessionId = sessionId,
                    UserId = userId,
                    Content = aiResponse,
                    IsFromUser = false,
                    Category = request.Category,
                    Timestamp = DateTime.UtcNow
                };
                await _sessionService.AddMessageAsync(sessionId, aiMessage);

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
                    success = true,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while processing chat message for user {UserId}.", userId);
                return StatusCode(500, new { error = "Ошибка обработки сообщения AI", details = ex.Message });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                _logger.LogWarning("Unauthorized history request or invalid user id in token.");
                return Unauthorized(new { error = "Неверный токен авторизации" });
            }

            try
            {
                var session = await _sessionService.GetOrCreateSessionAsync(userId);
                var messages = await _sessionService.GetMessagesAsync(session.Id, userId);

                return Ok(new
                {
                    sessionId = session.Id.ToString(),
                    messages = messages
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching chat history for user {UserId}.", userId);
                return StatusCode(500, new { error = "Ошибка получения истории" });
            }
        }
    }
}
