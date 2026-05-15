using FormFlow.Api.Data;
using FormFlow.Api.Helpers;
using FormFlow.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormFlow.Api.Services;

public record QrCreateRequest(int Count = 1, string? LabelPrefix = null, DateTime? ExpiresAt = null);
public record QrDto(Guid Id, string Token, string? Label, string Status, DateTime? ExpiresAt, string Url, string QrImageBase64);

public interface IQrService
{
    Task<List<QrDto>> GenerateAsync(Guid formId, Guid userId, QrCreateRequest req);
    Task<List<QrDto>> GetByFormAsync(Guid formId, Guid userId);
    Task DeleteAsync(Guid formId, Guid qrId, Guid userId);
}

public class QrService(AppDbContext db, IConfiguration config) : IQrService
{
    public async Task<List<QrDto>> GenerateAsync(Guid formId, Guid userId, QrCreateRequest req)
    {
        var form = await db.Forms.FirstOrDefaultAsync(f => f.Id == formId && f.UserId == userId)
            ?? throw new KeyNotFoundException("Form not found.");

        var baseUrl = config["App:BaseUrl"] ?? "http://localhost:3000";
        var result = new List<QrDto>();

        for (int i = 1; i <= req.Count; i++)
        {
            var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N")[..16];
            var label = req.LabelPrefix is not null ? $"{req.LabelPrefix} {i}" : null;
            var url = $"{baseUrl}/f/{form.Slug}?token={token}";
            var imageBytes = QrGenerator.GenerateQrImage(url);

            var qr = new QrToken
            {
                FormId = formId,
                Token = token,
                Label = label,
                ExpiresAt = req.ExpiresAt
            };
            db.QrTokens.Add(qr);
            result.Add(new QrDto(qr.Id, token, label, "active", req.ExpiresAt, url,
                $"data:image/png;base64,{Convert.ToBase64String(imageBytes)}"));
        }

        await db.SaveChangesAsync();
        return result;
    }

    public async Task<List<QrDto>> GetByFormAsync(Guid formId, Guid userId)
    {
        var formExists = await db.Forms.AnyAsync(f => f.Id == formId && f.UserId == userId);
        if (!formExists) throw new KeyNotFoundException("Form not found.");

        var baseUrl = config["App:BaseUrl"] ?? "http://localhost:3000";
        return await db.QrTokens
            .Where(q => q.FormId == formId)
            .OrderByDescending(q => q.CreatedAt)
            .Select(q => new QrDto(q.Id, q.Token, q.Label, q.Status, q.ExpiresAt,
                $"{baseUrl}/f/{q.Form.Slug}?token={q.Token}", ""))
            .ToListAsync();
    }

    public async Task DeleteAsync(Guid formId, Guid qrId, Guid userId)
    {
        var formExists = await db.Forms.AnyAsync(f => f.Id == formId && f.UserId == userId);
        if (!formExists) throw new KeyNotFoundException("Form not found.");

        var qr = await db.QrTokens.FirstOrDefaultAsync(q => q.Id == qrId && q.FormId == formId)
            ?? throw new KeyNotFoundException("QR token not found.");

        db.QrTokens.Remove(qr);
        await db.SaveChangesAsync();
    }
}
