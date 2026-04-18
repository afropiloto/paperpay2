export function formatFiat(amount: number, currency: string): string {
  const symbols: Record<string, string> = { GBP: "£", EUR: "€", USD: "$" };
  const sym = symbols[currency] ?? "";
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? "-" : "";
  return `${sign}${sym}${formatted}`;
}

export function formatUsdt(amount: number): string {
  return `${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} USDT`;
}

export function formatShortHash(hash: string | null | undefined): string {
  if (!hash || hash.length < 10) return hash ?? "";
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}
