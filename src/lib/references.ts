import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Sb = SupabaseClient<Database>;

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

/** PP-YYYY-CCY-XXXX (docs/quick-reference.md). */
export async function nextDepositReference(
  supabase: Sb,
  currency: "GBP" | "EUR" | "USD",
): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `PP-${year}-${currency}-`;

  const { data, error } = await supabase
    .from("transactions")
    .select("payment_reference")
    .like("payment_reference", `${prefix}%`);

  if (error) throw error;

  let max = 0;
  for (const row of data ?? []) {
    const ref = row.payment_reference;
    if (!ref || !ref.startsWith(prefix)) continue;
    const suffix = ref.slice(prefix.length);
    const n = Number.parseInt(suffix, 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }

  return `${prefix}${pad4(max + 1)}`;
}

/** Swap rows use payment_reference with PP-YYYY-SWAP-XXXX to stay unique on the same column. */
export async function nextSwapReference(supabase: Sb): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `PP-${year}-SWAP-`;

  const { data, error } = await supabase
    .from("transactions")
    .select("payment_reference")
    .like("payment_reference", `${prefix}%`);

  if (error) throw error;

  let max = 0;
  for (const row of data ?? []) {
    const ref = row.payment_reference;
    if (!ref || !ref.startsWith(prefix)) continue;
    const suffix = ref.slice(prefix.length);
    const n = Number.parseInt(suffix, 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }

  return `${prefix}${pad4(max + 1)}`;
}
