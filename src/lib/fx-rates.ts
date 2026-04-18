import { unstable_cache } from "next/cache";
import { RATES, type FiatCurrency } from "@/lib/rates";

export type FiatToUsdtRates = Record<FiatCurrency, number>;

export type LiveRatesResult = {
  rates: FiatToUsdtRates;
  /** ISO date from ECB/Frankfurter when live */
  asOf: string | null;
  /** False when static fallback used */
  live: boolean;
  source: "frankfurter" | "fallback";
};

/** USDT treated as USD for FX (common simplification). Small haircut configurable. */
const USDT_PER_USD = 0.9995;

async function fetchFrankfurter(): Promise<{ rates: FiatToUsdtRates; asOf: string }> {
  const res = await fetch(
    "https://api.frankfurter.app/latest?from=USD&to=GBP,EUR",
    { next: { revalidate: 120 } },
  );
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const j = (await res.json()) as {
    date?: string;
    rates?: { GBP?: number; EUR?: number };
  };
  const gbpPerUsd = j.rates?.GBP;
  const eurPerUsd = j.rates?.EUR;
  if (typeof gbpPerUsd !== "number" || typeof eurPerUsd !== "number") {
    throw new Error("Unexpected Frankfurter payload");
  }
  const rates: FiatToUsdtRates = {
    GBP: (1 / gbpPerUsd) * USDT_PER_USD,
    EUR: (1 / eurPerUsd) * USDT_PER_USD,
    USD: USDT_PER_USD,
  };
  return { rates, asOf: j.date ?? new Date().toISOString().slice(0, 10) };
}

async function resolveLiveRates(): Promise<LiveRatesResult> {
  try {
    const { rates, asOf } = await fetchFrankfurter();
    return {
      rates,
      asOf,
      live: true,
      source: "frankfurter",
    };
  } catch {
    return {
      rates: { ...RATES },
      asOf: null,
      live: false,
      source: "fallback",
    };
  }
}

/** Cached ~2m; use from Route Handlers and Server Components. */
export const getLiveFiatToUsdtRates = unstable_cache(
  resolveLiveRates,
  ["paperpay-fx-usdt-per-fiat"],
  { revalidate: 120 },
);

export async function getUsdtPerUnit(currency: FiatCurrency): Promise<number> {
  const { rates } = await getLiveFiatToUsdtRates();
  return rates[currency];
}
