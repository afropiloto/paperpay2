import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <Suspense
        fallback={
          <div className="h-64 w-full max-w-sm animate-pulse rounded-[var(--r)] bg-[var(--surface)]" />
        }
      >
        <LoginForm />
      </Suspense>
      <p className="mt-8 max-w-sm text-center font-mono-data text-[11px] leading-relaxed text-[var(--muted)]">
        Static UI mocks (no login, pixel reference):{" "}
        <Link
          className="text-[var(--yellow)] underline"
          href="/ui/paperpay-dashboard.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          PaperPay
        </Link>{" "}
        ·{" "}
        <Link
          className="text-[var(--yellow)] underline"
          href="/ui/cleardesk-dashboard.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          ClearDesk
        </Link>
        . Live app after sign-in:{" "}
        <Link className="text-[var(--yellow)] underline" href="/dashboard">
          /dashboard
        </Link>
        ,{" "}
        <Link className="text-[var(--yellow)] underline" href="/admin">
          /admin
        </Link>{" "}
        (admin role).
      </p>
    </div>
  );
}
