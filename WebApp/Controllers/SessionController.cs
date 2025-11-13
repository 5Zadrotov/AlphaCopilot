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
    public class SessionController(ApplicationDbContext db, ILogger<SessionController> logger) : ControllerBase
    {
        private readonly ApplicationDbContext _db = db;
        private readonly ILogger<SessionController> _logger = logger;

        // GET api/Session/{sessionId}  (sessionId � ��������� string SessionId)
        [HttpGet("{sessionId}")]
        public async Task<IActionResult> GetSession(string sessionId)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized("�������� ������ �������������� ������������");

            var session = await _db.ChatSessions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound(new { message = "������ �� �������" });

            return Ok(new
            {
                session.SessionId,
                session.Id,
                session.Title,
                session.BusinessType,
                session.SelectedCategory,
                session.StartedAt,
                session.LastActivity
            });
        }

        // PATCH api/Session/{sessionId}
        [HttpPatch("{sessionId}")]
        public async Task<IActionResult> UpdateSession(string sessionId, [FromBody] SessionUpdateRequest request)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized("�������� ������ �������������� ������������");

            var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);
            if (session == null)
                return NotFound(new { message = "������ �� �������" });

            var changed = false;
            if (!string.IsNullOrWhiteSpace(request.Title) && request.Title != session.Title)
            {
                session.Title = request.Title;
                changed = true;
            }
            if (!string.IsNullOrWhiteSpace(request.SelectedCategory) && request.SelectedCategory != session.SelectedCategory)
            {
                session.SelectedCategory = request.SelectedCategory;
                changed = true;
            }
            if (!string.IsNullOrWhiteSpace(request.BusinessType) && request.BusinessType != session.BusinessType)
            {
                session.BusinessType = request.BusinessType;
                changed = true;
            }

            if (changed)
            {
                session.LastActivity = DateTime.UtcNow;
                try
                {
                    _db.ChatSessions.Update(session);
                    await _db.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to update session {SessionId} for user {UserId}.", sessionId, userId);
                    return StatusCode(500, new { message = "�� ������� �������� ������" });
                }
            }

            return Ok(new
            {
                session.SessionId,
                session.Id,
                session.Title,
                session.BusinessType,
                session.SelectedCategory,
                session.StartedAt,
                session.LastActivity
            });
        }

        // DELETE api/Session/{sessionId}
        [HttpDelete("{sessionId}")]
        public async Task<IActionResult> DeleteSession(string sessionId)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized("�������� ������ �������������� ������������");

            var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);
            if (session == null)
                return NotFound(new { message = "������ �� �������" });

            try
            {
                // ������� ���������, ��������� � �������, ����� ���� ������
                var messages = _db.ChatMessages.Where(m => m.SessionId == session.Id);
                _db.ChatMessages.RemoveRange(messages);
                _db.ChatSessions.Remove(session);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Deleted session {SessionId} and messages for user {UserId}.", sessionId, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete session {SessionId} for user {UserId}.", sessionId, userId);
                return StatusCode(500, new { message = "�� ������� ������� ������" });
            }
        }

        [HttpPost("new")]
        public async Task<IActionResult> NewSession([FromBody] NewChatSessionRequest request)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                _logger.LogWarning("Unauthorized attempt to create session.");
                return Unauthorized("Неверный токен авторизации");
            }

            var idempotencyKey = Request.Headers.TryGetValue("Idempotency-Key", out Microsoft.Extensions.Primitives.StringValues value) ? value.FirstOrDefault() : null;
            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                var existing = await HttpContext.RequestServices.GetRequiredService<IIdempotencyService>().TryGetAsync(idempotencyKey, userId);
                if (existing.Found)
                {
                    return new ContentResult
                    {
                        Content = existing.ResponseJson,
                        ContentType = "application/json",
                        StatusCode = existing.StatusCode
                    };
                }
            }

            var session = new ChatSession
            {
                Id = Guid.NewGuid(),
                SessionId = Guid.NewGuid().ToString(),
                UserId = userId,
                BusinessType = string.IsNullOrWhiteSpace(request?.BusinessType) ? "Общий бизнес" : request.BusinessType!,
                SelectedCategory = "Общее",
                StartedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow,
                Title = $"Сессия {request?.BusinessType ?? "Общий бизнес"}"
            };

            try
            {
                await _db.ChatSessions.AddAsync(session);
                await _db.SaveChangesAsync();

                var resp = new { sessionId = session.SessionId, message = "����� ������ �������" };
                var json = System.Text.Json.JsonSerializer.Serialize(resp, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });
                if (!string.IsNullOrWhiteSpace(idempotencyKey))
                    await HttpContext.RequestServices.GetRequiredService<IIdempotencyService>().SaveAsync(idempotencyKey, userId, "POST", HttpContext.Request.Path, 200, json, TimeSpan.FromDays(7));

                _logger.LogInformation("Created new chat session {SessionId} for user {UserId}.", session.SessionId, userId);
                return Ok(new { sessionId = session.SessionId, message = "Сессия создана успешно" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create chat session for user {UserId}.", userId);
                return StatusCode(500, "Ошибка создания сессии");
            }
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetSessions()
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                _logger.LogWarning("Unauthorized attempt to list sessions.");
                return Unauthorized("Неверный токен авторизации");
            }

            try
            {
                var userSessions = await _db.ChatSessions
                    .AsNoTracking()
                    .Where(s => s.UserId == userId)
                    .OrderByDescending(s => s.LastActivity)
                    .Select(s => new
                    {
                        s.SessionId,
                        s.BusinessType,
                        s.SelectedCategory,
                        s.StartedAt,
                        s.LastActivity,
                        s.Title,
                        s.Id
                    })
                    .ToListAsync();

                _logger.LogDebug("Returned {Count} sessions for user {UserId}.", userSessions.Count, userId);
                return Ok(userSessions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve sessions for user {UserId}.", userId);
                return StatusCode(500, "Ошибка получения списка сессий");
            }
        }
    }
}