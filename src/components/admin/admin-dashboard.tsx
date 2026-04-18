"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Database } from "@/lib/database.types";

export type AdminTxnRow = Database["public"]["Tables"]["transactions"]["Row"] & {
  profiles?: { email: string | null; full_name: string | null } | null;
};

/** USDT (≈USD) per 1 unit of fiat — same source as `/api/swap` should use when wired to live FX. */
export type AdminRatesSnapshot = {
  gbp: string;
  eur: string;
  usd: string;
  asOf: string | null;
  live: boolean;
  source: string;
};

function badge(status: string | null) {
  const s = status ?? "";
  if (s.includes("pending")) return "badge badge-pending";
  if (s.includes("failed")) return "badge badge-failed";
  if (s.includes("complete") || s.includes("confirmed") || s === "swap_sent")
    return "badge badge-verified";
  if (s.includes("processing") || s.includes("requested")) return "badge badge-processing";
  return "badge badge-pending";
}

export function AdminDashboard({
  profileName,
  rows,
  ratesSnapshot,
}: {
  profileName: string;
  rows: AdminTxnRow[];
  ratesSnapshot?: AdminRatesSnapshot | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [incoming, setIncoming] = useState("");
  const [outgoing, setOutgoing] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    let vol = 0;
    let pending = 0;
    let settled = 0;
    let failed = 0;
    for (const t of rows) {
      if (t.status?.includes("pending")) pending += 1;
      if (t.status?.includes("failed")) failed += 1;
      if (t.status === "swap_sent" || t.status === "deposit_confirmed") settled += 1;
      if (t.created_at && new Date(t.created_at).toDateString() === today) {
        vol += Number(t.amount_in ?? 0) || Number(t.amount_out ?? 0);
      }
    }
    return { vol, pending, settled, failed };
  }, [rows]);

  async function saveHashes() {
    setMsg(null);
    if (!selectedId) return;
    const res = await fetch("/api/admin/record-hashes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction_id: selectedId,
        incoming_hash: incoming.trim(),
        outgoing_hash: outgoing.trim(),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(body?.error ?? "Failed");
      return;
    }
    setMsg("Saved + user notified (outgoing hash only).");
    setOpen(false);
    setIncoming("");
    setOutgoing("");
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    setMsg(null);
    const res = await fetch("/api/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id: id, status }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(body?.error ?? "Failed");
    else {
      setMsg("Status updated.");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[224px] flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] md:flex">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-5 pb-[18px] pt-[22px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[var(--blue)] text-white">
            CD
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-[var(--text)]">
              ClearDesk
            </div>
            <div className="font-mono-data text-[10px] uppercase tracking-wide text-[var(--muted)]">
              FX Clearing
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3.5">
          <div className="px-5 pb-2 font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--dim)]">
            Overview
          </div>
          <div className="border-l-2 border-[var(--blue)] bg-[var(--blue-bg)] py-2 pl-5 text-[13px] font-medium text-[var(--blue)]">
            Dashboard
          </div>
        </nav>
        <div className="border-t border-[var(--border)] px-5 pb-5 pt-3.5">
          <div className="text-[13px] font-medium text-[var(--text)]">{profileName}</div>
          <div className="text-[11px] text-[var(--muted)]">Admin</div>
          <Link href="/dashboard" className="mt-3 inline-block text-[12px] text-[var(--blue)] underline">
            Back to PaperPay
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-7">
        <div className="topbar mb-6 flex items-start justify-between">
          <div>
            <div className="page-title text-[22px] font-semibold tracking-tight text-[var(--text)]">
              Clearing Overview
            </div>
            <div className="page-sub mt-1 font-mono-data text-[13px] text-[var(--muted)]">
              Clearing queue — same login as PaperPay (no separate admin password).
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface2)] px-4 py-3.5">
            <div className="mb-1 text-[12px] font-semibold text-[var(--text)]">
              What this screen is
            </div>
            <p className="text-[12px] leading-relaxed text-[var(--muted)]">
              Different theme and layout from PaperPay: transaction table, optional
              status tweaks, and hash recording for swaps. Deposit confirmation in
              the bank still needs a webhook or a dedicated “confirm deposit” flow if
              you add one.
            </p>
          </div>
          {ratesSnapshot ? (
            <div className="rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface2)] px-4 py-3.5">
              <div className="mb-1 text-[12px] font-semibold text-[var(--text)]">
                Reference FX (USDT per 1 unit)
              </div>
              <div className="font-mono-data text-[11px] text-[var(--text)]">
                GBP {ratesSnapshot.gbp} · EUR {ratesSnapshot.eur} · USD{" "}
                {ratesSnapshot.usd}
              </div>
              <div className="mt-1 font-mono-data text-[10px] text-[var(--dim)]">
                {ratesSnapshot.live
                  ? `Live (${ratesSnapshot.source}) · date ${ratesSnapshot.asOf ?? "—"}`
                  : `Offline fallback (${ratesSnapshot.source})`}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">
                There is no FX editor in ClearDesk yet; new swap requests use the same
                live feed as this card (with static fallback if the feed fails). This
                panel is read-only.
              </p>
            </div>
          ) : null}
        </div>

        <div className="metrics mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="mc rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mc-label mb-2 font-mono-data text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
              Today activity (sum)
            </div>
            <div className="mc-val text-[26px] font-semibold tracking-tight text-[var(--text)]">
              {metrics.vol.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="mc rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mc-label mb-2 font-mono-data text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
              Pending-ish
            </div>
            <div className="mc-val text-[26px] font-semibold tracking-tight text-[var(--text)]">
              {metrics.pending}
            </div>
          </div>
          <div className="mc rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mc-label mb-2 font-mono-data text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
              Confirmed / sent
            </div>
            <div className="mc-val text-[26px] font-semibold tracking-tight text-[var(--text)]">
              {metrics.settled}
            </div>
          </div>
          <div className="mc rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mc-label mb-2 font-mono-data text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
              Failed
            </div>
            <div className="mc-val text-[26px] font-semibold tracking-tight text-[var(--text)]">
              {metrics.failed}
            </div>
          </div>
        </div>

        {msg ? (
          <div className="mb-4 rounded-[var(--r)] border border-[var(--border2)] bg-[var(--surface2)] px-4 py-3 text-sm text-[var(--text)]">
            {msg}
          </div>
        ) : null}

        <div className="card overflow-hidden rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="card-header flex items-center justify-between border-b border-[var(--border)] px-[18px] py-3.5">
            <div className="card-title text-[13px] font-semibold text-[var(--text)]">
              Transactions
            </div>
          </div>
          <div className="tbl-wrap overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="border-b border-[var(--border)] px-[18px] py-2.5 text-left font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--dim)]">
                    User
                  </th>
                  <th className="border-b border-[var(--border)] px-[18px] py-2.5 text-left font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--dim)]">
                    Ref
                  </th>
                  <th className="border-b border-[var(--border)] px-[18px] py-2.5 text-left font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--dim)]">
                    Type
                  </th>
                  <th className="border-b border-[var(--border)] px-[18px] py-2.5 text-left font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--dim)]">
                    In
                  </th>
                  <th className="border-b border-[var(--border)] px-[18px] py-2.5 text-left font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--dim)]">
                    USDT out
                  </th>
                  <th className="border-b border-[var(--border)] px-[18px] py-2.5 text-left font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--dim)]">
                    Wallet
                  </th>
                  <th className="border-b border-[var(--border)] px-[18px] py-2.5 text-left font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--dim)]">
                    Status
                  </th>
                  <th className="border-b border-[var(--border)] px-[18px] py-2.5 text-left font-mono-data text-[10px] font-medium uppercase tracking-wide text-[var(--dim)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t: AdminTxnRow) => {
                  const name =
                    t.profiles?.full_name ?? t.profiles?.email ?? "—";
                  return (
                    <tr key={t.id} className="hover:bg-white/[0.025]">
                      <td className="border-b border-[var(--border)] px-[18px] py-3 text-[var(--text)]">
                        {name}
                      </td>
                      <td className="tid border-b border-[var(--border)] px-[18px] py-3 font-mono-data text-[11px] text-[var(--dim)]">
                        {t.payment_reference ?? "—"}
                      </td>
                      <td className="border-b border-[var(--border)] px-[18px] py-3 text-[var(--text)]">
                        {t.type ?? "—"}
                      </td>
                      <td className="tamount border-b border-[var(--border)] px-[18px] py-3 font-mono-data">
                        {t.amount_in ?? "—"} {t.currency_in ?? ""}
                      </td>
                      <td className="tamount border-b border-[var(--border)] px-[18px] py-3 font-mono-data">
                        {t.amount_out ?? "—"}
                      </td>
                      <td className="border-b border-[var(--border)] px-[18px] py-3 font-mono-data text-[12px] text-[var(--muted)]">
                        {(t.wallet_address ?? "").slice(0, 10)}…
                      </td>
                      <td className="border-b border-[var(--border)] px-[18px] py-3">
                        <span className={badge(t.status)}>{t.status ?? "—"}</span>
                      </td>
                      <td className="border-b border-[var(--border)] px-[18px] py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-sm rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] px-3 py-1 text-[12px] font-medium text-[var(--text)]"
                            onClick={() => {
                              setSelectedId(t.id);
                              setIncoming(t.incoming_hash ?? "");
                              setOutgoing(t.outgoing_hash ?? "");
                              setOpen(true);
                              setMsg(null);
                            }}
                          >
                            Record hashes
                          </button>
                          <button
                            type="button"
                            className="btn-sm-primary rounded-[var(--r-sm)] border border-[var(--blue)] bg-[var(--blue)] px-3 py-1 text-[12px] font-medium text-white"
                            onClick={() => setStatus(t.id, "swap_processing")}
                          >
                            Mark processing
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {open ? (
          <div className="modal-overlay open fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
            <div className="modal w-full max-w-[420px] rounded-[20px] border border-[var(--border2)] bg-[var(--surface)] p-7">
              <div className="modal-title text-lg font-bold text-[var(--text)]">
                Record hashes
              </div>
              <div className="modal-sub mb-5 mt-1 text-[13px] text-[var(--muted)]">
                incoming_hash is internal only. outgoing_hash is emailed to the user.
              </div>
              <label className="block font-mono-data text-[10px] uppercase tracking-wide text-[var(--muted)]">
                incoming_hash
                <input
                  className="mt-1 w-full rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2 font-mono-data text-xs text-[var(--text)]"
                  value={incoming}
                  onChange={(e) => setIncoming(e.target.value)}
                />
              </label>
              <label className="mt-3 block font-mono-data text-[10px] uppercase tracking-wide text-[var(--muted)]">
                outgoing_hash
                <input
                  className="mt-1 w-full rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2 font-mono-data text-xs text-[var(--text)]"
                  value={outgoing}
                  onChange={(e) => setOutgoing(e.target.value)}
                />
              </label>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-[var(--r-sm)] bg-[var(--blue)] py-2 text-sm font-semibold text-white"
                  onClick={saveHashes}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] py-2 text-sm font-semibold text-[var(--text)]"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
