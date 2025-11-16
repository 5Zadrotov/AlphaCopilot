namespace WebApp.Models.DbModels;

public class ChatSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastActivity { get; set; } = DateTime.UtcNow;
    public string SessionId { get; set; } = Guid.NewGuid().ToString();
    public string SelectedCategory { get; set; } = "Общее";
    public string BusinessType { get; set; } = "Малый бизнес";
}