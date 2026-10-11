import Link from "next/link"
import { Suspense } from "react"
import { SetupNotice } from "@/components/setup-notice"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { LoginForm } from "./login-form"

export const metadata = {
  title: "Sign in · AI Study Summarizer",
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Link
        href="/"
        className="mb-12 text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        AI Study Summarizer
      </Link>

      {isSupabaseConfigured ? (
        <Suspense fallback={<FormSkeleton />}>
          <LoginForm />
        </Suspense>
      ) : (
        <SetupNotice />
      )}
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="w-full max-w-sm animate-pulse space-y-4">
      <div className="h-8 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-64 rounded bg-zinc-100 dark:bg-zinc-900" />
      <div className="h-11 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
      <div className="h-11 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
      <div className="h-11 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
    </div>
  )
}
