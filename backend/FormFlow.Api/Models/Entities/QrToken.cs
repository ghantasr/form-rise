using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.Entities;

public class QrToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FormId { get; set; }

    [Required, MaxLength(64)]
    public string Token { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = "active"; // active, used, expired

    [MaxLength(200)]
    public string? Label { get; set; }

    public DateTime? ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Form Form { get; set; } = null!;
    public ICollection<FormResponse> Responses { get; set; } = [];
}
