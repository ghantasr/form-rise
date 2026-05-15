using FormFlow.Api.Data;
using FormFlow.Api.Helpers;
using FormFlow.Api.Models.DTOs.Auth;
using FormFlow.Api.Models.Entities;
using FormFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FormFlow.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService, AppDbContext db, JwtHelper jwt, IWebHostEnvironment env) : ControllerBase
{
    [HttpPost("send-otp")]
    [EnableRateLimiting("otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest req)
    {
        await authService.SendOtpAsync(req.Email);
        return Ok(new { message = "OTP sent successfully." });
    }

    [HttpPost("verify-otp")]
    [EnableRateLimiting("otp")]
    public async Task<ActionResult<AuthResponse>> VerifyOtp([FromBody] VerifyOtpRequest req)
    {
        var result = await authService.VerifyOtpAsync(req.Email, req.Code);
        AppendRefreshCookie(result.RefreshToken);
        return Ok(new { accessToken = result.AccessToken, user = result.User });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (refreshToken is null) return Unauthorized(new { error = "No session." });
        var result = await authService.RefreshAsync(refreshToken);
        AppendRefreshCookie(result.RefreshToken);
        return Ok(new { accessToken = result.AccessToken, user = result.User });
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> GoogleLogin([FromBody] GoogleAuthRequest req)
    {
        var result = await authService.GoogleLoginAsync(req.IdToken);
        AppendRefreshCookie(result.RefreshToken);
        return Ok(new { accessToken = result.AccessToken, user = result.User });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var token = Request.Cookies["refreshToken"];
        if (token is not null)
            await authService.RevokeRefreshTokenAsync(token);
        Response.Cookies.Delete("refreshToken");
        return Ok(new { message = "Logged out." });
    }

    private void AppendRefreshCookie(string token)
    {
        var isHttps = Request.IsHttps;
        Response.Cookies.Append("refreshToken", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = isHttps ? SameSiteMode.Strict : SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(30)
        });
    }

    // Development-only endpoint for Playwright e2e tests — never exposed in production
    [HttpPost("dev-login")]
    public async Task<IActionResult> DevLogin()
    {
        if (!env.IsDevelopment()) return NotFound();

        const string testEmail = "playwright@formflow.test";
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == testEmail);
        if (user is null)
        {
            user = new User { Email = testEmail, DisplayName = "Playwright Tester", IsVerified = true };
            db.Users.Add(user);
        }
        else
        {
            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
        }

        var existing = db.RefreshTokens.Where(r => r.UserId == user.Id && r.RevokedAt == null);
        await existing.ForEachAsync(t => t.RevokedAt = DateTime.UtcNow);

        var raw = jwt.GenerateRefreshToken();
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = jwt.HashToken(raw),
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        });
        await db.SaveChangesAsync();

        AppendRefreshCookie(raw);
        return Ok(new { accessToken = jwt.GenerateAccessToken(user), user = new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl) });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");
        return Ok(new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl));
    }
}
