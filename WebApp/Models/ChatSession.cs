using WebApp.Models.DbModels;

namespace WebApp.Models
{
    public class ChatSession
    {
        public string SessionId { get; set; } = Guid.NewGuid().ToString();
        public Guid UserId { get; set; }
        public string BusinessType { get; set; } = "Малый бизнес";
        public string SelectedCategory { get; set; } = "Общее";
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastActivity { get; set; } = DateTime.UtcNow;
        public List<ChatMessage> Messages { get; set; } = [];
    }
}