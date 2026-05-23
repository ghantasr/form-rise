using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.DTOs.Orgs;

public record OrgDto(Guid Id, string Name, string Slug, int MemberCount, int GroupCount, DateTime CreatedAt);
public record OrgMemberDto(Guid UserId, string Name, string Email, string? AvatarUrl, string Role, DateTime JoinedAt);
public record OrgGroupDto(Guid Id, string Name, int MemberCount, int AssignmentCount, bool IsDefault = false);
public record CreateOrgRequest([Required] string Name);
public record CreateGroupRequest([Required] string Name);
public record InviteRequest(string? Email, string Role = "member");
public record UpdateMemberRoleRequest([Required] string Role);
public record AddGroupMembersRequest([Required] List<Guid> UserIds);
public record InviteResponse(Guid InviteId, string Token, string JoinUrl, DateTime ExpiresAt);
