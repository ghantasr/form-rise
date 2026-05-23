using FormFlow.Api.Data;
using FormFlow.Api.Models.DTOs.Orgs;
using FormFlow.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormFlow.Api.Services;

public interface IAssignmentService
{
    Task<AssignmentDto> CreateAssignmentAsync(Guid formId, Guid userId, CreateAssignmentRequest req);
    Task<List<AssignmentDto>> GetFormAssignmentsAsync(Guid formId, Guid userId);
    Task DeleteAssignmentAsync(Guid formId, Guid assignmentId, Guid userId);
    Task<List<AssignmentResultDto>> GetAssignmentResultsAsync(Guid assignmentId, Guid userId);
    Task<List<StudentResultDto>> GetMyResultsAsync(Guid userId);
    Task<List<StudentAssignmentDto>> GetMyAssignmentsAsync(Guid userId);
    Task<List<AssignmentDto>> GetOrgAssignmentsAsync(Guid orgId, Guid requesterId);
}

public record StudentResultDto(
    Guid ResponseId,
    Guid FormId,
    string FormTitle,
    string FormSlug,
    int? TotalScore,
    int? MaxScore,
    bool? IsPassed,
    DateTime SubmittedAt
);

public record StudentAssignmentDto(
    Guid AssignmentId,
    Guid FormId,
    string FormTitle,
    string FormSlug,
    string GroupName,
    DateTime? OpensAt,
    DateTime? ClosesAt,
    string Mode,
    bool HasSubmitted,
    int? TotalScore,
    int? MaxScore,
    bool? IsPassed
);

public class AssignmentService(AppDbContext db) : IAssignmentService
{
    public async Task<AssignmentDto> CreateAssignmentAsync(Guid formId, Guid userId, CreateAssignmentRequest req)
    {
        // Verify form belongs to userId
        var form = await db.Forms.FirstOrDefaultAsync(f => f.Id == formId && f.UserId == userId)
            ?? throw new KeyNotFoundException("Form not found.");

        // Verify group belongs to an org where userId is admin or moderator
        var group = await db.OrgGroups
            .Include(g => g.Org)
            .FirstOrDefaultAsync(g => g.Id == req.GroupId)
            ?? throw new KeyNotFoundException("Group not found.");

        var memberRole = await db.OrgMembers
            .Where(m => m.OrgId == group.OrgId && m.UserId == userId)
            .Select(m => (string?)m.Role)
            .FirstOrDefaultAsync();

        if (memberRole is not ("admin" or "moderator"))
            throw new UnauthorizedAccessException("You must be an admin or moderator in the group's organisation to assign forms.");

        var alreadyAssigned = await db.FormAssignments
            .AnyAsync(a => a.FormId == formId && a.GroupId == req.GroupId);
        if (alreadyAssigned)
            throw new InvalidOperationException("This form is already assigned to that group. Delete the existing assignment first if you want to reassign it.");

        var assignment = new FormAssignment
        {
            FormId = formId,
            GroupId = req.GroupId,
            AssignedBy = userId,
            OpensAt = req.OpensAt,
            ClosesAt = req.ClosesAt,
            Mode = req.Mode
        };
        db.FormAssignments.Add(assignment);
        await db.SaveChangesAsync();

        var memberCount = await db.GroupMembers.CountAsync(gm => gm.GroupId == req.GroupId);
        return new AssignmentDto(
            assignment.Id,
            formId,
            form.Title,
            req.GroupId,
            group.Name,
            assignment.OpensAt,
            assignment.ClosesAt,
            assignment.Mode,
            0,
            memberCount,
            assignment.CreatedAt,
            group.IsDefault
        );
    }

