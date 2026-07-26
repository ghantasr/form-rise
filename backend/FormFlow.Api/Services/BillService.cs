using System.Text.Json;
using FormFlow.Api.Data;
using FormFlow.Api.Models.DTOs.Bills;
using FormFlow.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormFlow.Api.Services;

public interface IBillService
{
    Task<List<BillListItemDto>> GetBillsAsync(Guid userId, string? search, string? status, int page, int pageSize);
    Task<BillDto> GetBillAsync(Guid billId, Guid userId);
    Task<BillDto?> GetBillByNumberAsync(Guid userId, string billNumber);
    Task<BillDto> CreateBillAsync(Guid userId, CreateBillRequest req);
    Task<BillDto> UpdateBillAsync(Guid billId, Guid userId, UpdateBillRequest req);
    Task DeleteBillAsync(Guid billId, Guid userId);
    Task<BillDto> UpdateStatusAsync(Guid billId, Guid userId, string status);
    Task<byte[]> GeneratePdfAsync(Guid billId, Guid userId);
    Task SendBillAsync(Guid billId, Guid userId);
    Task<string> GetNextBillNumberAsync(Guid userId, string prefix);
}

public class BillService(
    AppDbContext db,
    IEmailService emailService,
    IConfiguration config) : IBillService
{
    private static string DefaultPrefix => "INV-";

    public async Task<List<BillListItemDto>> GetBillsAsync(Guid userId, string? search, string? status, int page, int pageSize)
    {
        var query = db.Bills.Where(b => b.UserId == userId);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(b => b.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(b =>
                b.BillNumber.Contains(search) ||
                b.RecipientName.Contains(search) ||
                (b.RecipientEmail != null && b.RecipientEmail.Contains(search)));

        return await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BillListItemDto(
                b.Id, b.BillNumber, b.Status, b.RecipientName,
                b.RecipientEmail, b.IssueDate, b.DueDate, b.Total,
                b.Currency, b.CreatedAt))
            .ToListAsync();
    }

    public async Task<BillDto> GetBillAsync(Guid billId, Guid userId)
    {
        var bill = await db.Bills
            .Include(b => b.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId)
            ?? throw new KeyNotFoundException("Bill not found.");

        return MapToDto(bill);
    }

    public async Task<BillDto?> GetBillByNumberAsync(Guid userId, string billNumber)
    {
        var bill = await db.Bills
            .Include(b => b.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(b => b.UserId == userId && b.BillNumber == billNumber);

        return bill is null ? null : MapToDto(bill);
    }

    public async Task<BillDto> CreateBillAsync(Guid userId, CreateBillRequest req)
    {
        var prefix = DefaultPrefix;
        var billNumber = await GetNextBillNumberAsync(userId, prefix);

        var bill = new Bill
        {
            UserId = userId,
            BillNumber = !string.IsNullOrWhiteSpace(req.BillNumber) ? req.BillNumber : billNumber,
            Status = "draft",
            IssueDate = req.IssueDate ?? DateTime.UtcNow,
            DueDate = req.DueDate,
            Currency = string.IsNullOrWhiteSpace(req.Currency) ? "INR" : req.Currency,
            TaxRate = req.TaxRate,
            TaxLabel = string.IsNullOrWhiteSpace(req.TaxLabel) ? "GST" : req.TaxLabel,
            RecipientName = req.RecipientName,
            RecipientEmail = req.RecipientEmail,
            RecipientAddress = req.RecipientAddress,
            RecipientGstin = req.RecipientGstin,
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
            HeaderOrder = req.HeaderOrder,
            InvoiceLabel = req.InvoiceLabel,
            AccentColor = !string.IsNullOrWhiteSpace(req.AccentColor) ? req.AccentColor : "#1B6B4A",
            Items = req.Items?.Select((item, i) => new BillItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Amount = item.Quantity * item.UnitPrice,
                SortOrder = i,
                Taxable = item.Taxable
            }).ToList() ?? []
        };

        RecalculateBill(bill);
        db.Bills.Add(bill);
        await db.SaveChangesAsync();

        return MapToDto(bill);
    }

    public async Task<BillDto> UpdateBillAsync(Guid billId, Guid userId, UpdateBillRequest req)
    {
        var bill = await db.Bills
            .Include(b => b.Items)
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId)
            ?? throw new KeyNotFoundException("Bill not found.");

        if (bill.Status == "sent")
            throw new InvalidOperationException("Cannot edit a sent bill. Mark it as draft first.");

        if (req.BillNumber is not null) bill.BillNumber = req.BillNumber;
        if (req.IssueDate is not null) bill.IssueDate = req.IssueDate.Value;
        if (req.DueDate is not null) bill.DueDate = req.DueDate;
        if (req.Currency is not null) bill.Currency = req.Currency;
        if (req.TaxRate is not null) bill.TaxRate = req.TaxRate.Value;
        if (req.TaxLabel is not null) bill.TaxLabel = req.TaxLabel;
        if (req.RecipientName is not null) bill.RecipientName = req.RecipientName;
        if (req.RecipientEmail is not null) bill.RecipientEmail = req.RecipientEmail;
        if (req.RecipientAddress is not null) bill.RecipientAddress = req.RecipientAddress;
        if (req.RecipientGstin is not null) bill.RecipientGstin = req.RecipientGstin;
        if (req.SenderName is not null) bill.SenderName = req.SenderName;
        if (req.SenderEmail is not null) bill.SenderEmail = req.SenderEmail;
        if (req.SenderAddress is not null) bill.SenderAddress = req.SenderAddress;
        if (req.SenderGstin is not null) bill.SenderGstin = req.SenderGstin;
        if (req.SenderLogoBase64 is not null) bill.SenderLogoBase64 = req.SenderLogoBase64;
        if (req.Notes is not null) bill.Notes = req.Notes;
        if (req.PaymentTerms is not null) bill.PaymentTerms = req.PaymentTerms;
        if (req.BankName is not null) bill.BankName = req.BankName;
        if (req.BankAccount is not null) bill.BankAccount = req.BankAccount;
        if (req.BankIfsc is not null) bill.BankIfsc = req.BankIfsc;
        if (req.HeaderOrder is not null) bill.HeaderOrder = req.HeaderOrder;
        if (req.InvoiceLabel is not null) bill.InvoiceLabel = req.InvoiceLabel;
        if (req.AccentColor is not null) bill.AccentColor = req.AccentColor;

        if (req.Items is not null)
        {
            db.BillItems.RemoveRange(bill.Items);
            var newItems = req.Items.Select((item, i) => new BillItem
            {
                Id = item.Id ?? Guid.NewGuid(),
                BillId = bill.Id,
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Amount = item.Quantity * item.UnitPrice,
                SortOrder = i,
                Taxable = item.Taxable
            }).ToList();
            db.BillItems.AddRange(newItems);
            bill.Items = newItems;
        }

        RecalculateBill(bill);
        bill.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return MapToDto(bill);
    }

    public async Task DeleteBillAsync(Guid billId, Guid userId)
    {
        var bill = await db.Bills
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId)
            ?? throw new KeyNotFoundException("Bill not found.");

        db.Bills.Remove(bill);
        await db.SaveChangesAsync();
    }

    public async Task<BillDto> UpdateStatusAsync(Guid billId, Guid userId, string status)
    {
        var validStatuses = new[] { "draft", "sent", "paid", "overdue", "cancelled" };
        if (!validStatuses.Contains(status))
            throw new ArgumentException($"Invalid status. Must be one of: {string.Join(", ", validStatuses)}");

        var bill = await db.Bills
            .Include(b => b.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId)
            ?? throw new KeyNotFoundException("Bill not found.");

        bill.Status = status;
        bill.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return MapToDto(bill);
    }

    public async Task<byte[]> GeneratePdfAsync(Guid billId, Guid userId)
    {
        var bill = await db.Bills
            .Include(b => b.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId)
            ?? throw new KeyNotFoundException("Bill not found.");

        return BillPdfRenderer.Render(bill);
    }

    public async Task SendBillAsync(Guid billId, Guid userId)
    {
        var bill = await db.Bills
            .Include(b => b.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId)
            ?? throw new KeyNotFoundException("Bill not found.");

        if (string.IsNullOrWhiteSpace(bill.RecipientEmail))
            throw new InvalidOperationException("Recipient email is required to send the bill.");

        var pdf = BillPdfRenderer.Render(bill);
        var fileName = $"{bill.BillNumber.Replace("/", "-")}.html";

        await emailService.SendBillEmailAsync(
            bill.RecipientEmail,
            bill.RecipientName,
            bill.BillNumber,
            pdf,
            fileName);

        bill.Status = "sent";
        bill.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task<string> GetNextBillNumberAsync(Guid userId, string prefix)
    {
        if (string.IsNullOrWhiteSpace(prefix))
            prefix = DefaultPrefix;

        var lastBill = await db.Bills
            .Where(b => b.UserId == userId && b.BillNumber.StartsWith(prefix))
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => b.BillNumber)
            .FirstOrDefaultAsync();

        int nextNum = 1;
        if (lastBill is not null)
        {
            var numPart = lastBill[prefix.Length..];
            if (int.TryParse(numPart, out var lastNum))
                nextNum = lastNum + 1;
        }

        // Ensure uniqueness by checking in a loop (edge case)
        string candidate;
        do
        {
            candidate = $"{prefix}{nextNum:D4}";
            nextNum++;
        }
        while (await db.Bills.AnyAsync(b => b.UserId == userId && b.BillNumber == candidate));

        return candidate;
    }

    private static void RecalculateBill(Bill bill)
    {
        var taxableItems = bill.Items.Where(i => i.Taxable).ToList();
        var nonTaxableItems = bill.Items.Where(i => !i.Taxable).ToList();

        var taxableSubtotal = taxableItems.Sum(i => i.Amount);
        var nonTaxableSubtotal = nonTaxableItems.Sum(i => i.Amount);
        bill.Subtotal = taxableSubtotal + nonTaxableSubtotal;
        bill.TaxAmount = Math.Round(taxableSubtotal * bill.TaxRate / 100m, 2);
        bill.Total = bill.Subtotal + bill.TaxAmount;
    }

    private static BillDto MapToDto(Bill bill) => new(
        bill.Id,
        bill.BillNumber,
        bill.Status,
        bill.IssueDate,
        bill.DueDate,
        bill.Currency,
        bill.TaxRate,
        bill.TaxLabel,
        bill.RecipientName,
        bill.RecipientEmail,
        bill.RecipientAddress,
        bill.RecipientGstin,
        bill.SenderName,
        bill.SenderEmail,
        bill.SenderAddress,
        bill.SenderGstin,
        bill.SenderLogoBase64,
        bill.Subtotal,
        bill.TaxAmount,
        bill.Total,
        bill.Notes,
        bill.PaymentTerms,
        bill.BankName,
        bill.BankAccount,
        bill.BankIfsc,
        bill.Items.OrderBy(i => i.SortOrder).Select(i => new BillItemDto(
            i.Id,
            i.Description,
            i.Quantity,
            i.UnitPrice,
            i.Amount,
            i.SortOrder,
            i.Taxable
        )).ToList(),
        bill.HeaderOrder,
        bill.InvoiceLabel,
        bill.AccentColor,
        bill.CreatedAt,
        bill.UpdatedAt
    );
}