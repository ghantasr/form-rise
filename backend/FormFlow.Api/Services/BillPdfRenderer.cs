using FormFlow.Api.Models.Entities;

namespace FormFlow.Api.Services;

/// <summary>
/// Generates a professional HTML invoice styled for print/PDF output.
/// </summary>
public static class BillPdfRenderer
{
    public static byte[] Render(Bill bill)
    {
        string accent = string.IsNullOrWhiteSpace(bill.AccentColor) ? "#1B6B4A" : bill.AccentColor;

        string currencySymbol = bill.Currency switch
        {
            "INR" => "₹",
            "USD" => "$",
            "EUR" => "€",
            "GBP" => "£",
            _ => ""
        };

        var sb = new System.Text.StringBuilder();

        // ── Document frame ────────────────────────────────────────────────
        sb.AppendLine("<div style='max-width:800px;margin:0 auto;padding:40px 48px;background:#FFFFFF;min-height:100vh;display:flex;flex-direction:column;'>");

        // ── Header ─────────────────────────────────────────────────────────
        sb.AppendLine("<div style='display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;'>");

        // Left: Logo + business name only (address / details go in the From card below)
        sb.AppendLine("<div style='max-width:55%;'>");
        if (!string.IsNullOrWhiteSpace(bill.SenderLogoBase64))
        {
            sb.AppendLine($"<img src='{EscapeAttr(bill.SenderLogoBase64)}' style='max-width:140px;max-height:64px;margin-bottom:12px;object-fit:contain;' />");
        }
        sb.AppendLine($"<h2 style='margin:0 0 6px 0;font-size:20px;font-weight:700;color:#141412;letter-spacing:-0.01em;'>{EscapeHtml(bill.SenderName)}</h2>");
        sb.AppendLine("</div>");

        // Right: INVOICE title + metadata
        sb.AppendLine("<div style='text-align:right;min-width:200px;'>");
        sb.AppendLine($"<div style='display:inline-block;background:{accent};color:#FFFFFF;padding:10px 24px;border-radius:6px;margin-bottom:16px;'>");
        var invoiceLabel = bill.InvoiceLabel ?? "INVOICE";
        sb.AppendLine($"<span style='font-size:22px;font-weight:800;letter-spacing:0.04em;'>{EscapeHtml(invoiceLabel)}</span>");
        sb.AppendLine("</div>");
        sb.AppendLine($"<p style='margin:0 0 8px 0;font-size:15px;font-weight:700;color:#141412;'>{EscapeHtml(bill.BillNumber)}</p>");
        sb.AppendLine("<table style='margin-left:auto;border-collapse:collapse;'>");
        sb.AppendLine($"<tr><td style='padding:3px 16px 3px 0;font-size:12px;color:#6B6B66;text-align:right;'>Date issued</td><td style='padding:3px 0;font-size:12px;color:#141412;font-weight:500;text-align:right;'>{bill.IssueDate:dd MMM yyyy}</td></tr>");
        if (bill.DueDate is not null)
            sb.AppendLine($"<tr><td style='padding:3px 16px 3px 0;font-size:12px;color:#6B6B66;text-align:right;'>Due date</td><td style='padding:3px 0;font-size:12px;color:#141412;font-weight:500;text-align:right;'>{bill.DueDate:dd MMM yyyy}</td></tr>");
        sb.AppendLine("</table>");
        sb.AppendLine("</div>");
        sb.AppendLine("</div>");

        // ── Two-column: From / To ─────────────────────────────────────────
        sb.AppendLine("<div style='display:flex;gap:32px;margin-bottom:36px;'>");

        // From
        sb.AppendLine("<div style='flex:1;background:#FAFAF8;border:1px solid #E8E8E4;border-radius:8px;padding:16px 20px;'>");
        sb.AppendLine("<p style='margin:0 0 8px 0;font-size:10px;font-weight:700;color:#9C9C96;text-transform:uppercase;letter-spacing:0.08em;'>From</p>");
        sb.AppendLine($"<p style='margin:0;font-size:13px;font-weight:600;color:#141412;'>{EscapeHtml(bill.SenderName)}</p>");
        if (!string.IsNullOrWhiteSpace(bill.SenderAddress))
            sb.AppendLine($"<p style='margin:4px 0 0 0;font-size:12px;color:#6B6B66;line-height:1.5;'>{EscapeHtml(bill.SenderAddress.Replace("\n", "<br>"))}</p>");
        if (!string.IsNullOrWhiteSpace(bill.SenderEmail))
            sb.AppendLine($"<p style='margin:4px 0 0 0;font-size:12px;color:#6B6B66;'>{EscapeHtml(bill.SenderEmail)}</p>");
        if (!string.IsNullOrWhiteSpace(bill.SenderGstin))
            sb.AppendLine($"<p style='margin:6px 0 0 0;font-size:11px;color:#9C9C96;'>GSTIN: {EscapeHtml(bill.SenderGstin)}</p>");
        sb.AppendLine("</div>");

        // To
        sb.AppendLine("<div style='flex:1;background:#FAFAF8;border:1px solid #E8E8E4;border-radius:8px;padding:16px 20px;'>");
        sb.AppendLine("<p style='margin:0 0 8px 0;font-size:10px;font-weight:700;color:#9C9C96;text-transform:uppercase;letter-spacing:0.08em;'>Bill To</p>");
        sb.AppendLine($"<p style='margin:0;font-size:13px;font-weight:600;color:#141412;'>{EscapeHtml(bill.RecipientName)}</p>");
        if (!string.IsNullOrWhiteSpace(bill.RecipientAddress))
            sb.AppendLine($"<p style='margin:4px 0 0 0;font-size:12px;color:#6B6B66;line-height:1.5;'>{EscapeHtml(bill.RecipientAddress.Replace("\n", "<br>"))}</p>");
        if (!string.IsNullOrWhiteSpace(bill.RecipientEmail))
            sb.AppendLine($"<p style='margin:4px 0 0 0;font-size:12px;color:#6B6B66;'>{EscapeHtml(bill.RecipientEmail)}</p>");
        if (!string.IsNullOrWhiteSpace(bill.RecipientGstin))
            sb.AppendLine($"<p style='margin:6px 0 0 0;font-size:11px;color:#9C9C96;'>GSTIN: {EscapeHtml(bill.RecipientGstin)}</p>");
        sb.AppendLine("</div>");
        sb.AppendLine("</div>");

        // ── Items table ────────────────────────────────────────────────────
        sb.AppendLine("<table style='width:100%;border-collapse:collapse;margin-bottom:4px;'>");
        sb.AppendLine("<thead>");
        sb.AppendLine($"<tr style='background:{accent};'>");
        sb.AppendLine("<th style='padding:10px 14px;text-align:left;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.06em;width:36px;'>#</th>");
        sb.AppendLine("<th style='padding:10px 14px;text-align:left;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.06em;'>Description</th>");
        sb.AppendLine("<th style='padding:10px 14px;text-align:right;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.06em;width:64px;'>Qty</th>");
        sb.AppendLine("<th style='padding:10px 14px;text-align:right;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.06em;width:108px;'>Rate</th>");
        sb.AppendLine("<th style='padding:10px 14px;text-align:right;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.06em;width:108px;'>Amount</th>");
        sb.AppendLine("</tr>");
        sb.AppendLine("</thead>");
        sb.AppendLine("<tbody>");

        int idx = 1;
        foreach (var item in bill.Items)
        {
            string rowBg = idx % 2 == 0 ? "background:#FAFAF8;" : "background:#FFFFFF;";
            string borderStyle = idx == bill.Items.Count ? $"border-bottom:2px solid {accent};" : "border-bottom:1px solid #E8E8E4;";
            string nonTaxLabel = item.Taxable ? "" : " <span style='color:#9C9C96;font-size:10px;font-weight:500;'>(Non-taxable)</span>";
            sb.AppendLine($"<tr style='{rowBg}'>");
            sb.AppendLine($"<td style='padding:11px 14px;font-size:12px;color:#6B6B66;{borderStyle}'>{idx}</td>");
            sb.AppendLine($"<td style='padding:11px 14px;font-size:12px;color:#141412;font-weight:500;{borderStyle}'>{EscapeHtml(item.Description)}{nonTaxLabel}</td>");
            sb.AppendLine($"<td style='padding:11px 14px;text-align:right;font-size:12px;color:#141412;font-variant-numeric:tabular-nums;{borderStyle}'>{item.Quantity}</td>");
            sb.AppendLine($"<td style='padding:11px 14px;text-align:right;font-size:12px;color:#141412;font-variant-numeric:tabular-nums;{borderStyle}'>{currencySymbol}{item.UnitPrice:N2}</td>");
            sb.AppendLine($"<td style='padding:11px 14px;text-align:right;font-size:12px;color:#141412;font-weight:600;font-variant-numeric:tabular-nums;{borderStyle}'>{currencySymbol}{item.Amount:N2}</td>");
            sb.AppendLine("</tr>");
            idx++;
        }

        sb.AppendLine("</tbody>");
        sb.AppendLine("</table>");

        // ── Totals block ──────────────────────────────────────────────────
        sb.AppendLine("<div style='margin-left:auto;width:300px;margin-top:20px;margin-bottom:32px;'>");
        sb.AppendLine("<table style='width:100%;border-collapse:collapse;'>");
        sb.AppendLine($"<tr><td style='padding:6px 0;font-size:13px;color:#6B6B66;'>Subtotal</td><td style='padding:6px 0;text-align:right;font-size:13px;color:#141412;font-weight:500;font-variant-numeric:tabular-nums;'>{currencySymbol}{bill.Subtotal:N2}</td></tr>");
        if (bill.TaxAmount > 0)
        {
            sb.AppendLine($"<tr><td style='padding:6px 0;font-size:13px;color:#6B6B66;'>{EscapeHtml(bill.TaxLabel)} ({bill.TaxRate}%)</td><td style='padding:6px 0;text-align:right;font-size:13px;color:#141412;font-weight:500;font-variant-numeric:tabular-nums;'>{currencySymbol}{bill.TaxAmount:N2}</td></tr>");
        }
        sb.AppendLine($"<tr style='border-top:2px solid {accent};'><td style='padding:12px 0 0 0;font-size:16px;font-weight:700;color:#141412;'>Total</td><td style='padding:12px 0 0 0;text-align:right;font-size:20px;font-weight:800;color:{accent};font-variant-numeric:tabular-nums;'>{currencySymbol}{bill.Total:N2}</td></tr>");
        sb.AppendLine("</table>");
        sb.AppendLine("</div>");

        // ── Bottom section: Notes + Bank + Terms ──────────────────────────
        bool hasNotes = !string.IsNullOrWhiteSpace(bill.Notes);
        bool hasTerms = !string.IsNullOrWhiteSpace(bill.PaymentTerms);
        bool hasBank = !string.IsNullOrWhiteSpace(bill.BankName);

        if (hasNotes || hasTerms || hasBank)
        {
            sb.AppendLine("<div style='border-top:1px solid #E8E8E4;padding-top:24px;margin-top:8px;'>");

            // Left: Notes & Terms
            if (hasNotes || hasTerms)
            {
                sb.AppendLine("<div style='margin-bottom:20px;'>");
                if (hasNotes)
                {
                    sb.AppendLine("<p style='margin:0 0 4px 0;font-size:10px;font-weight:700;color:#9C9C96;text-transform:uppercase;letter-spacing:0.08em;'>Notes</p>");
                    sb.AppendLine($"<p style='margin:0 0 16px 0;font-size:12px;color:#6B6B66;line-height:1.5;'>{EscapeHtml(bill.Notes)}</p>");
                }
                if (hasTerms)
                {
                    sb.AppendLine("<p style='margin:0 0 4px 0;font-size:10px;font-weight:700;color:#9C9C96;text-transform:uppercase;letter-spacing:0.08em;'>Payment Terms</p>");
                    sb.AppendLine($"<p style='margin:0;font-size:12px;color:#6B6B66;'>{EscapeHtml(bill.PaymentTerms)}</p>");
                }
                sb.AppendLine("</div>");
            }

            // Bank details
            if (hasBank)
            {
                sb.AppendLine("<div style='background:#FAFAF8;border:1px solid #E8E8E4;border-radius:8px;padding:16px 20px;'>");
                sb.AppendLine("<p style='margin:0 0 10px 0;font-size:10px;font-weight:700;color:#9C9C96;text-transform:uppercase;letter-spacing:0.08em;'>Bank Details</p>");
                sb.AppendLine("<table style='border-collapse:collapse;'>");
                sb.AppendLine($"<tr><td style='padding:4px 24px 4px 0;font-size:12px;color:#6B6B66;'>Bank</td><td style='padding:4px 0;font-size:12px;color:#141412;font-weight:500;'>{EscapeHtml(bill.BankName)}</td></tr>");
                if (!string.IsNullOrWhiteSpace(bill.BankAccount))
                    sb.AppendLine($"<tr><td style='padding:4px 24px 4px 0;font-size:12px;color:#6B6B66;'>Account</td><td style='padding:4px 0;font-size:12px;color:#141412;font-weight:500;'>{EscapeHtml(bill.BankAccount)}</td></tr>");
                if (!string.IsNullOrWhiteSpace(bill.BankIfsc))
                    sb.AppendLine($"<tr><td style='padding:4px 24px 4px 0;font-size:12px;color:#6B6B66;'>IFSC</td><td style='padding:4px 0;font-size:12px;color:#141412;font-weight:500;'>{EscapeHtml(bill.BankIfsc)}</td></tr>");
                sb.AppendLine("</table>");
                sb.AppendLine("</div>");
            }

            sb.AppendLine("</div>");
        }

        sb.AppendLine("<div style='flex:1;'></div>");

        // ── Footer ────────────────────────────────────────────────────────
        sb.AppendLine("<div style='text-align:center;padding-top:20px;border-top:1px solid #E8E8E4;margin-top:auto;'>");
        sb.AppendLine($"<p style='margin:0;font-size:11px;color:#9C9C96;'>Thank you for your business &mdash; {EscapeHtml(bill.SenderName)}</p>");
        sb.AppendLine("</div>");

        // Close document frame
        sb.AppendLine("</div>");

        return WrapHtml(sb.ToString());
    }

    private static byte[] WrapHtml(string body)
    {
        var fullHtml = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<style>\n" +
            "  @page { margin: 0; size: A4; }\n" +
            "  * { box-sizing: border-box; }\n" +
            "  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; color: #333; line-height: 1.5; margin: 0; padding: 0; background: #FFFFFF; }\n" +
            "  table { border-collapse: collapse; }\n" +
            "  h1, h2, h3, h4, p { margin: 0; }\n" +
            "  @media print {\n" +
            "    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n" +
            "  }\n" +
            "</style>\n</head>\n<body>\n" +
            body +
            "\n</body>\n</html>";

        return System.Text.Encoding.UTF8.GetBytes(fullHtml);
    }

    private static string EscapeHtml(string text)
    {
        return System.Net.WebUtility.HtmlEncode(text ?? string.Empty);
    }

    private static string EscapeAttr(string text)
    {
        return System.Net.WebUtility.HtmlEncode(text ?? string.Empty);
    }
}