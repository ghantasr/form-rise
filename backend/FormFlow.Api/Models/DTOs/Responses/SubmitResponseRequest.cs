using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.DTOs.Responses;

public record SubmitResponseRequest(
    [EmailAddress] string? RespondentEmail,
    string? QrToken,
    List<AnswerSubmitDto> Answers
);

public record AnswerSubmitDto(
    [Required] Guid FieldId,
    string? Value,
    string[]? ValuesArray,
    double? NumericValue
);
