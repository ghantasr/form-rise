// Client-side invoice HTML renderer — mirrors backend BillPdfRenderer
function esc(text: string): string {
  return text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#39;');
}
function currencySymbol(cur: string): string {
  switch (cur) { case 'INR': return '₹'; case 'USD': return '$'; case 'EUR': return '€'; case 'GBP': return '£'; default: return ''; }
}
function fmt(amount: number, currency: string): string {
  return `${currencySymbol(currency)}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface RenderItem { description: string; quantity: number; unitPrice: number; taxable: boolean; }

interface RenderParams {
  billNumber?: string; senderName: string; senderEmail?: string; senderAddress?: string; senderGstin?: string; senderLogoBase64?: string;
  recipientName: string; recipientEmail?: string; recipientAddress?: string; recipientGstin?: string;
  issueDate: string; dueDate?: string; currency: string; taxRate: number; taxLabel: string;
  subtotal: number; taxAmount: number; total: number; items: RenderItem[];
  notes?: string; paymentTerms?: string; bankName?: string; bankAccount?: string; bankIfsc?: string;
  senderPhone?: string; recipientPhone?: string;
  headerOrder?: string[];
  invoiceLabel?: string;
  accentColor?: string;
}

export function renderInvoiceHtml(params: RenderParams): string {
  const accent = params.accentColor || '#1B6B4A';
  const issueDateStr = new Date(params.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const dueDateStr = params.dueDate ? new Date(params.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  // Build header blocks
  const blocks: Record<string, string> = {};
  blocks.logo = params.senderLogoBase64 ? `<div><img src="${params.senderLogoBase64}" style="max-width:140px;max-height:64px;object-fit:contain;" /></div>` : '';
  blocks.business = `<div><h2 style="margin:0 0 6px 0;font-size:20px;font-weight:700;color:#141412;letter-spacing:-0.01em;">${esc(params.senderName)}</h2>${params.senderPhone ? `<p style="margin:0;font-size:12px;color:#6B6B66;line-height:1.6;">${esc(params.senderPhone)}</p>` : ''}</div>`;
  const invoiceLabel = params.invoiceLabel || 'INVOICE';
  blocks.invoice = `<div><div style="display:inline-block;background:${accent};color:#FFFFFF;padding:10px 24px;border-radius:6px;margin-bottom:8px;"><span style="font-size:22px;font-weight:800;letter-spacing:0.04em;">${esc(invoiceLabel)}</span></div>${params.billNumber ? `<p style="margin:0;font-size:15px;font-weight:700;color:#141412;">${esc(params.billNumber)}</p>` : ''}</div>`;
  blocks.dates = `<div><table style="border-collapse:collapse;line-height:1.6;"><tr><td style="padding:2px 10px 2px 0;font-size:12px;color:#6B6B66;">Date issued</td><td style="padding:2px 0;font-size:12px;color:#141412;font-weight:500;">${esc(issueDateStr)}</td></tr>${dueDateStr ? `<tr><td style="padding:2px 10px 2px 0;font-size:12px;color:#6B6B66;">Due date</td><td style="padding:2px 0;font-size:12px;color:#141412;font-weight:500;">${esc(dueDateStr)}</td></tr>` : ''}</table></div>`;

  const order = params.headerOrder || ['logo', 'business', 'invoice', 'dates'];

  let html = '<div style="max-width:800px;margin:0 auto;padding:40px 48px;background:#FFFFFF;min-height:100%;display:flex;flex-direction:column;">';

  // Header — blocks rendered in order
  html += '<div style="display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:40px;">';
  for (const id of order) {
    const content = blocks[id];
    if (!content?.trim()) continue;
    html += `<div style="flex:0 0 auto;">${content}</div>`;
  }
  html += '</div>';

  // From / To cards
  html += '<div style="display:flex;gap:32px;margin-bottom:36px;">';
  html += '<div style="flex:1;background:#FAFAF8;border:1px solid #E8E8E4;border-radius:8px;padding:16px 20px;"><p style="margin:0 0 8px 0;font-size:10px;font-weight:700;color:#9C9C96;text-transform:uppercase;letter-spacing:0.08em;">From</p>';
  html += `<p style="margin:0;font-size:13px;font-weight:600;color:#141412;">${esc(params.senderName)}</p>`;
  if (params.senderAddress) html += `<p style="margin:4px 0 0 0;font-size:12px;color:#6B6B66;line-height:1.5;">${esc(params.senderAddress.replace(/\n/g, '<br>'))}</p>`;
  if (params.senderPhone) html += `<p style="margin:4px 0 0 0;font-size:12px;color:#6B6B66;">📞 ${esc(params.senderPhone)}</p>`;
  if (params.senderEmail) html += `<p style="margin:4px 0 0 0;font-size:12px;color:#6B6B66;">${esc(params.senderEmail)}</p>`;
  if (params.senderGstin) html += `<p style="margin:6px 0 0 0;font-size:11px;color:#9C9C96;">GSTIN: ${esc(params.senderGstin)}</p>`;
  html += '</div>';
  html += '<div style="flex:1;background:#FAFAF8;border:1px solid #E8E8E4;border-radius:8px;padding:16px 20px;"><p style="margin:0 0 8px 0;font-size:10px;font-weight:700;color:#9C9C96;text-transform:uppercase;letter-spacing:0.08em;">Bill To</p>';
  html += `<p style="margin:0;font-size:13px;font-weight:600;color:#141412;">${esc(params.recipientName)}</p>`;
  if (params.recipientAddress) html += `<p style="margin:4px 0 0 0;font-size:12px;color:#6B6B66;line-height:1.5;">${esc(params.recipientAddress.replace(/\n/g, '<br>'))}</p>`;
  if (params.recipientPhone) html += `<p style="margin:4px 0 0 0;font-size:12px;color:#6B6B66;">📞 ${esc(params.recipientPhone)}</p>`;
  if (params.recipientEmail) html += `<p style="margin:4px 0 0 0;font-size:12px;color:#6B6B66;">${esc(params.recipientEmail)}</p>`;
  if (params.recipientGstin) html += `<p style="margin:6px 0 0 0;font-size:11px;color:#9C9C96;">GSTIN: ${esc(params.recipientGstin)}</p>`;
  html += '</div></div>';

  // Items table
  html += '<table style="width:100%;border-collapse:collapse;margin-bottom:4px;"><thead>';
  html += `<tr style="background:${accent};">`;
  html += '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.06em;width:36px;">#</th>';
  html += '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.06em;">Description</th>';
  html += '<th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.06em;width:64px;">Qty</th>';
  html += '<th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.06em;width:108px;">Rate</th>';
  html += '<th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.06em;width:108px;">Amount</th>';
  html += '</tr></thead><tbody>';
  params.items.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? 'background:#FFFFFF;' : 'background:#FAFAF8;';
    const border = idx === params.items.length - 1 ? `border-bottom:2px solid ${accent};` : 'border-bottom:1px solid #E8E8E4;';
    const ntl = item.taxable ? '' : ' <span style="color:#9C9C96;font-size:10px;font-weight:500;">(Non-taxable)</span>';
    html += `<tr style="${rowBg}"><td style="padding:11px 14px;font-size:12px;color:#6B6B66;${border}">${idx + 1}</td>`;
    html += `<td style="padding:11px 14px;font-size:12px;color:#141412;font-weight:500;${border}">${esc(item.description)}${ntl}</td>`;
    html += `<td style="padding:11px 14px;text-align:right;font-size:12px;color:#141412;font-variant-numeric:tabular-nums;${border}">${item.quantity}</td>`;
    html += `<td style="padding:11px 14px;text-align:right;font-size:12px;color:#141412;font-variant-numeric:tabular-nums;${border}">${fmt(item.unitPrice, params.currency)}</td>`;
    html += `<td style="padding:11px 14px;text-align:right;font-size:12px;color:#141412;font-weight:600;font-variant-numeric:tabular-nums;${border}">${fmt(item.quantity * item.unitPrice, params.currency)}</td></tr>`;
  });
  html += '</tbody></table>';

  // Totals
  html += '<div style="margin-left:auto;width:300px;margin-top:20px;margin-bottom:32px;"><table style="width:100%;border-collapse:collapse;">';
  html += `<tr><td style="padding:6px 0;font-size:13px;color:#6B6B66;">Subtotal</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#141412;font-weight:500;font-variant-numeric:tabular-nums;">${fmt(params.subtotal, params.currency)}</td></tr>`;
  if (params.taxAmount > 0) html += `<tr><td style="padding:6px 0;font-size:13px;color:#6B6B66;">${esc(params.taxLabel)} (${params.taxRate}%)</td><td style="padding:6px 0;text-align:right;font-size:13px;color:#141412;font-weight:500;font-variant-numeric:tabular-nums;">${fmt(params.taxAmount, params.currency)}</td></tr>`;
  html += `<tr style="border-top:2px solid ${accent};"><td style="padding:12px 0 0 0;font-size:16px;font-weight:700;color:#141412;">Total</td><td style="padding:12px 0 0 0;text-align:right;font-size:20px;font-weight:800;color:${accent};font-variant-numeric:tabular-nums;">${fmt(params.total, params.currency)}</td></tr>`;
  html += '</table></div>';

  // Notes / Terms / Bank
  const hasNotes = !!params.notes?.trim(), hasTerms = !!params.paymentTerms?.trim(), hasBank = !!params.bankName?.trim();
  if (hasNotes || hasTerms || hasBank) {
    html += '<div style="border-top:1px solid #E8E8E4;padding-top:24px;margin-top:8px;">';
    if (hasNotes || hasTerms) {
      html += '<div style="margin-bottom:20px;">';
      if (hasNotes) html += `<p style="margin:0 0 4px 0;font-size:10px;font-weight:700;color:#9C9C96;text-transform:uppercase;letter-spacing:0.08em;">Notes</p><p style="margin:0 0 16px 0;font-size:12px;color:#6B6B66;line-height:1.5;">${esc(params.notes!)}</p>`;
      if (hasTerms) html += `<p style="margin:0 0 4px 0;font-size:10px;font-weight:700;color:#9C9C96;text-transform:uppercase;letter-spacing:0.08em;">Payment Terms</p><p style="margin:0;font-size:12px;color:#6B6B66;">${esc(params.paymentTerms!)}</p>`;
      html += '</div>';
    }
    if (hasBank) {
      html += '<div style="background:#FAFAF8;border:1px solid #E8E8E4;border-radius:8px;padding:16px 20px;"><p style="margin:0 0 10px 0;font-size:10px;font-weight:700;color:#9C9C96;text-transform:uppercase;letter-spacing:0.08em;">Bank Details</p><table style="border-collapse:collapse;">';
      html += `<tr><td style="padding:4px 24px 4px 0;font-size:12px;color:#6B6B66;">Bank</td><td style="padding:4px 0;font-size:12px;color:#141412;font-weight:500;">${esc(params.bankName!)}</td></tr>`;
      if (params.bankAccount?.trim()) html += `<tr><td style="padding:4px 24px 4px 0;font-size:12px;color:#6B6B66;">Account</td><td style="padding:4px 0;font-size:12px;color:#141412;font-weight:500;">${esc(params.bankAccount!)}</td></tr>`;
      if (params.bankIfsc?.trim()) html += `<tr><td style="padding:4px 24px 4px 0;font-size:12px;color:#6B6B66;">IFSC</td><td style="padding:4px 0;font-size:12px;color:#141412;font-weight:500;">${esc(params.bankIfsc!)}</td></tr>`;
      html += '</table></div>';
    }
    html += '</div>';
  }

  html += '<div style="flex:1;"></div>';
  // Footer
  html += '<div style="text-align:center;padding-top:20px;border-top:1px solid #E8E8E4;margin-top:auto;">';
  html += `<p style="margin:0;font-size:11px;color:#9C9C96;">Thank you for your business &mdash; ${esc(params.senderName)}</p></div>`;
  html += '</div>';

  return `<!DOCTYPE html><html lang="en" style="height:100%;overflow:hidden;"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>@page{margin:0;size:A4}*{box-sizing:border-box}html,body{height:100%;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:11pt;color:#333;line-height:1.5;margin:0;padding:0;background:#FFF}table{border-collapse:collapse}h1,h2,h3,h4,p{margin:0}@media print{html,body{overflow:visible;height:auto}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body style="overflow-y:auto;">${html}</body></html>`;
}

export function printInvoiceHtml(html: string) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => setTimeout(() => w.print(), 300);
}