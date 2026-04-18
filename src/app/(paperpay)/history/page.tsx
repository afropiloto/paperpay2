import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatFiat, formatShortHash, formatUsdt } from "@/lib/format";

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: txns } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="topbar mb-7 flex items-start justify-between">
        <div>
          <div className="page-title text-2xl font-bold tracking-tight text-[var(--text)]">
            History
          </div>
          <div className="page-date mt-1 font-mono-data text-[11px] text-[var(--muted)]">
            All transactions
          </div>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-[var(--yellow)] underline"
        >
          Back to overview
        </Link>
      </div>

      <div className="txn-list overflow-hidden rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)]">
        {(txns ?? []).length === 0 ? (
          <div className="px-4 py-6 text-sm text-[var(--muted)]">No transactions yet.</div>
        ) : (
          (txns ?? []).map((t) => {
            const title =
              t.type === "deposit"
                ? `${t.currency_in ?? ""} Deposit`
                : t.type === "swap"
                  ? `Swap ${t.currency_in ?? ""} → USDT`
                  : (t.type ?? "Transaction");
            const sub =
              t.type === "swap" && t.outgoing_hash
                ? `Outgoing hash: ${formatShortHash(t.outgoing_hash)}`
                : "";

            const amt =
              t.type === "deposit"
                ? `${formatFiat(Number(t.amount_in ?? 0), t.currency_in ?? "")}`
                : t.amount_out
                  ? `${formatUsdt(Number(t.amount_out))}`
                  : "—";

            return (
              <div
                key={t.id}
                className="flex flex-col gap-2 border-b border-[var(--border)] px-[18px] py-3.5 last:border-b-0 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--text)]">
                    {title}
                  </div>
                  {sub ? (
                    <div className="font-mono-data text-[11px] text-[var(--muted)]">
                      {sub}
                    </div>
                  ) : null}
                  {t.payment_reference ? (
                    <div className="font-mono-data text-[10px] text-[var(--dim)]">
                      REF: {t.payment_reference}
                    </div>
                  ) : null}
                </div>
                <div className="text-right font-mono-data text-sm font-semibold text-[var(--text)]">
                  <div>{amt}</div>
                  <div className="text-[10px] font-medium text-[var(--muted)]">
                    {t.status?.replaceAll("_", " ")}
                  </div>
                  <div className="text-[10px] text-[var(--dim)]">
                    {t.created_at
                      ? new Date(t.created_at).toLocaleString("en-GB")
                      : ""}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
