"use client"

import { Check, Copy, Download } from "lucide-react"
import { useState } from "react"
import { downloadFile, fileNameFor, toMarkdown, toWordDocument } from "@/lib/export"
import type { StudySummary } from "@/lib/summary"
import { cn } from "@/lib/utils"
import { Flashcards } from "./flashcards"
import { Quiz } from "./quiz"

const TABS = ["Summary", "Flashcards", "Quiz"] as const
type Tab = (typeof TABS)[number]

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
  const [tab, setTab] = useState<Tab>("Summary")

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
      {/* The only thing that prints: the whole summary with every answer shown. */}
      <PrintableSummary title={title} summary={summary} />

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={copy} className={toolButton}>
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>

          <details className="group relative">
            <summary className={`${toolButton} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Export
            </summary>
            <div className="absolute left-0 z-10 mt-1 w-52 sm:left-auto sm:right-0 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <ExportItem
                onClick={() =>
                  downloadFile(
                    fileNameFor(title, "doc"),
                    toWordDocument(title, summary),
                    "application/msword"
                  )
                }
              >
                Word document
              </ExportItem>
              <ExportItem onClick={() => window.print()}>Print or save as PDF</ExportItem>
              <ExportItem
                onClick={() =>
                  downloadFile(fileNameFor(title, "md"), toMarkdown(title, summary), "text/markdown")
                }
              >
                Markdown file
              </ExportItem>
            </div>
          </details>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Study tools"
        className="mt-6 flex gap-1 border-b border-zinc-200 dark:border-zinc-800"
      >
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            id={`tab-${name}`}
            aria-selected={tab === name}
            aria-controls={`panel-${name}`}
            onClick={() => setTab(name)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
              tab === name
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "Flashcards" && <Flashcards summary={summary} />}
        {tab === "Quiz" && <Quiz summary={summary} />}
        {tab === "Summary" && <SummaryText summary={summary} />}
      </div>

      {children}
    </article>
  )
}

const toolButton =
  "flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"

function ExportItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // Close the menu before acting, so it isn't left open (or printed).
        e.currentTarget.closest("details")?.removeAttribute("open")
        onClick()
      }}
      className="block w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  )
}

/** Hidden on screen; globals.css shows only `.print-area` when printing. */
function PrintableSummary({ title, summary }: { title: string; summary: StudySummary }) {
  return (
    <div className="print-area hidden">
      <h1>{title}</h1>
      {summary.overview && <p>{summary.overview}</p>}

      {summary.keyPoints.length > 0 && (
        <>
          <h2>Key points</h2>
          <ul>
            {summary.keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </>
      )}

      {summary.keyTerms.length > 0 && (
        <>
          <h2>Key terms</h2>
          {summary.keyTerms.map((item, i) => (
            <p key={i}>
              <strong>{item.term}:</strong> {item.definition}
            </p>
          ))}
        </>
      )}

      {summary.questions.length > 0 && (
        <>
          <h2>Revision questions</h2>
          <ol>
            {summary.questions.map((item, i) => (
              <li key={i}>
                {item.question}
                <br />
                <em>{item.answer}</em>
              </li>
            ))}
          </ol>
        </>
      )}

      {summary.quiz.length > 0 && (
        <>
          <h2>Quiz</h2>
          <ol>
            {summary.quiz.map((item, i) => (
              <li key={i}>
                {item.question}
                <ol type="A">
                  {item.options.map((option, j) => (
                    <li key={j}>{option}</li>
                  ))}
                </ol>
                <em>
                  Answer: {String.fromCharCode(65 + item.answerIndex)}. {item.explanation}
                </em>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

function SummaryText({ summary }: { summary: StudySummary }) {
  return (
    <>
      {summary.overview && (
        <p className="mt-6 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
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
    </>
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
