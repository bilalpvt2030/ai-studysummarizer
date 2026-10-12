import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { signOut } from "@/app/actions"
import { getCurrentUser } from "@/lib/auth"
import { getUsage, listSummaries } from "@/lib/summaries"
import { Summarizer } from "./summarizer"

export const metadata = {
  title: "Dashboard · AI Study Summarizer",
}

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Reads the session cookie, so it streams in behind a boundary.
          With cacheComponents enabled this boundary is required. */}
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <Suspense fallback={<GreetingSkeleton />}>
          <Greeting />
        </Suspense>

        <Suspense fallback={<SummarizerSkeleton />}>
          <SummarizerSection />
        </Suspense>
      </main>
    </div>
  )
}

async function Header() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
        <span className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
          AI Study Summarizer
        </span>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                width={28}
                height={28}
                // Google's avatar host rejects some requests that carry a referrer.
                referrerPolicy="no-referrer"
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 sm:inline">
              {user.name}
            </span>
          </div>

          <Link
            href="/account"
            className="text-sm text-zinc-500 underline-offset-4 transition hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Account
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-zinc-500 underline-offset-4 transition hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}

async function Greeting() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Welcome, {user.firstName}.
      </h1>
      <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
        <dd className="text-zinc-900 dark:text-zinc-100">{user.name}</dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
        <dd className="text-zinc-900 dark:text-zinc-100">{user.email}</dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Signed in with</dt>
        <dd className="capitalize text-zinc-900 dark:text-zinc-100">
          {user.provider}
        </dd>
      </dl>
    </div>
  )
}

async function SummarizerSection() {
  const [summaries, usage] = await Promise.all([listSummaries(), getUsage()])
  return <Summarizer initialSummaries={summaries} initialUsage={usage} />
}

function SummarizerSkeleton() {
  return (
    <div className="mt-12 animate-pulse space-y-4">
      <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-36 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  )
}

function HeaderSkeleton() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
        <span className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
          AI Study Summarizer
        </span>
        <div className="h-7 w-7 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </header>
  )
}

function GreetingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-9 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-80 rounded bg-zinc-100 dark:bg-zinc-900" />
    </div>
  )
}
