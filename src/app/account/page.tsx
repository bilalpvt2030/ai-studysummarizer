import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth"
import { SITE_NAME } from "@/lib/site"
import { DeleteAccount } from "./delete-account"

export const metadata = {
  title: `Account · ${SITE_NAME}`,
}

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Account
      </h1>

      <Suspense fallback={<div className="mt-8 h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
        <Details />
      </Suspense>

      <DeleteAccount />
    </main>
  )
}

async function Details() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/account")

  return (
    <dl className="mt-8 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
      <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
      <dd className="text-zinc-900 dark:text-zinc-100">{user.name}</dd>

      <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
      <dd className="text-zinc-900 dark:text-zinc-100">{user.email}</dd>

      <dt className="text-zinc-500 dark:text-zinc-400">Signed in with</dt>
      <dd className="capitalize text-zinc-900 dark:text-zinc-100">{user.provider}</dd>
    </dl>
  )
}
