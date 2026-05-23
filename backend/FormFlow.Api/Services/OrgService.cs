using System.Security.Cryptography;
using FormFlow.Api.Data;
using FormFlow.Api.Models.DTOs.Orgs;
using FormFlow.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormFlow.Api.Services;

public interface IOrgService
{
    Task<OrgDto> CreateOrgAsync(Guid userId, string name);
    Task<OrgDto?> GetMyOrgAsync(Guid userId);
    Task<OrgDto> GetOrgBySlugAsync(string slug, Guid userId);
    Task<List<OrgMemberDto>> GetMembersAsync(Guid orgId, Guid userId);
    Task<OrgInvite> CreateInviteAsync(Guid orgId, Guid userId, string? email, string role);
    Task<OrgDto> JoinOrgAsync(string token, Guid userId);
    Task UpdateMemberRoleAsync(Guid orgId, Guid targetUserId, string role, Guid requesterId);
    Task RemoveMemberAsync(Guid orgId, Guid targetUserId, Guid requesterId);
    Task<OrgGroupDto> CreateGroupAsync(Guid orgId, Guid userId, string name);
    Task<List<OrgGroupDto>> GetGroupsAsync(Guid orgId, Guid userId);
    Task DeleteGroupAsync(Guid orgId, Guid groupId, Guid userId);
    Task AddGroupMembersAsync(Guid orgId, Guid groupId, List<Guid> userIds, Guid requesterId);
    Task RemoveGroupMemberAsync(Guid orgId, Guid groupId, Guid targetUserId, Guid requesterId);
    Task<List<OrgMemberDto>> GetGroupMembersAsync(Guid orgId, Guid groupId, Guid requesterId);
}

public class OrgService(AppDbContext db) : IOrgService
{
    public async Task<OrgDto> CreateOrgAsync(Guid userId, string name)
    {
        var alreadyOwns = await db.Organizations.AnyAsync(o => o.CreatedBy == userId);
        if (alreadyOwns)
            throw new InvalidOperationException("You already own an organisation. Free tier allows only one org per account.");

        var slug = await GenerateUniqueOrgSlugAsync(name);

        var org = new Organization
        {
            Name = name,
            Slug = slug,
            CreatedBy = userId
        };
        db.Organizations.Add(org);

        // Creator is automatically an admin member
        db.OrgMembers.Add(new OrgMember
        {
            OrgId = org.Id,
            UserId = userId,
            Role = "admin"
        });

        // Auto-create the default "Everyone" group and add the creator to it
        var everyoneGroup = new OrgGroup
        {
            OrgId = org.Id,
            Name = "Everyone",
            IsDefault = true,
            CreatedBy = userId
        };
        db.OrgGroups.Add(everyoneGroup);
        await db.SaveChangesAsync();

        db.GroupMembers.Add(new GroupMember { GroupId = everyoneGroup.Id, UserId = userId });
        await db.SaveChangesAsync();

        return new OrgDto(org.Id, org.Name, org.Slug, 1, 0, org.CreatedAt);
    }

    public async Task<OrgDto?> GetMyOrgAsync(Guid userId)
    {
        var org = await db.Organizations
            .Where(o => o.CreatedBy == userId)
            .Select(o => new
            {
                o.Id, o.Name, o.Slug, o.CreatedAt,
                MemberCount = o.Members.Count,
                GroupCount = o.Groups.Count(g => !g.IsDefault)
            })
            .FirstOrDefaultAsync();

        if (org is null) return null;
        return new OrgDto(org.Id, org.Name, org.Slug, org.MemberCount, org.GroupCount, org.CreatedAt);
    }

    public async Task<OrgDto> GetOrgBySlugAsync(string slug, Guid userId)
    {
        var org = await db.Organizations
            .Where(o => o.Slug == slug)
            .Select(o => new
            {
                o.Id, o.Name, o.Slug, o.CreatedAt,
                MemberCount = o.Members.Count,
                GroupCount = o.Groups.Count(g => !g.IsDefault)
            })
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Organisation not found.");

        // Ensure requester is a member
        var isMember = await db.OrgMembers.AnyAsync(m => m.OrgId == org.Id && m.UserId == userId);
        if (!isMember)
            throw new UnauthorizedAccessException("You are not a member of this organisation.");

        return new OrgDto(org.Id, org.Name, org.Slug, org.MemberCount, org.GroupCount, org.CreatedAt);
    }

    public async Task<List<OrgMemberDto>> GetMembersAsync(Guid orgId, Guid userId)
    {
        await RequireMemberAsync(orgId, userId);

        return await db.OrgMembers
            .Where(m => m.OrgId == orgId)
            .Select(m => new OrgMemberDto(
                m.UserId,
                m.User.DisplayName ?? m.User.Email,
                m.User.Email,
                m.User.AvatarUrl,
                m.Role,
                m.JoinedAt
            ))
            .ToListAsync();
    }

