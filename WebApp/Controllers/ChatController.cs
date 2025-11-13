using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        // POST api/Chat/message  (создать/использовать сессию, сохранить сообщения, получить ответ AI)
        [HttpPost("message")]
        public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest request)
        {
            _logger.LogInformation("Incoming chat message (category={Category})", request?.Category ?? "null");

            if (request == null || string.IsNullOrWhiteSpace(request.Content))
            {
                _logger.LogWarning("Empty chat message received.");
                return BadRequest(new { message = "Сообщение не может быть пустым" });
            }

            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                _logger.LogWarning("Unauthorized request or invalid user id in token.");
                return Unauthorized(new { message = "Неверный формат идентификатора пользователя" });
            }

            // Найдём или создадим сессию по публичному SessionId (string)
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
                _logger.LogInformation("Created new chat session {SessionId} for user {UserId}.", session.SessionId, userId);
            }
            else
            {
                session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.SessionId == request.SessionId && s.UserId == userId);
                if (session == null)
                {
                    // создаём, если не найдено
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
                    _logger.LogInformation("Created missing chat session {SessionId} for user {UserId}.", session.SessionId, userId);
                }
            }

            // Сохраняем сообщение пользователя
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
                _logger.LogDebug("Calling IAiService for user {UserId}, session {SessionId}.", userId, session.SessionId);
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
                // обновим lastActivity сессии
                session.LastActivity = DateTime.UtcNow;
                _db.ChatSessions.Update(session);

                await _db.SaveChangesAsync();

                // Сохраняем LLM лог (усечённый)
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

                return Ok(new
                {
                    sessionId = session.SessionId,
                    userMessage,
                    aiMessage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while processing chat message for user {UserId}.", userId);
                return StatusCode(500, new { message = $"Ошибка при получении ответа от AI: {ex.Message}" });
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
    }
}