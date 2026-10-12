import { Suspense } from "react"
import { AuthShell } from "@/components/auth-shell"
import { SetupNotice } from "@/components/setup-notice"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { LoginForm } from "./login-form"

export const metadata = {
  title: "Sign in · AI Study Summarizer",
}

export default function LoginPage() {
  return (
    <AuthShell>
      {isSupabaseConfigured ? (
        <Suspense fallback={<FormSkeleton />}>
          <LoginForm />
        </Suspense>
      ) : (
        <SetupNotice />
      )}
    </AuthShell>
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
