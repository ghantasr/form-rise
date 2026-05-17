using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace FormFlow.Api.Models.DTOs.Forms;

public record UpdateFormRequest(
    [MaxLength(300)] string? Title,
    string? Description,
    bool? IsPublic,
    bool? AllowAnonymous,
    bool? CollectEmail,
    bool? LimitOneResponse,
    bool? ShuffleFields,
    bool? ShowProgress,
    DateTime? AcceptFrom,
    DateTime? AcceptUntil,
    string[]? AllowedEmails,
    string? ThankYouMsg,
    [MaxLength(50)] string? ThemeId,
    List<FieldUpdateDto>? Fields
);

public record FieldUpdateDto(
    Guid? Id,
    [Required, MaxLength(30)] string FieldType,
    [Required, MaxLength(500)] string Label,
    [MaxLength(300)] string? Placeholder,
    [MaxLength(500)] string? HelpText,
    bool IsRequired,
    int SortOrder,
    JsonDocument? Options,
    JsonDocument? Validation,
    JsonDocument? Conditional,
    JsonDocument? Translations
);
