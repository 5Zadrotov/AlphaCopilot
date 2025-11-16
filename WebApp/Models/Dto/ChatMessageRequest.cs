namespace WebApp.Models.Dto
{
    public class ChatMessageRequest
    {
        public string Text { get; set; } = string.Empty;
        public string Content => Text;
        public string Category { get; set; } = "general";
        public string? SessionId { get; set; }
    }
}