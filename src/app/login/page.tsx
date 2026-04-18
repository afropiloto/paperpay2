import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <Suspense
        fallback={
          <div className="h-64 w-full max-w-sm animate-pulse rounded-[var(--r)] bg-[var(--surface)]" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
