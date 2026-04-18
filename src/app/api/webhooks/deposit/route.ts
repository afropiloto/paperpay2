import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-server";
import {
  processDepositReceived,
  type DepositWebhookPayload,
} from "@/lib/deposit-processor";

export async function POST(request: NextRequest) {
  const secret = process.env.DEPOSIT_WEBHOOK_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: DepositWebhookPayload;
  try {
    body = (await request.json()) as DepositWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const result = await processDepositReceived(supabase, body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