    public async Task<OrgInvite> CreateInviteAsync(Guid orgId, Guid userId, string? email, string role)
    {
        await RequireAdminOrModeratorAsync(orgId, userId);

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLower();

        var invite = new OrgInvite
        {
            OrgId = orgId,
            Token = token,
            Role = role,
            Email = email,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedBy = userId
        };
        db.OrgInvites.Add(invite);
        await db.SaveChangesAsync();
        return invite;
    }

    public async Task<OrgDto> JoinOrgAsync(string token, Guid userId)
    {
        var invite = await db.OrgInvites
            .Include(i => i.Org)
            .FirstOrDefaultAsync(i => i.Token == token)
            ?? throw new KeyNotFoundException("Invite not found.");

        if (invite.UsedAt is not null)
            throw new InvalidOperationException("This invite has already been used.");
        if (invite.ExpiresAt.HasValue && invite.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("This invite has expired.");

        var alreadyMember = await db.OrgMembers.AnyAsync(m => m.OrgId == invite.OrgId && m.UserId == userId);
        if (!alreadyMember)
        {
            db.OrgMembers.Add(new OrgMember
            {
                OrgId = invite.OrgId,
                UserId = userId,
                Role = invite.Role
            });
        }

        invite.UsedAt ??= DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Add to the default "Everyone" group if not already in it
        var defaultGroup = await db.OrgGroups.FirstOrDefaultAsync(g => g.OrgId == invite.OrgId && g.IsDefault);
        if (defaultGroup is not null)
        {
            var inDefault = await db.GroupMembers.AnyAsync(gm => gm.GroupId == defaultGroup.Id && gm.UserId == userId);
            if (!inDefault)
            {
                db.GroupMembers.Add(new GroupMember { GroupId = defaultGroup.Id, UserId = userId });
                await db.SaveChangesAsync();
            }
        }

        var memberCount = await db.OrgMembers.CountAsync(m => m.OrgId == invite.OrgId);
        var groupCount = await db.OrgGroups.CountAsync(g => g.OrgId == invite.OrgId && !g.IsDefault);
        var org = invite.Org;
        return new OrgDto(org.Id, org.Name, org.Slug, memberCount, groupCount, org.CreatedAt);
    }

    public async Task UpdateMemberRoleAsync(Guid orgId, Guid targetUserId, string role, Guid requesterId)
    {
        await RequireAdminAsync(orgId, requesterId);

        var member = await db.OrgMembers.FirstOrDefaultAsync(m => m.OrgId == orgId && m.UserId == targetUserId)
            ?? throw new KeyNotFoundException("Member not found.");

        // Cannot demote the owner/creator
        var org = await db.Organizations.FindAsync(orgId)
            ?? throw new KeyNotFoundException("Organisation not found.");
        if (org.CreatedBy == targetUserId && role != "admin")
            throw new InvalidOperationException("Cannot change the role of the organisation owner.");

        member.Role = role;
        await db.SaveChangesAsync();
    }

    public async Task RemoveMemberAsync(Guid orgId, Guid targetUserId, Guid requesterId)
    {
        await RequireAdminOrModeratorAsync(orgId, requesterId);

        // Moderators can only remove regular members
        var requesterRole = await GetRoleAsync(orgId, requesterId);
        if (requesterRole == "moderator")
        {
            var targetRole = await GetRoleAsync(orgId, targetUserId);
            if (targetRole is "admin" or "moderator")
                throw new UnauthorizedAccessException("Moderators can only remove regular members.");
        }

        var member = await db.OrgMembers.FirstOrDefaultAsync(m => m.OrgId == orgId && m.UserId == targetUserId)
            ?? throw new KeyNotFoundException("Member not found.");

        var org = await db.Organizations.FindAsync(orgId)
            ?? throw new KeyNotFoundException("Organisation not found.");
        if (org.CreatedBy == targetUserId)
            throw new InvalidOperationException("Cannot remove the organisation owner.");

        db.OrgMembers.Remove(member);
        await db.SaveChangesAsync();
    }

    public async Task<OrgGroupDto> CreateGroupAsync(Guid orgId, Guid userId, string name)
    {
        await RequireAdminOrModeratorAsync(orgId, userId);

        var group = new OrgGroup
        {
            OrgId = orgId,
            Name = name,
            CreatedBy = userId
        };
        db.OrgGroups.Add(group);
        await db.SaveChangesAsync();
        return new OrgGroupDto(group.Id, group.Name, 0, 0);
    }

    public async Task<List<OrgGroupDto>> GetGroupsAsync(Guid orgId, Guid userId)
    {
        await RequireMemberAsync(orgId, userId);

        return await db.OrgGroups
            .Where(g => g.OrgId == orgId)
            .OrderBy(g => g.IsDefault ? 0 : 1)
            .ThenBy(g => g.Name)
            .Select(g => new OrgGroupDto(
                g.Id,
                g.Name,
                g.Members.Count,
                g.Assignments.Count,
                g.IsDefault
            ))
            .ToListAsync();
    }

    public async Task DeleteGroupAsync(Guid orgId, Guid groupId, Guid userId)
    {
        await RequireAdminOrModeratorAsync(orgId, userId);

        var group = await db.OrgGroups.FirstOrDefaultAsync(g => g.Id == groupId && g.OrgId == orgId)
            ?? throw new KeyNotFoundException("Group not found.");

        if (group.IsDefault)
            throw new InvalidOperationException("The default 'Everyone' group cannot be deleted.");

        db.OrgGroups.Remove(group);
        await db.SaveChangesAsync();
    }

    public async Task AddGroupMembersAsync(Guid orgId, Guid groupId, List<Guid> userIds, Guid requesterId)
    {
        await RequireAdminOrModeratorAsync(orgId, requesterId);

        var group = await db.OrgGroups.FirstOrDefaultAsync(g => g.Id == groupId && g.OrgId == orgId)
            ?? throw new KeyNotFoundException("Group not found.");

        // Only org members can be added to groups
        var orgMemberIds = await db.OrgMembers
            .Where(m => m.OrgId == orgId && userIds.Contains(m.UserId))
            .Select(m => m.UserId)
            .ToListAsync();

        var existingGroupMemberIds = await db.GroupMembers
            .Where(gm => gm.GroupId == groupId && userIds.Contains(gm.UserId))
            .Select(gm => gm.UserId)
            .ToListAsync();

        var toAdd = orgMemberIds.Except(existingGroupMemberIds).ToList();

        foreach (var uid in toAdd)
        {
            db.GroupMembers.Add(new GroupMember
            {
                GroupId = groupId,
                UserId = uid
            });
        }

        await db.SaveChangesAsync();
    }

    public async Task RemoveGroupMemberAsync(Guid orgId, Guid groupId, Guid targetUserId, Guid requesterId)
    {
        await RequireAdminOrModeratorAsync(orgId, requesterId);

        var group = await db.OrgGroups.FirstOrDefaultAsync(g => g.Id == groupId && g.OrgId == orgId)
            ?? throw new KeyNotFoundException("Group not found.");

        var member = await db.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == targetUserId)
            ?? throw new KeyNotFoundException("Member not in group.");

        db.GroupMembers.Remove(member);
        await db.SaveChangesAsync();
    }

