import { createServerSupabaseClient } from "@/lib/supabase-server";
import { canAccessClearDesk } from "@/lib/admin-access";
import { PaperShell } from "@/components/paperpay/paper-shell";

export default async function PaperPayGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,kyc_status")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const loginEmail = user?.email?.trim().toLowerCase() ?? null;
  const showClearDeskLink = canAccessClearDesk(loginEmail);

  return (
    <PaperShell
      showClearDeskLink={showClearDeskLink}
      profile={{
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        kyc_status: profile?.kyc_status ?? "pending",
      }}
    >
      {children}
    </PaperShell>
  );
}
