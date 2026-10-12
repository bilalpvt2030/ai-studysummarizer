import Link from "next/link"
import { SITE_NAME } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-6 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{SITE_NAME}</span>
        <nav aria-label="Legal" className="flex gap-5">
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  )
}
