"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { BANK_DETAILS_GBP } from "@/lib/bank-details";
import { ensureDepositIntent, simulateDepositAction } from "./actions";

type Currency = "GBP" | "EUR" | "USD";

export function DepositClient({
  simulateEnabled,
}: {
  simulateEnabled: boolean;
}) {
  const [currency, setCurrency] = useState<Currency>("GBP");
  const [reference, setReference] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const [simAmount, setSimAmount] = useState("5000.00");
  const [simName, setSimName] = useState("Alex Thompson");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      try {
        const ref = await ensureDepositIntent(currency);
        setReference(ref);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Failed to prepare deposit");
      }
    });
  }, [currency]);

  const bankRows = useMemo(() => {
    if (currency !== "GBP") return null;
    return (
      <div className="bank-details rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface2)] px-4 py-3.5">
        <div className="bdr flex justify-between border-b border-[var(--border)] py-1.5 last:border-b-0">
          <span className="bdk font-mono-data text-[11px] text-[var(--muted)]">
            Account name
          </span>
          <span className="bdv font-mono-data text-xs font-semibold text-[var(--text)]">
            {BANK_DETAILS_GBP.accountName}
          </span>
        </div>
        <div className="bdr flex justify-between border-b border-[var(--border)] py-1.5 last:border-b-0">
          <span className="bdk font-mono-data text-[11px] text-[var(--muted)]">
            Sort code
          </span>
          <span className="bdv font-mono-data text-xs font-semibold text-[var(--text)]">
            {BANK_DETAILS_GBP.sortCode}
          </span>
        </div>
        <div className="bdr flex justify-between border-b border-[var(--border)] py-1.5 last:border-b-0">
          <span className="bdk font-mono-data text-[11px] text-[var(--muted)]">
            Account no.
          </span>
          <span className="bdv font-mono-data text-xs font-semibold text-[var(--text)]">
            {BANK_DETAILS_GBP.accountNumber}
          </span>
        </div>
        <div className="bdr flex justify-between border-b border-[var(--border)] py-1.5 last:border-b-0">
          <span className="bdk font-mono-data text-[11px] text-[var(--muted)]">
            Bank
          </span>
          <span className="bdv font-mono-data text-xs font-semibold text-[var(--text)]">
            {BANK_DETAILS_GBP.bankName}
          </span>
        </div>
        <div className="bdr flex justify-between py-1.5">
          <span className="bdk font-mono-data text-[11px] text-[var(--muted)]">
            Reference
          </span>
          <span className="bdv font-mono-data text-xs font-semibold text-[var(--yellow)]">
            {reference ?? "—"}
          </span>
        </div>
      </div>
    );
  }, [currency, reference]);

  async function copyRef() {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setMsg("Reference copied.");
    } catch {
      setMsg("Could not copy reference.");
    }
  }

  async function simulate() {
    setMsg(null);
    if (!reference) return;
    try {
      await simulateDepositAction({
        event: "payment.received",
        amount: Number.parseFloat(simAmount),
        currency,
        reference,
        sender_name: simName,
        timestamp: new Date().toISOString(),
      });
      setMsg("Simulate processed.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Simulate failed");
    }
  }

  return (
    <div>
      <div className="topbar mb-7 flex justify-between">
        <div>
          <div className="page-title text-2xl font-bold tracking-tight text-[var(--text)]">
            Deposit
          </div>
          <div className="page-date mt-1 font-mono-data text-[11px] text-[var(--muted)]">
            Unique reference + PaperPay bank details
          </div>
        </div>
        <button
          type="button"
          className="rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2 text-sm font-semibold text-[var(--text)]"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide" : "Show"} details
        </button>
      </div>

      {open ? (
        <div className="modal rounded-[20px] border border-[var(--border2)] bg-[var(--surface)] p-7">
          <div className="modal-title text-lg font-bold tracking-tight text-[var(--text)]">
            Deposit funds
          </div>
          <div className="modal-sub mb-5 mt-1 text-[13px] text-[var(--muted)]">
            Choose your currency and send to your PaperPay account
          </div>

          <div className="mb-4 flex gap-2">
            {(["GBP", "EUR", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                className={clsx(
                  "flex-1 rounded-[var(--r-sm)] border px-2 py-2 text-xs font-semibold",
                  currency === c
                    ? "border-transparent bg-[var(--yellow)] text-[#0a0a0a]"
                    : "border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)]",
                )}
                onClick={() => setCurrency(c)}
              >
                {c === "GBP" ? "🇬🇧 GBP" : c === "EUR" ? "🇪🇺 EUR" : "🇺🇸 USD"}
              </button>
            ))}
          </div>

          {reference ? (
            <div className="ref-highlight mb-3.5 flex items-center justify-between rounded-[var(--r-sm)] border border-[var(--yellow-border)] bg-[var(--yellow-dim)] px-3.5 py-2.5">
              <div>
                <div className="ref-label font-mono-data text-[11px] font-semibold uppercase text-[var(--yellow)]">
                  YOUR PAYMENT REFERENCE
                </div>
                <div className="ref-val font-mono-data text-sm font-bold tracking-wide text-[var(--yellow)]">
                  {reference}
                </div>
              </div>
              <button
                type="button"
                className="cursor-pointer font-mono-data text-[11px] text-[var(--yellow)]"
                onClick={copyRef}
              >
                Copy
              </button>
            </div>
          ) : (
            <div className="mb-3 text-sm text-[var(--muted)]">
              {pending ? "Preparing your reference…" : "—"}
            </div>
          )}

          {currency === "GBP" ? (
            bankRows
          ) : (
            <div className="mb-3.5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 text-sm text-[var(--muted)]">
              GBP bank details are shown in the UI reference. For {currency}, use the
              same payment reference and follow the transfer instructions provided by
              PaperPay ops for that rail.
            </div>
          )}

          <div className="mt-3 font-mono-data text-[11px] text-[var(--muted)]">
            ⚠ Always include your reference. Funds without a reference cannot be
            matched to your account.
          </div>

          {simulateEnabled ? (
            <div className="mt-6 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                Simulate deposit (testing)
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  Amount
                  <input
                    className="mt-1 w-full rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2 font-mono-data text-sm text-[var(--text)]"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                  />
                </label>
                <label className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  Sender name
                  <input
                    className="mt-1 w-full rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2 font-mono-data text-sm text-[var(--text)]"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                  />
                </label>
              </div>
              <button
                type="button"
                className="mt-3 w-full rounded-[var(--r-sm)] bg-[var(--yellow)] py-2 text-sm font-bold text-[#0a0a0a] disabled:opacity-50"
                onClick={simulate}
                disabled={!reference || pending}
              >
                Simulate webhook
              </button>
            </div>
          ) : null}

          {msg ? (
            <div className="mt-3 text-center text-xs text-[var(--muted)]">{msg}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
