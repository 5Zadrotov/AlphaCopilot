namespace WebApp.Models.DbModels;

public class Recommendation
{
    public Guid Id { get; set; }
    public Guid DomainId { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsSaved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}