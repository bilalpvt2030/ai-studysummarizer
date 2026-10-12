"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"
import type { StudySummary } from "@/lib/summary"

export function SummaryView({
  title,
  summary,
  children,
}: {
  title: string
  summary: StudySummary
  children?: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(toPlainText(title, summary))
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
          {title}
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

      {children}
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

function toPlainText(title: string, summary: StudySummary): string {
  const blocks = [title, summary.overview]

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
