namespace FormFlow.Api.Models.Entities;

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public Guid CreatedBy { get; set; }
    public User Creator { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<OrgMember> Members { get; set; } = [];
    public ICollection<OrgGroup> Groups { get; set; } = [];
}
