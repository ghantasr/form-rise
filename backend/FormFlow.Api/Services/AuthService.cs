using FormFlow.Api.Data;
using FormFlow.Api.Helpers;
using FormFlow.Api.Models.DTOs.Auth;
using FormFlow.Api.Models.Entities;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace FormFlow.Api.Services;

public class AuthService(
    AppDbContext db,
    IDistributedCache cache,
    IEmailService emailService,
    JwtHelper jwt,
    IConfiguration config) : IAuthService
{
    public async Task SendOtpAsync(string email)
    {
        var cooldownKey = $"otp_cooldown:{email}";
        if (await cache.GetStringAsync(cooldownKey) is not null)
            throw new InvalidOperationException("Please wait before requesting another OTP.");

        var code = GenerateOtp();
        var otpData = JsonSerializer.Serialize(new { code, attempts = 0 });

        await cache.SetStringAsync($"otp:{email}", otpData, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
        });

        await cache.SetStringAsync(cooldownKey, "1", new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(60)
        });

        try
        {
            await emailService.SendOtpAsync(email, code);
        }
        catch (Exception ex)
        {
            // In development, print OTP to console so you can log in without email working
            Console.WriteLine($"\n========================================");
            Console.WriteLine($"  OTP for {email}: {code}");
            Console.WriteLine($"  (Email failed: {ex.Message})");
            Console.WriteLine($"========================================\n");
        }
    }

    public async Task<AuthResponse> VerifyOtpAsync(string email, string code)
    {
        var otpKey = $"otp:{email}";
        var stored = await cache.GetStringAsync(otpKey)
            ?? throw new UnauthorizedAccessException("OTP expired or not found.");

        var otpData = JsonSerializer.Deserialize<JsonElement>(stored);
        var storedCode = otpData.GetProperty("code").GetString();
        var attempts = otpData.GetProperty("attempts").GetInt32();

        if (attempts >= 5)
        {
            await cache.RemoveAsync(otpKey);
            throw new UnauthorizedAccessException("Too many failed attempts.");
        }

        if (storedCode != code)
        {
            var updated = JsonSerializer.Serialize(new { code = storedCode, attempts = attempts + 1 });
            await cache.SetStringAsync(otpKey, updated, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
            });
            throw new UnauthorizedAccessException("Invalid OTP code.");
        }

        await cache.RemoveAsync(otpKey);

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
        {
            user = new User { Email = email, IsVerified = true };
            db.Users.Add(user);
        }
        else
        {
            user.IsVerified = true;
            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
        }

        var rawRefreshToken = jwt.GenerateRefreshToken();
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = jwt.HashToken(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };
        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync();

        return new AuthResponse(
            jwt.GenerateAccessToken(user),
            rawRefreshToken,
            new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl));
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken)
    {
        var hash = jwt.HashToken(refreshToken);
        var stored = await db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.TokenHash == hash)
            ?? throw new UnauthorizedAccessException("Invalid refresh token.");

        if (!stored.IsActive)
            throw new UnauthorizedAccessException("Refresh token expired or revoked.");

        stored.RevokedAt = DateTime.UtcNow;

        var rawNew = jwt.GenerateRefreshToken();
        var newToken = new RefreshToken
        {
            UserId = stored.UserId,
            TokenHash = jwt.HashToken(rawNew),
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };
        db.RefreshTokens.Add(newToken);
        await db.SaveChangesAsync();

        return new AuthResponse(
            jwt.GenerateAccessToken(stored.User),
            rawNew,
            new UserDto(stored.User.Id, stored.User.Email, stored.User.DisplayName, stored.User.AvatarUrl));
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        var hash = jwt.HashToken(refreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash);
        if (stored is not null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
    }

    public async Task<AuthResponse> GoogleLoginAsync(string idToken)
    {
        var clientId = config["Google:ClientId"]
            ?? throw new InvalidOperationException("Google:ClientId not configured.");

        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [clientId]
        };

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        catch
        {
            throw new UnauthorizedAccessException("Invalid Google token.");
        }

        var email = payload.Email;
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
        {
            user = new User
            {
                Email = email,
                DisplayName = payload.Name,
                AvatarUrl = payload.Picture,
                IsVerified = true
            };
            db.Users.Add(user);
        }
        else
        {
            user.DisplayName ??= payload.Name;
            user.AvatarUrl ??= payload.Picture;
            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
        }

        var rawRefreshToken = jwt.GenerateRefreshToken();
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = jwt.HashToken(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        });
        await db.SaveChangesAsync();

        return new AuthResponse(
            jwt.GenerateAccessToken(user),
            rawRefreshToken,
            new UserDto(user.Id, user.Email, user.DisplayName, user.AvatarUrl));
    }

    private static string GenerateOtp()
    {
        return Random.Shared.Next(100000, 999999).ToString();
    }
}
