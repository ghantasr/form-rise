using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.Entities;

public class BusinessProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Email { get; set; }

    public string? Address { get; set; }

    [MaxLength(20)]
    public string? Gstin { get; set; }

    public string? LogoBase64 { get; set; }
    public bool IsDefault { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}