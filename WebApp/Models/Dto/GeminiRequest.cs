namespace WebApp.Models.Dto;

public class GeminiRequest
{
    public string Prompt { get; set; } = string.Empty;
    public string Category { get; set; } = "Общее";
    public string? BusinessType { get; set; }
    public Dictionary<string, object>? Context { get; set; }
}