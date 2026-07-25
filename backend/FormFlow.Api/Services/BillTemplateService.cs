using FormFlow.Api.Data;
using FormFlow.Api.Models.DTOs.Bills;
using FormFlow.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormFlow.Api.Services;

public interface IBillTemplateService
{
    Task<List<BillTemplateListItemDto>> GetTemplatesAsync(Guid userId, string? category = null);
    Task<BillTemplateDetailDto?> GetTemplateAsync(Guid id, Guid userId);
    Task<BillTemplateDetailDto> CreateTemplateAsync(Guid userId, CreateBillTemplateRequest req);
    Task<BillTemplateDetailDto> UpdateTemplateAsync(Guid id, Guid userId, UpdateBillTemplateRequest req);
    Task DeleteTemplateAsync(Guid id, Guid userId);
}

public class BillTemplateService(AppDbContext db) : IBillTemplateService
{
    public async Task<List<BillTemplateListItemDto>> GetTemplatesAsync(Guid userId, string? category = null)
    {
        var query = db.BillTemplates
            .Include(t => t.Items)
            .Where(t => t.UserId == userId);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(t => t.Category == category);

        return await query
            .OrderByDescending(t => t.UpdatedAt)
            .Select(t => new BillTemplateListItemDto(
                t.Id,
                t.Name,
                t.Description,
                t.Category,
                t.Items.Count,
                t.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task<BillTemplateDetailDto?> GetTemplateAsync(Guid id, Guid userId)
    {
        var t = await db.BillTemplates
            .Include(x => x.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

        if (t is null) return null;

        return MapDetail(t);
    }

    public async Task<BillTemplateDetailDto> CreateTemplateAsync(Guid userId, CreateBillTemplateRequest req)
    {
        var template = new BillTemplate
        {
            UserId = userId,
            Name = req.Name,
            Description = req.Description,
            Category = req.Category,
            Currency = req.Currency,
            TaxRate = req.TaxRate,
            TaxLabel = req.TaxLabel,
            SenderName = req.SenderName,
            SenderEmail = req.SenderEmail,
            SenderAddress = req.SenderAddress,
            SenderGstin = req.SenderGstin,
            SenderLogoBase64 = req.SenderLogoBase64,
            Notes = req.Notes,
            PaymentTerms = req.PaymentTerms,
            BankName = req.BankName,
            BankAccount = req.BankAccount,
            BankIfsc = req.BankIfsc,
            AccentColor = !string.IsNullOrWhiteSpace(req.AccentColor) ? req.AccentColor : "#1B6B4A",
            Items = req.Items.Select((item, idx) => new BillTemplateItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Taxable = item.Taxable,
                SortOrder = idx
            }).ToList()
        };

        db.BillTemplates.Add(template);
        await db.SaveChangesAsync();

        return MapDetail(template);
    }

    public async Task<BillTemplateDetailDto> UpdateTemplateAsync(Guid id, Guid userId, UpdateBillTemplateRequest req)
    {
        var template = await db.BillTemplates
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId)
            ?? throw new KeyNotFoundException("Template not found");

        if (req.Name is not null) template.Name = req.Name;
        if (req.Description is not null) template.Description = req.Description;
        if (req.Category is not null) template.Category = req.Category;
        if (req.Currency is not null) template.Currency = req.Currency;
        if (req.TaxRate.HasValue) template.TaxRate = req.TaxRate.Value;
        if (req.TaxLabel is not null) template.TaxLabel = req.TaxLabel;
        if (req.SenderName is not null) template.SenderName = req.SenderName;
        if (req.SenderEmail is not null) template.SenderEmail = req.SenderEmail;
        if (req.SenderAddress is not null) template.SenderAddress = req.SenderAddress;
        if (req.SenderGstin is not null) template.SenderGstin = req.SenderGstin;
        if (req.SenderLogoBase64 is not null) template.SenderLogoBase64 = req.SenderLogoBase64;
        if (req.Notes is not null) template.Notes = req.Notes;
        if (req.PaymentTerms is not null) template.PaymentTerms = req.PaymentTerms;
        if (req.BankName is not null) template.BankName = req.BankName;
        if (req.BankAccount is not null) template.BankAccount = req.BankAccount;
        if (req.BankIfsc is not null) template.BankIfsc = req.BankIfsc;
        if (req.AccentColor is not null) template.AccentColor = req.AccentColor;

        if (req.Items is not null)
        {
            db.BillTemplateItems.RemoveRange(template.Items);
            template.Items = req.Items.Select((item, idx) => new BillTemplateItem
            {
                TemplateId = template.Id,
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Taxable = item.Taxable,
                SortOrder = idx
            }).ToList();
        }

        template.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return MapDetail(template);
    }

    public async Task DeleteTemplateAsync(Guid id, Guid userId)
    {
        var template = await db.BillTemplates
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId)
            ?? throw new KeyNotFoundException("Template not found");

        db.BillTemplates.Remove(template);
        await db.SaveChangesAsync();
    }

    private static BillTemplateDetailDto MapDetail(BillTemplate t) => new(
        t.Id,
        t.Name,
        t.Description,
        t.Category,
        t.Currency,
        t.TaxRate,
        t.TaxLabel,
        t.SenderName,
        t.SenderEmail,
        t.SenderAddress,
        t.SenderGstin,
        t.SenderLogoBase64,
        t.Notes,
        t.PaymentTerms,
        t.BankName,
        t.BankAccount,
        t.BankIfsc,
        t.AccentColor,
        t.Items.OrderBy(i => i.SortOrder).Select(i => new BillTemplateItemDto(
            i.Description,
            i.Quantity,
            i.UnitPrice,
            i.Taxable,
            i.SortOrder
        )).ToList(),
        t.CreatedAt
    );
}