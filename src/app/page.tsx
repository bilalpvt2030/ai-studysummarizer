import Link from "next/link"
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <main className="w-full max-w-xl">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          AI Study Summarizer
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Turn dense notes into something you can actually revise.
        </h1>
        <p className="mt-5 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Upload a PDF, get a clean summary and key points in seconds.
        </p>

        <div className="mt-10">
          <Suspense fallback={<CtaSkeleton />}>
            <Cta />
          </Suspense>
        </div>

        {!isSupabaseConfigured && (
          <p className="mt-10 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            Add your Supabase keys to{" "}
            <code className="font-mono">.env.local</code> to enable sign-in.
          </p>
        )}
      </main>
    </div>
  )
}

async function Cta() {
  const user = await getCurrentUser()

  if (user) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go to dashboard
        </Link>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Signed in as {user.name}
        </span>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      Get started
    </Link>
  )
}

function CtaSkeleton() {
  return (
    <div className="h-11 w-36 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
  )
}
