namespace WebApp.Models.DbModels;

public class Template
{
    public Guid Id { get; set; }
    public Guid? DomainId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string PromptTemplate { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}