namespace FormFlow.Api.Models.DTOs.Bills;

public record BillTemplateItemDto(
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    bool Taxable,
    int SortOrder
);

public record BillTemplateListItemDto(
    Guid Id,
    string Name,
    string? Description,
    string Category,
    int ItemCount,
    DateTime CreatedAt
);

public record BillTemplateDetailDto(
    Guid Id,
    string Name,
    string? Description,
    string Category,
    string Currency,
    decimal TaxRate,
    string TaxLabel,
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
    string AccentColor,
    List<BillTemplateItemDto> Items,
    DateTime CreatedAt
);

public record CreateBillTemplateRequest(
    string Name,
    string? Description,
    string Category,
    string Currency,
    decimal TaxRate,
    string TaxLabel,
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
    string? AccentColor,
    List<BillTemplateItemDto> Items
);

public record UpdateBillTemplateRequest(
    string? Name,
    string? Description,
    string? Category,
    string? Currency,
    decimal? TaxRate,
    string? TaxLabel,
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
    string? AccentColor,
    List<BillTemplateItemDto>? Items
);