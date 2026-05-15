using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? DisplayName { get; set; }

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    public bool IsVerified { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<Form> Forms { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
