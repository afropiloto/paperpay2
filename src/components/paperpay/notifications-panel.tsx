"use client";

import { useState } from "react";

export type NotifItem = {
  id: string;
  title: string;
  sub: string;
  dot: "yellow" | "green";
};

export function NotificationsPanel({ items }: { items: NotifItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        className="notif-btn relative flex h-[38px] w-[38px] items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface2)] transition-colors hover:border-[var(--border2)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Notifications"
      >
        <svg
          viewBox="0 0 16 16"
          className="h-4 w-4 stroke-[var(--muted)]"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M8 1.5A3.5 3.5 0 0 1 11.5 5v3L13 10.5H3L4.5 8V5A3.5 3.5 0 0 1 8 1.5zM6.5 10.5a1.5 1.5 0 0 0 3 0" />
        </svg>
        {items.length > 0 ? (
          <span className="absolute right-[7px] top-[7px] h-[7px] w-[7px] rounded-full border-[1.5px] border-[var(--bg)] bg-[var(--yellow)]" />
        ) : null}
      </button>

      {open ? (
        <div className="mt-3 rounded-[var(--r)] border border-[var(--border2)] bg-[var(--surface)] p-3.5">
          <div className="mb-2.5 text-[13px] font-semibold text-[var(--text)]">
            Notifications
          </div>
          {items.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">No notifications.</div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className="mb-1.5 flex gap-2.5 rounded-[var(--r-sm)] bg-[var(--surface2)] px-2.5 py-2 last:mb-0"
              >
                <div
                  className={`mt-1 h-[7px] w-[7px] flex-shrink-0 rounded-full ${
                    n.dot === "yellow" ? "bg-[var(--yellow)]" : "bg-[var(--green)]"
                  }`}
                />
                <div>
                  <div className="text-xs font-semibold text-[var(--text)]">
                    {n.title}
                  </div>
                  <div className="font-mono-data text-[11px] text-[var(--muted)]">
                    {n.sub}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
