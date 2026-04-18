import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  AdminDashboard,
  type AdminTxnRow,
} from "@/components/admin/admin-dashboard";
import { getLiveFiatToUsdtRates } from "@/lib/fx-rates";

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

    let ratesSnapshot = null;
    try {
      const fx = await getLiveFiatToUsdtRates();
      ratesSnapshot = {
        gbp: fx.rates.GBP.toFixed(4),
        eur: fx.rates.EUR.toFixed(4),
        usd: fx.rates.USD.toFixed(4),
        asOf: fx.asOf,
        live: fx.live,
        source: fx.source,
      };
    } catch {
      ratesSnapshot = null;
    }

    return (
      <AdminDashboard
        profileName={profile.full_name ?? profile.email ?? "Admin"}
        rows={(txns ?? []) as AdminTxnRow[]}
        ratesSnapshot={ratesSnapshot}
      />
    );
  } catch {
    redirect("/dashboard");
  }
}
