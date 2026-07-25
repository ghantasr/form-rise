using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.Entities;

public class BillTemplateItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TemplateId { get; set; }

    [Required, MaxLength(300)]
    public string Description { get; set; } = string.Empty;

    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; } = 0;
    public bool Taxable { get; set; } = true;
    public int SortOrder { get; set; } = 0;

    public BillTemplate Template { get; set; } = null!;
}