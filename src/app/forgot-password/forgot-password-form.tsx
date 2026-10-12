"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import {
  authButtonClass,
  authErrorClass,
  authInputClass,
  authNoticeClass,
} from "@/components/auth-shell"
import { createClient } from "@/lib/supabase/client"

export function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  // Set by /auth/callback when a reset link can't be used.
  const [error, setError] = useState<string | null>(
    searchParams.get("error")
      ? "That reset link has expired or was opened in a different browser. Request a new one below."
      : null
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      // "Too many emails" is worth showing. Anything else stays generic, so
      // this form can't be used to find out which addresses have accounts.
      if (error?.status === 429) {
        setError("Too many emails have been sent recently. Please try again in an hour.")
        return
      }
      setSent(true)
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Enter your email and we&apos;ll send you a link to choose a new password.
        </p>
      </div>

      {error && (
        <p role="alert" className={`mb-6 ${authErrorClass}`}>
          {error}
        </p>
      )}

      {sent ? (
        <p className={authNoticeClass}>
          If an account exists for {email}, a reset link is on its way. Open it in this browser.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className={authInputClass}
            />
          </label>
          <button type="submit" disabled={pending} className={`mt-2 ${authButtonClass}`}>
            {pending ? "Please wait…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
