import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-server";

const FIAT = ["GBP", "EUR", "USD", "USDT"] as const;

export async function POST(request: Request) {
  let json: { email?: string; password?: string; full_name?: string };
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = json.email?.trim().toLowerCase();
  const password = json.password;
  const full_name = json.full_name?.trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }
  if (!full_name) {
    return NextResponse.json({ error: "Full name required" }, { status: 400 });
  }

  const admin = createServiceRoleSupabaseClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createErr) {
    const msg = createErr.message.toLowerCase();
    const code = String(
      (createErr as { code?: string }).code ?? "",
    ).toLowerCase();
    if (
      code === "email_exists" ||
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists") ||
      msg.includes("duplicate") ||
      createErr.status === 422
    ) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Use Sign in, or Forgot password if you lost access.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: createErr.message }, { status: 400 });
  }

  const uid = created.user?.id;
  if (!uid) {
    return NextResponse.json(
      { error: "Account could not be created" },
      { status: 500 },
    );
  }

  const { error: profErr } = await admin.from("profiles").upsert(
    {
      id: uid,
      email,
      full_name,
      kyc_status: "pending",
      role: "user",
    },
    { onConflict: "id" },
  );

  if (profErr) {
    await admin.auth.admin.deleteUser(uid);
    return NextResponse.json(
      {
        error: `Profile setup failed (${profErr.message}). Ensure the Supabase \`profiles\` table exists (see docs/schema.sql), then try sign up again.`,
      },
      { status: 500 },
    );
  }

  for (const currency of FIAT) {
    const { count } = await admin
      .from("balances")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("currency", currency);
    if (!count) {
      await admin.from("balances").insert({
        user_id: uid,
        currency,
        amount: "0",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
