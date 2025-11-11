namespace WebApp.Models.DbModels;

public class ChatMessage
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public string Sender { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int TokenUsage { get; set; }
}