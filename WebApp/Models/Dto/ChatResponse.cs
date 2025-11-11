namespace WebApp.Models.Dto;

public class ChatResponse
{
    public string SessionId { get; set; } = Guid.NewGuid().ToString();
    public ChatMessageDto UserMessage { get; set; } = new();
    public ChatMessageDto AiMessage { get; set; } = new();
}