    public async Task<List<AssignmentDto>> GetFormAssignmentsAsync(Guid formId, Guid userId)
    {
        var formExists = await db.Forms.AnyAsync(f => f.Id == formId && f.UserId == userId);
        if (!formExists) throw new KeyNotFoundException("Form not found.");

        var assignments = await db.FormAssignments
            .Where(a => a.FormId == formId)
            .Select(a => new
            {
                a.Id,
                a.FormId,
                FormTitle = a.Form.Title,
                a.GroupId,
                GroupName = a.Group.Name,
                GroupIsDefault = a.Group.IsDefault,
                a.OpensAt,
                a.ClosesAt,
                a.Mode,
                MemberCount = a.Group.Members.Count,
                a.CreatedAt,
                MemberUserIds = a.Group.Members.Select(gm => gm.UserId).ToList()
            })
            .ToListAsync();

        var result = new List<AssignmentDto>();
        foreach (var a in assignments)
        {
            var memberEmails = await db.Users
                .Where(u => a.MemberUserIds.Contains(u.Id))
                .Select(u => u.Email)
                .ToListAsync();

            var submittedCount = await db.FormResponses
                .CountAsync(r => r.FormId == a.FormId &&
                                 r.RespondentEmail != null &&
                                 memberEmails.Contains(r.RespondentEmail));

            result.Add(new AssignmentDto(
                a.Id, a.FormId, a.FormTitle,
                a.GroupId, a.GroupName,
                a.OpensAt, a.ClosesAt, a.Mode,
                submittedCount, a.MemberCount, a.CreatedAt,
                a.GroupIsDefault
            ));
        }
        return result;
    }

    public async Task DeleteAssignmentAsync(Guid formId, Guid assignmentId, Guid userId)
    {
        var formExists = await db.Forms.AnyAsync(f => f.Id == formId && f.UserId == userId);
        if (!formExists) throw new KeyNotFoundException("Form not found.");

        var assignment = await db.FormAssignments
            .FirstOrDefaultAsync(a => a.Id == assignmentId && a.FormId == formId)
            ?? throw new KeyNotFoundException("Assignment not found.");

        db.FormAssignments.Remove(assignment);
        await db.SaveChangesAsync();
    }

    public async Task<List<AssignmentResultDto>> GetAssignmentResultsAsync(Guid assignmentId, Guid userId)
    {
        var assignment = await db.FormAssignments
            .Include(a => a.Form)
            .Include(a => a.Group)
            .FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new KeyNotFoundException("Assignment not found.");

        // Ensure requester owns the form or is admin/moderator in the org
        var isFormOwner = assignment.Form.UserId == userId;
        if (!isFormOwner)
        {
            var role = await db.OrgMembers
                .Where(m => m.OrgId == assignment.Group.OrgId && m.UserId == userId)
                .Select(m => (string?)m.Role)
                .FirstOrDefaultAsync();
            if (role is not ("admin" or "moderator"))
                throw new UnauthorizedAccessException("You do not have access to these results.");
        }

        // Get all group members
        var groupMemberUserIds = await db.GroupMembers
            .Where(gm => gm.GroupId == assignment.GroupId)
            .Select(gm => gm.UserId)
            .ToListAsync();

        // Get users in the group
        var users = await db.Users
            .Where(u => groupMemberUserIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id);

        // Get responses from group members for this form
        // We match by email since responses currently store RespondentEmail (not UserId)
        var groupMemberEmails = users.Values.Select(u => u.Email).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var responses = await db.FormResponses
            .Where(r => r.FormId == assignment.FormId &&
                        r.RespondentEmail != null &&
                        groupMemberEmails.Contains(r.RespondentEmail))
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();

        // Map email -> user for lookup
        var userByEmail = users.Values.ToDictionary(u => u.Email, StringComparer.OrdinalIgnoreCase);

        return responses.Select(r =>
        {
            var user = r.RespondentEmail is not null && userByEmail.TryGetValue(r.RespondentEmail, out var u) ? u : null;
            return new AssignmentResultDto(
                r.Id,
                user?.Id ?? Guid.Empty,
                user?.DisplayName ?? r.RespondentEmail ?? "Unknown",
                r.RespondentEmail ?? "",
                user?.AvatarUrl,
                r.TotalScore,
                r.MaxScore,
                r.IsPassed,
                r.SubmittedAt
            );
        }).ToList();
    }

