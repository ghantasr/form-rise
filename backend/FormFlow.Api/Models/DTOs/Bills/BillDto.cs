namespace FormFlow.Api.Models.DTOs.Bills;

public record BillListItemDto(
    Guid Id,
    string BillNumber,
    string Status,
    string RecipientName,
    string? RecipientEmail,
    DateTime IssueDate,
    DateTime? DueDate,
    decimal Total,
    string Currency,
    DateTime CreatedAt
);

public record BillDto(
    Guid Id,
    string BillNumber,
    string Status,
    DateTime IssueDate,
    DateTime? DueDate,
    string Currency,
    decimal TaxRate,
    string TaxLabel,
    // Recipient
    string RecipientName,
    string? RecipientEmail,
    string? RecipientAddress,
    string? RecipientGstin,
    // Sender
    string SenderName,
    string? SenderEmail,
    string? SenderAddress,
    string? SenderGstin,
    string? SenderLogoBase64,
    // Totals
    decimal Subtotal,
    decimal TaxAmount,
    decimal Total,
    string? Notes,
    string? PaymentTerms,
    string? BankName,
    string? BankAccount,
    string? BankIfsc,
    List<BillItemDto> Items,
    string? HeaderOrder,
    string? InvoiceLabel,
    string AccentColor,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record BillItemDto(
    Guid Id,
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    decimal Amount,
    int SortOrder,
    bool Taxable
);

public record CreateBillRequest(
    string? BillNumber,
    DateTime? IssueDate,
    DateTime? DueDate,
    string Currency,
    decimal TaxRate,
    string TaxLabel,
    string RecipientName,
    string? RecipientEmail,
    string? RecipientAddress,
    string? RecipientGstin,
    string SenderName,
    string? SenderEmail,
    string? SenderAddress,
    string? SenderGstin,
    string? SenderLogoBase64,
    string? Notes,
    string? PaymentTerms,
    string? BankName,
    string? BankAccount,
    string? BankIfsc,
    string? HeaderOrder,
    string? InvoiceLabel,
    string? AccentColor,
    List<CreateBillItemRequest>? Items
);

public record CreateBillItemRequest(
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    bool Taxable
);

public record UpdateBillRequest(
    string? BillNumber,
    DateTime? IssueDate,
    DateTime? DueDate,
    string? Currency,
    decimal? TaxRate,
    string? TaxLabel,
    string? RecipientName,
    string? RecipientEmail,
    string? RecipientAddress,
    string? RecipientGstin,
    string? SenderName,
    string? SenderEmail,
    string? SenderAddress,
    string? SenderGstin,
    string? SenderLogoBase64,
    string? Notes,
    string? PaymentTerms,
    string? BankName,
    string? BankAccount,
    string? BankIfsc,
    string? HeaderOrder,
    string? InvoiceLabel,
    string? AccentColor,
    List<UpdateBillItemRequest>? Items
);

public record UpdateBillItemRequest(
    Guid? Id,
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    bool Taxable
);

public record UpdateBillStatusRequest(
    string Status
);

public record NextBillNumberResponse(
    string BillNumber
);

public record BusinessProfileDto(
    Guid Id,
    string Name,
    string? Email,
    string? Address,
    string? Gstin,
    string? LogoBase64,
    bool IsDefault,
    DateTime CreatedAt
);

public record SaveBusinessProfileRequest(
    string Name,
    string? Email,
    string? Address,
    string? Gstin,
    string? LogoBase64,
    bool IsDefault
);