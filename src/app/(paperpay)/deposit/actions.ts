"use server";

import { revalidatePath } from "next/cache";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase-server";
import { nextDepositReference } from "@/lib/references";
import {
  processDepositReceived,
  type DepositWebhookPayload,
} from "@/lib/deposit-processor";

export async function ensureDepositIntent(currency: "GBP" | "EUR" | "USD") {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const service = createServiceRoleSupabaseClient();
  const { data: existing } = await service
    .from("transactions")
    .select("payment_reference")
    .eq("user_id", user.id)
    .eq("type", "deposit")
    .eq("status", "pending")
    .eq("currency_in", currency)
    .maybeSingle();

  if (existing?.payment_reference) {
    return existing.payment_reference;
  }

  const ref = await nextDepositReference(service, currency);
  const { error } = await service.from("transactions").insert({
    user_id: user.id,
    type: "deposit",
    status: "pending",
    currency_in: currency,
    payment_reference: ref,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/deposit");
  revalidatePath("/dashboard");
  return ref;
}

export async function simulateDepositAction(payload: DepositWebhookPayload) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DEPOSIT_SIMULATE !== "true"
  ) {
    throw new Error("Simulate disabled");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const service = createServiceRoleSupabaseClient();
  const { data: txn } = await service
    .from("transactions")
    .select("user_id,status,type")
    .eq("payment_reference", payload.reference)
    .maybeSingle();

  if (
    !txn ||
    txn.user_id !== user.id ||
    txn.type !== "deposit" ||
    txn.status !== "pending"
  ) {
    throw new Error("Invalid reference");
  }

  const result = await processDepositReceived(service, payload);
  if (!result.ok) throw new Error(result.error);

  revalidatePath("/dashboard");
  revalidatePath("/deposit");
  revalidatePath("/history");
}
