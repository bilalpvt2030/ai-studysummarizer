"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { authButtonClass, authErrorClass, authInputClass } from "@/components/auth-shell"
import { createClient } from "@/lib/supabase/client"

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (password !== confirm) {
      setError("The two passwords don't match.")
      return
    }
    setError(null)
    setPending(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        setPending(false)
        return
      }
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
      setPending(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          You&apos;ll use it the next time you sign in with your email.
        </p>
      </div>

      {error && (
        <p role="alert" className={`mb-6 ${authErrorClass}`}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">New password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
            className={authInputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Confirm new password
          </span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
            className={authInputClass}
          />
        </label>
        <button type="submit" disabled={pending} className={`mt-2 ${authButtonClass}`}>
          {pending ? "Please wait…" : "Save password"}
        </button>
      </form>
    </div>
  )
}
