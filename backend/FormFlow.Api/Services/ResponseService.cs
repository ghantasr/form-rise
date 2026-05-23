using System.Security.Cryptography;
using System.Text;
using FormFlow.Api.Data;
using FormFlow.Api.Models.DTOs.Responses;
using FormFlow.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormFlow.Api.Services;

public interface IResponseService
{
    Task<ResponseDto> SubmitAsync(string slug, SubmitResponseRequest req, string? ipAddress, string? userAgent, Guid? currentUserId = null);
    Task<List<ResponseDto>> GetResponsesAsync(Guid formId, Guid userId, int page, int pageSize);
    Task<ResponseDto> GetResponseAsync(Guid formId, Guid responseId, Guid userId);
    Task DeleteResponseAsync(Guid formId, Guid responseId, Guid userId);
    Task<string> ExportCsvAsync(Guid formId, Guid userId);
}

public class ResponseService(AppDbContext db) : IResponseService
{
    public async Task<ResponseDto> SubmitAsync(string slug, SubmitResponseRequest req, string? ipAddress, string? userAgent, Guid? currentUserId = null)
    {
        var form = await db.Forms
            .Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Slug == slug && f.Status == "active")
            ?? throw new KeyNotFoundException("Form not found or not accepting responses.");

        // Access control
        if (form.AccessMode == "group")
        {
            if (currentUserId is null)
                throw new UnauthorizedAccessException("You must be signed in to submit this form.");

            var now = DateTime.UtcNow;
            var assignment = await db.FormAssignments
                .Where(a => a.FormId == form.Id)
                .Where(a => a.OpensAt == null || a.OpensAt <= now)
                .Where(a => a.ClosesAt == null || a.ClosesAt >= now)
                .Where(a => db.GroupMembers.Any(gm => gm.GroupId == a.GroupId && gm.UserId == currentUserId))
                .Select(a => new { a.Mode })
                .FirstOrDefaultAsync();

            if (assignment is null)
                throw new UnauthorizedAccessException("You are not enrolled in this form.");

            // Enforce attempt limit
            if (assignment.Mode == "attempt_once")
            {
                var userEmail = await db.Users
                    .Where(u => u.Id == currentUserId)
                    .Select(u => u.Email)
                    .FirstOrDefaultAsync();

                var alreadySubmitted = await db.FormResponses
                    .AnyAsync(r => r.FormId == form.Id &&
                                   r.RespondentEmail != null &&
                                   r.RespondentEmail == userEmail);

                if (alreadySubmitted)
                    throw new InvalidOperationException("You have already submitted this quiz. Only one attempt is allowed.");
            }
        }
        else if (form.AccessMode == "org")
        {
            if (currentUserId is null)
                throw new UnauthorizedAccessException("You must be signed in to submit this form.");
            if (form.OrgId is null)
                throw new InvalidOperationException("Form is not linked to an organisation.");
            var isMember = await db.OrgMembers.AnyAsync(m => m.OrgId == form.OrgId && m.UserId == currentUserId);
            if (!isMember)
                throw new UnauthorizedAccessException("You are not a member of this organisation.");
        }

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

        if (form.IsQuizMode)
        {
            var (total, max, passed) = CalculateScore(form, form.Fields.ToList(), response.Answers.ToList());
            response.TotalScore = total;
            response.MaxScore   = max;
            response.IsPassed   = passed;
            await db.SaveChangesAsync();
        }