    public async Task<List<StudentResultDto>> GetMyResultsAsync(Guid userId)
    {
        var user = await db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        // Get all form IDs assigned to groups the user belongs to
        var assignedFormIds = await db.FormAssignments
            .Where(a => db.GroupMembers.Any(gm => gm.GroupId == a.GroupId && gm.UserId == userId))
            .Select(a => a.FormId)
            .Distinct()
            .ToListAsync();

        var responses = await db.FormResponses
            .Where(r => assignedFormIds.Contains(r.FormId) &&
                        r.RespondentEmail == user.Email)
            .Include(r => r.Form)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();

        return responses.Select(r => new StudentResultDto(
            r.Id,
            r.FormId,
            r.Form.Title,
            r.Form.Slug,
            r.TotalScore,
            r.MaxScore,
            r.IsPassed,
            r.SubmittedAt
        )).ToList();
    }

    public async Task<List<StudentAssignmentDto>> GetMyAssignmentsAsync(Guid userId)
    {
        var user = await db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        // Get groups the user belongs to
        var groupIds = await db.GroupMembers
            .Where(gm => gm.UserId == userId)
            .Select(gm => gm.GroupId)
            .ToListAsync();

        // Get all assignments for those groups
        var assignments = await db.FormAssignments
            .Where(a => groupIds.Contains(a.GroupId))
            .Include(a => a.Form)
            .Include(a => a.Group)
            .ToListAsync();

        // Get all responses by this user (matched by email)
        var responsesByFormId = await db.FormResponses
            .Where(r => r.RespondentEmail == user.Email && assignments.Select(a => a.FormId).Contains(r.FormId))
            .ToDictionaryAsync(r => r.FormId);

        return assignments
            .OrderBy(a => a.ClosesAt.HasValue ? 0 : 1)
            .ThenBy(a => a.ClosesAt)
            .ThenByDescending(a => a.CreatedAt)
            .Select(a =>
            {
                var hasResponse = responsesByFormId.TryGetValue(a.FormId, out var response);
                return new StudentAssignmentDto(
                    a.Id,
                    a.FormId,
                    a.Form.Title,
                    a.Form.Slug,
                    a.Group.Name,
                    a.OpensAt,
                    a.ClosesAt,
                    a.Mode,
                    hasResponse,
                    hasResponse ? response!.TotalScore : null,
                    hasResponse ? response!.MaxScore : null,
                    hasResponse ? response!.IsPassed : null
                );
            })
            .ToList();
    }

    public async Task<List<AssignmentDto>> GetOrgAssignmentsAsync(Guid orgId, Guid requesterId)
    {
        var isMember = await db.OrgMembers.AnyAsync(m => m.OrgId == orgId && m.UserId == requesterId);
        if (!isMember) throw new UnauthorizedAccessException("You are not a member of this organisation.");

        var orgGroupIds = await db.OrgGroups
            .Where(g => g.OrgId == orgId)
            .Select(g => g.Id)
            .ToListAsync();

        var assignments = await db.FormAssignments
            .Where(a => orgGroupIds.Contains(a.GroupId))
            .Select(a => new
            {
                a.Id,
                a.FormId,
                FormTitle = a.Form.Title,
                a.GroupId,
                GroupName = a.Group.Name,
                GroupIsDefault = a.Group.IsDefault,
                a.OpensAt,
                a.ClosesAt,
                a.Mode,
                MemberCount = a.Group.Members.Count,
                a.CreatedAt,
                MemberUserIds = a.Group.Members.Select(gm => gm.UserId).ToList()
            })
            .ToListAsync();

        var result = new List<AssignmentDto>();
        foreach (var a in assignments)
        {
            var memberEmails = await db.Users
                .Where(u => a.MemberUserIds.Contains(u.Id))
                .Select(u => u.Email)
                .ToListAsync();

            var submittedCount = await db.FormResponses
                .CountAsync(r => r.FormId == a.FormId &&
                                 r.RespondentEmail != null &&
                                 memberEmails.Contains(r.RespondentEmail));

            result.Add(new AssignmentDto(
                a.Id, a.FormId, a.FormTitle,
                a.GroupId, a.GroupName,
                a.OpensAt, a.ClosesAt, a.Mode,
                submittedCount, a.MemberCount, a.CreatedAt,
                a.GroupIsDefault
            ));
        }
        return result;
    }
}
