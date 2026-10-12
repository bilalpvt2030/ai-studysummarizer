"use client"

import { FileText, Loader2, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import {
  MAX_PDF_BYTES,
  type SavedSummary,
  type StudySummary,
  type Usage,
} from "@/lib/summary"
import { cn, formatBytes } from "@/lib/utils"
import { SummaryHistory } from "./summary-history"
import { SummaryView } from "./summary-view"

const MAX_SIZE_LABEL = formatBytes(MAX_PDF_BYTES, 0)

// `id` is null for a summary that was created but couldn't be saved.
type ActiveSummary = { id: string | null; title: string; summary: StudySummary }

export function Summarizer({
  initialSummaries,
  initialUsage,
}: {
  initialSummaries: SavedSummary[]
  initialUsage: Usage
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [summaries, setSummaries] = useState(initialSummaries)
  const [usage, setUsage] = useState(initialUsage)
  const [active, setActive] = useState<ActiveSummary | null>(null)

  const remaining = Math.max(0, usage.limit - usage.used)
  const limitReached = remaining === 0

  function choose(candidate: File | undefined) {
    if (!candidate || pending) return
    setActive(null)
    setNotice(null)

    const isPdf =
      candidate.type === "application/pdf" || candidate.name.toLowerCase().endsWith(".pdf")
    if (!isPdf) {
      setFile(null)
      setError("Please choose a PDF file.")
      return
    }
    if (candidate.size > MAX_PDF_BYTES) {
      setFile(null)
      setError(`That file is ${formatBytes(candidate.size, 1)}. PDFs can be up to ${MAX_SIZE_LABEL}.`)
      return
    }
    setError(null)
    setFile(candidate)
  }

  function reset() {
    setFile(null)
    setActive(null)
    setError(null)
    setNotice(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function summarize() {
    if (!file || pending || limitReached) return
    setError(null)
    setNotice(null)
    setActive(null)
    setPending(true)

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/pdf",
          "X-File-Name": encodeURIComponent(file.name),
        },
        body: file,
      })

      if (response.status === 401) {
        router.push("/login?next=/dashboard")
        return
      }

      const data = (await response.json().catch(() => null)) as {
        summary?: StudySummary
        saved?: SavedSummary | null
        usage?: Usage
        error?: string
      } | null

      if (data?.usage) setUsage(data.usage)
      if (!response.ok || !data?.summary) {
        setError(data?.error ?? "Something went wrong while summarizing. Please try again.")
        return
      }

      const saved = data.saved
      if (saved) {
        setSummaries((current) => [saved, ...current])
      } else {
        setNotice("This summary couldn't be saved to your history. Copy it if you need it later.")
      }
      setActive({
        id: saved?.id ?? null,
        title: saved?.title ?? data.summary.title,
        summary: data.summary,
      })
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  function open(saved: SavedSummary) {
    if (pending) return
    setFile(null)
    setError(null)
    setNotice(null)
    if (inputRef.current) inputRef.current.value = ""
    setActive({ id: saved.id, title: saved.title, summary: saved.summary })
    // The list sits below the summary, so bring the summary into view.
    requestAnimationFrame(() => viewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  function handleRenamed(id: string, title: string) {
    setSummaries((current) => current.map((s) => (s.id === id ? { ...s, title } : s)))
    setActive((current) => (current?.id === id ? { ...current, title } : current))
  }

  function handleDeleted(id: string) {
    setSummaries((current) => current.filter((s) => s.id !== id))
    setActive((current) => (current?.id === id ? null : current))
  }

  return (
    <>
      <section aria-labelledby="summarizer-heading" className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            id="summarizer-heading"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Summarize a PDF
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {remaining} of {usage.limit} summaries left today
          </p>
        </div>

        {file ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <FileText className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {file.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatBytes(file.size, 1)}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              aria-label="Remove file"
              className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              choose(e.dataTransfer.files[0])
            }}
            className={cn(
              "mt-4 flex cursor-pointer flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center transition focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 dark:focus-within:border-zinc-50 dark:focus-within:ring-zinc-50/10",
              dragging
                ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
                : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
            )}
          >
            <Upload className="h-6 w-6 text-zinc-400" aria-hidden="true" />
            <span className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Choose a PDF or drop it here
            </span>
            <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Up to {MAX_SIZE_LABEL}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => choose(e.target.files?.[0])}
            />
          </label>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            {notice}
          </p>
        )}

        {limitReached && (
          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            You&apos;ve used all {usage.limit} summaries for today.
            {usage.resetsAt && (
              <>
                {" "}
                You can summarize again from{" "}
                {/* Formatted in the reader's own time zone, which the server can't know. */}
                <time dateTime={usage.resetsAt} suppressHydrationWarning>
                  {formatResetTime(usage.resetsAt)}
                </time>
                .
              </>
            )}
          </p>
        )}

        {file && !active && (
          <button
            type="button"
            onClick={summarize}
            disabled={pending || limitReached}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {pending ? "Summarizing…" : "Summarize"}
          </button>
        )}

        <p aria-live="polite" className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {pending ? "Reading your PDF. This usually takes under a minute, longer when the AI service is busy." : ""}
        </p>

        <div ref={viewRef} className="scroll-mt-6">
          {active && (
            <SummaryView title={active.title} summary={active.summary}>
              <button
                type="button"
                onClick={reset}
                className="mt-8 text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
              >
                Summarize another PDF
              </button>
            </SummaryView>
          )}
        </div>
      </section>

      <SummaryHistory
        summaries={summaries}
        activeId={active?.id ?? null}
        onOpen={open}
        onRenamed={handleRenamed}
        onDeleted={handleDeleted}
      />
    </>
  )
}

function formatResetTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  })
}
