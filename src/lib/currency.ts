// Multi-currency display. Prices are stored in USD cents; display converts using
// configured rates. In production, refresh rates from a rates service daily.
export const CURRENCIES = {
  USD: { symbol: '$', rate: 1, label: 'USD' },
  ZAR: { symbol: 'R', rate: 18.2, label: 'ZAR' },
  ZWG: { symbol: 'ZiG', rate: 26.8, label: 'ZWG' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function formatPrice(usdCents: number, code: CurrencyCode = 'USD'): string {
  if (usdCents === 0) return 'Free';
  const c = CURRENCIES[code];
  const value = (usdCents / 100) * c.rate;
  const rounded = code === 'USD' ? value.toFixed(2) : Math.round(value).toLocaleString();
  return `${c.symbol}${rounded}`;
}
