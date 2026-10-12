import Link from "next/link"
import { SITE_NAME } from "@/lib/site"

/** Centered layout shared by the sign-in and password pages. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Link
        href="/"
        className="mb-12 text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        {SITE_NAME}
      </Link>
      {children}
    </div>
  )
}

export const authInputClass =
  "h-11 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10"

export const authButtonClass =
  "h-11 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"

export const authErrorClass =
  "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"

export const authNoticeClass =
  "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
