using FormFlow.Api.Models.DTOs.Auth;

namespace FormFlow.Api.Services;

public interface IAuthService
{
    Task SendOtpAsync(string email);
    Task<AuthResponse> VerifyOtpAsync(string email, string code);
    Task<AuthResponse> RefreshAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
    Task<AuthResponse> GoogleLoginAsync(string idToken);
}
