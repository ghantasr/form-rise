using System.Security.Cryptography;
using System.Text;
using FormFlow.Api.Data;
using FormFlow.Api.Models.DTOs.Responses;
using FormFlow.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormFlow.Api.Services;

public interface IResponseService
{
    Task<ResponseDto> SubmitAsync(string slug, SubmitResponseRequest req, string? ipAddress, string? userAgent);
    Task<List<ResponseDto>> GetResponsesAsync(Guid formId, Guid userId, int page, int pageSize);
    Task<ResponseDto> GetResponseAsync(Guid formId, Guid responseId, Guid userId);
    Task DeleteResponseAsync(Guid formId, Guid responseId, Guid userId);
    Task<string> ExportCsvAsync(Guid formId, Guid userId);
}

public class ResponseService(AppDbContext db) : IResponseService
{
    public async Task<ResponseDto> SubmitAsync(string slug, SubmitResponseRequest req, string? ipAddress, string? userAgent)
    {
        var form = await db.Forms
            .Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Slug == slug && f.Status == "active")
            ?? throw new KeyNotFoundException("Form not found or not accepting responses.");

        if (form.AcceptFrom.HasValue && DateTime.UtcNow < form.AcceptFrom)
            throw new InvalidOperationException("This form is not yet accepting responses.");
        if (form.AcceptUntil.HasValue && DateTime.UtcNow > form.AcceptUntil)
            throw new InvalidOperationException("This form is no longer accepting responses.");

        if (form.AllowedEmails?.Length > 0 && req.RespondentEmail is not null)
        {
            if (!form.AllowedEmails.Contains(req.RespondentEmail, StringComparer.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException("Your email is not allowed to submit this form.");
        }

        QrToken? qrToken = null;
        if (req.QrToken is not null)
        {
            qrToken = await db.QrTokens.FirstOrDefaultAsync(q => q.Token == req.QrToken && q.FormId == form.Id)
                ?? throw new InvalidOperationException("Invalid QR token.");
            if (qrToken.Status != "active")
                throw new InvalidOperationException("QR token already used or expired.");
            if (qrToken.ExpiresAt.HasValue && DateTime.UtcNow > qrToken.ExpiresAt)
            {
                qrToken.Status = "expired";
                await db.SaveChangesAsync();
                throw new InvalidOperationException("QR token has expired.");
            }
            qrToken.Status = "used";
            qrToken.UsedAt = DateTime.UtcNow;
        }

        var ipHash = ipAddress is not null
            ? Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ipAddress))).ToLower()
            : null;

        var response = new FormResponse
        {
            FormId = form.Id,
            RespondentEmail = req.RespondentEmail,
            QrTokenId = qrToken?.Id,
            IpHash = ipHash,
            UserAgent = userAgent?[..Math.Min(500, userAgent.Length)],
            Answers = req.Answers.Select(a => new FieldAnswer
            {
                FieldId = a.FieldId,
                Value = a.Value,
                ValuesArray = a.ValuesArray,
                NumericValue = a.NumericValue
            }).ToList()
        };

        db.FormResponses.Add(response);
        form.ResponseCount++;
        await db.SaveChangesAsync();

        return MapToDto(response, form.Fields.ToList());
    }

    public async Task<List<ResponseDto>> GetResponsesAsync(Guid formId, Guid userId, int page, int pageSize)
    {
        var formExists = await db.Forms.AnyAsync(f => f.Id == formId && f.UserId == userId);
        if (!formExists) throw new KeyNotFoundException("Form not found.");

        return await db.FormResponses
            .Where(r => r.FormId == formId)
            .Include(r => r.Answers).ThenInclude(a => a.Field)
            .OrderByDescending(r => r.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ResponseDto(
                r.Id, r.FormId, r.RespondentEmail, r.IsComplete, r.SubmittedAt,
                r.Answers.Select(a => new AnswerDto(
                    a.FieldId, a.Field.Label, a.Value, a.ValuesArray, a.NumericValue
                )).ToList()))
            .ToListAsync();
    }

    public async Task<ResponseDto> GetResponseAsync(Guid formId, Guid responseId, Guid userId)
    {
        var formExists = await db.Forms.AnyAsync(f => f.Id == formId && f.UserId == userId);
        if (!formExists) throw new KeyNotFoundException("Form not found.");

        var response = await db.FormResponses
            .Include(r => r.Answers).ThenInclude(a => a.Field)
            .FirstOrDefaultAsync(r => r.Id == responseId && r.FormId == formId)
            ?? throw new KeyNotFoundException("Response not found.");

        return new ResponseDto(
            response.Id, response.FormId, response.RespondentEmail, response.IsComplete, response.SubmittedAt,
            response.Answers.Select(a => new AnswerDto(
                a.FieldId, a.Field.Label, a.Value, a.ValuesArray, a.NumericValue
            )).ToList());
    }

    public async Task DeleteResponseAsync(Guid formId, Guid responseId, Guid userId)
    {
        var form = await db.Forms.FirstOrDefaultAsync(f => f.Id == formId && f.UserId == userId)
            ?? throw new KeyNotFoundException("Form not found.");

        var response = await db.FormResponses.FirstOrDefaultAsync(r => r.Id == responseId && r.FormId == formId)
            ?? throw new KeyNotFoundException("Response not found.");

        db.FormResponses.Remove(response);
        form.ResponseCount = Math.Max(0, form.ResponseCount - 1);
        await db.SaveChangesAsync();
    }

    public async Task<string> ExportCsvAsync(Guid formId, Guid userId)
    {
        var form = await db.Forms
            .Include(f => f.Fields.OrderBy(ff => ff.SortOrder))
            .FirstOrDefaultAsync(f => f.Id == formId && f.UserId == userId)
            ?? throw new KeyNotFoundException("Form not found.");

        var responses = await db.FormResponses
            .Include(r => r.Answers)
            .Where(r => r.FormId == formId)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();

        var sb = new StringBuilder();
        var fields = form.Fields.ToList();

        sb.Append("Submitted At,Email");
        foreach (var field in fields)
            sb.Append($",\"{field.Label.Replace("\"", "\"\"")}\"");
        sb.AppendLine();

        foreach (var response in responses)
        {
            sb.Append($"{response.SubmittedAt:yyyy-MM-dd HH:mm:ss},{response.RespondentEmail ?? ""}");
            foreach (var field in fields)
            {
                var answer = response.Answers.FirstOrDefault(a => a.FieldId == field.Id);
                var value = answer?.ValuesArray is not null
                    ? string.Join("; ", answer.ValuesArray)
                    : answer?.Value ?? "";
                sb.Append($",\"{value.Replace("\"", "\"\"")}\"");
            }
            sb.AppendLine();
        }

        return sb.ToString();
    }

    private static ResponseDto MapToDto(FormResponse r, List<FormField> fields) => new(
        r.Id, r.FormId, r.RespondentEmail, r.IsComplete, r.SubmittedAt,
        r.Answers.Select(a => new AnswerDto(
            a.FieldId,
            fields.FirstOrDefault(f => f.Id == a.FieldId)?.Label,
            a.Value, a.ValuesArray, a.NumericValue
        )).ToList()
    );
}
