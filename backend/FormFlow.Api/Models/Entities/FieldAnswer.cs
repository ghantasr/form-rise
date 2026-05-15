namespace FormFlow.Api.Models.Entities;

public class FieldAnswer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ResponseId { get; set; }
    public Guid FieldId { get; set; }

    public string? Value { get; set; }
    public string[]? ValuesArray { get; set; }
    public double? NumericValue { get; set; }

    public FormResponse Response { get; set; } = null!;
    public FormField Field { get; set; } = null!;
}
