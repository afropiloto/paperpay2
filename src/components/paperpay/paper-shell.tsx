"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { signOut } from "@/app/(paperpay)/actions";

type Profile = {
  full_name: string | null;
  email: string | null;
  kyc_status: string | null;
};

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/swap", label: "Swap" },
  { href: "/deposit", label: "Deposit" },
  { href: "/history", label: "History" },
  { href: "/account", label: "Account" },
] as const;

function initials(profile: Profile): string {
  const base = profile.full_name?.trim() || profile.email?.trim() || "PP";
  const parts = base.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "P";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export function PaperShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-[var(--border)] bg-[var(--surface)] md:flex">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-[22px] pb-5 pt-6">
          <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--bg)]">
            <Image
              src="/paperpay-logo.png"
              alt="PaperPay"
              width={34}
              height={34}
              className="h-[34px] w-[34px] object-contain"
            />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-[var(--text)]">
              PaperPay
            </div>
            <div className="font-mono-data text-[10px] tracking-[0.06em] text-[var(--muted)]">
              FX · ON/OFF RAMP
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {nav.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2.5 px-[22px] py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--yellow-dim)] text-[var(--yellow)]"
                    : "text-[var(--muted)] hover:bg-white/[0.03] hover:text-[var(--text)]",
                )}
              >
                <span className="font-mono-data text-xs">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border)] px-[22px] pb-[22px] pt-4">
          <div className="flex cursor-default items-center gap-2.5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface2)] p-2.5">
            <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full border border-[var(--yellow-border)] bg-[var(--yellow-dim)] text-xs font-bold text-[var(--yellow)]">
              {initials(profile)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-[var(--text)]">
                {profile.full_name ?? profile.email ?? "Account"}
              </div>
              <div className="font-mono-data flex items-center gap-1 text-[10px] text-[var(--muted)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
                {profile.kyc_status === "verified"
                  ? "KYC Verified"
                  : "KYC Pending"}
              </div>
            </div>
          </div>
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2 text-sm font-semibold text-[var(--text)] hover:border-[var(--yellow-border)]"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 max-w-[900px] flex-1 overflow-y-auto px-5 py-8 md:px-9 md:py-8">
        <nav
          aria-label="PaperPay sections"
          className="mb-6 flex gap-2 overflow-x-auto border-b border-[var(--border)] pb-3 md:hidden"
        >
          {nav.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold",
                  active
                    ? "border-[var(--yellow-border)] bg-[var(--yellow-dim)] text-[var(--yellow)]"
                    : "border-[var(--border2)] bg-[var(--surface2)] text-[var(--muted)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </main>
    </div>
  );
}
