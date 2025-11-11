namespace WebApp.Models.Dto;

public class NewChatSessionRequest
{
    public string? BusinessType { get; set; } = "Малый бизнес";
    public string? InitialPrompt { get; set; }
}