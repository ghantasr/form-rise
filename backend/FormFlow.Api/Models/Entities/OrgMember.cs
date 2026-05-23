namespace FormFlow.Api.Models.Entities;

public class OrgMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrgId { get; set; }
    public Organization Org { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Role { get; set; } = "member"; // "admin" | "moderator" | "member"
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
