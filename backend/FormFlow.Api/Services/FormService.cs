using System.Text.Json;
using FormFlow.Api.Data;
using FormFlow.Api.Helpers;
using FormFlow.Api.Models.DTOs.Forms;
using FormFlow.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace FormFlow.Api.Services;

public class FormService(AppDbContext db, IDistributedCache cache) : IFormService
{
    private static string PubFormKey(string slug) => $"fr:form:pub:{slug}";

    private static readonly DistributedCacheEntryOptions PubFormTtl =
        new() { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2) };

    public async Task<List<FormListItemDto>> GetUserFormsAsync(Guid userId)
    {
        return await db.Forms
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.UpdatedAt)
            .Select(f => new FormListItemDto(
                f.Id, f.Slug, f.Title, f.Description,
                f.Status, f.ResponseCount, f.CreatedAt, f.UpdatedAt))
            .ToListAsync();
    }

    public async Task<FormDto> GetFormAsync(Guid formId, Guid userId)
    {
        var form = await db.Forms
            .Include(f => f.Fields.OrderBy(ff => ff.SortOrder))
            .FirstOrDefaultAsync(f => f.Id == formId && f.UserId == userId)
            ?? throw new KeyNotFoundException("Form not found.");
        return MapToDto(form);
    }

    public async Task<FormDto> GetPublicFormAsync(string slug)
    {
        var cached = await cache.GetStringAsync(PubFormKey(slug));
        if (cached is not null)
            return JsonSerializer.Deserialize<FormDto>(cached)!;

        var form = await db.Forms
            .Include(f => f.Fields.OrderBy(ff => ff.SortOrder))
            .FirstOrDefaultAsync(f => f.Slug == slug && f.Status == "active")
            ?? throw new KeyNotFoundException("Form not found or not active.");

        var dto = MapToDto(form);
        await cache.SetStringAsync(PubFormKey(slug), JsonSerializer.Serialize(dto), PubFormTtl);
        return dto;
    }

    public async Task<FormDto> CreateFormAsync(Guid userId, CreateFormRequest req)
    {
        string slug;
        do { slug = SlugGenerator.Generate(); }
        while (await db.Forms.AnyAsync(f => f.Slug == slug));

        var form = new Form
        {
            UserId = userId,
            Slug = slug,
            Title = req.Title,
            Description = req.Description
        };
        db.Forms.Add(form);
        await db.SaveChangesAsync();
        return MapToDto(form);
    }

    public async Task<FormDto> UpdateFormAsync(Guid formId, Guid userId, UpdateFormRequest req)
    {
        var form = await db.Forms
            .Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Id == formId && f.UserId == userId)
            ?? throw new KeyNotFoundException("Form not found.");

        if (req.Title is not null) form.Title = req.Title;
        if (req.Description is not null) form.Description = req.Description;
        if (req.IsPublic is not null) form.IsPublic = req.IsPublic.Value;
        if (req.AllowAnonymous is not null) form.AllowAnonymous = req.AllowAnonymous.Value;
        if (req.CollectEmail is not null) form.CollectEmail = req.CollectEmail.Value;
        if (req.LimitOneResponse is not null) form.LimitOneResponse = req.LimitOneResponse.Value;
        if (req.ShuffleFields is not null) form.ShuffleFields = req.ShuffleFields.Value;
        if (req.ShowProgress is not null) form.ShowProgress = req.ShowProgress.Value;
        if (req.AcceptFrom is not null) form.AcceptFrom = req.AcceptFrom;
        if (req.AcceptUntil is not null) form.AcceptUntil = req.AcceptUntil;
        if (req.AllowedEmails is not null) form.AllowedEmails = req.AllowedEmails;
        if (req.ThankYouMsg is not null) form.ThankYouMsg = req.ThankYouMsg;

        if (req.Fields is not null)
        {
            db.FormFields.RemoveRange(form.Fields);
            var newFields = req.Fields.Select((f, i) => new FormField
            {
                Id = f.Id ?? Guid.NewGuid(),
                FormId = form.Id,
                FieldType = f.FieldType,
                Label = f.Label,
                Placeholder = f.Placeholder,
                HelpText = f.HelpText,
                IsRequired = f.IsRequired,
                SortOrder = f.SortOrder != 0 ? f.SortOrder : i,
                Options = f.Options,
                Validation = f.Validation,
                Conditional = f.Conditional,
                Translations = f.Translations
            }).ToList();
            db.FormFields.AddRange(newFields);
            form.Fields = newFields;
        }

        form.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await cache.RemoveAsync(PubFormKey(form.Slug));
        return MapToDto(form);
    }

    public async Task DeleteFormAsync(Guid formId, Guid userId)
    {
        var form = await db.Forms.FirstOrDefaultAsync(f => f.Id == formId && f.UserId == userId)
            ?? throw new KeyNotFoundException("Form not found.");
        await cache.RemoveAsync(PubFormKey(form.Slug));
        db.Forms.Remove(form);
        await db.SaveChangesAsync();
    }

    public async Task<FormDto> PublishFormAsync(Guid formId, Guid userId)
    {
        var form = await db.Forms.Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Id == formId && f.UserId == userId)
            ?? throw new KeyNotFoundException("Form not found.");
        form.Status = "active";
        form.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await cache.RemoveAsync(PubFormKey(form.Slug));
        return MapToDto(form);
    }

    public async Task<FormDto> UnpublishFormAsync(Guid formId, Guid userId)
    {
        var form = await db.Forms.Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Id == formId && f.UserId == userId)
            ?? throw new KeyNotFoundException("Form not found.");
        form.Status = "paused";
        form.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await cache.RemoveAsync(PubFormKey(form.Slug));
        return MapToDto(form);
    }

    private static FormDto MapToDto(Form form) => new(
        form.Id, form.Slug, form.Title, form.Description, form.Status,
        form.IsPublic, form.AllowAnonymous, form.CollectEmail,
        form.LimitOneResponse, form.ShuffleFields, form.ShowProgress,
        form.AcceptFrom, form.AcceptUntil, form.AllowedEmails, form.ThankYouMsg,
        form.ForkedFromId, form.ForkCount, form.ResponseCount, form.ViewCount,
        form.CreatedAt, form.UpdatedAt,
        form.Fields.OrderBy(f => f.SortOrder).Select(ff => new FormFieldDto(
            ff.Id, ff.FieldType, ff.Label, ff.Placeholder, ff.HelpText,
            ff.IsRequired, ff.SortOrder, ff.Options, ff.Validation, ff.Conditional, ff.Translations
        )).ToList(),
        form.EnabledLanguages,
        form.Translations
    );
}
