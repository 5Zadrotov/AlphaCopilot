using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Interfaces;
using WebApp.Models.DbModels;

namespace WebApp.Services
{
    public class DataService(ApplicationDbContext db) : IDataService
    {
        private readonly ApplicationDbContext _db = db;

        public async Task<User> GetUserByEmailAsync(string email)
        {
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email);
            return user!;
        }

        public async Task<bool> CreateUserAsync(User user)
        {
            if (string.IsNullOrWhiteSpace(user?.Email))
                return false;

            var exists = await _db.Users.AnyAsync(u => u.Email == user.Email);
            if (exists)
                return false;

            user.Id = user.Id == Guid.Empty ? Guid.NewGuid() : user.Id;
            user.CreatedAt = user.CreatedAt == default ? DateTime.UtcNow : user.CreatedAt;

            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<ChatSession> CreateChatSessionAsync(Guid userId, string businessType)
        {
            var session = new ChatSession
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = $"Сессия для {businessType}",
                StartedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            };

            await _db.ChatSessions.AddAsync(session);
            await _db.SaveChangesAsync();

            return session;
        }

        public async Task<ChatSession> GetChatSessionAsync(Guid sessionId, Guid userId)
        {
            var session = await _db.ChatSessions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            return session!;
        }

        public async Task SaveChatMessageAsync(ChatMessage message)
        {
            if (message == null) return;

            message.Id = message.Id == Guid.Empty ? Guid.NewGuid() : message.Id;
            message.Timestamp = message.Timestamp == default ? DateTime.UtcNow : message.Timestamp;

            await _db.ChatMessages.AddAsync(message);
            await _db.SaveChangesAsync();
        }

        public bool UserExists(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            return _db.Users.AsNoTracking().Any(u => u.Email == email);
        }
    }
}