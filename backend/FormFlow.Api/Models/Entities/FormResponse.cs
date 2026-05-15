using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.Entities;

public class FormResponse
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FormId { get; set; }

    [MaxLength(255)]
    public string? RespondentEmail { get; set; }

    public Guid? QrTokenId { get; set; }

    [MaxLength(64)]
    public string? IpHash { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    public bool IsComplete { get; set; } = true;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public Form Form { get; set; } = null!;
    public QrToken? QrToken { get; set; }
    public ICollection<FieldAnswer> Answers { get; set; } = [];
}
