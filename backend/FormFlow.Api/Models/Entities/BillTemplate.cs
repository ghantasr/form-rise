using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.Entities;

/// <summary>
/// A reusable bill template saved by a user. Unlike a Bill, this has no recipient,
/// status, or dates — just the structural blueprint for creating new bills quickly.
/// </summary>
public class BillTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public string Category { get; set; } = "Custom";

    // Invoice settings
    [MaxLength(10)]
    public string Currency { get; set; } = "INR";
    public decimal TaxRate { get; set; } = 0;

    [MaxLength(50)]
    public string TaxLabel { get; set; } = "GST";

    // Sender defaults
    [Required, MaxLength(200)]
    public string SenderName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? SenderEmail { get; set; }
    public string? SenderAddress { get; set; }

    [MaxLength(20)]
    public string? SenderGstin { get; set; }
    public string? SenderLogoBase64 { get; set; }

    // Defaults
    public string? Notes { get; set; }

    [MaxLength(300)]
    public string? PaymentTerms { get; set; }

    [MaxLength(200)]
    public string? BankName { get; set; }

    [MaxLength(50)]
    public string? BankAccount { get; set; }

    [MaxLength(20)]
    public string? BankIfsc { get; set; }

    [MaxLength(7)]
    public string AccentColor { get; set; } = "#1B6B4A";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<BillTemplateItem> Items { get; set; } = [];
}