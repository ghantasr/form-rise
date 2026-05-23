namespace FormFlow.Api.Models.Entities;

public class GroupMember
{
    public Guid GroupId { get; set; }
    public OrgGroup Group { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
