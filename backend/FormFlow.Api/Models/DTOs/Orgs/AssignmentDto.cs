using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.DTOs.Orgs;

public record AssignmentDto(
    Guid Id,
    Guid FormId,
    string FormTitle,
    Guid GroupId,
    string GroupName,
    DateTime? OpensAt,
    DateTime? ClosesAt,
    string Mode,
    int SubmittedCount,
    int MemberCount,
    DateTime CreatedAt,
    bool IsDefaultGroup = false
);

public record AssignmentResultDto(
    Guid ResponseId,
    Guid UserId,
    string UserName,
    string UserEmail,
    string? AvatarUrl,
    int? TotalScore,
    int? MaxScore,
    bool? IsPassed,
    DateTime SubmittedAt
);

public record CreateAssignmentRequest(
    [Required] Guid GroupId,
    DateTime? OpensAt,
    DateTime? ClosesAt,
    string Mode = "attempt_once"
);
