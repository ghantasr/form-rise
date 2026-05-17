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
    int ViewCount,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<FormFieldDto> Fields,
    string[] EnabledLanguages,
    JsonDocument? Translations,
    string? ThemeId
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
    JsonDocument? Conditional,
    JsonDocument? Translations
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
