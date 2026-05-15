using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.DTOs.Forms;

public record CreateFormRequest(
    [Required, MaxLength(300)] string Title,
    string? Description
);
