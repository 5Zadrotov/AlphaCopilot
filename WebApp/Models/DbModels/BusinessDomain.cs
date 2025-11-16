namespace WebApp.Models.DbModels;

public class BusinessDomain
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}