import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendDepositConfirmedEmail } from "@/lib/resend";

export type DepositWebhookPayload = {
  event: "payment.received";
  amount: number;
  currency: string;
  reference: string;
  sender_name: string;
  timestamp: string;
};

type Sb = SupabaseClient<Database>;

export async function processDepositReceived(
  supabase: Sb,
  payload: DepositWebhookPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (payload.event !== "payment.received") {
    return { ok: false, error: "Unsupported event" };
  }

  const { data: txn, error: txnError } = await supabase
    .from("transactions")
    .select("id,user_id,type,status,currency_in,payment_reference")
    .eq("payment_reference", payload.reference)
    .maybeSingle();

  if (txnError) return { ok: false, error: txnError.message };
  if (!txn?.user_id) return { ok: false, error: "Unknown reference" };
  if (txn.type !== "deposit") return { ok: false, error: "Not a deposit" };
  if (txn.status !== "pending") {
    if (txn.status === "deposit_confirmed") return { ok: true };
    return { ok: false, error: "Deposit not pending" };
  }

  if (txn.currency_in && txn.currency_in !== payload.currency) {
    return { ok: false, error: "Currency mismatch" };
  }

  const amountStr = payload.amount.toFixed(2);

  const { error: updError } = await supabase
    .from("transactions")
    .update({
      status: "deposit_confirmed",
      amount_in: amountStr,
      currency_in: payload.currency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", txn.id);

  if (updError) return { ok: false, error: updError.message };

  const { data: bal, error: balErr } = await supabase
    .from("balances")
    .select("id,amount")
    .eq("user_id", txn.user_id)
    .eq("currency", payload.currency)
    .maybeSingle();

  if (balErr || !bal?.id) return { ok: false, error: "Balance row missing" };

  const current = Number(bal.amount ?? 0);
  const next = current + payload.amount;

  const { error: balUpdErr } = await supabase
    .from("balances")
    .update({
      amount: next.toFixed(2),
      updated_at: new Date().toISOString(),
    })
    .eq("id", bal.id);

  if (balUpdErr) return { ok: false, error: balUpdErr.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("email,full_name")
    .eq("id", txn.user_id)
    .maybeSingle();

  const to = profile?.email;
  if (to) {
    await sendDepositConfirmedEmail({
      to,
      name: profile?.full_name ?? "there",
      amount: amountStr,
      currency: payload.currency,
      paymentReference: payload.reference,
    });
  }

  return { ok: true };
}
