using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Models.DbModels;

namespace WebApp.Services
{
    public interface IChatSessionService
    {
        Task<ChatSession> GetOrCreateSessionAsync(Guid userId);
        Task AddMessageAsync(Guid sessionId, ChatMessage message);
        Task<List<ChatMessage>> GetMessagesAsync(Guid sessionId, Guid userId);
    }

    public class ChatSessionService : IChatSessionService
    {
        private readonly ApplicationDbContext _db;

        public ChatSessionService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<ChatSession> GetOrCreateSessionAsync(Guid userId)
        {
            var session = await _db.ChatSessions
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (session == null)
            {
                session = new ChatSession
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    StartedAt = DateTime.UtcNow,
                    LastActivity = DateTime.UtcNow
                };
                _db.ChatSessions.Add(session);
                await _db.SaveChangesAsync();
            }

            return session;
        }

        public async Task AddMessageAsync(Guid sessionId, ChatMessage message)
        {
            _db.ChatMessages.Add(message);
            
            var session = await _db.ChatSessions.FindAsync(sessionId);
            if (session != null)
            {
                session.LastActivity = DateTime.UtcNow;
                _db.ChatSessions.Update(session);
            }

            await _db.SaveChangesAsync();
        }

        public async Task<List<ChatMessage>> GetMessagesAsync(Guid sessionId, Guid userId)
        {
            return await _db.ChatMessages
                .Where(m => m.SessionId == sessionId && m.UserId == userId)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();
        }
    }
}
