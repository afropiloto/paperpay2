"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import {
  DEPOSIT_BANK_EU_IBAN,
  DEPOSIT_BANK_UK_GBP,
  type DepositBankRailId,
} from "@/lib/bank-details";
import { ensureDepositIntent, simulateDepositAction } from "./actions";

type Currency = "GBP" | "EUR" | "USD";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bdr flex justify-between border-b border-[var(--border)] py-1.5 last:border-b-0">
      <span className="bdk font-mono-data text-[11px] text-[var(--muted)]">
        {label}
      </span>
      <span className="bdv max-w-[62%] text-right font-mono-data text-xs font-semibold text-[var(--text)] break-all">
        {value}
      </span>
    </div>
  );
}

export function DepositClient({
  simulateEnabled,
}: {
  simulateEnabled: boolean;
}) {
  const [currency, setCurrency] = useState<Currency>("GBP");
  const [bankRail, setBankRail] = useState<DepositBankRailId>("uk");
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

  const bankPanel = useMemo(() => {
    if (bankRail === "uk") {
      const b = DEPOSIT_BANK_UK_GBP;
      return (
        <div className="bank-details rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface2)] px-4 py-3.5">
          <DetailRow label="Account name" value={b.accountName} />
          <DetailRow label="Sort code" value={b.sortCode} />
          <DetailRow label="Account number" value={b.accountNumber} />
          <DetailRow label="IBAN" value={b.iban} />
          <DetailRow label="SWIFT/BIC" value={b.bic} />
          <DetailRow label="Currency (letter)" value={b.currencyLine} />
          <DetailRow label="Your reference" value={reference ?? "—"} />
        </div>
      );
    }

    const b = DEPOSIT_BANK_EU_IBAN;
    return (
      <div className="bank-details rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface2)] px-4 py-3.5">
        <DetailRow label="Account name" value={b.accountName} />
        <DetailRow label="Bank name" value={b.bankName} />
        <DetailRow label="Bank address" value={b.bankAddress} />
        <DetailRow label="IBAN" value={b.iban} />
        <DetailRow label="SWIFT/BIC" value={b.bic} />
        <DetailRow label="Account number" value={b.accountNumber} />
        <DetailRow label="Currency (letter)" value={b.currencyLine} />
        <DetailRow label="Your reference" value={reference ?? "—"} />
      </div>
    );
  }, [bankRail, reference]);

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
            Your reference plus the two Clearing accounts on file
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
            Choose the currency for your PaperPay reference, then pay into the UK
            or European/international account below.
          </div>

          <div className="mb-2 font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
            Deposit currency (your reference)
          </div>
          <div className="mb-5 flex gap-2">
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

          <div className="mb-2 font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
            Beneficiary bank
          </div>
          <div className="mb-5 grid gap-2 md:grid-cols-2">
            <button
              type="button"
              className={clsx(
                "rounded-[var(--r-sm)] border px-3 py-3 text-left text-sm font-semibold transition-colors",
                bankRail === "uk"
                  ? "border-[var(--yellow-border)] bg-[var(--yellow-dim)] text-[var(--yellow)]"
                  : "border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)]",
              )}
              onClick={() => setBankRail("uk")}
            >
              <div>{DEPOSIT_BANK_UK_GBP.title}</div>
              <div className="mt-1 font-mono-data text-[11px] font-normal text-[var(--muted)]">
                Sort code {DEPOSIT_BANK_UK_GBP.sortCode} · Account{" "}
                {DEPOSIT_BANK_UK_GBP.accountNumber}
              </div>
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-[var(--r-sm)] border px-3 py-3 text-left text-sm font-semibold transition-colors",
                bankRail === "eu"
                  ? "border-[var(--yellow-border)] bg-[var(--yellow-dim)] text-[var(--yellow)]"
                  : "border-[var(--border2)] bg-[var(--surface2)] text-[var(--text)]",
              )}
              onClick={() => setBankRail("eu")}
            >
              <div>{DEPOSIT_BANK_EU_IBAN.title}</div>
              <div className="mt-1 font-mono-data text-[11px] font-normal text-[var(--muted)]">
                {DEPOSIT_BANK_EU_IBAN.bankName} · IBAN {DEPOSIT_BANK_EU_IBAN.iban}
              </div>
            </button>
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

          {bankPanel}

          {currency === "EUR" && bankRail === "uk" ? (
            <div className="mt-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono-data text-[11px] text-[var(--muted)]">
              EUR is not listed on the UK GBP letter. Prefer the{" "}
              <strong className="text-[var(--text)]">European IBAN</strong> account
              for euro rails, or confirm with your bank.
            </div>
          ) : null}

          <div className="mt-3 font-mono-data text-[11px] text-[var(--muted)]">
            ⚠ Always include your reference. Funds without a reference cannot be
            matched to your account.
          </div>

          <div className="mt-3 font-mono-data text-[10px] leading-relaxed text-[var(--dim)]">
            Relationship manager: Josh Milner. General: support@clearing.com. Time
            critical: payments@clearing.com. Tel: +44 (0) 20 8154 3174.
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
