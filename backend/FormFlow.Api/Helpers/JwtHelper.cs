using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FormFlow.Api.Models.Entities;
using Microsoft.IdentityModel.Tokens;

namespace FormFlow.Api.Helpers;

public class JwtHelper(IConfiguration config)
{
    public string GenerateAccessToken(User user)
    {
        var secret = config["Jwt:Secret"] ?? throw new InvalidOperationException("JWT secret missing");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("name", user.DisplayName ?? user.Email),
            new Claim(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64)
        };

        var expiryMinutes = int.Parse(config["Jwt:ExpiryMinutes"] ?? "15");
        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        Random.Shared.NextBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    public string HashToken(string token)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(
            Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLower();
    }
}
