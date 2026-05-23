namespace FormFlow.Api.Models.DTOs.Responses;

public record ResponseDto(
    Guid Id,
    Guid FormId,
    string? RespondentEmail,
    bool IsComplete,
    DateTime SubmittedAt,
    List<AnswerDto> Answers,
    int? TotalScore,
    int? MaxScore,
    bool? IsPassed
);

public record AnswerDto(
    Guid FieldId,
    string? FieldLabel,
    string? Value,
    string[]? ValuesArray,
    double? NumericValue,
    bool? IsCorrect,
    string? Explanation
);
