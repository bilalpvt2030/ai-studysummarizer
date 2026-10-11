"use client"

import { Check, Copy, FileText, Loader2, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { MAX_PDF_BYTES, type StudySummary } from "@/lib/summary"
import { cn, formatBytes } from "@/lib/utils"

const MAX_SIZE_LABEL = formatBytes(MAX_PDF_BYTES, 0)

export function Summarizer() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<StudySummary | null>(null)

  function choose(candidate: File | undefined) {
    if (!candidate || pending) return
    setSummary(null)

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
    setSummary(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function summarize() {
    if (!file || pending) return
    setError(null)
    setSummary(null)
    setPending(true)

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      })

      if (response.status === 401) {
        router.push("/login?next=/dashboard")
        return
      }

      const data = (await response.json().catch(() => null)) as {
        summary?: StudySummary
        error?: string
      } | null

      if (!response.ok || !data?.summary) {
        setError(data?.error ?? "Something went wrong while summarizing. Please try again.")
        return
      }
      setSummary(data.summary)
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <section aria-labelledby="summarizer-heading" className="mt-12">
      <h2
        id="summarizer-heading"
        className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        Summarize a PDF
      </h2>

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

      {file && !summary && (
        <button
          type="button"
          onClick={summarize}
          disabled={pending}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {pending ? "Summarizing…" : "Summarize"}
        </button>
      )}

      <p aria-live="polite" className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
        {pending ? "Reading your PDF. Long documents can take up to a minute." : ""}
      </p>

      {summary && <SummaryView summary={summary} onReset={reset} />}
    </section>
  )
}

function SummaryView({ summary, onReset }: { summary: StudySummary; onReset: () => void }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(toPlainText(summary))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access denied — nothing useful to show.
    }
  }

  return (
    <article className="mt-4 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {summary.title}
        </h3>
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {summary.overview && (
        <p className="mt-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
          {summary.overview}
        </p>
      )}

      {summary.keyPoints.length > 0 && (
        <>
          <SectionHeading>Key points</SectionHeading>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700 marker:text-zinc-400 dark:text-zinc-300">
            {summary.keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </>
      )}

      {summary.keyTerms.length > 0 && (
        <>
          <SectionHeading>Key terms</SectionHeading>
          <dl className="mt-3 space-y-3 text-sm leading-7">
            {summary.keyTerms.map((item, i) => (
              <div key={i}>
                <dt className="font-medium text-zinc-900 dark:text-zinc-50">{item.term}</dt>
                <dd className="text-zinc-700 dark:text-zinc-300">{item.definition}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {summary.questions.length > 0 && (
        <>
          <SectionHeading>Test yourself</SectionHeading>
          <div className="mt-3 space-y-2">
            {summary.questions.map((item, i) => (
              <details
                key={i}
                className="rounded-lg border border-zinc-200 px-4 py-3 text-sm leading-7 dark:border-zinc-800"
              >
                <summary className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-50">
                  {item.question}
                </summary>
                <p className="mt-2 text-zinc-700 dark:text-zinc-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-8 text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
      >
        Summarize another PDF
      </button>
    </article>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-8 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
      {children}
    </h4>
  )
}

function toPlainText(summary: StudySummary): string {
  const blocks = [summary.title, summary.overview]

  if (summary.keyPoints.length > 0) {
    blocks.push(["Key points", ...summary.keyPoints.map((point) => `- ${point}`)].join("\n"))
  }
  if (summary.keyTerms.length > 0) {
    blocks.push(
      ["Key terms", ...summary.keyTerms.map((t) => `- ${t.term}: ${t.definition}`)].join("\n")
    )
  }
  if (summary.questions.length > 0) {
    blocks.push(
      ["Test yourself", ...summary.questions.map((q) => `Q: ${q.question}\nA: ${q.answer}`)].join(
        "\n"
      )
    )
  }
  return blocks.filter(Boolean).join("\n\n")
}
