/** V1 hardcoded rates — USDT per 1 unit of fiat (from docs/quick-reference.md). */
export const RATES = {
  GBP: 1.265,
  EUR: 1.0874,
  USD: 0.999,
} as const;

export type FiatCurrency = keyof typeof RATES;

export function rateFor(currency: FiatCurrency): number {
  return RATES[currency];
}
