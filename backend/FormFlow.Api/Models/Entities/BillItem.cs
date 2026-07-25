using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.Entities;

public class BillItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BillId { get; set; }

    [Required, MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; } = 0;
    public decimal Amount { get; set; } = 0; // quantity * unitPrice
    public int SortOrder { get; set; } = 0;
    public bool Taxable { get; set; } = true;

    public Bill Bill { get; set; } = null!;
}