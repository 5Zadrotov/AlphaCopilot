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
                return BadRequest(new { message = "Сообщение не может быть пустым" });

            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized(new { message = "Неверный формат идентификатора пользователя" });

            // idempotency key from header
            var idempotencyKey = Request.Headers.TryGetValue("Idempotency-Key", out Microsoft.Extensions.Primitives.StringValues value) ? value.FirstOrDefault() : null;
            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                var idempotencyService = HttpContext.RequestServices.GetRequiredService<IIdempotencyService>();
                var existing = await idempotencyService.TryGetAsync(idempotencyKey, userId);

                if (existing.Found)
                {
                    // return cached JSON with status code
                    return new ContentResult
                    {
                        Content = existing.ResponseJson,
                        ContentType = "application/json",
                        StatusCode = existing.StatusCode
                    };
                }
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
                    BusinessType = request?.Category ?? "Малый бизнес",
                    SelectedCategory = request?.Category ?? "Общее",
                    StartedAt = DateTime.UtcNow,
                    LastActivity = DateTime.UtcNow,
                    Title = $"Сессия для {request?.Category ?? "Малый бизнес"}"
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
                        BusinessType = request?.Category ?? "Малый бизнес",
                        SelectedCategory = request?.Category ?? "Общее",
                        StartedAt = DateTime.UtcNow,
                        LastActivity = DateTime.UtcNow,
                        Title = $"Сессия для {request?.Category ?? "Малый бизнес"}"
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
                    Content = aiResponse ?? string.Empty,
                    IsFromUser = false,
                    Category = request.Category,
                    Timestamp = DateTime.UtcNow
                };

                await _db.ChatMessages.AddAsync(aiMessage);
                session.LastActivity = DateTime.UtcNow;
                _db.ChatSessions.Update(session);
                await _db.SaveChangesAsync();

                // LLM лог
                try
                {
                    await _llmLogService.CreateLogAsync(new LlmLog
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        RequestText = request.Content.Length > 2000 ? string.Concat(request.Content.AsSpan(0, 2000), "...") : request.Content,
                        ResponseText = aiResponse?.Length > 4000 ? string.Concat(aiResponse.AsSpan(0, 4000), "...") : aiResponse ?? string.Empty,
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
                var err = new { message = $"Ошибка при получении ответа от AI: {ex.Message}" };
                var errJson = System.Text.Json.JsonSerializer.Serialize(err, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });

                if (!string.IsNullOrWhiteSpace(Request.Headers["Idempotency-Key"]))
                {
                    var idempotency = HttpContext.RequestServices.GetRequiredService<IIdempotencyService>();
                    await idempotency.SaveAsync(Request.Headers["Idempotency-Key"].FirstOrDefault() ?? string.Empty, userId, "POST", HttpContext.Request.Path, 500, errJson, TimeSpan.FromDays(1));
                }

                return StatusCode(500, err);
            }
        }

        // GET api/Chat/messages?sessionId={id}&page={n}&pageSize={m}
        [HttpGet("messages")]
        public async Task<IActionResult> GetMessages([FromQuery] string sessionId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (string.IsNullOrEmpty(sessionId))
                return BadRequest(new { message = "sessionId обязателен" });

            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized(new { message = "Неверный формат идентификатора пользователя" });

            var session = await _db.ChatSessions.AsNoTracking().FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);
            if (session == null)
                return NotFound(new { message = "Сессия не найдена" });

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
                return BadRequest(new { message = "Content обязателен" });

            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            var message = await _db.ChatMessages.FirstOrDefaultAsync(m => m.Id == messageId);
            if (message == null) return NotFound(new { message = "Сообщение не найдено" });
            if (message.UserId != userId) return Forbid();

            if (!message.IsFromUser) return BadRequest(new { message = "Нельзя редактировать сообщение от AI" });

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
            if (message == null) return NotFound(new { message = "Сообщение не найдено" });
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

            // Простое сохранение фидбека в LlmLogs (как запись для аналитики)
            var feedbackText = $"Feedback rating={request.Rating}; comment={request.Comment}";
            try
            {
                await _llmLogService.CreateLogAsync(new LlmLog
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

            return Ok(new { message = "Feedback saved" });
        }
    }
}
