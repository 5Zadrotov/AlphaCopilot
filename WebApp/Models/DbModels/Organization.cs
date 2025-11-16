using System.ComponentModel.DataAnnotations;

namespace WebApp.Models.DbModels;

public class Organization
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}