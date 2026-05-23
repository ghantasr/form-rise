namespace FormFlow.Api.Models.Entities;

public class OrgGroup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrgId { get; set; }
    public Organization Org { get; set; } = null!;
    public string Name { get; set; } = "";
    public bool IsDefault { get; set; }
    public Guid CreatedBy { get; set; }
    public ICollection<GroupMember> Members { get; set; } = [];
    public ICollection<FormAssignment> Assignments { get; set; } = [];
}
