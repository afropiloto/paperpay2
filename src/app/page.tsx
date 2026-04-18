export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)]">
        Paper<span className="text-[var(--yellow)]">Pay</span>
      </h1>
      <p className="mt-3 max-w-md text-center text-[var(--muted)] font-mono-data text-xs uppercase tracking-widest">
        Step 1 — scaffold, Tailwind, fonts
      </p>
    </div>
  );
}
