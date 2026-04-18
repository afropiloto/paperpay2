import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-16">
      <h1 className="text-lg font-semibold text-[var(--text)]">
        Sign-in could not be completed
      </h1>
      <p className="max-w-md text-center text-sm text-[var(--muted)]">
        The link may have expired or already been used. Request a new sign-in
        link from the login page.
      </p>
      <Link
        href="/login"
        className="rounded-[var(--r-sm)] border border-[var(--border2)] bg-[var(--surface2)] px-4 py-2 text-sm font-medium text-[var(--text)]"
      >
        Back to login
      </Link>
    </div>
  );
}
