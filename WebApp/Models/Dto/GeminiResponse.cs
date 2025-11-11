namespace WebApp.Models.Dto;

public class GeminiResponse
{
    public string Content { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public int TotalTokens { get; set; }
    public bool IsFallback { get; set; } = false;
    public string? ErrorMessage { get; set; }
}