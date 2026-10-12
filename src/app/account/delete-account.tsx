"use client"

import { useState } from "react"
import { deleteAccount } from "@/app/actions"

const CONFIRM_WORD = "DELETE"

export function DeleteAccount() {
  const [typed, setTyped] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (typed !== CONFIRM_WORD || pending) return
    setError(null)
    setPending(true)

    // On success the action redirects, so a return value means it failed.
    const result = await deleteAccount()
    if (result && !result.ok) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <section
      aria-labelledby="delete-heading"
      className="mt-14 rounded-xl border border-red-200 p-6 dark:border-red-900/50"
    >
      <h2
        id="delete-heading"
        className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        Delete account
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        This permanently deletes your account and all of your saved summaries. It can&apos;t be
        undone.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Type {CONFIRM_WORD} to confirm
          </span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="h-11 w-48 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10"
          />
        </label>
        <button
          type="submit"
          disabled={typed !== CONFIRM_WORD || pending}
          className="h-11 rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </form>
    </section>
  )
}
