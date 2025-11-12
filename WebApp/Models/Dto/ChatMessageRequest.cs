namespace WebApp.Models.Dto
{
    public class ChatMessageRequest
    {
        public string Content { get; set; } = string.Empty;
        public string Category { get; set; } = "Общее";
        public string? SessionId { get; set; } // Теперь опционально
    }
}