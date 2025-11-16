namespace WebApp.Models.DbModels;

public class LlmLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string RequestText { get; set; } = string.Empty;
    public string ResponseText { get; set; } = string.Empty;
    public int TokensInput { get; set; }
    public int TokensOutput { get; set; }
    public string? ModelUsed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}