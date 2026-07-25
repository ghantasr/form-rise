export function computeLineTotal(quantity: number, unitPrice: number): number {
  return Math.round((quantity * unitPrice) * 100) / 100;
}

export function computeSubtotal(items: { amount: number }[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function computeTax(_subtotal: number, taxRate: number, taxableAmount: number): number {
  return Math.round((taxableAmount * taxRate / 100) * 100) / 100;
}

export function computeTotal(subtotal: number, taxAmount: number): number {
  return subtotal + taxAmount;
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = currencySymbol(currency);
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function currencySymbol(currency: string): string {
  switch (currency) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return '';
  }
}

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-yellow-100 text-yellow-700',
};
