import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  let service: Awaited<ReturnType<typeof requireAdmin>>["service"];
  try {
    ({ service } = await requireAdmin());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }

  let json: { transaction_id: string; status: string };
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!json.transaction_id || !json.status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await service
    .from("transactions")
    .update({ status: json.status, updated_at: new Date().toISOString() })
    .eq("id", json.transaction_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
