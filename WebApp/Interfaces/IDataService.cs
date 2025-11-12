using WebApp.Models;
using WebApp.Models.DbModels;

namespace WebApp.Interfaces
{
    public interface IDataService
    {
        Task<User> GetUserByEmailAsync(string email);
        Task<bool> CreateUserAsync(User user);
        Task<ChatSession> CreateChatSessionAsync(Guid userId, string businessType);
        Task<ChatSession> GetChatSessionAsync(Guid sessionId, Guid userId);
        Task SaveChatMessageAsync(ChatMessage message);
        bool UserExists(string email);
    }
}