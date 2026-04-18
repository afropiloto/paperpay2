"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RATES, rateFor, type FiatCurrency } from "@/lib/rates";

type RatesPayload = { rates: Record<FiatCurrency, number>; live: boolean };

export function SwapWidget() {
  const router = useRouter();
  const [mode, setMode] = useState<"instant" | "locked">("instant");
  const [sendAmount, setSendAmount] = useState("");
  const [currency, setCurrency] = useState<FiatCurrency>("GBP");
  const [wallet, setWallet] = useState("");
  const [lockSeconds, setLockSeconds] = useState(300);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveRates, setLiveRates] = useState<RatesPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/rates", { cache: "no-store" });
        const body = (await res.json()) as Partial<RatesPayload>;
        if (
          cancelled ||
          !body?.rates ||
          typeof body.rates.GBP !== "number"
        ) {
          return;
        }
        setLiveRates({
          rates: body.rates as Record<FiatCurrency, number>,
          live: Boolean(body.live),
        });
      } catch {
        /* keep static fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rate = useMemo(
    () => liveRates?.rates[currency] ?? rateFor(currency),
    [currency, liveRates],
  );
  const recv = useMemo(() => {
    const amt = Number.parseFloat(sendAmount);
    if (!Number.isFinite(amt) || amt <= 0) return "";
    return (amt * rate).toFixed(2);
  }, [sendAmount, rate]);

  useEffect(() => {
    if (mode !== "locked") return;
    setLockSeconds(300);
    const id = window.setInterval(() => {
      setLockSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode]);

  async function submit() {
    setMessage(null);
    setLoading(true);
    try {
      const amt = Number.parseFloat(sendAmount);
      if (!Number.isFinite(amt) || amt <= 0) {
        setMessage("Enter a valid amount.");
        return;
      }
      if (!wallet.trim()) {
        setMessage("Enter a destination wallet address.");
        return;
      }
      if (mode === "locked" && lockSeconds <= 0) {
        setMessage("Rate lock expired — switch to Instant or refresh.");
        return;
      }

      const res = await fetch("/api/swap/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          currency,
          rate_mode: mode,
          wallet_address: wallet.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err =
          typeof body?.error === "string"
            ? body.error
            : `Request failed (${res.status})`;
        setMessage(err);
        return;
      }
      setMessage(`Swap requested. Reference: ${body.payment_reference}`);
      setSendAmount("");
      setWallet("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const mm = String(Math.floor(lockSeconds / 60)).padStart(2, "0");
  const ss = String(lockSeconds % 60).padStart(2, "0");

  return (
    <div>
      <div className="section-label mb-3.5 font-mono-data text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        Swap
      </div>
      <div className="swap-card mb-5 rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-[22px]">
        <div className="rate-mode mb-4 flex gap-2">
          <button
            type="button"
            className={`rmode inline-flex items-center gap-2 rounded-[var(--r-sm)] border px-4 py-2 text-xs font-semibold transition-colors ${
              mode === "instant"
                ? "border-[var(--yellow-border)] bg-[var(--yellow-dim)] text-[var(--yellow)]"
                : "border-[var(--border)] bg-[var(--surface2)] text-[var(--muted)]"
            }`}
            onClick={() => setMode("instant")}
          >
            Instant
          </button>
          <button
            type="button"
            className={`rmode inline-flex items-center gap-2 rounded-[var(--r-sm)] border px-4 py-2 text-xs font-semibold transition-colors ${
              mode === "locked"
                ? "border-[var(--yellow-border)] bg-[var(--yellow-dim)] text-[var(--yellow)]"
                : "border-[var(--border)] bg-[var(--surface2)] text-[var(--muted)]"
            }`}
            onClick={() => setMode("locked")}
          >
            Rate Lock
          </button>
        </div>

        <div className="swap-row mb-4 flex flex-col items-stretch gap-3 md:flex-row md:items-end">
          <div className="swap-field flex-1">
            <label className="mb-1.5 block font-mono-data text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
              You send
            </label>
            <div className="swap-input-wrap flex overflow-hidden rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] focus-within:border-[var(--yellow)]">
              <input
                className="swap-input flex-1 border-0 bg-transparent px-3.5 py-2.5 text-base font-semibold text-[var(--text)] outline-none"
                inputMode="decimal"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.00"
              />
              <div className="swap-currency flex items-center gap-2 pr-3.5 font-mono-data text-[13px] font-semibold text-[var(--muted)]">
                <select
                  className="cursor-pointer border-0 bg-transparent font-mono-data text-[13px] font-semibold text-[var(--text)] outline-none"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as FiatCurrency)}
                >
                  {(Object.keys(RATES) as FiatCurrency[]).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="swap-arrow mx-auto flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[var(--yellow-border)] bg-[var(--yellow-dim)] md:mb-0.5">
            <span className="text-[var(--yellow)]">⇅</span>
          </div>

          <div className="swap-field flex-1">
            <label className="mb-1.5 block font-mono-data text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
              You receive
            </label>
            <div className="swap-input-wrap flex overflow-hidden rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] focus-within:border-[var(--yellow)]">
              <input
                className="swap-input flex-1 border-0 bg-transparent px-3.5 py-2.5 text-base font-semibold text-[var(--yellow)] outline-none"
                readOnly
                value={recv}
                placeholder="0.00"
              />
              <div className="flex items-center pr-3.5 font-mono-data text-[13px] font-semibold text-[var(--yellow)]">
                USDT
              </div>
            </div>
          </div>
        </div>

        <div className="rate-display mb-4 flex items-center justify-between rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface2)] px-3.5 py-3">
          <span className="rate-pair font-mono-data text-xs text-[var(--muted)]">
            {currency} / USDT
          </span>
          <span className="rate-val font-mono-data text-[13px] font-semibold text-[var(--text)]">
            1 {currency} = {rate.toFixed(4)} USDT
            {liveRates?.live ? (
              <span className="ml-1.5 text-[10px] font-normal text-[var(--muted)]">
                (live)
              </span>
            ) : null}
          </span>
          {mode === "locked" ? (
            <span className="rate-lock-timer font-mono-data text-[11px] text-[var(--yellow)]">
              ⏱ {lockSeconds <= 0 ? "Expired" : `${mm}:${ss}`}
            </span>
          ) : (
            <span />
          )}
        </div>

        <div className="wallet-input-wrap mb-4 overflow-hidden rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] focus-within:border-[var(--yellow)]">
          <div className="wallet-label-row flex justify-between px-3.5 pt-2.5">
            <span className="wallet-lbl font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
              Destination USDT wallet address
            </span>
          </div>
          <input
            className="wallet-input w-full border-0 bg-transparent px-3.5 pb-2.5 pt-1.5 font-mono-data text-xs text-[var(--text)] outline-none placeholder:text-[var(--dim)]"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="TRC-20 or ERC-20 address…"
          />
        </div>

        {message ? (
          <p
            className={`mb-3 rounded-[var(--r-sm)] border px-3 py-2 text-center text-xs leading-relaxed ${
              message.startsWith("Swap requested")
                ? "border-[var(--green)]/30 bg-[var(--green-bg)] text-[var(--text)]"
                : "border-[var(--red)]/30 bg-[var(--red-bg)] text-[var(--text)]"
            }`}
          >
            {message}
          </p>
        ) : null}

        <button
          type="button"
          className="swap-submit w-full rounded-[var(--r-sm)] bg-[var(--yellow)] py-3 text-sm font-bold text-[#0a0a0a] transition-colors hover:bg-[#c8f200] disabled:opacity-50"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Submitting…" : "Request swap →"}
        </button>
      </div>
    </div>
  );
}
