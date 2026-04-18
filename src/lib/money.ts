import { RATES, type FiatCurrency } from "@/lib/rates";

export function totalGbpEquivalent(balances: {
  GBP: number;
  EUR: number;
  USD: number;
  USDT: number;
}): number {
  const totalUsdt =
    balances.GBP * RATES.GBP +
    balances.EUR * RATES.EUR +
    balances.USD * RATES.USD +
    balances.USDT;
  return totalUsdt / RATES.GBP;
}

export function parseBalanceAmount(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

export function isFiatCurrency(s: string): s is FiatCurrency {
  return s === "GBP" || s === "EUR" || s === "USD";
}
