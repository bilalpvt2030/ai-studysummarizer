"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { GoogleIcon } from "@/components/google-button"
import { createClient } from "@/lib/supabase/client"
import { safeNextPath } from "@/lib/utils"

type Mode = "signin" | "signup"

// Codes set by /auth/callback. Anything else in ?error= gets the generic
// message, so a crafted link can't put arbitrary text on this page.
const CALLBACK_ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled.",
  failed: "We couldn't sign you in. Please try again.",
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNextPath(searchParams.get("next"))

  const [mode, setMode] = useState<Mode>("signin")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState<null | "google" | "email">(null)
  const errorCode = searchParams.get("error")
  const [error, setError] = useState<string | null>(
    errorCode ? (CALLBACK_ERRORS[errorCode] ?? CALLBACK_ERRORS.failed) : null
  )
  const [notice, setNotice] = useState<string | null>(null)

  async function handleGoogle() {
    setError(null)
    setNotice(null)
    setPending("google")
    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      })
      if (error) {
        setError(error.message)
        setPending(null)
      }
      // On success the browser navigates to Google; nothing else to do here.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach Supabase.")
      setPending(null)
    }
  }

  async function handleEmail(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setPending("email")

    try {
      const supabase = createClient()

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Stored on the user so the dashboard can greet them by name.
            data: { full_name: fullName.trim(), name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        })
        if (error) throw error

        if (data.session) {
          router.push(next)
          router.refresh()
          return
        }
        setNotice("Check your inbox to confirm your email, then sign in.")
        setMode("signin")
        setPending(null)
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      router.push(next)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
      setPending(null)
    }
  }

  const busy = pending !== null

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {mode === "signin"
            ? "Sign in to continue to AI Study Summarizer."
            : "Start summarizing your study material in seconds."}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {notice}
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
      >
        <GoogleIcon className="h-[18px] w-[18px]" />
        {pending === "google" ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-xs uppercase tracking-wider text-zinc-400">
          or
        </span>
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <form onSubmit={handleEmail} className="flex flex-col gap-4">
        {mode === "signup" && (
          <Field
            label="Full name"
            type="text"
            value={fullName}
            onChange={setFullName}
            placeholder="Bilal Ahmed"
            autoComplete="name"
            required
          />
        )}
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={6}
          required
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-2 h-11 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending === "email"
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin")
            setError(null)
            setNotice(null)
          }}
          className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  ...props
}: {
  label: string
  value: string
  onChange: (value: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10"
      />
    </label>
  )
}
