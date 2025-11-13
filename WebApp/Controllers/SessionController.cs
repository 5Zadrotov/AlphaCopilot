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
    public class SessionController(IDataService dataService, ApplicationDbContext db, ILogger<SessionController> logger) : ControllerBase
    {
        private readonly IDataService _dataService = dataService;
        private readonly ApplicationDbContext _db = db;
        private readonly ILogger<SessionController> _logger = logger;

        [HttpPost("new")]
        public async Task<IActionResult> NewSession([FromBody] NewChatSessionRequest request)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                _logger.LogWarning("Unauthorized attempt to create session.");
                return Unauthorized("Неверный токен авторизации");
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