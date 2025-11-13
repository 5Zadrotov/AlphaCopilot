using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Interfaces;
using WebApp.Models.DbModels;

namespace WebApp.Services
{
    public class DataService(ApplicationDbContext db, ILogger<DataService> logger) : IDataService
    {
        private readonly ApplicationDbContext _db = db;
        private readonly ILogger<DataService> _logger = logger;

        public async Task<User> GetUserByEmailAsync(string email)
        {
            _logger.LogDebug("GetUserByEmailAsync: {Email}", email);
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                _logger.LogInformation("User not found by email: {Email}", email);
            return user!;
        }

        public async Task<bool> CreateUserAsync(User user)
        {
            _logger.LogInformation("CreateUserAsync: {Email}", user?.Email);
            if (string.IsNullOrWhiteSpace(user?.Email))
            {
                _logger.LogWarning("Attempt to create user with empty email.");
                return false;
            }

            var exists = await _db.Users.AnyAsync(u => u.Email == user.Email);
            if (exists)
            {
                _logger.LogWarning("User already exists: {Email}", user.Email);
                return false;
            }

            user.Id = user.Id == Guid.Empty ? Guid.NewGuid() : user.Id;
            user.CreatedAt = user.CreatedAt == default ? DateTime.UtcNow : user.CreatedAt;

            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            _logger.LogInformation("User created: {Email} (Id={Id})", user.Email, user.Id);
            return true;
        }

        public async Task<ChatSession> CreateChatSessionAsync(Guid userId, string businessType)
        {
            _logger.LogInformation("CreateChatSessionAsync for user {UserId}, businessType={Type}", userId, businessType);
            var session = new ChatSession
            {
                Id = Guid.NewGuid(),
                SessionId = Guid.NewGuid().ToString(), // <- уникальный SessionId строкой
                UserId = userId,
                Title = $"Сессия для {businessType}",
                BusinessType = businessType,
                StartedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            };

            await _db.ChatSessions.AddAsync(session);
            await _db.SaveChangesAsync();

            _logger.LogDebug("Chat session created: {SessionId} for user {UserId}", session.Id, userId);
            return session;
        }

        public async Task<ChatSession> GetChatSessionAsync(Guid sessionId, Guid userId)
        {
            _logger.LogDebug("GetChatSessionAsync: sessionId={SessionId}, userId={UserId}", sessionId, userId);
            var session = await _db.ChatSessions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
                _logger.LogInformation("Chat session not found: {SessionId} for user {UserId}", sessionId, userId);

            return session!;
        }

        public async Task SaveChatMessageAsync(ChatMessage message)
        {
            _logger.LogDebug("SaveChatMessageAsync: userId={UserId}, isFromUser={IsFromUser}, len={Len}", message?.UserId, message?.IsFromUser, message?.Content?.Length ?? 0);
            if (message == null) return;

            message.Id = message.Id == Guid.Empty ? Guid.NewGuid() : message.Id;
            message.Timestamp = message.Timestamp == default ? DateTime.UtcNow : message.Timestamp;

            await _db.ChatMessages.AddAsync(message);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Chat message saved: Id={MessageId}, userId={UserId}", message.Id, message.UserId);
        }

        public bool UserExists(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            var exists = _db.Users.AsNoTracking().Any(u => u.Email == email);
            _logger.LogDebug("UserExists({Email}) => {Exists}", email, exists);
            return exists;
        }

        public async Task<List<ChatMessage>> GetMessagesAsync(Guid sessionId, Guid userId)
        {
            _logger.LogDebug("GetMessagesAsync: sessionId={SessionId}, userId={UserId}", sessionId, userId);
            var messages = await _db.ChatMessages
                .AsNoTracking()
                .Where(m => m.SessionId == sessionId && m.UserId == userId)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            return messages;
        }
    }
}