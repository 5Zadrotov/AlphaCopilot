using WebApp.Interfaces;
using WebApp.Models.DbModels;

namespace WebApp.Services
{
    public class DataService : IDataService
    {
        public Task<User> GetUserByEmailAsync(string email)
        {
            // Заглушка для тестирования
            return Task.FromResult(new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = string.Empty,
            });
        }

        public Task<bool> CreateUserAsync(User user)
        {
            return Task.FromResult(true);
        }

        public Task<ChatSession> CreateChatSessionAsync(Guid userId, string businessType)
        {
            return Task.FromResult(new ChatSession
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = $"Сессия для {businessType}",
                StartedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            });
        }

        public Task<ChatSession> GetChatSessionAsync(Guid sessionId, Guid userId)
        {
            return Task.FromResult(new ChatSession
            {
                Id = sessionId,
                UserId = userId,
                Title = "Тестовая сессия",
                StartedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
            });
        }

        public Task SaveChatMessageAsync(ChatMessage message)
        {
            return Task.CompletedTask;
        }

        public bool UserExists(string email)
        {
            return false; // Заглушка
        }
    }
}