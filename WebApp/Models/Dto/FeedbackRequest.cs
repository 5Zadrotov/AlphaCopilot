namespace WebApp.Models.Dto;

public class FeedbackRequest
{
    public Guid MessageId { get; set; }
    public int Rating { get; set; } = 0;
    public string? Comment { get; set; }
}