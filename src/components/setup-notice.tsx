export function SetupNotice() {
  return (
    <div className="w-full max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30">
      <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">
        Supabase isn&apos;t connected yet
      </h2>
      <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300/90">
        Auth is wired up and ready — it just needs your project keys. Open{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-amber-900/40">
          .env.local
        </code>{" "}
        and fill in these two values from your Supabase dashboard under{" "}
        <strong className="font-medium">Settings → API</strong>, then restart{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-amber-900/40">
          npm run dev
        </code>
        .
      </p>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-amber-100/70 p-4 font-mono text-xs leading-6 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...`}
      </pre>
    </div>
  )
}
