using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WebApp.Data;
using WebApp.Interfaces;
using WebApp.Models.DbModels;
using WebApp.Models.Dto;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController(IDataService dataService, ApplicationDbContext db, IAiService aiService, ILlmLogService llmLogService, ILogger<ChatController> logger) : ControllerBase
    {
        private readonly IDataService _dataService = dataService;
        private readonly ApplicationDbContext _db = db;
        private readonly IAiService _aiService = aiService;
        private readonly ILlmLogService _llmLogService = llmLogService;
        private readonly ILogger<ChatController> _logger = logger;

        // POST api/Chat/message
        [HttpPost("message")]
        public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Content))
            {
                _logger.LogWarning("Empty chat message received.");
                return BadRequest("Сообщение не может быть пустым");
            }

            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized(new { message = "�������� ������ �������������� ������������" });

            // idempotency key from header
            var idempotencyKey = Request.Headers.TryGetValue("Idempotency-Key", out Microsoft.Extensions.Primitives.StringValues value) ? value.FirstOrDefault() : null;
            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                _logger.LogWarning("Unauthorized request or invalid user id in token.");
                return Unauthorized("Неверный токен авторизации");
            }

            // --- existing logic to find/create session and save userMessage ---
            ChatSession session;
            if (string.IsNullOrEmpty(request.SessionId))
            {
                session = new ChatSession
                {
                    Id = Guid.NewGuid(),
                    SessionId = Guid.NewGuid().ToString(),
                    UserId = userId,
                    BusinessType = request?.Category ?? "����� ������",
                    SelectedCategory = request?.Category ?? "�����",
                    StartedAt = DateTime.UtcNow,
                    LastActivity = DateTime.UtcNow,
                    Title = $"������ ��� {request?.Category ?? "����� ������"}"
                };
                await _db.ChatSessions.AddAsync(session);
                await _db.SaveChangesAsync();
            }
            else
            {
                session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.SessionId == request.SessionId && s.UserId == userId);
                if (session == null)
                {
                    session = new ChatSession
                    {
                        Id = Guid.NewGuid(),
                        SessionId = request.SessionId,
                        UserId = userId,
                        BusinessType = request?.Category ?? "����� ������",
                        SelectedCategory = request?.Category ?? "�����",
                        StartedAt = DateTime.UtcNow,
                        LastActivity = DateTime.UtcNow,
                        Title = $"������ ��� {request?.Category ?? "����� ������"}"
                    };
                    await _db.ChatSessions.AddAsync(session);
                    await _db.SaveChangesAsync();
                }
            }

            var userMessage = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                UserId = userId,
                Content = request.Content,
                IsFromUser = true,
                Category = request.Category,
                Timestamp = DateTime.UtcNow
            };

            await _db.ChatMessages.AddAsync(userMessage);
            await _db.SaveChangesAsync();

            try
            {
                var aiResponse = await _aiService.GetResponseAsync(request.Content, request.Category, userId);

                var aiMessage = new ChatMessage
                {
                    Id = Guid.NewGuid(),
                    SessionId = session.Id,
                    UserId = userId,
                    Content = aiResponse ?? "Ошибка получения ответа",
                    IsFromUser = false,
                    Category = request.Category,
                    Timestamp = DateTime.UtcNow
                };

                await _db.ChatMessages.AddAsync(aiMessage);
                session.LastActivity = DateTime.UtcNow;
                _db.ChatSessions.Update(session);
                await _db.SaveChangesAsync();

                // LLM ���
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

                // prepare response object and json
                var responseObj = new
                {
                    sessionId = session.SessionId,
                    userMessage,
                    aiMessage
                };
                var json = System.Text.Json.JsonSerializer.Serialize(responseObj, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });

                // save idempotency record if key provided
                if (!string.IsNullOrWhiteSpace(idempotencyKey))
                {
                    var idempotency = HttpContext.RequestServices.GetRequiredService<IIdempotencyService>();
                    await idempotency.SaveAsync(idempotencyKey, userId, "POST", HttpContext.Request.Path, 200, json, TimeSpan.FromDays(7));
                }

                return Ok(responseObj);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while processing chat message for user {UserId}.", userId);
                return StatusCode(500, $"Ошибка обработки сообщения AI: {ex.Message}");
            }
        }

        // GET api/Chat/messages?sessionId={id}&page={n}&pageSize={m}
        [HttpGet("messages")]
        public async Task<IActionResult> GetMessages([FromQuery] string sessionId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (string.IsNullOrEmpty(sessionId))
                return BadRequest(new { message = "sessionId ����������" });

            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized(new { message = "�������� ������ �������������� ������������" });

            var session = await _db.ChatSessions.AsNoTracking().FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);
            if (session == null)
                return NotFound(new { message = "������ �� �������" });

            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;
            var skip = (page - 1) * pageSize;

            var query = _db.ChatMessages.AsNoTracking()
                .Where(m => m.SessionId == session.Id)
                .OrderBy(m => m.Timestamp);

            var total = await query.CountAsync();
            var messages = await query.Skip(skip).Take(pageSize).ToListAsync();

            return Ok(new
            {
                sessionId = session.SessionId,
                page,
                pageSize,
                total,
                messages
            });
        }

        // PATCH api/Chat/message/{messageId}
        [HttpPatch("message/{messageId:guid}")]
        public async Task<IActionResult> EditMessage(Guid messageId, [FromBody] EditMessageRequest request)
        {
            if (request is null || string.IsNullOrWhiteSpace(request.Content))
                return BadRequest(new { message = "Content ����������" });

            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            var message = await _db.ChatMessages.FirstOrDefaultAsync(m => m.Id == messageId);
            if (message == null) return NotFound(new { message = "��������� �� �������" });
            if (message.UserId != userId) return Forbid();

            if (!message.IsFromUser) return BadRequest(new { message = "������ ������������� ��������� �� AI" });

            message.Content = request.Content;
            message.Timestamp = DateTime.UtcNow;

            _db.ChatMessages.Update(message);
            await _db.SaveChangesAsync();

            return Ok(message);
        }

        // DELETE api/Chat/message/{messageId}
        [HttpDelete("message/{messageId:guid}")]
        public async Task<IActionResult> DeleteMessage(Guid messageId)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            var message = await _db.ChatMessages.FirstOrDefaultAsync(m => m.Id == messageId);
            if (message == null) return NotFound(new { message = "��������� �� �������" });
            if (message.UserId != userId) return Forbid();

            _db.ChatMessages.Remove(message);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // POST api/Chat/feedback
        [HttpPost("feedback")]
        public async Task<IActionResult> Feedback([FromBody] FeedbackRequest request)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            // ������� ���������� ������� � LlmLogs (��� ������ ��� ���������)
            var feedbackText = $"Feedback rating={request.Rating}; comment={request.Comment}";
            try
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
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    RequestText = $"Feedback for message {request.MessageId}",
                    ResponseText = feedbackText,
                    ModelUsed = "feedback",
                    TokensInput = 0,
                    TokensOutput = 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to persist feedback log.");
            }

            _logger.LogWarning("Requested history for non-existent session {SessionId} by user {UserId}.", sessionId, userId);
            return NotFound("Сессия не найдена");
        }
    }
}
