"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

type Mode = "sign_in" | "sign_up";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "sign_in") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        router.replace(nextPath);
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: appUrl
            ? `${appUrl.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(nextPath)}`
            : undefined,
        },
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage(
        "Check your email to confirm your account, then sign in here.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-5 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--bg)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          <Image
            src="/paperpay-logo.png"
            alt="PaperPay"
            width={72}
            height={72}
            className="h-[72px] w-[72px] object-contain"
            priority
          />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">
          Paper<span className="text-[var(--yellow)]">Pay</span>
        </h1>
        <p className="mt-1 font-mono-data text-[11px] uppercase tracking-widest text-[var(--muted)]">
          {mode === "sign_in" ? "Sign in" : "Create account"}
        </p>
      </div>

      <div className="mb-6 flex rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface2)] p-0.5">
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
            mode === "sign_in"
              ? "bg-[var(--yellow-dim)] text-[var(--yellow)]"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
          onClick={() => {
            setMode("sign_in");
            setMessage(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
            mode === "sign_up"
              ? "bg-[var(--yellow-dim)] text-[var(--yellow)]"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
          onClick={() => {
            setMode("sign_up");
            setMessage(null);
          }}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "sign_up" && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="fullName"
              className="font-mono-data text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]"
            >
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] outline-none ring-0 transition-[border-color] placeholder:text-[var(--dim)] focus:border-[var(--yellow-border)]"
              placeholder="Ada Lovelace"
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="font-mono-data text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--dim)] focus:border-[var(--yellow-border)]"
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="font-mono-data text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === "sign_in" ? "current-password" : "new-password"
            }
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--dim)] focus:border-[var(--yellow-border)]"
            placeholder="••••••••"
          />
        </div>

        {message && (
          <p
            className={`text-center text-xs leading-relaxed ${
              message.startsWith("Check your email")
                ? "text-[var(--green)]"
                : "text-[var(--red)]"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-11 items-center justify-center rounded-[var(--r-sm)] bg-[var(--yellow)] text-sm font-semibold text-[var(--bg)] transition-opacity disabled:opacity-50"
        >
          {loading ? "Please wait…" : mode === "sign_in" ? "Sign in" : "Sign up"}
        </button>
      </form>
    </div>
  );
}
