"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function UpdatePasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionOk(Boolean(session));
      if (!session) {
        setMessage(
          "No active reset session. Open the link from your latest reset email, or request a new one from the login page.",
        );
      }
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 8) {
      setMessage("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Password updated. Redirecting…");
      router.replace("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-8">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">
        Set new password
      </h1>
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
        Choose a new password for your account. If this page says your session
        expired, request another reset link from the login page.
      </p>
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-4"
        aria-disabled={sessionOk === false}
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="pw"
            className="font-mono-data text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]"
          >
            New password
          </label>
          <input
            id="pw"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--yellow-border)]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="pw2"
            className="font-mono-data text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]"
          >
            Confirm
          </label>
          <input
            id="pw2"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--yellow-border)]"
          />
        </div>
        {message ? (
          <p
            className={`text-center text-xs ${
              message.startsWith("Password updated")
                ? "text-[var(--green)]"
                : "text-[var(--red)]"
            }`}
          >
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || sessionOk === false}
          className="mt-2 flex h-11 items-center justify-center rounded-[var(--r-sm)] bg-[var(--yellow)] text-sm font-semibold text-[var(--bg)] disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save password"}
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        <Link className="text-[var(--yellow)] underline" href="/login">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
