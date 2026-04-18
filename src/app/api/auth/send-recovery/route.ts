import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-server";
import { sendPasswordResetViaResend } from "@/lib/resend";

/**
 * Sends a password-reset link via Resend using Supabase Admin `generateLink`.
 * Does not rely on Supabase built-in auth emails.
 */
export async function POST(request: Request) {
  let json: { email?: string };
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = json.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) {
    return NextResponse.json(
      { error: "Server missing NEXT_PUBLIC_APP_URL" },
      { status: 500 },
    );
  }

  const admin = createServiceRoleSupabaseClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${base}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`,
    },
  });

  const actionLink = data?.properties?.action_link;

  if (error || !actionLink) {
    return NextResponse.json(
      {
        ok: true,
        message:
          "If an account exists for that address, a reset email has been sent.",
      },
      { status: 200 },
    );
  }

  try {
    await sendPasswordResetViaResend({ to: email, actionLink });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Email failed";
    return NextResponse.json(
      { error: `Could not send email: ${msg}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists for that address, a reset email has been sent.",
  });
}
