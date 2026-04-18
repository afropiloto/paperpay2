import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendUsdtSentEmail } from "@/lib/resend";

export async function POST(request: Request) {
  let service: Awaited<ReturnType<typeof requireAdmin>>["service"];
  try {
    ({ service } = await requireAdmin());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }

  let json: {
    transaction_id: string;
    incoming_hash: string;
    outgoing_hash: string;
  };

  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!json.transaction_id || !json.incoming_hash || !json.outgoing_hash) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: txn, error: txnErr } = await service
    .from("transactions")
    .select("id,user_id,wallet_address,amount_out")
    .eq("id", json.transaction_id)
    .maybeSingle();

  if (txnErr || !txn?.user_id) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const { error: updErr } = await service
    .from("transactions")
    .update({
      incoming_hash: json.incoming_hash,
      outgoing_hash: json.outgoing_hash,
      status: "swap_sent",
      updated_at: new Date().toISOString(),
    })
    .eq("id", json.transaction_id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 400 });
  }

  const { data: profile } = await service
    .from("profiles")
    .select("full_name,email")
    .eq("id", txn.user_id)
    .maybeSingle();

  const email = profile?.email;
  if (email) {
    await sendUsdtSentEmail({
      to: email,
      name: profile?.full_name ?? "there",
      amountOut: txn.amount_out ?? "",
      walletAddress: txn.wallet_address ?? "",
      outgoingHash: json.outgoing_hash,
    });
  }

  return NextResponse.json({ ok: true });
}
