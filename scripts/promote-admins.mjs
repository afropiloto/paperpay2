#!/usr/bin/env node
/**
 * Promote users to admin (profiles.role = 'admin') using Supabase service role.
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
 *
 * Optional: PROMOTE_ADMIN_EMAILS="a@x.com,b@y.com" in .env.local
 * Default: ops@paperless.money, lee@paperless.money
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local at", envPath);
    process.exit(1);
  }
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const extra = env.PROMOTE_ADMIN_EMAILS;

if (!url || !serviceKey) {
  console.error(
    "Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const defaultEmails = ["ops@paperless.money", "lee@paperless.money"];
const targets = (extra
  ? extra.split(",").map((s) => s.trim().toLowerCase())
  : defaultEmails.map((e) => e.toLowerCase())
).filter(Boolean);

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if (!data.users?.length || data.users.length < perPage) break;
    page += 1;
  }
  return users;
}

async function main() {
  const authUsers = await listAllAuthUsers();
  const byEmail = new Map(
    authUsers
      .filter((u) => u.email)
      .map((u) => [u.email.toLowerCase(), u]),
  );

  for (const email of targets) {
    const user = byEmail.get(email);
    if (!user) {
      console.error(
        `[skip] No auth.users row for ${email} — sign up once in the app, then re-run.`,
      );
      continue;
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id,role")
      .eq("id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: "admin",
          email: user.email ?? email,
        })
        .eq("id", user.id);
      if (error) {
        console.error(`[error] ${email}:`, error.message);
        continue;
      }
      console.log(`[ok] ${email} → admin (updated profile ${user.id})`);
      continue;
    }

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? email,
      full_name:
        (user.user_metadata && user.user_metadata.full_name) || null,
      kyc_status: "pending",
      role: "admin",
    });
    if (error) {
      console.error(`[error] ${email} insert:`, error.message);
      continue;
    }
    console.log(`[ok] ${email} → admin (created profile ${user.id})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
