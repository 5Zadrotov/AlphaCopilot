namespace WebApp.Models.Dto;

public class PromptTemplate
{
    public string Category { get; set; } = string.Empty;
    public string SystemPrompt { get; set; } = string.Empty;
    public string FormatInstructions { get; set; } = string.Empty;
}