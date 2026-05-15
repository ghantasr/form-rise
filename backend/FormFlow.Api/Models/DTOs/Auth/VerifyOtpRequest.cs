using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.DTOs.Auth;

public record VerifyOtpRequest(
    [Required, EmailAddress] string Email,
    [Required, StringLength(6, MinimumLength = 6)] string Code
);
