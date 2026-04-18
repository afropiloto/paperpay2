import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase-server";
import { getUsdtPerUnit } from "@/lib/fx-rates";
import { isFiatCurrency } from "@/lib/money";
import type { FiatCurrency } from "@/lib/rates";
import { nextSwapReference } from "@/lib/references";
import { sendSwapRequestEmail } from "@/lib/resend";

export async function POST(request: Request) {
  const paperpayWallet = process.env.PAPERPAY_USDT_WALLET;
  if (!paperpayWallet) {
    return NextResponse.json(
      { error: "Missing PAPERPAY_USDT_WALLET" },
      { status: 500 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: {
    amount: number;
    currency: string;
    rate_mode: "instant" | "locked";
    wallet_address: string;
  };

  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { amount, currency: currencyRaw, rate_mode, wallet_address } = json;
  if (rate_mode !== "instant" && rate_mode !== "locked") {
    return NextResponse.json({ error: "Invalid rate_mode" }, { status: 400 });
  }
  if (!isFiatCurrency(currencyRaw)) {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }
  const currency = currencyRaw as FiatCurrency;
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (!wallet_address) {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }
  const rate = await getUsdtPerUnit(currency);
  const amountOut = (amount * rate).toFixed(2);
  const rateStr = rate.toFixed(4);

  const service = createServiceRoleSupabaseClient();
  const paymentReference = await nextSwapReference(service);

  const { data: profile } = await service
    .from("profiles")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();

  const { error: insertError } = await service.from("transactions").insert({
    user_id: user.id,
    type: "swap",
    status: "swap_requested",
    currency_in: currency,
    currency_out: "USDT",
    amount_in: amount.toFixed(2),
    amount_out: amountOut,
    rate: rateStr,
    rate_mode: rate_mode,
    payment_reference: paymentReference,
    wallet_address,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  await sendSwapRequestEmail({
    userName: profile?.full_name ?? profile?.email ?? user.email ?? "Unknown user",
    paymentReference,
    amountIn: amount.toFixed(2),
    currencyIn: currency,
    rate: rateStr,
    amountOut,
    walletAddress: wallet_address,
    rateMode: rate_mode === "locked" ? "locked" : "instant",
    paperpayWallet,
  });

  return NextResponse.json({ ok: true, payment_reference: paymentReference });
}
