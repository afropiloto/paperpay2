/**
 * Who may use ClearDesk (/admin) and admin APIs.
 * Prefer `profiles.role === 'admin'` in Supabase long-term; this list is a
 * practical fallback when the profile row or role column is missing.
 *
 * Set `ADMIN_EMAIL_ALLOWLIST` (comma-separated) to replace the defaults entirely.
 */
const DEFAULT_ADMIN_EMAILS = [
  "lee@paperless.money",
  "ops@paperless.money",
] as const;

export function adminAccessEmails(): ReadonlySet<string> {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST?.trim();
  const fromEnv =
    raw && raw.length > 0
      ? raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
      : [];
  const list =
    fromEnv.length > 0 ? fromEnv : [...DEFAULT_ADMIN_EMAILS];
  return new Set(list);
}

export function emailHasAdminAccess(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminAccessEmails().has(email.trim().toLowerCase());
}
