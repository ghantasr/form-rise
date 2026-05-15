using System.ComponentModel.DataAnnotations;

namespace FormFlow.Api.Models.DTOs.Auth;

public record SendOtpRequest(
    [Required, EmailAddress, MaxLength(255)] string Email
);