    public async Task<List<OrgMemberDto>> GetGroupMembersAsync(Guid orgId, Guid groupId, Guid requesterId)
    {
        await RequireMemberAsync(orgId, requesterId);

        var group = await db.OrgGroups.FirstOrDefaultAsync(g => g.Id == groupId && g.OrgId == orgId)
            ?? throw new KeyNotFoundException("Group not found.");

        return await db.GroupMembers
            .Where(gm => gm.GroupId == groupId)
            .Select(gm => new OrgMemberDto(
                gm.UserId,
                gm.User.DisplayName ?? gm.User.Email,
                gm.User.Email,
                gm.User.AvatarUrl,
                "member",
                gm.AddedAt
            ))
            .ToListAsync();
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private async Task RequireMemberAsync(Guid orgId, Guid userId)
    {
        var isMember = await db.OrgMembers.AnyAsync(m => m.OrgId == orgId && m.UserId == userId);
        if (!isMember)
            throw new UnauthorizedAccessException("You are not a member of this organisation.");
    }

    private async Task RequireAdminOrModeratorAsync(Guid orgId, Guid userId)
    {
        var role = await GetRoleAsync(orgId, userId);
        if (role is not ("admin" or "moderator"))
            throw new UnauthorizedAccessException("You must be an admin or moderator to perform this action.");
    }

    private async Task RequireAdminAsync(Guid orgId, Guid userId)
    {
        var role = await GetRoleAsync(orgId, userId);
        if (role != "admin")
            throw new UnauthorizedAccessException("You must be an admin to perform this action.");
    }

    private async Task<string?> GetRoleAsync(Guid orgId, Guid userId)
    {
        return await db.OrgMembers
            .Where(m => m.OrgId == orgId && m.UserId == userId)
            .Select(m => (string?)m.Role)
            .FirstOrDefaultAsync();
    }

    private async Task<string> GenerateUniqueOrgSlugAsync(string name)
    {
        var baseSlug = name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("--", "-")
            .Trim('-');

        // Remove non-alphanumeric/dash characters
        baseSlug = System.Text.RegularExpressions.Regex.Replace(baseSlug, @"[^a-z0-9\-]", "");
        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "org";

        var slug = baseSlug;
        while (await db.Organizations.AnyAsync(o => o.Slug == slug))
        {
            var suffix = Convert.ToHexString(RandomNumberGenerator.GetBytes(2)).ToLower();
            slug = $"{baseSlug}-{suffix}";
        }
        return slug;
    }
}
