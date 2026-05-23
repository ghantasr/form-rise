namespace FormFlow.Api.Models.Entities;

public class OrgInvite
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrgId { get; set; }
    public Organization Org { get; set; } = null!;
    public string Token { get; set; } = "";
    public string Role { get; set; } = "member";
    public string? Email { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
