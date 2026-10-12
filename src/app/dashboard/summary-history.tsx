"use client"

import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { deleteSummary, renameSummary } from "@/app/actions"
import type { SavedSummary } from "@/lib/summary"
import { cn, formatDate } from "@/lib/utils"

export function SummaryHistory({
  summaries,
  activeId,
  onOpen,
  onRenamed,
  onDeleted,
}: {
  summaries: SavedSummary[]
  activeId: string | null
  onOpen: (summary: SavedSummary) => void
  onRenamed: (id: string, title: string) => void
  onDeleted: (id: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function rename(item: SavedSummary) {
    const title = draft.trim()
    if (!title || title === item.title) {
      setEditingId(null)
      return
    }
    setError(null)
    setBusyId(item.id)
    const result = await renameSummary(item.id, title)
    setBusyId(null)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setEditingId(null)
    onRenamed(item.id, title)
  }

  async function remove(item: SavedSummary) {
    if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) return
    setError(null)
    setBusyId(item.id)
    const result = await deleteSummary(item.id)
    setBusyId(null)

    if (!result.ok) {
      setError(result.error)
      return
    }
    onDeleted(item.id)
  }

  return (
    <section aria-labelledby="history-heading" className="mt-14">
      <h2
        id="history-heading"
        className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        Your summaries
      </h2>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      )}

      {summaries.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Summaries you create are saved here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {summaries.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-2 px-4 py-3",
                item.id === activeId && "bg-zinc-50 dark:bg-zinc-900"
              )}
            >
              {editingId === item.id ? (
                <form
                  className="flex min-w-0 flex-1 items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    rename(item)
                  }}
                >
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setEditingId(null)}
                    maxLength={200}
                    aria-label="Summary title"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10"
                  />
                  <button
                    type="submit"
                    disabled={busyId === item.id}
                    className="h-9 rounded-lg bg-zinc-900 px-3 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="h-9 px-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    aria-current={item.id === activeId ? "true" : undefined}
                    className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:focus-visible:ring-zinc-50/20"
                  >
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {item.fileName} ·{" "}
                      {/* The server and the browser may sit in different time zones. */}
                      <time dateTime={item.createdAt} suppressHydrationWarning>
                        {formatDate(item.createdAt)}
                      </time>
                    </span>
                  </button>
                  <IconButton
                    label={`Rename ${item.title}`}
                    disabled={busyId === item.id}
                    onClick={() => {
                      setDraft(item.title)
                      setEditingId(item.id)
                    }}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={`Delete ${item.title}`}
                    disabled={busyId === item.id}
                    onClick={() => remove(item)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function IconButton({
  label,
  children,
  ...props
}: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      className="shrink-0 rounded-md p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      {...props}
    >
      {children}
    </button>
  )
}
