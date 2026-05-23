using FormFlow.Api.Models.DTOs.Orgs;
using FormFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FormFlow.Api.Controllers;

[ApiController]
[Route("api/orgs")]
[Authorize]
public class OrgController(IOrgService orgService, IConfiguration config) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue("sub")!);

    [HttpPost]
    public async Task<IActionResult> CreateOrg([FromBody] CreateOrgRequest req)
    {
        var org = await orgService.CreateOrgAsync(UserId, req.Name);
        return CreatedAtAction(nameof(GetMyOrg), org);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyOrg()
    {
        var org = await orgService.GetMyOrgAsync(UserId);
        if (org is null) return NotFound(new { message = "No organisation found." });
        return Ok(org);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetOrgBySlug(string slug) =>
        Ok(await orgService.GetOrgBySlugAsync(slug, UserId));

    [HttpGet("{orgId:guid}/members")]
    public async Task<IActionResult> GetMembers(Guid orgId) =>
        Ok(await orgService.GetMembersAsync(orgId, UserId));

    [HttpPost("{orgId:guid}/invite")]
    public async Task<IActionResult> CreateInvite(Guid orgId, [FromBody] InviteRequest req)
    {
        var invite = await orgService.CreateInviteAsync(orgId, UserId, req.Email, req.Role);
        var baseUrl = config["App:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var joinUrl = $"{baseUrl}/join/{invite.Token}";
        return Ok(new InviteResponse(invite.Id, invite.Token, joinUrl, invite.ExpiresAt!.Value));
    }

    [HttpPost("join/{token}")]
    public async Task<IActionResult> JoinOrg(string token) =>
        Ok(await orgService.JoinOrgAsync(token, UserId));

    [HttpPatch("{orgId:guid}/members/{userId:guid}/role")]
    public async Task<IActionResult> UpdateRole(Guid orgId, Guid userId, [FromBody] UpdateMemberRoleRequest req)
    {
        await orgService.UpdateMemberRoleAsync(orgId, userId, req.Role, UserId);
        return NoContent();
    }

    [HttpDelete("{orgId:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid orgId, Guid userId)
    {
        await orgService.RemoveMemberAsync(orgId, userId, UserId);
        return NoContent();
    }

    [HttpPost("{orgId:guid}/groups")]
    public async Task<IActionResult> CreateGroup(Guid orgId, [FromBody] CreateGroupRequest req)
    {
        var group = await orgService.CreateGroupAsync(orgId, UserId, req.Name);
        return CreatedAtAction(nameof(GetGroups), new { orgId }, group);
    }

    [HttpGet("{orgId:guid}/groups")]
    public async Task<IActionResult> GetGroups(Guid orgId) =>
        Ok(await orgService.GetGroupsAsync(orgId, UserId));

    [HttpDelete("{orgId:guid}/groups/{groupId:guid}")]
    public async Task<IActionResult> DeleteGroup(Guid orgId, Guid groupId)
    {
        await orgService.DeleteGroupAsync(orgId, groupId, UserId);
        return NoContent();
    }

    [HttpGet("{orgId:guid}/groups/{groupId:guid}/members")]
    public async Task<IActionResult> GetGroupMembers(Guid orgId, Guid groupId) =>
        Ok(await orgService.GetGroupMembersAsync(orgId, groupId, UserId));

    [HttpPost("{orgId:guid}/groups/{groupId:guid}/members")]
    public async Task<IActionResult> AddGroupMembers(Guid orgId, Guid groupId, [FromBody] AddGroupMembersRequest req)
    {
        await orgService.AddGroupMembersAsync(orgId, groupId, req.UserIds, UserId);
        return NoContent();
    }

    [HttpDelete("{orgId:guid}/groups/{groupId:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveGroupMember(Guid orgId, Guid groupId, Guid userId)
    {
        await orgService.RemoveGroupMemberAsync(orgId, groupId, userId, UserId);
        return NoContent();
    }
}
