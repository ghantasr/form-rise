namespace FormFlow.Api.Models.Entities;

public class FieldDropoff
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FormId { get; set; }
    public Guid? FieldId { get; set; }
    public int ReachCount { get; set; } = 0;
    public Form Form { get; set; } = null!;
}