        return MapToDto(response, form.Fields.ToList(), includeQuizDetails: form.IsQuizMode);
    }

    public async Task<List<ResponseDto>> GetResponsesAsync(Guid formId, Guid userId, int page, int pageSize)
    {
        var formExists = await db.Forms.AnyAsync(f => f.Id == formId && f.UserId == userId);
        if (!formExists) throw new KeyNotFoundException("Form not found.");

        var responses = await db.FormResponses
            .Where(r => r.FormId == formId)
            .Include(r => r.Answers).ThenInclude(a => a.Field)
            .OrderByDescending(r => r.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return responses.Select(r => MapToDto(r, r.Answers.Select(a => a.Field).OfType<FormField>().ToList())).ToList();
    }

    public async Task<ResponseDto> GetResponseAsync(Guid formId, Guid responseId, Guid userId)
    {
        var formExists = await db.Forms.AnyAsync(f => f.Id == formId && f.UserId == userId);
        if (!formExists) throw new KeyNotFoundException("Form not found.");

        var response = await db.FormResponses
            .Include(r => r.Answers).ThenInclude(a => a.Field)
            .FirstOrDefaultAsync(r => r.Id == responseId && r.FormId == formId)
            ?? throw new KeyNotFoundException("Response not found.");

        return MapToDto(response, response.Answers.Select(a => a.Field).OfType<FormField>().ToList());
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
        if (form.IsQuizMode) sb.Append(",Score,Max Score,Passed");
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
            if (form.IsQuizMode)
                sb.Append($",{response.TotalScore ?? 0},{response.MaxScore ?? 0},{(response.IsPassed == true ? "Yes" : "No")}");
            sb.AppendLine();
        }

        return sb.ToString();
    }

    private static ResponseDto MapToDto(FormResponse r, List<FormField> fields, bool includeQuizDetails = false)
    {
        var fieldMap = fields.ToDictionary(f => f.Id);
        var answers = r.Answers.Select(a =>
        {
            fieldMap.TryGetValue(a.FieldId, out var field);
            bool? isCorrect = null;
            string? explanation = null;

            if (includeQuizDetails && field?.QuizConfig is not null)
            {
                isCorrect = EvaluateAnswer(field, a);
                var config = field.QuizConfig.RootElement;
                if (config.ValueKind == System.Text.Json.JsonValueKind.Object &&
                    config.TryGetProperty("explanation", out var expProp))
                    explanation = expProp.GetString();
            }

            return new AnswerDto(a.FieldId, field?.Label, a.Value, a.ValuesArray, a.NumericValue, isCorrect, explanation);
        }).ToList();

        return new ResponseDto(r.Id, r.FormId, r.RespondentEmail, r.IsComplete, r.SubmittedAt,
            answers, r.TotalScore, r.MaxScore, r.IsPassed);
    }

    private static bool EvaluateAnswer(FormField field, FieldAnswer answer)
    {
        if (field.QuizConfig is null) return false;
        var config = field.QuizConfig.RootElement;
        if (config.ValueKind != System.Text.Json.JsonValueKind.Object) return false;
        if (!config.TryGetProperty("correctAnswers", out var correctProp)) return false;

        var correctList = correctProp.EnumerateArray()
            .Select(x => x.GetString()?.Trim() ?? "")
            .ToList();

        if (correctList.Count == 0) return false;

        switch (field.FieldType)
        {
            // ── Multi-select: all correct answers must match, no extras ──────
            case "checkbox":
            {
                var given = (answer.ValuesArray ?? [])
                    .Select(v => v.Trim().ToLowerInvariant()).ToHashSet();
                var expected = correctList
                    .Select(c => c.ToLowerInvariant()).ToHashSet();
                return given.SetEquals(expected);
            }

            // ── Numeric fields: exact or within tolerance ─────────────────
            case "number":
            case "rating":
            case "nps":
            {
                if (!double.TryParse(correctList[0], out var correctNum)) return false;
                double given = answer.NumericValue
                    ?? (double.TryParse(answer.Value, out var v) ? v : double.NaN);
                if (double.IsNaN(given)) return false;
                double tolerance = config.TryGetProperty("tolerance", out var tolProp)
                    ? tolProp.GetDouble() : 0;
                return Math.Abs(given - correctNum) <= tolerance;
            }

            // ── Date: exact match ─────────────────────────────────────────
            case "date":
            {
                var given = (answer.Value ?? "").Trim();
                return string.Equals(given, correctList[0].Trim(), StringComparison.OrdinalIgnoreCase);
            }

            // ── Text fields: case-insensitive with matchType ─────────────
            case "short_text":
            case "long_text":
            case "email":
            case "url":
            case "phone":
            {
                var given = (answer.Value ?? "").Trim();
                var expected = correctList[0].Trim();
                var matchType = config.TryGetProperty("matchType", out var mt)
                    ? mt.GetString() ?? "exact" : "exact";

                return matchType switch
                {
                    "normalized" => Normalize(given) == Normalize(expected),
                    "contains"   => given.Contains(expected, StringComparison.OrdinalIgnoreCase),
                    "startsWith" => given.StartsWith(expected, StringComparison.OrdinalIgnoreCase),
                    "pattern"    => IsPatternMatch(given, expected),
                    _            => string.Equals(given, expected, StringComparison.OrdinalIgnoreCase),
                };
            }

            // ── Option fields: single selection ───────────────────────────
            default:
            {
                var given = (answer.Value ?? "").Trim().ToLowerInvariant();
                return correctList.Any(c => string.Equals(c.Trim(), given, StringComparison.OrdinalIgnoreCase));
            }
        }
    }

    private static string Normalize(string s) =>
        System.Text.RegularExpressions.Regex.Replace(s.Trim().ToLowerInvariant(), @"\s+", "");

    private static bool IsPatternMatch(string input, string pattern)
    {
        try { return System.Text.RegularExpressions.Regex.IsMatch(input, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase); }
        catch { return false; }
    }

    private static (int total, int max, bool passed) CalculateScore(Form form, List<FormField> fields, List<FieldAnswer> answers)
    {
        int total = 0, max = 0;
        foreach (var field in fields)
        {
            if (field.QuizConfig is null) continue;
            var config = field.QuizConfig.RootElement;
            if (config.ValueKind != System.Text.Json.JsonValueKind.Object) continue;
            if (!config.TryGetProperty("points", out var pointsProp)) continue;
            int points = pointsProp.GetInt32();
            max += points;
            if (points == 0) continue;

            var answer = answers.FirstOrDefault(a => a.FieldId == field.Id);
            if (answer is null) continue;

            if (EvaluateAnswer(field, answer)) total += points;
        }

        bool passed = max > 0 && (total * 100 / max) >= form.PassMark;
        return (total, max, passed);
    }
}
