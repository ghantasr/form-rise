namespace FormFlow.Api.Models.Entities;

public class FormAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FormId { get; set; }
    public Form Form { get; set; } = null!;
    public Guid GroupId { get; set; }
    public OrgGroup Group { get; set; } = null!;
    public Guid AssignedBy { get; set; }
    public DateTime? OpensAt { get; set; }
    public DateTime? ClosesAt { get; set; }
    public string Mode { get; set; } = "attempt_once"; // "attempt_once" | "unlimited"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
