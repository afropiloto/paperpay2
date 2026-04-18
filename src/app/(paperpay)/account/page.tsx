import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,kyc_status,role,created_at")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <div>
      <div className="topbar mb-7">
        <div className="page-title text-2xl font-bold tracking-tight text-[var(--text)]">
          Account
        </div>
        <div className="page-date mt-1 font-mono-data text-[11px] text-[var(--muted)]">
          Profile details from Supabase
        </div>
      </div>

      <div className="rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="font-mono-data text-[10px] uppercase tracking-widest text-[var(--muted)]">
              Full name
            </div>
            <div className="mt-1 text-sm font-semibold text-[var(--text)]">
              {profile?.full_name ?? "—"}
            </div>
          </div>
          <div>
            <div className="font-mono-data text-[10px] uppercase tracking-widest text-[var(--muted)]">
              Email
            </div>
            <div className="mt-1 text-sm font-semibold text-[var(--text)]">
              {profile?.email ?? user?.email ?? "—"}
            </div>
          </div>
          <div>
            <div className="font-mono-data text-[10px] uppercase tracking-widest text-[var(--muted)]">
              KYC status
            </div>
            <div className="mt-1 text-sm font-semibold text-[var(--text)]">
              {profile?.kyc_status ?? "—"}
            </div>
          </div>
          <div>
            <div className="font-mono-data text-[10px] uppercase tracking-widest text-[var(--muted)]">
              Role
            </div>
            <div className="mt-1 text-sm font-semibold text-[var(--text)]">
              {profile?.role ?? "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
