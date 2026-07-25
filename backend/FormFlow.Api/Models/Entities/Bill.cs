using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace FormFlow.Api.Models.Entities;

public class Bill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }

    [Required, MaxLength(50)]
    public string BillNumber { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = "draft"; // draft, sent, paid, overdue, cancelled

    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }

    [MaxLength(10)]
    public string Currency { get; set; } = "INR";

    public decimal TaxRate { get; set; } = 0;

    [MaxLength(50)]
    public string TaxLabel { get; set; } = "GST";

    // Recipient
    [Required, MaxLength(200)]
    public string RecipientName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? RecipientEmail { get; set; }

    public string? RecipientAddress { get; set; }

    [MaxLength(20)]
    public string? RecipientGstin { get; set; }

    // Sender (from user's business profile or manual)
    [Required, MaxLength(200)]
    public string SenderName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? SenderEmail { get; set; }

    public string? SenderAddress { get; set; }

    [MaxLength(20)]
    public string? SenderGstin { get; set; }

    public string? SenderLogoBase64 { get; set; }

    // Denormalised totals
    public decimal Subtotal { get; set; } = 0;
    public decimal TaxAmount { get; set; } = 0;
    public decimal Total { get; set; } = 0;

    public string? Notes { get; set; }

    [MaxLength(300)]
    public string? PaymentTerms { get; set; }

    [MaxLength(200)]
    public string? BankName { get; set; }

    [MaxLength(50)]
    public string? BankAccount { get; set; }

    [MaxLength(20)]
    public string? BankIfsc { get; set; }

    [MaxLength(500)]
    public string? HeaderOrder { get; set; }  // JSON array of block IDs e.g. ["logo","business","invoice","dates"]

    [MaxLength(50)]
    public string? InvoiceLabel { get; set; }

    [MaxLength(7)]
    public string AccentColor { get; set; } = "#1B6B4A";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<BillItem> Items { get; set; } = [];
}