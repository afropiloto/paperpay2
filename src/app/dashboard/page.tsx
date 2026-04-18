import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { signOut } from "./actions";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-6 py-16">
      <div>
        <p className="font-mono-data text-[11px] uppercase tracking-widest text-[var(--muted)]">
          Signed in as
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--text)]">
          {profile?.full_name ?? user.email ?? "PaperPay user"}
        </h1>
        <p className="mt-1 font-mono-data text-xs text-[var(--muted)]">
          {profile?.email ?? user.email}
        </p>
        {profile?.role && (
          <p className="mt-2 font-mono-data text-[10px] uppercase tracking-widest text-[var(--dim)]">
            Role: {profile.role}
          </p>
        )}
      </div>

      <p className="text-sm leading-relaxed text-[var(--muted)]">
        Dashboard UI (Step 4) will replace this screen. Session and profile load
        from Supabase are working.
      </p>

      <form action={signOut}>
        <button
          type="submit"
          className="rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:border-[var(--yellow-border)]"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
