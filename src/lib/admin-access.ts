/**
 * Who may use ClearDesk (/admin) and admin APIs.
 * Prefer `profiles.role === 'admin'` in Supabase long-term; this module adds
 * fallbacks when DB role is missing or you need access during testing.
 *
 * - `ADMIN_EMAIL_ALLOWLIST` — comma-separated emails **added** on top of the default
 *   Paperless ops pair (lee + ops); env never removes those defaults.
 * - `ADMIN_STAFF_EMAIL_SUFFIX` — e.g. `@paperless.money`: any login with that suffix
 *   can open ClearDesk (default `@paperless.money` when unset).
 * - `ADMIN_OPEN_TO_ANY_AUTH_USER=true` — **any signed-in user** can open `/admin`
 *   (testing only; remove for production).
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
  /** Defaults always stay; env only adds more admins (avoids losing lee/ops if env was mis-set). */
  return new Set([...DEFAULT_ADMIN_EMAILS, ...fromEnv]);
}

function staffEmailSuffix(): string | null {
  const raw = process.env.ADMIN_STAFF_EMAIL_SUFFIX;
  if (raw === "") return null;
  const s = (raw ?? "@paperless.money").trim().toLowerCase();
  if (s === "off" || s === "false") return null;
  return s.startsWith("@") ? s : `@${s}`;
}

function emailMatchesStaffSuffix(email: string): boolean {
  const suffix = staffEmailSuffix();
  if (!suffix) return false;
  return email.trim().toLowerCase().endsWith(suffix);
}

/** True when this login should bypass DB `role` checks for ClearDesk. */
export function emailHasAdminAccess(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (adminAccessEmails().has(e)) return true;
  if (emailMatchesStaffSuffix(e)) return true;
  return false;
}

/** Nuclear testing switch: any authenticated user may use /admin. */
export function adminOpenToAnyAuthenticatedUser(): boolean {
  const v = process.env.ADMIN_OPEN_TO_ANY_AUTH_USER?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function canAccessClearDesk(email: string | null | undefined): boolean {
  if (adminOpenToAnyAuthenticatedUser()) return true;
  return emailHasAdminAccess(email);
}
