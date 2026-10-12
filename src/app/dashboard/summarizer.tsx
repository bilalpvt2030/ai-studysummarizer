"use client"

import { FileText, Loader2, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  DETAIL_LEVELS,
  FILE_TYPES,
  MAX_FILE_BYTES,
  MAX_TEXT_CHARS,
  MIN_TEXT_CHARS,
  type DetailLevel,
  type SavedSummary,
  type StudySummary,
  type Usage,
} from "@/lib/summary"
import { cn, formatBytes } from "@/lib/utils"
import { SummaryHistory } from "./summary-history"
import { SummaryView } from "./summary-view"

const MAX_SIZE_LABEL = formatBytes(MAX_FILE_BYTES, 0)

type Mode = "file" | "text"

const MODES: { value: Mode; label: string }[] = [
  { value: "file", label: "Upload a file" },
  { value: "text", label: "Paste text" },
]

const DETAIL_LABELS: Record<DetailLevel, string> = {
  short: "Short",
  standard: "Standard",
  detailed: "Detailed",
}

// By extension, for browsers that don't report a type for the file.
const TYPE_BY_EXTENSION: Record<string, (typeof FILE_TYPES)[number]> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
}

function fileTypeOf(file: File): (typeof FILE_TYPES)[number] | null {
  const reported = FILE_TYPES.find((type) => type === file.type)
  if (reported) return reported
  return TYPE_BY_EXTENSION[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? null
}

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
  const [mode, setMode] = useState<Mode>("file")
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState("")
  const [detail, setDetail] = useState<DetailLevel>("standard")
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [summaries, setSummaries] = useState(initialSummaries)
  const [usage, setUsage] = useState(initialUsage)
  const [active, setActive] = useState<ActiveSummary | null>(null)

  const remaining = Math.max(0, usage.limit - usage.used)
  const limitReached = remaining === 0
  const textLength = text.trim().length
  const ready = mode === "file" ? file !== null : textLength >= MIN_TEXT_CHARS

  // Counts up while a summary is being written, so a slow one doesn't look stuck.
  useEffect(() => {
    if (!pending) return
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => clearInterval(timer)
  }, [pending])

  function choose(candidate: File | undefined) {
    if (!candidate || pending) return
    setActive(null)
    setNotice(null)

    if (!fileTypeOf(candidate)) {
      setFile(null)
      setError("Please choose a PDF or an image (PNG, JPG or WebP).")
      return
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setFile(null)
      setError(`That file is ${formatBytes(candidate.size, 1)}. Files can be up to ${MAX_SIZE_LABEL}.`)
      return
    }
    setError(null)
    setFile(candidate)
  }

  function reset() {
    setFile(null)
    setText("")
    setActive(null)
    setError(null)
    setNotice(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function summarize() {
    if (!ready || pending || limitReached) return
    setError(null)
    setNotice(null)
    setActive(null)
    setSeconds(0)
    setPending(true)

    try {
      const headers: Record<string, string> = { "X-Detail": detail }
      let body: File | string
      if (mode === "file" && file) {
        headers["Content-Type"] = fileTypeOf(file) ?? "application/pdf"
        headers["X-File-Name"] = encodeURIComponent(file.name)
        body = file
      } else {
        headers["Content-Type"] = "text/plain"
        body = text
      }

      const response = await fetch("/api/summarize", { method: "POST", headers, body })

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
            Create a summary
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {remaining} of {usage.limit} summaries left today
          </p>
        </div>

        <Segmented
          label="Source"
          options={MODES}
          value={mode}
          disabled={pending}
          onChange={(value) => {
            setMode(value)
            setError(null)
            setActive(null)
          }}
          className="mt-4"
        />

        {mode === "text" ? (
          <div className="mt-4">
            <label htmlFor="summary-text" className="sr-only">
              Text to summarize
            </label>
            <textarea
              id="summary-text"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setActive(null)
              }}
              disabled={pending}
              maxLength={MAX_TEXT_CHARS}
              rows={8}
              placeholder="Paste your notes, an article or a chapter here."
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50/10"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {textLength < MIN_TEXT_CHARS
                ? `${textLength.toLocaleString("en-US")} characters. At least ${MIN_TEXT_CHARS} needed.`
                : `${textLength.toLocaleString("en-US")} of ${MAX_TEXT_CHARS.toLocaleString("en-US")} characters`}
            </p>
          </div>
        ) : file ? (
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
              Choose a PDF or image, or drop it here
            </span>
            <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              PDF, PNG, JPG or WebP, up to {MAX_SIZE_LABEL}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept={`${FILE_TYPES.join(",")},.pdf`}
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

        {ready && !active && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Segmented
              label="Length"
              options={DETAIL_LEVELS.map((value) => ({ value, label: DETAIL_LABELS[value] }))}
              value={detail}
              disabled={pending}
              onChange={setDetail}
            />
            <button
              type="button"
              onClick={summarize}
              disabled={pending || limitReached}
              className="flex h-11 min-w-40 flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {pending ? `Summarizing… ${seconds}s` : "Summarize"}
            </button>
          </div>
        )}

        <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {pending ? "This usually takes under a minute, longer when the AI service is busy." : ""}
        </p>

        <div ref={viewRef} className="scroll-mt-6">
          {active && (
            // Keyed so the tab and quiz progress reset when another summary opens.
            <SummaryView key={active.id ?? "unsaved"} title={active.title} summary={active.summary}>
              <button
                type="button"
                onClick={reset}
                className="mt-8 text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
              >
                Summarize something else
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

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  className,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-800",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
            value === option.value
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function formatResetTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  })
}
