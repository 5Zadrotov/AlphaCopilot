using WebApp.Models;
using WebApp.Models.DbModels;

namespace WebApp.Interfaces
{
    public interface IDataService
    {
        Task<User> GetUserByEmailAsync(string email);
        Task<bool> CreateUserAsync(User user);
        Task<Models.DbModels.ChatSession> CreateChatSessionAsync(Guid userId, string businessType);
        Task<Models.DbModels.ChatSession> GetChatSessionAsync(Guid sessionId, Guid userId);
        Task SaveChatMessageAsync(ChatMessage message);
        bool UserExists(string email);
    }
}