import { Suspense } from "react";
import { UpdatePasswordForm } from "./update-password-form";

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <Suspense
        fallback={
          <div className="h-64 w-full max-w-sm animate-pulse rounded-[var(--r)] bg-[var(--surface)]" />
        }
      >
        <UpdatePasswordForm />
      </Suspense>
    </div>
  );
}
