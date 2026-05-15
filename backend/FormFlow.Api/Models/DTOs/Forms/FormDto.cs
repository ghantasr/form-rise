using System.Text.Json;

namespace FormFlow.Api.Models.DTOs.Forms;

public record FormDto(
    Guid Id,
    string Slug,
    string Title,
    string? Description,
    string Status,
    bool IsPublic,
    bool AllowAnonymous,
    bool CollectEmail,
    bool LimitOneResponse,
    bool ShuffleFields,
    bool ShowProgress,
    DateTime? AcceptFrom,
    DateTime? AcceptUntil,
    string[]? AllowedEmails,
    string ThankYouMsg,
    Guid? ForkedFromId,
    int ForkCount,
    int ResponseCount,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<FormFieldDto> Fields
);

public record FormFieldDto(
    Guid Id,
    string FieldType,
    string Label,
    string? Placeholder,
    string? HelpText,
    bool IsRequired,
    int SortOrder,
    JsonDocument? Options,
    JsonDocument? Validation,
    JsonDocument? Conditional
);

public record FormListItemDto(
    Guid Id,
    string Slug,
    string Title,
    string? Description,
    string Status,
    int ResponseCount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
