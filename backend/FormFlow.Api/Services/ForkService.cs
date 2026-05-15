using FormFlow.Api.Data;
using FormFlow.Api.Helpers;
using FormFlow.Api.Models.DTOs.Forms;
using FormFlow.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormFlow.Api.Services;

public interface IForkService
{
    Task<FormDto> ForkAsync(string slug, Guid userId);
    Task<List<FormListItemDto>> GetTemplatesAsync(int page, int pageSize, string? sort);
}

public class ForkService(AppDbContext db) : IForkService
{
    public async Task<FormDto> ForkAsync(string slug, Guid userId)
    {
        var original = await db.Forms
            .Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Slug == slug && f.IsPublic && f.Status == "active")
            ?? throw new KeyNotFoundException("Template not found.");

        string newSlug;
        do { newSlug = SlugGenerator.Generate(); }
        while (await db.Forms.AnyAsync(f => f.Slug == newSlug));

        var forked = new Form
        {
            UserId = userId,
            Slug = newSlug,
            Title = $"{original.Title} (Copy)",
            Description = original.Description,
            Status = "draft",
            IsPublic = false,
            AllowAnonymous = original.AllowAnonymous,
            CollectEmail = original.CollectEmail,
            ThankYouMsg = original.ThankYouMsg,
            ForkedFromId = original.Id,
            Fields = original.Fields.Select(f => new FormField
            {
                FieldType = f.FieldType,
                Label = f.Label,
                Placeholder = f.Placeholder,
                HelpText = f.HelpText,
                IsRequired = f.IsRequired,
                SortOrder = f.SortOrder,
                Options = f.Options,
                Validation = f.Validation,
                Conditional = f.Conditional
            }).ToList()
        };

        db.Forms.Add(forked);
        original.ForkCount++;
        await db.SaveChangesAsync();

        return new FormDto(
            forked.Id, forked.Slug, forked.Title, forked.Description, forked.Status,
            forked.IsPublic, forked.AllowAnonymous, forked.CollectEmail,
            forked.LimitOneResponse, forked.ShuffleFields, forked.ShowProgress,
            forked.AcceptFrom, forked.AcceptUntil, forked.AllowedEmails, forked.ThankYouMsg,
            forked.ForkedFromId, forked.ForkCount, forked.ResponseCount,
            forked.CreatedAt, forked.UpdatedAt,
            forked.Fields.Select(ff => new FormFieldDto(
                ff.Id, ff.FieldType, ff.Label, ff.Placeholder, ff.HelpText,
                ff.IsRequired, ff.SortOrder, ff.Options, ff.Validation, ff.Conditional
            )).ToList()
        );
    }

    public async Task<List<FormListItemDto>> GetTemplatesAsync(int page, int pageSize, string? sort)
    {
        var query = db.Forms.Where(f => f.IsPublic && f.Status == "active");
        query = sort == "popular"
            ? query.OrderByDescending(f => f.ForkCount)
            : query.OrderByDescending(f => f.CreatedAt);

        return await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FormListItemDto(
                f.Id, f.Slug, f.Title, f.Description,
                f.Status, f.ResponseCount, f.CreatedAt, f.UpdatedAt))
            .ToListAsync();
    }
}
