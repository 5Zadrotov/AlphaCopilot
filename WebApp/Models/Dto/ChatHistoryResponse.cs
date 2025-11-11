namespace WebApp.Models.Dto;

public class ChatHistoryResponse
{
    public string SessionId { get; set; } = string.Empty;
    public List<ChatMessageDto> Messages { get; set; } = [];
    public string BusinessType { get; set; } = "Малый бизнес";
    public string SelectedCategory { get; set; } = "Общее";
}
public class ChatMessageDto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public bool IsFromUser { get; set; }
    public string Category { get; set; } = "Общее";
    public Dictionary<string, string>? Metadata { get; set; }
}