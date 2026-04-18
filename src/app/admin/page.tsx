import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  AdminDashboard,
  type AdminTxnRow,
} from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  try {
    const { service, profile } = await requireAdmin();
    const { data: txns, error } = await service
      .from("transactions")
      .select("*, profiles(email,full_name)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      redirect("/dashboard");
    }

    return (
      <AdminDashboard
        profileName={profile.full_name ?? profile.email ?? "Admin"}
        rows={(txns ?? []) as AdminTxnRow[]}
      />
    );
  } catch {
    redirect("/dashboard");
  }
}
