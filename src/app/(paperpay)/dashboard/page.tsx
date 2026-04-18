import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatFiat, formatShortHash, formatUsdt } from "@/lib/format";
import { totalGbpEquivalent, parseBalanceAmount } from "@/lib/money";
import { RATES } from "@/lib/rates";
import { NotificationsPanel } from "@/components/paperpay/notifications-panel";

function badgeClass(status: string | null): string {
  const s = status ?? "";
  if (s.includes("pending")) return "badge badge-pending";
  if (s.includes("complete") || s.includes("confirmed") || s === "swap_sent")
    return "badge badge-verified";
  if (s.includes("processing") || s.includes("requested")) return "badge badge-processing";
  return "badge badge-pending";
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const { data: balances } = await supabase
    .from("balances")
    .select("currency,amount")
    .eq("user_id", user?.id ?? "");

  const byCurrency = { GBP: 0, EUR: 0, USD: 0, USDT: 0 };
  for (const row of balances ?? []) {
    const c = row.currency ?? "";
    if (c in byCurrency) {
      byCurrency[c as keyof typeof byCurrency] = parseBalanceAmount(row.amount);
    }
  }

  const gbpTotal = totalGbpEquivalent(byCurrency);
  const [gbpIntRaw, gbpDec] = gbpTotal.toFixed(2).split(".");
  const gbpIntWithCommas = Number(gbpIntRaw).toLocaleString("en-GB");

  const { data: txns } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(5);

  const now = new Date();
  const dateLabel = now
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const notifs =
    txns
      ?.filter((t) => t.status === "deposit_confirmed" || t.status === "swap_sent")
      .slice(0, 2)
      .map((t) => ({
        id: t.id,
        title:
          t.type === "deposit"
            ? `Your deposit of ${formatFiat(Number(t.amount_in ?? 0), t.currency_in ?? "")} has landed`
            : `${formatUsdt(Number(t.amount_out ?? 0))} sent`,
        sub:
          t.payment_reference && t.created_at
            ? `Ref: ${t.payment_reference} · ${new Date(t.created_at).toLocaleString("en-GB")}`
            : "",
        dot: t.type === "deposit" ? ("yellow" as const) : ("green" as const),
      })) ?? [];

  return (
    <>
      <div className="topbar mb-7 flex justify-between md:mb-7">
        <div>
          <div className="page-title text-2xl font-bold tracking-tight text-[var(--text)] md:text-2xl">
            Good morning, {firstName}
          </div>
          <div className="page-date mt-1 font-mono-data text-[11px] text-[var(--muted)]">
            {dateLabel}
          </div>
        </div>
        <div className="topbar-right flex items-start gap-2">
          <NotificationsPanel items={notifs} />
        </div>
      </div>

      <div className="balance-card relative mb-5 overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-8 before:pointer-events-none before:absolute before:-right-[60px] before:-top-[60px] before:h-[200px] before:w-[200px] before:rounded-full before:bg-[radial-gradient(circle,rgba(212,255,0,0.08)_0%,transparent_70%)] before:content-['']">
        <div className="balance-label mb-2.5 font-mono-data text-xs font-medium uppercase tracking-[0.07em] text-[var(--muted)]">
          Total balance (GBP equiv.)
        </div>
        <p className="mb-2 font-mono-data text-[10px] text-[var(--dim)]">
          Figures load from your Supabase balances — not the static HTML mock. Empty
          or £0.00 until you deposit or receive USDT.
        </p>
        <div className="balance-amount text-5xl font-bold leading-none tracking-tight text-[var(--text)]">
          £
          <span className="text-[var(--yellow)]">{gbpIntWithCommas}</span>.{gbpDec}
        </div>
        <div className="balance-sub mt-2.5 font-mono-data text-[13px] text-[var(--muted)]">
          ≈ ${(gbpTotal * RATES.GBP).toLocaleString("en-GB", { maximumFractionDigits: 0 })}{" "}
          · ≈ €
          {((gbpTotal * RATES.GBP) / RATES.EUR).toLocaleString("en-GB", {
            maximumFractionDigits: 0,
          })}{" "}
          · Updated just now
        </div>
        <div className="balance-actions mt-6 flex flex-wrap gap-2.5">
          <Link
            href="/deposit"
            className="bal-btn bal-btn-primary inline-flex items-center gap-2 rounded-[var(--r-sm)] bg-[var(--yellow)] px-[18px] py-2.5 text-[13px] font-semibold text-[#0a0a0a]"
          >
            Deposit
          </Link>
          <div
            className="bal-btn bal-btn-secondary inline-flex cursor-default flex-col items-start justify-center gap-0.5 rounded-[var(--r-sm)] border border-dashed border-[var(--border2)] bg-[var(--surface2)] px-[18px] py-2.5 text-[13px] font-semibold text-[var(--muted)]"
            title="Fiat off-ramp is not in V1"
          >
            <span>Withdraw</span>
            <span className="font-mono-data text-[10px] font-normal normal-case text-[var(--dim)]">
              V2 — not built yet
            </span>
          </div>
          <Link
            href="/swap"
            className="bal-btn bal-btn-secondary inline-flex items-center gap-2 rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] px-[18px] py-2.5 text-[13px] font-semibold text-[var(--text)] hover:border-[var(--yellow-border)]"
          >
            Swap
          </Link>
        </div>
        <p className="mt-3 max-w-xl font-mono-data text-[11px] leading-relaxed text-[var(--muted)]">
          <strong className="text-[var(--text)]">Deposit</strong> opens bank details + your
          reference.           <strong className="text-[var(--text)]">Swap</strong> opens the request form; if
          the server is missing the PaperPay USDT wallet env var, submit will show an
          error.{" "}
          <strong className="text-[var(--text)]">Withdraw</strong> is intentionally off in
          V1 (spec: off-ramp V2).
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="wc rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4 transition-colors hover:border-[var(--border2)]">
          <div className="wc-flag mb-2 text-[22px]">🇬🇧</div>
          <div className="wc-label mb-1.5 font-mono-data text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
            GBP
          </div>
          <div className="wc-amount text-xl font-bold tracking-tight text-[var(--text)]">
            {formatFiat(byCurrency.GBP, "GBP")}
          </div>
        </div>
        <div className="wc rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4 transition-colors hover:border-[var(--border2)]">
          <div className="wc-flag mb-2 text-[22px]">🇪🇺</div>
          <div className="wc-label mb-1.5 font-mono-data text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
            EUR
          </div>
          <div className="wc-amount text-xl font-bold tracking-tight text-[var(--text)]">
            {formatFiat(byCurrency.EUR, "EUR")}
          </div>
        </div>
        <div className="wc rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4 transition-colors hover:border-[var(--border2)]">
          <div className="wc-flag mb-2 text-[22px]">🇺🇸</div>
          <div className="wc-label mb-1.5 font-mono-data text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
            USD
          </div>
          <div className="wc-amount text-xl font-bold tracking-tight text-[var(--text)]">
            {formatFiat(byCurrency.USD, "USD")}
          </div>
        </div>
        <div className="wc wc-usdt col-span-2 flex items-center justify-between rounded-[var(--r)] border border-[var(--yellow-border)] bg-[var(--surface)] px-[18px] py-4 md:col-span-3">
          <div>
            <div className="wc-label mb-1.5 font-mono-data text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
              USDT (TRC-20 / ERC-20)
            </div>
            <div className="wc-amount text-xl font-bold tracking-tight text-[var(--yellow)]">
              {formatUsdt(byCurrency.USDT)}
            </div>
          </div>
          <div className="text-[28px] opacity-60">₮</div>
        </div>
      </div>

      <div className="section-label mb-3.5 font-mono-data text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        Recent transactions
      </div>
      <div className="txn-list overflow-hidden rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)]">
        {(txns ?? []).length === 0 ? (
          <div className="px-4 py-6 text-sm text-[var(--muted)]">No transactions yet.</div>
        ) : (
          (txns ?? []).map((t) => {
            const title =
              t.type === "deposit"
                ? `${t.currency_in ?? ""} Deposit received`
                : t.type === "swap"
                  ? `Swap ${t.currency_in ?? ""} → USDT`
                  : (t.type ?? "Transaction");
            const subParts: string[] = [];
            if (t.type === "swap" && t.outgoing_hash) {
              subParts.push(`Hash: ${formatShortHash(t.outgoing_hash)}`);
            }
            if (t.type === "swap" && !t.outgoing_hash) {
              subParts.push("Awaiting settlement");
            }
            if (t.type === "deposit") subParts.push("Bank transfer");
            const icon =
              t.type === "swap"
                ? "⇄"
                : t.type === "deposit"
                  ? "↓"
                  : "⏳";
            const amt =
              t.type === "deposit"
                ? `+${formatFiat(Number(t.amount_in ?? 0), t.currency_in ?? "")}`
                : t.amount_out
                  ? `+${formatUsdt(Number(t.amount_out))}`
                  : "—";

            return (
              <div
                key={t.id}
                className="txn-item flex cursor-pointer items-center gap-3.5 border-b border-[var(--border)] px-[18px] py-3.5 last:border-b-0 hover:bg-white/[0.025]"
              >
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] text-sm ${
                    t.type === "swap"
                      ? "bg-[var(--yellow-dim)]"
                      : t.type === "deposit"
                        ? "bg-[var(--green-bg)]"
                        : "bg-white/[0.05]"
                  }`}
                >
                  {icon}
                </div>
                <div className="txn-info min-w-0 flex-1">
                  <div className="txn-title text-[13px] font-semibold text-[var(--text)]">
                    {title}
                  </div>
                  <div className="txn-sub font-mono-data text-[11px] text-[var(--muted)]">
                    {subParts.join(" · ")}
                  </div>
                  {t.payment_reference ? (
                    <div className="txn-ref mt-0.5 font-mono-data text-[10px] text-[var(--dim)]">
                      REF: {t.payment_reference}
                    </div>
                  ) : null}
                </div>
                <div className="txn-right flex-shrink-0 text-right">
                  <div className="txn-amount txn-amount-in font-mono-data text-sm font-bold">
                    {amt}
                  </div>
                  <div className="txn-time mt-0.5 font-mono-data text-[10px] text-[var(--muted)]">
                    {t.created_at
                      ? new Date(t.created_at).toLocaleString("en-GB")
                      : ""}
                  </div>
                  <span className={`${badgeClass(t.status)} mt-1 inline-flex`}>
                    {(t.status ?? "").replaceAll("_", " ")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8 text-center text-sm text-[var(--muted)]">
        <Link className="text-[var(--yellow)] underline" href="/history">
          View full history
        </Link>
      </div>
    </>
  );
}
