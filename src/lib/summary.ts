/** Shared by the server code and the dashboard UI — nothing secret here. */

// Kept under Next's 10MB proxy body buffer (proxyClientMaxBodySize). A larger
// upload reaches the route handler cut off at 10MB, which is still over this
// limit, so it is rejected instead of being summarized half-read.
export const MAX_PDF_BYTES = 8 * 1024 * 1024

// Per user, over a rolling 24 hours. The free Gemini tier gives the whole site
// roughly 1,100 requests a day, so this keeps one account from using it all.
export const DAILY_SUMMARY_LIMIT = 20

export type StudySummary = {
  title: string
  overview: string
  keyPoints: string[]
  keyTerms: { term: string; definition: string }[]
  questions: { question: string; answer: string }[]
}

export type SavedSummary = {
  id: string
  title: string
  fileName: string
  createdAt: string
  summary: StudySummary
}

export type Usage = {
  used: number
  limit: number
  /** When the oldest summary in the window ages out and a slot frees up. */
  resetsAt: string | null
}

/**
 * Coerce untrusted JSON (a model reply, a database row) into a StudySummary,
 * so a malformed value can't crash the UI.
 */
export function toStudySummary(value: unknown): StudySummary {
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "")
  const list = (v: unknown) => (Array.isArray(v) ? v : [])
  const record = (v: unknown) => (v && typeof v === "object" ? v : {}) as Record<string, unknown>

  return {
    title: text(source.title) || "Untitled document",
    overview: text(source.overview),
    keyPoints: list(source.keyPoints).map(text).filter(Boolean),
    keyTerms: list(source.keyTerms)
      .map((item) => ({ term: text(record(item).term), definition: text(record(item).definition) }))
      .filter((item) => item.term && item.definition),
    questions: list(source.questions)
      .map((item) => ({ question: text(record(item).question), answer: text(record(item).answer) }))
      .filter((item) => item.question && item.answer),
  }
}
