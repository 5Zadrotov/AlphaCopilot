namespace WebApp.Models
{
    public class ChatMessageRequest
    {
        public string Content { get; set; } = string.Empty;
        public string Category { get; set; } = "Общее";
    }
}