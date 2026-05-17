using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace FormFlow.Api.Models.Entities;

public class FormField
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FormId { get; set; }

    [Required, MaxLength(30)]
    public string FieldType { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string Label { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Placeholder { get; set; }

    [MaxLength(500)]
    public string? HelpText { get; set; }

    public bool IsRequired { get; set; } = false;
    public int SortOrder { get; set; } = 0;

    public JsonDocument? Options { get; set; }
    public JsonDocument? Validation { get; set; }
    public JsonDocument? Conditional { get; set; }
    public JsonDocument? Translations { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Form Form { get; set; } = null!;
    public ICollection<FieldAnswer> Answers { get; set; } = [];
}
